import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateFarmBotReply } from '@/lib/gemini';

// Get messages for a chat session
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}

// Add a new message and trigger AI response
export async function POST(request) {
  try {
    const { session_id, content, district, language } = await request.json();

    if (!session_id || !content) {
      return NextResponse.json({ error: 'Missing session_id or content' }, { status: 400 });
    }

    // 1. Insert user message
    const { error: userInsertError } = await supabase
      .from('messages')
      .insert([{
        session_id,
        role: 'user',
        content
      }]);

    if (userInsertError) throw userInsertError;

    // 2. Generate AI reply
    let assistantReply = "I am FarmBot, your agricultural advisor. I'm having trouble connecting to my cognitive services right now, but please ensure your crops have correct irrigation and soil nutrients.";
    
    try {
      // Fetch last 10 messages for context
      const { data: history } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const chatContext = history ? history.reverse().map(h => `${h.role === 'user' ? 'User' : 'FarmBot'}: ${h.content}`).join('\n') : '';

      assistantReply = await generateFarmBotReply(chatContext, content, district || 'Guntur', language || 'en');
    } catch (geminiError) {
      console.error('Gemini failed in FarmBot response:', geminiError);
    }

    // 3. Insert assistant message
    const { data: insertedAssistant, error: assistantInsertError } = await supabase
      .from('messages')
      .insert([{
        session_id,
        role: 'assistant',
        content: assistantReply
      }])
      .select();

    if (assistantInsertError) throw assistantInsertError;

    return NextResponse.json({ success: true, userMessage: content, assistantMessage: insertedAssistant[0] });
  } catch (error) {
    console.error('Error in messages POST API:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
