import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const fallbackFilePath = path.join(process.cwd(), 'src/data/community_posts.json');

// Helper to read local posts
function readLocalPosts() {
  try {
    if (fs.existsSync(fallbackFilePath)) {
      const data = fs.readFileSync(fallbackFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local community posts:', err);
  }
  return [];
}

// Helper to write local posts
function writeLocalPosts(posts) {
  try {
    // Ensure directory exists
    const dir = path.dirname(fallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fallbackFilePath, JSON.stringify(posts, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing local community posts:', err);
    return false;
  }
}

// GET all community posts
export async function GET(request) {
  try {
    // Try querying Supabase
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback if table doesn't exist
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('community_posts table missing in DB, falling back to local storage file.');
        const localPosts = readLocalPosts();
        // Sort local posts by created_at descending
        localPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return NextResponse.json(localPosts);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Failed to get community posts, returning local fallback:', err);
    const localPosts = readLocalPosts();
    localPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return NextResponse.json(localPosts);
  }
}

// POST a new community post
export async function POST(request) {
  try {
    const body = await request.json();
    const { author, district, crop_category, title, content, image_url } = body;

    if (!author || !district || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields: author, district, title, content' }, { status: 400 });
    }

    const newPost = {
      author,
      district,
      crop_category: crop_category || 'General',
      title,
      content,
      image_url: image_url || null,
      created_at: new Date().toISOString()
    };

    // Try inserting into Supabase
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([newPost])
        .select();

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, post: data[0] });
      }

      if (error) {
        console.warn('DB insertion error, attempting local fallback:', error.message);
      }
    } catch (dbErr) {
      console.warn('DB client error, using local fallback:', dbErr.message);
    }

    // Fallback: Write locally
    const posts = readLocalPosts();
    const localPost = {
      id: `post-${Date.now()}`,
      ...newPost
    };
    posts.push(localPost);
    writeLocalPosts(posts);

    return NextResponse.json({ success: true, post: localPost, fallback: true });
  } catch (err) {
    console.error('Error in community POST API:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
