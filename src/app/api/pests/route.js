import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callGeminiRest } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// In-memory cache to save API credits and speed up responses
// district -> { pests, outbreaks, timestamp }
const cache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache TTL

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || 'Guntur';

    const now = Date.now();
    const cachedData = cache[district];

    // If cache is valid, return cached pests/outbreaks and merge with live user-reported DB data
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log(`Returning cached pest data for district: ${district}`);
      const dbPests = await fetchDbPests(district);
      const dbOutbreaks = await fetchDbOutbreaks();
      
      const mergedPests = mergePests(dbPests, cachedData.pests);
      const mergedOutbreaks = mergeOutbreaks(dbOutbreaks, cachedData.outbreaks);
      
      return NextResponse.json({ pests: mergedPests, outbreaks: mergedOutbreaks });
    }

    console.log(`Generating live AI pest data for district: ${district}`);
    let livePests = [];
    let liveOutbreaks = [];

    try {
      const prompt = `You are an expert agronomist for Andhra Pradesh, India.
Generate active agricultural pest surveillance data for the district of "${district}" during the current month (June 2026, which is early Kharif crop season in Andhra Pradesh). Also generate a few recent outbreaks from any district in Andhra Pradesh to show on the state-wide feed.

Provide a JSON response. Do NOT wrap it in markdown block. The JSON must have the following structure:
{
  "pests": [
    {
      "id": "pest-live-1",
      "name": "Pest Common Name (e.g. Chilli Thrips, Yellow Stem Borer, Pink Bollworm)",
      "scientific_name": "Scientific name (e.g. Thrips parvispinus, Scirpophaga incertulas)",
      "crop_affected": "Main crop affected (e.g. Paddy, Cotton, Chillies, Tomato)",
      "severity_level": "critical" | "high" | "rising" | "low",
      "district": "${district}",
      "description": "Short realistic description of the infestation in fields of ${district} right now.",
      "advice": "Detailed actionable treatment advice for the farmer.",
      "image_url": "one of: yellow_stem_borer, pink_bollworm, chilli_thrips, tobacco_caterpillar, whitefly, brown_plant_hopper, early_shoot_borer, leaf_folder, groundnut_leaf_miner, red_hairy_caterpillar"
    }
  ],
  "outbreaks": [
    {
      "id": "ob-live-1",
      "crop_name": "Crop affected",
      "pest_name": "Pest name",
      "image_url": "A realistic unsplash image or null. Use high quality agricultural crop images from unsplash if possible (e.g., cotton field is 'https://images.unsplash.com/photo-1594900010978-8f9f0f9b60e6?q=80&w=200', chilli is 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=200', paddy is 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?q=80&w=200'). Choose a relevant URL or default to one of these three.",
      "description": "Short report about the outbreak seen in a field in Andhra Pradesh (specify the district, e.g. Guntur, Nellore, West Godavari).",
      "reporter_name": "Name of reporting farmer or agricultural officer (e.g. Venkata Rao, Rythu Bharosa Kendra Officer)",
      "district": "Name of the district where this outbreak occurred",
      "status": "VERIFIED",
      "created_at": "ISO String date in June 2026"
    }
  ]
}

Ensure the pests are highly realistic for the district of "${district}" during early Kharif (June). E.g. in Guntur, chilli crops and cotton are very common; in Kurnool, cotton and paddy are dominant; in Anantapur, groundnut is dominant; in Visakhapatnam, cashew, mango, and paddy are dominant. Make the advice practical, mentioning local Rythu Bharosa Kendra (RBK) services or standard chemical/organic pesticides.
Generate between 3 to 5 pests, and 2 to 3 outbreaks. Make sure the severity levels are distributed (at least one critical/high threat, and some rising/low).`;

      const responseText = await callGeminiRest(prompt, null, null, "application/json");
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      livePests = parsed.pests || [];
      liveOutbreaks = parsed.outbreaks || [];

      // Cache the generated data
      cache[district] = {
        pests: livePests,
        outbreaks: liveOutbreaks,
        timestamp: now
      };
    } catch (apiErr) {
      console.warn('Failed calling Gemini for live pests, using fallback seed data:', apiErr);
      // Fallback to static district seed data
      livePests = getFallbackPests(district);
      liveOutbreaks = getFallbackOutbreaks();
    }

    // Fetch latest user-reported data from Supabase
    const dbPests = await fetchDbPests(district);
    const dbOutbreaks = await fetchDbOutbreaks();

    // Merge database reports + seed/live AI reports
    const mergedPests = mergePests(dbPests, livePests);
    const mergedOutbreaks = mergeOutbreaks(dbOutbreaks, liveOutbreaks);

    return NextResponse.json({ pests: mergedPests, outbreaks: mergedOutbreaks });
  } catch (error) {
    console.error('Error in pests GET route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchDbPests(district) {
  try {
    const { data, error } = await supabase
      .from('pests')
      .select('*')
      .eq('district', district);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase pests query failed:', err);
    return [];
  }
}

async function fetchDbOutbreaks() {
  try {
    const { data, error } = await supabase
      .from('outbreaks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase outbreaks query failed:', err);
    return [];
  }
}

function mergePests(dbPests, livePests) {
  const combined = [...dbPests, ...livePests];
  const unique = [];
  const seen = new Set();
  combined.forEach(p => {
    const key = `${p.name.toLowerCase().trim()}_${p.district.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  });
  return unique;
}

function mergeOutbreaks(dbOutbreaks, liveOutbreaks) {
  const combined = [...dbOutbreaks, ...liveOutbreaks];
  const unique = [];
  const seen = new Set();
  combined.forEach(o => {
    // Unique key: crop + pest + reporter + district
    const key = `${o.crop_name.toLowerCase().trim()}_${o.pest_name.toLowerCase().trim()}_${o.reporter_name.toLowerCase().trim()}_${o.district.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(o);
    }
  });
  // Sort by date descending
  return unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Fallback catalog if Gemini API key fails or is rate-limited
function getFallbackPests(district) {
  const allSeeds = [
    {
      id: 'pest-seed-1',
      name: 'Yellow Stem Borer',
      crop_affected: 'Paddy',
      scientific_name: 'Scirpophaga incertulas',
      severity_level: 'critical',
      district: 'Kurnool',
      description: 'Bores into paddy stem causing dead hearts in young tillers and whiteheads in mature panicles. Heavy damage reported in late kharif plantations.',
      advice: 'Apply Cartap Hydrochloride 4G @ 10kg/acre or release Trichogramma japonicum parasitoids @ 20,000/acre.',
      image_url: 'yellow_stem_borer',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pest-seed-2',
      name: 'Pink Bollworm',
      crop_affected: 'Cotton',
      scientific_name: 'Pectinophora gossypiella',
      severity_level: 'critical',
      district: 'Anantapur',
      description: 'Larvae feed on cotton seeds and stain lint, leading to double seeds and early flower dropping. Population is rising due to late rainfall delay.',
      advice: 'Deploy pheromone traps (8/acre) to monitor moth flights. Spray Profenophos 50% EC @ 2ml/L if threshold exceeds.',
      image_url: 'pink_bollworm',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pest-seed-3',
      name: 'Black Chilli Thrips',
      crop_affected: 'Red Chillies',
      scientific_name: 'Thrips parvispinus',
      severity_level: 'high',
      district: 'Guntur',
      description: 'Severe upward leaf curling, flower drop, and brown patches on pepper pods. Rapidly spreading in dry weather zones.',
      advice: 'Install blue sticky traps (25/acre) and spray Fipronil 5% SC @ 2ml/L or Spinosad 45% SC @ 0.25ml/L.',
      image_url: 'chilli_thrips',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pest-seed-4',
      name: 'Tobacco Caterpillar',
      crop_affected: 'Tobacco',
      scientific_name: 'Spodoptera litura',
      severity_level: 'high',
      district: 'Prakasam',
      description: 'Caterpillars defoliate leaves leaving only major veins. Active feeding observed during night hours.',
      advice: 'Collect egg masses and caterpillars manually. Spray Neem Seed Kernel Extract (NSKE 5%) or Spinosad 45% SC.',
      image_url: 'tobacco_caterpillar',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pest-seed-5',
      name: 'Brown Plant Hopper (BPH)',
      crop_affected: 'Paddy',
      scientific_name: 'Nilaparvata lugens',
      severity_level: 'rising',
      district: 'Nellore',
      description: 'Sucks sap at base of plants, causing tillers to turn yellow and dry. Leads to circular hopper burn patches in fields.',
      advice: 'Provide wide alleyways in crops. Drain water for 3 days and spray Pymetrozine 50% WG @ 120g/acre.',
      image_url: 'brown_plant_hopper',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pest-seed-6',
      name: 'Mango Hopper',
      crop_affected: 'Mangoes',
      scientific_name: 'Idioscopus clypealis',
      severity_level: 'low',
      district: 'Chittoor',
      description: 'Nymphs suck sap from flowers and panicles, secreting sticky honeydew that hosts black sooty mold.',
      advice: 'Prune congested inner branches. Spray Imidacloprid 17.8% SL @ 0.3ml/L during pre-flowering stage.',
      image_url: 'mango_hopper',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pest-seed-7',
      name: 'Tea Mosquito Bug',
      crop_affected: 'Cashews',
      scientific_name: 'Helopeltis antonii',
      severity_level: 'high',
      district: 'Visakhapatnam',
      description: 'Causes necrotic lesions on tender shoots, leaves, and cashew nuts. Heavily active in Visakhapatnam hilly areas.',
      advice: 'Spray Lambda Cyhalothrin 5% EC @ 0.6ml/L at flushing and flowering stages.',
      image_url: 'tea_mosquito_bug',
      created_at: new Date().toISOString()
    }
  ];

  const matched = allSeeds.filter(p => p.district.toLowerCase() === district.toLowerCase());
  const nonMatched = allSeeds.filter(p => p.district.toLowerCase() !== district.toLowerCase());
  return [...matched, ...nonMatched.map(p => ({ ...p, district }))];
}

function getFallbackOutbreaks() {
  return [
    {
      id: 'ob-seed-1',
      crop_name: 'Chillies',
      pest_name: 'Chilli Thrips',
      image_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=200',
      description: 'Observed significant leaf curling and drying of plants in Guntur chilli fields. Thrips population is spreading fast due to dry weather conditions.',
      reporter_name: 'Venkata Subbaiah',
      district: 'Guntur',
      status: 'VERIFIED',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ob-seed-2',
      crop_name: 'Cotton',
      pest_name: 'Pink Bollworm',
      image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=200',
      description: 'Rosette flowers and boll damage observed in cotton crops across Kurnool district. Pheromone traps set up to capture adult moths.',
      reporter_name: 'Prasad Rao',
      district: 'Kurnool',
      status: 'VERIFIED',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ob-seed-3',
      crop_name: 'Paddy',
      pest_name: 'Yellow Stem Borer',
      image_url: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?q=80&w=200',
      description: 'Dead hearts seen in late-planted paddy fields of Nellore. Applying Cartap hydrochloride 4G to prevent further crop damage.',
      reporter_name: 'Kondala Rao',
      district: 'Nellore',
      status: 'VERIFIED',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ob-seed-4',
      crop_name: 'Tomatoes',
      pest_name: 'Tomato Leaf Curl Virus',
      image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200',
      description: 'Severe leaf curling and yellowing on tomato leaves in Madanapalle area, Chittoor. Whitefly population is extremely high.',
      reporter_name: 'Narasimha Naidu',
      district: 'Chittoor',
      status: 'VERIFIED',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ob-seed-5',
      crop_name: 'Groundnut',
      pest_name: 'Leaf Miner',
      image_url: 'https://images.unsplash.com/photo-1598970434796-0f2c4167e41b?q=80&w=200',
      description: 'Leaf miner larvae causing yellow blotches on groundnut leaves in Kadiri, Anantapur. Recommendation to spray Quinalphos is being followed.',
      reporter_name: 'Anjineyulu',
      district: 'Anantapur',
      status: 'VERIFIED',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}
