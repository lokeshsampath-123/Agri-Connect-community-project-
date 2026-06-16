import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { processAgentPrompt } from '@/lib/gemini';
import { getAssetUrl } from '@/lib/assets';

export async function POST(request) {
  try {
    const body = await request.json();
    let payload = body;

    // 1. If a raw text prompt is sent, run it through Gemini to get structured JSON
    if (body.prompt) {
      payload = await processAgentPrompt(body.prompt);
    }

    // 2. Validate payload
    const { pest_name, crop_affected, severity_level, district, description, image_url, advice } = payload;

    if (!pest_name || !crop_affected || !district) {
      return NextResponse.json({ error: 'Missing required fields: pest_name, crop_affected, district' }, { status: 400 });
    }

    // 3. Resolve high-fidelity image mapping if a library ID is passed
    let resolvedImageUrl = image_url;
    const libraryUrl = getAssetUrl(image_url, 'pest');
    if (libraryUrl) {
      resolvedImageUrl = libraryUrl;
    }

    // 4. Update the pests table
    // Let's check if this pest alert already exists for the district and crop to update it, or insert a new one
    const { data: existing } = await supabase
      .from('pests')
      .select('id')
      .eq('name', pest_name)
      .eq('district', district)
      .eq('crop_affected', crop_affected)
      .single();

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('pests')
        .update({
          severity_level,
          description,
          image_url: resolvedImageUrl || null,
          advice,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();
      
      if (error) throw error;
      result = data[0];
    } else {
      // Insert
      const { data, error } = await supabase
        .from('pests')
        .insert([{
          name: pest_name,
          crop_affected,
          severity_level: severity_level || 'low',
          description,
          image_url: resolvedImageUrl || null,
          district,
          advice
        }])
        .select();

      if (error) throw error;
      result = data[0];
    }

    return NextResponse.json({ success: true, record: result, payload });
  } catch (error) {
    console.error('Error in agent update API:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
