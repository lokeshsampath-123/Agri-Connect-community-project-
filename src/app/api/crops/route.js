import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching crops:', error);
    
    // Return cached/fallback values if database query fails
    const fallbacks = [
      {
        id: '1',
        name: 'Paddy',
        variety: 'Sona Masuri',
        photography_url: 'https://lh3.googleusercontent.com/aida/AP1WRLvxTJeL1Q89dkiYKJ1-09v8mMf1boZYa3Buz3bOmoVZhww8xxJsKO5ZGHzahM-RbrGhXjMW7ARi9mztWQvbRxXLR0qyk6-MpsCLnW-ZbCIkupd_1tAnKw91szeP5mGd6ZBb_nzSfr8crfAEKJUuxux8D97GkrtvmR6qnTLg58P4KOt11h3PhtDXfzYb6MNsq8SXJ6ZApniBHJaLjqZpK3X-HBs_7ElMHivjmi_H496m4Wkmq_5HFX6z91s',
        district: 'Guntur',
        health_score: 92,
        details: 'Healthy paddy fields. High yield expected.'
      },
      {
        id: '2',
        name: 'Cotton',
        variety: 'BG II',
        photography_url: 'https://lh3.googleusercontent.com/aida/AP1WRLvsll9ktwciT3x-d8mHDknDtL7WhIqcAkRY8Bv8F5Kuus7sbY6h0kiKhHOE6s52mI82VzrvP0wiXq02Ka5orJRiUGmp107C9kMVjiNOiHeFo0x-N9dBKwO_TJ6Z9EzeQYgpQIzHjezvJlY0yblUa6vp1XSui5xnZuJI-Cl7BCr-sKXRq-nAc6p4HFmdJhvLVL4_E5c9qeUEU3h48f7hS_R9ci_wH1rUYtXfFK7cpFhQOUTn0Xxon5b-T2nc',
        district: 'Kurnool',
        health_score: 85,
        details: 'Blooming cotton bolls, minor whitefly risk.'
      }
    ];
    return NextResponse.json(fallbacks);
  }
}
