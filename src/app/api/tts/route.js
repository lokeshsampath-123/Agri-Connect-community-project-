import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { text: rawText, lang: rawLang } = await request.json();
    return handleTtsRequest(rawText, rawLang);
  } catch (error) {
    console.error('Error in POST TTS API:', error);
    return new Response(error.message, { status: 500 });
  }
}

async function handleTtsRequest(rawText = '', lang = 'en') {
  // Filter out emojis and markdown syntax for voice synthesis
  const text = (rawText || '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
    .replace(/[*_#`~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    return new Response('Missing text parameter', { status: 400 });
  }

  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

  const res = await fetch(ttsUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!res.ok) {
    return new Response('Failed to fetch audio from Google TTS', { status: res.status });
  }

  const audioBuffer = await res.arrayBuffer();

  return new Response(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const lang = searchParams.get('lang') || 'en';
    return handleTtsRequest(rawText, lang);
  } catch (error) {
    console.error('Error in GET TTS API:', error);
    return new Response(error.message, { status: 500 });
  }
}

