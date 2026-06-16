import { NextResponse } from 'next/server';
import { callGeminiRest } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// In-memory cache to save API credits and speed up responses
const cache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache TTL

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || 'Guntur';

    const now = Date.now();
    const cachedData = cache[district];

    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log(`Returning cached climate data for district: ${district}`);
      return NextResponse.json(cachedData.data);
    }

    console.log(`Generating live AI weather data for district: ${district}`);
    try {
      const prompt = `You are an expert agricultural meteorologist specializing in Andhra Pradesh, India.
Generate realistic weather forecast parameters and targeted agronomic warnings for the district of "${district}" during the month of June 2026 (early Kharif crop season).

Provide a raw JSON response. Do NOT wrap it in a markdown block. Do NOT use \`\`\`json or \`\`\`. The JSON must match the following schema:
{
  "current": {
    "temp": 34, // integer temperature in Celsius
    "humidity": 75, // integer percentage
    "windSpeed": 16, // wind speed in km/h
    "condition": "Humid / Light Rain", // short description
    "overview": "A detailed 2-sentence meteorology synopsis outlining weather conditions today and how they impact local crops."
  },
  "forecast": [
    // Provide a 5-day daily forecast starting tomorrow
    { "day": "Monday", "condition": "Scattered Showers", "tempHigh": 35, "tempLow": 28, "precip": 60 },
    { "day": "Tuesday", "condition": "Thunderstorms", "tempHigh": 33, "tempLow": 26, "precip": 80 },
    { "day": "Wednesday", "condition": "Partly Cloudy", "tempHigh": 36, "tempLow": 28, "precip": 20 },
    { "day": "Thursday", "condition": "Sunny", "tempHigh": 37, "tempLow": 29, "precip": 10 },
    { "day": "Friday", "condition": "Mostly Cloudy", "tempHigh": 34, "tempLow": 27, "precip": 40 }
  ],
  "alerts": [
    // Provide 1 to 2 active warnings
    {
      "title": "Warning Title (e.g. Sucking Pest Risk, Waterlogging Alert, High Gale Advisory)",
      "severity": "critical" | "high" | "moderate" | "low",
      "desc": "Detailed explanation of why this warning is active and what immediate measures the farmer should take."
    }
  ],
  "advisory": "A comprehensive AI Agronomist spray planning and soil management summary (e.g. 'Favorable spraying window is Tuesday morning before expected rain. Delay nitrogen dressing...')."
}

Ensure the weather patterns and crop advisories are highly realistic for the geography of "${district}". For example:
- Coastal districts (Vizag, Godavari, Nellore, Krishna, Srikakulam) are humid with frequent sea winds and rain alerts.
- Rayalaseema districts (Anantapur, Kurnool, Kadapa, Chittoor) are hotter, drier, and prone to soil moisture deficits and micro-irrigation advice.
Ensure the agronomic alerts connect directly to crops grown in "${district}" (e.g. Chilli/Cotton in Guntur, Groundnut in Anantapur, Paddy in Godavari/Krishna).`;

      const responseText = await callGeminiRest(prompt, null, null, 'application/json');
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      if (parsed && parsed.current && Array.isArray(parsed.forecast) && Array.isArray(parsed.alerts)) {
        cache[district] = {
          data: parsed,
          timestamp: now
        };
        return NextResponse.json(parsed);
      }
      throw new Error("Invalid weather JSON format from Gemini");
    } catch (apiErr) {
      console.warn(`Gemini weather API failed for ${district}, using local fallback:`, apiErr);
      const fallbackData = getFallbackClimateData(district);
      return NextResponse.json(fallbackData);
    }
  } catch (error) {
    console.error('Error in climate API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getFallbackClimateData(district) {
  const normalizedDistrict = district.toLowerCase().trim();

  const fallbackDatabase = {
    guntur: {
      current: {
        temp: 33,
        humidity: 78,
        windSpeed: 15,
        condition: "Thunderstorms / Rain",
        overview: "Thunderstorm activity is building over Guntur plains. Expect humid conditions with moderate rainfall during afternoon hours, boosting soil hydration."
      },
      forecast: [
        { day: "Monday", condition: "Scattered Showers", tempHigh: 34, tempLow: 26, precip: 60 },
        { day: "Tuesday", condition: "Thunderstorms", tempHigh: 33, tempLow: 25, precip: 80 },
        { day: "Wednesday", condition: "Partly Cloudy", tempHigh: 35, tempLow: 27, precip: 20 },
        { day: "Thursday", condition: "Sunny", tempHigh: 36, tempLow: 28, precip: 10 },
        { day: "Friday", condition: "Mostly Cloudy", tempHigh: 34, tempLow: 26, precip: 40 }
      ],
      alerts: [
        {
          title: "High Humidity Pest Risk",
          severity: "high",
          desc: "Relatively high humidity (above 75%) and warm temperatures are highly conducive to Chilli Thrips reproduction. Farmers should monitor leaf undersides closely."
        },
        {
          title: "Runoff Management Alert",
          severity: "moderate",
          desc: "Afternoon convective showers will cause soil runoff in sloped blocks. Clear bund outlets to allow controlled drainage."
        }
      ],
      advisory: "Favorable spraying window is limited. Do not apply pesticide sprays on Monday/Tuesday due to high wash-off risk. Plan foliar treatments for Wednesday morning."
    },
    kurnool: {
      current: {
        temp: 38,
        humidity: 45,
        windSpeed: 12,
        condition: "Hot / Dry Winds",
        overview: "Dry weather continues across Kurnool. Soil moisture index is dropping, necessitating timely irrigation schedules for cotton seedlings."
      },
      forecast: [
        { day: "Monday", condition: "Sunny", tempHigh: 39, tempLow: 29, precip: 0 },
        { day: "Tuesday", condition: "Sunny", tempHigh: 40, tempLow: 30, precip: 0 },
        { day: "Wednesday", condition: "Partly Cloudy", tempHigh: 38, tempLow: 28, precip: 10 },
        { day: "Thursday", condition: "Mostly Sunny", tempHigh: 39, tempLow: 29, precip: 0 },
        { day: "Friday", condition: "Light Showers", tempHigh: 36, tempLow: 27, precip: 30 }
      ],
      alerts: [
        {
          title: "Soil Moisture Deficit",
          severity: "high",
          desc: "Rapid evapotranspiration rates are depleting soil moisture. Delay groundnut sowing if irrigation is not available."
        }
      ],
      advisory: "Apply light irrigation during early morning or evening hours to minimize water evaporation. Spraying can be conducted at any time on Monday through Thursday."
    },
    anantapur: {
      current: {
        temp: 39,
        humidity: 40,
        windSpeed: 16,
        condition: "Intense Heat / Sunny",
        overview: "Scorching dry spell holds over Anantapur. High dry wind speeds are exacerbating dry soil conditions in red sandy blocks."
      },
      forecast: [
        { day: "Monday", condition: "Sunny", tempHigh: 40, tempLow: 29, precip: 0 },
        { day: "Tuesday", condition: "Sunny", tempHigh: 41, tempLow: 30, precip: 0 },
        { day: "Wednesday", condition: "Mostly Sunny", tempHigh: 40, tempLow: 29, precip: 0 },
        { day: "Thursday", condition: "Partly Cloudy", tempHigh: 38, tempLow: 28, precip: 10 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 37, tempLow: 27, precip: 20 }
      ],
      alerts: [
        {
          title: "Critical Dry Spell Warning",
          severity: "critical",
          desc: "Severe moisture stress detected in rainfed groundnut tracts. Farmers must utilize drip lines or sprinkler irrigation immediately to avoid crop stunting."
        }
      ],
      advisory: "Incorporate organic mulching (like straw or crop residue) around the base of banana and sweet orange crops to conserve moisture. Spray scheduling is optimal."
    },
    chittoor: {
      current: {
        temp: 32,
        humidity: 60,
        windSpeed: 10,
        condition: "Mostly Cloudy",
        overview: "Overcast skies bring mild temperatures to Chittoor. Localized light rain is cooling mango orchards and providing moisture to tomato fields."
      },
      forecast: [
        { day: "Monday", condition: "Partly Cloudy", tempHigh: 33, tempLow: 24, precip: 10 },
        { day: "Tuesday", condition: "Mostly Cloudy", tempHigh: 32, tempLow: 23, precip: 20 },
        { day: "Wednesday", condition: "Light Rain", tempHigh: 31, tempLow: 22, precip: 60 },
        { day: "Thursday", condition: "Showers", tempHigh: 30, tempLow: 22, precip: 80 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 32, tempLow: 23, precip: 30 }
      ],
      alerts: [
        {
          title: "Madanapalle Heavy Rain Forecast",
          severity: "high",
          desc: "Significant rain accumulation forecast on Wednesday/Thursday. Delay fruit picking for tomatoes to avoid post-harvest rot."
        }
      ],
      advisory: "Complete tomato harvesting on Monday/Tuesday before rains set in. Clear field channels to ensure rain water does not stagnate around crop roots."
    },
    krishna: {
      current: {
        temp: 31,
        humidity: 85,
        windSpeed: 22,
        condition: "Humid / Coastal Showers",
        overview: "Humid sea winds are blowing across Krishna delta. High moisture is supportive of paddy nursery growth but raises fungal humidity risk."
      },
      forecast: [
        { day: "Monday", condition: "Rain", tempHigh: 32, tempLow: 26, precip: 90 },
        { day: "Tuesday", condition: "Heavy Rain", tempHigh: 30, tempLow: 25, precip: 100 },
        { day: "Wednesday", condition: "Scattered Showers", tempHigh: 32, tempLow: 26, precip: 70 },
        { day: "Thursday", condition: "Partly Cloudy", tempHigh: 34, tempLow: 27, precip: 30 },
        { day: "Friday", condition: "Mostly Sunny", tempHigh: 35, tempLow: 28, precip: 10 }
      ],
      alerts: [
        {
          title: "Coastal Gale Warning",
          severity: "critical",
          desc: "Gale winds exceeding 30 km/h and heavy rainfall are expected. Fishermen and farmers should secure machinery and avoid open fields."
        },
        {
          title: "Delta Paddy Waterlogging Alert",
          severity: "high",
          desc: "Inundation risk in low-lying paddy nursery blocks. Ensure drainage canals are free of weeds and silt."
        }
      ],
      advisory: "Suspend all chemical, fertilizer, and pesticide applications until Thursday. Grains should be moved to covered storage to prevent damage."
    },
    nellore: {
      current: {
        temp: 34,
        humidity: 80,
        windSpeed: 18,
        condition: "Humid / Breeze",
        overview: "Humid and breezy weather is observed in Nellore. Sona Masuri paddy transplantation is progressing rapidly under favorable moisture."
      },
      forecast: [
        { day: "Monday", condition: "Mostly Sunny", tempHigh: 36, tempLow: 28, precip: 10 },
        { day: "Tuesday", condition: "Partly Cloudy", tempHigh: 35, tempLow: 27, precip: 20 },
        { day: "Wednesday", condition: "Scattered Showers", tempHigh: 34, tempLow: 26, precip: 50 },
        { day: "Thursday", condition: "Rain / Thunder", tempHigh: 32, tempLow: 25, precip: 70 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 35, tempLow: 27, precip: 20 }
      ],
      alerts: [
        {
          title: "Lightning Hazard Alert",
          severity: "high",
          desc: "Thunderstorm activity forecast for Wednesday/Thursday. Avoid standing under tall trees or near metal sheds during storm cells."
        }
      ],
      advisory: "Spraying can be safely conducted on Monday and Tuesday. Clean lemon orchards to prevent citrus canker spread through rain droplets."
    },
    visakhapatnam: {
      current: {
        temp: 32,
        humidity: 82,
        windSpeed: 20,
        condition: "Coastal Humid",
        overview: "Humid coastal winds are active in Vizag. Scattered rain is cooling orchards but demands physical protections for younger plantations."
      },
      forecast: [
        { day: "Monday", condition: "Partly Cloudy", tempHigh: 33, tempLow: 27, precip: 20 },
        { day: "Tuesday", condition: "Scattered Showers", tempHigh: 32, tempLow: 26, precip: 60 },
        { day: "Wednesday", condition: "Rain", tempHigh: 31, tempLow: 25, precip: 80 },
        { day: "Thursday", condition: "Showers", tempHigh: 31, tempLow: 25, precip: 70 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 33, tempLow: 26, precip: 30 }
      ],
      alerts: [
        {
          title: "Coastal Gale Warning",
          severity: "high",
          desc: "High sea winds are expected to shake tree canopies. Provide bamboo support staking for newly planted cashew and mango grafts."
        }
      ],
      advisory: "Fungicide treatments for mango orchards should be completed by Monday. Delay subsequent sprays until Friday when winds subside."
    },
    prakasam: {
      current: {
        temp: 35,
        humidity: 72,
        windSpeed: 14,
        condition: "Partly Cloudy / Humid",
        overview: "Warm and humid day over Prakasam. Convective clouds are building, suggesting localized thunder activity towards evening."
      },
      forecast: [
        { day: "Monday", condition: "Mostly Sunny", tempHigh: 37, tempLow: 28, precip: 0 },
        { day: "Tuesday", condition: "Partly Cloudy", tempHigh: 36, tempLow: 27, precip: 10 },
        { day: "Wednesday", condition: "Thunderstorms", tempHigh: 33, tempLow: 25, precip: 70 },
        { day: "Thursday", condition: "Rain / Showers", tempHigh: 32, tempLow: 24, precip: 80 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 35, tempLow: 26, precip: 30 }
      ],
      alerts: [
        {
          title: "Sudden Convective Showers",
          severity: "high",
          desc: "Sharp, sudden rain showers are likely. Cover tobacco leaves in curing yards to prevent water spotting and mold."
        }
      ],
      advisory: "Complete outdoor grain drying on Monday and Tuesday. Spraying window is closed from Wednesday morning until Thursday night."
    },
    srikakulam: {
      current: {
        temp: 30,
        humidity: 88,
        windSpeed: 24,
        condition: "Coastal Rain / Windy",
        overview: "Heavy cloud cover and strong sea winds are dominating Srikakulam. Continuous rain is recharging water tables but creating swampy conditions."
      },
      forecast: [
        { day: "Monday", condition: "Rain", tempHigh: 31, tempLow: 25, precip: 80 },
        { day: "Tuesday", condition: "Heavy Rain", tempHigh: 29, tempLow: 24, precip: 100 },
        { day: "Wednesday", condition: "Showers", tempHigh: 30, tempLow: 24, precip: 90 },
        { day: "Thursday", condition: "Light Rain", tempHigh: 31, tempLow: 25, precip: 60 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 32, tempLow: 26, precip: 30 }
      ],
      alerts: [
        {
          title: "Heavy Coastal Rain Warning",
          severity: "critical",
          desc: "Significant water accumulation expected. Avoid waterlogged fields, especially in low-lying coconut groves, and clear drainage blockages."
        }
      ],
      advisory: "Postpone all fertilizer applications. Do not attempt tree climbing in coconut groves on Monday/Tuesday due to slippery bark and wind hazard."
    },
    vizianagaram: {
      current: {
        temp: 32,
        humidity: 80,
        windSpeed: 18,
        condition: "Overcast / Light Showers",
        overview: "Humid air is trapped under heavy cloud cover in Vizianagaram. Gentle showers are moistening maize fields."
      },
      forecast: [
        { day: "Monday", condition: "Partly Cloudy", tempHigh: 34, tempLow: 26, precip: 30 },
        { day: "Tuesday", condition: "Showers", tempHigh: 32, tempLow: 25, precip: 70 },
        { day: "Wednesday", condition: "Heavy Rain", tempHigh: 30, tempLow: 24, precip: 90 },
        { day: "Thursday", condition: "Light Rain", tempHigh: 32, tempLow: 25, precip: 50 },
        { day: "Friday", condition: "Partly Cloudy", tempHigh: 33, tempLow: 26, precip: 20 }
      ],
      alerts: [
        {
          title: "Fungal Spore Incubation Risk",
          severity: "high",
          desc: "High humidity and moderate heat are causing fungal pathogens to spread in maize and sugarcane leaves. Inspect crops for rust spots."
        }
      ],
      advisory: "Foliar treatments can be applied on Monday. Postpone all field spraying for Wednesday due to heavy rainfall wash-out risk."
    },
    'west godavari': {
      current: {
        temp: 31,
        humidity: 84,
        windSpeed: 20,
        condition: "Rainy / Humid",
        overview: "Monsoon activity is active over West Godavari canal belts. Warm temperatures and high humidity are accelerating paddy nursery transplantations."
      },
      forecast: [
        { day: "Monday", condition: "Heavy Rain", tempHigh: 30, tempLow: 25, precip: 90 },
        { day: "Tuesday", condition: "Heavy Rain", tempHigh: 29, tempLow: 24, precip: 100 },
        { day: "Wednesday", condition: "Rain", tempHigh: 31, tempLow: 25, precip: 80 },
        { day: "Thursday", condition: "Partly Cloudy", tempHigh: 33, tempLow: 26, precip: 30 },
        { day: "Friday", condition: "Mostly Sunny", tempHigh: 35, tempLow: 27, precip: 10 }
      ],
      alerts: [
        {
          title: "Paddy Nursery Water Silt Alert",
          severity: "high",
          desc: "Excess mud and silt from runoff can choke young paddy shoots. Maintain a shallow, clear water level (2-3 cm) in nurseries."
        }
      ],
      advisory: "Postpone chemical spraying and top-dressing of urea until Thursday. Check bunds for leakages to prevent nutrient wash-out."
    },
    'east godavari': {
      current: {
        temp: 31,
        humidity: 83,
        windSpeed: 22,
        condition: "Showers / Humid",
        overview: "Cloudy, rainy weather covers East Godavari. Soil moisture levels are saturated, facilitating delta crop development."
      },
      forecast: [
        { day: "Monday", condition: "Rain", tempHigh: 32, tempLow: 26, precip: 80 },
        { day: "Tuesday", condition: "Heavy Rain", tempHigh: 30, tempLow: 25, precip: 90 },
        { day: "Wednesday", condition: "Showers", tempHigh: 31, tempLow: 25, precip: 70 },
        { day: "Thursday", condition: "Partly Cloudy", tempHigh: 33, tempLow: 27, precip: 30 },
        { day: "Friday", condition: "Mostly Sunny", tempHigh: 35, tempLow: 28, precip: 10 }
      ],
      alerts: [
        {
          title: "Slippery Tree Climber Advisory",
          severity: "high",
          desc: "Coconut harvesting should be delayed due to high trunk slip risks and strong wind gusts in orchards."
        }
      ],
      advisory: "Ensure all newly harvested grains are securely stored in dry, moisture-proof warehouses before Tuesday's heavy downpour."
    },
    'ysr kadapa': {
      current: {
        temp: 37,
        humidity: 48,
        windSpeed: 12,
        condition: "Mostly Sunny / Dry",
        overview: "Hot sunshine dominates YSR Kadapa. Evaporation rates are high, calling for strict water management on banana plantations."
      },
      forecast: [
        { day: "Monday", condition: "Sunny", tempHigh: 38, tempLow: 28, precip: 0 },
        { day: "Tuesday", condition: "Sunny", tempHigh: 39, tempLow: 29, precip: 0 },
        { day: "Wednesday", condition: "Mostly Sunny", tempHigh: 38, tempLow: 27, precip: 10 },
        { day: "Thursday", condition: "Partly Cloudy", tempHigh: 37, tempLow: 26, precip: 20 },
        { day: "Friday", condition: "Light Showers", tempHigh: 35, tempLow: 25, precip: 40 }
      ],
      alerts: [
        {
          title: "Dry Soil Moisture Advisory",
          severity: "moderate",
          desc: "Lack of rain is causing dry soil cracks in black soils. Maintain steady drip irrigation to prevent turmeric rhizome shriveling."
        }
      ],
      advisory: "Irrigation should be scheduled for early morning to reduce evapotranspiration. Crop spraying is highly favorable throughout the week."
    }
  };

  return fallbackDatabase[normalizedDistrict] || fallbackDatabase.guntur;
}
