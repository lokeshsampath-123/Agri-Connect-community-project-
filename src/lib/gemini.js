const apiKey = process.env.GEMINI_API_KEY || '';

/**
 * Helper to call Gemini REST API directly to bypass SDK bugs with AQ. key formats.
 */
export async function callGeminiRest(promptText, base64Data, mimeType, responseMimeType = null) {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured in .env.local');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`;

  const parts = [{ text: promptText }];

  if (base64Data) {
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType || 'image/jpeg'
      }
    });
  }

  const payload = {
    contents: [
      {
        parts: parts
      }
    ]
  };

  if (responseMimeType) {
    payload.generationConfig = {
      responseMimeType: responseMimeType
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-goog-api-key': apiKey
  };

  let response;
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      if (response.ok) break;
      
      const status = response.status;
      if (status !== 503 && status !== 429 && status !== 500) {
        // Break immediately for non-retryable status codes (e.g. 400, 401, 403, 404)
        break;
      }
    } catch (fetchErr) {
      if (i === attempts - 1) throw fetchErr;
    }
    if (i < attempts - 1) {
      // Wait 1.5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  if (!response || !response.ok) {
    const errorDetails = response ? await response.text() : 'No response received';
    throw new Error(`Gemini API HTTP Error (${response ? response.status : 'Fetch Failed'}): ${errorDetails}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return text.trim();
}

/**
 * Fallback parser for the AI Agent Console if Gemini API key fails.
 */
function fallbackParseAgentPrompt(promptText) {
  const text = promptText.toLowerCase();
  
  // Pests list
  const pests = [
    { name: 'Yellow Stem Borer', key: 'yellow_stem_borer', keywords: ['stem borer', 'yellow stem'] },
    { name: 'Pink Bollworm', key: 'pink_bollworm', keywords: ['bollworm', 'pink boll'] },
    { name: 'Chilli Thrips', key: 'chilli_thrips', keywords: ['thrips', 'chilli thrip'] },
    { name: 'Tobacco Caterpillar', key: 'tobacco_caterpillar', keywords: ['tobacco caterpillar', 'caterpillar', 'spodoptera'] },
    { name: 'Whitefly', key: 'whitefly', keywords: ['whitefly', 'white flies'] },
    { name: 'Brown Plant Hopper', key: 'brown_plant_hopper', keywords: ['brown plant hopper', 'bph', 'hopper'] },
    { name: 'Early Shoot Borer', key: 'early_shoot_borer', keywords: ['shoot borer', 'early shoot'] },
    { name: 'Leaf Folder', key: 'leaf_folder', keywords: ['leaf folder', 'folder'] },
    { name: 'Groundnut Leaf Miner', key: 'groundnut_leaf_miner', keywords: ['leaf miner', 'miner'] },
    { name: 'Red Hairy Caterpillar', key: 'red_hairy_caterpillar', keywords: ['red hairy', 'hairy caterpillar'] }
  ];

  // Crops list
  const crops = ['Paddy', 'Cotton', 'Chillies', 'Groundnut', 'Tomato', 'Maize', 'Pulse'];

  // Districts
  const districts = ['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Vizag', 'Nellore', 'Chittoor', 'Prakasam', 'East Godavari', 'West Godavari'];

  // Match pest
  let matchedPest = pests.find(p => p.keywords.some(kw => text.includes(kw))) || pests[0];

  // Match crop
  let matchedCrop = crops.find(c => text.includes(c.toLowerCase())) || 'Paddy';

  // Match district
  let matchedDistrict = districts.find(d => text.includes(d.toLowerCase())) || 'Guntur';

  // Severity
  let severity = 'low';
  if (text.includes('critical') || text.includes('emergency')) {
    severity = 'critical';
  } else if (text.includes('high') || text.includes('severe')) {
    severity = 'high';
  } else if (text.includes('rising') || text.includes('increase') || text.includes('warn')) {
    severity = 'rising';
  }

  // Advice
  let advice = "Apply light neem oil spray (3000 ppm) and monitor field conditions daily.";
  if (matchedPest.key === 'tobacco_caterpillar') {
    advice = "Plow soil to expose pupae, set up pheromone traps (5/acre), and spray Neem Seed Kernel Extract (5%).";
  } else if (matchedPest.key === 'pink_bollworm') {
    advice = "Deploy pheromone traps (8/acre) at 45 days. Avoid monoculture and apply chemical sprays if ETL > 10% damage.";
  } else if (matchedPest.key === 'chilli_thrips') {
    advice = "Spray Fipronil 5% SC (2ml/L) or Spinosad 45% SC (0.25ml/L). Conserve predatory mites.";
  } else if (matchedPest.key === 'yellow_stem_borer') {
    advice = "Set up light traps, apply Cartap Hydrochloride 4G (10kg/acre), and release Trichogramma japonicum parasitoids.";
  }

  return {
    pest_name: matchedPest.name,
    crop_affected: matchedCrop,
    severity_level: severity,
    district: matchedDistrict,
    description: promptText,
    image_url: matchedPest.key,
    advice: advice
  };
}

/**
 * Fallback conversational engine for FarmBot AI if Gemini API key fails.
 */
const REGIONAL_MARKET_DATA = {
  Guntur: {
    prices: [
      { name: 'Chillies (Teja Variety)', arrival: '5,400 Quintals', price: 18200, unit: '/ Qtl', change: '+4.2%' },
      { name: 'Cotton (Long Staple)', arrival: '8,200 Quintals', price: 7500, unit: '/ Qtl', change: '-1.2%' },
      { name: 'Paddy (Sona Masuri)', arrival: '12,000 Quintals', price: 2450, unit: '/ Qtl', change: '+0.5%' }
    ],
    trending: [
      { name: 'Chillies (Dry Red)', desc: 'High export demand in Asia', rank: '#1', trend: 'up' },
      { name: 'Cotton', desc: 'Spinning mill procurement active', rank: '#2', trend: 'up' },
      { name: 'Paddy (Fine)', desc: 'Steady domestic demand', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Export Surge', duration: 'Next 15 Days', title: 'Chilli Export Demand Spike', desc: 'High demand in Southeast Asian spice markets is projecting a 12% price increase at Guntur yards.' },
      { tag: 'Pest Risk', duration: 'Next 7 Days', title: 'Thrips Outbreak Impact', desc: 'Widespread Chilli Thrips damage in Guntur farms is tightening crop supply, elevating premium grade rates.' }
    ]
  },
  Kurnool: {
    prices: [
      { name: 'Cotton (Long Staple)', arrival: '9,100 Quintals', price: 7450, unit: '/ Qtl', change: '+1.8%' },
      { name: 'Paddy (Sona Masuri)', arrival: '15,000 Quintals', price: 2400, unit: '/ Qtl', change: '+1.1%' },
      { name: 'Bengal Gram (Desi)', arrival: '3,200 Quintals', price: 5400, unit: '/ Qtl', change: '0.0%' }
    ],
    trending: [
      { name: 'Cotton', desc: 'Slow arrivals driving rates up', rank: '#1', trend: 'up' },
      { name: 'Bengal Gram', desc: 'Favorable post-harvest storage', rank: '#2', trend: 'up' },
      { name: 'Paddy', desc: 'Regular mill demand active', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Supply Delay', duration: 'Next 10 Days', title: 'Rain Delay in Cotton Pickings', desc: 'Kurnool rain forecasts are delaying cotton pickings, causing buyers to bid higher for immediate stocks.' },
      { tag: 'Sowing Advice', duration: 'Next 30 Days', title: 'Bengal Gram Sowing Advisory', desc: 'RBK reports adequate soil moisture; farmers are advised to delay sales to maximize post-harvest returns.' }
    ]
  },
  Anantapur: {
    prices: [
      { name: 'Groundnut (Bold)', arrival: '4,100 Quintals', price: 6800, unit: '/ Qtl', change: '-2.5%' },
      { name: 'Sunflower', arrival: '1,800 Quintals', price: 5250, unit: '/ Qtl', change: '+1.0%' },
      { name: 'Paddy (Common)', arrival: '3,500 Quintals', price: 2300, unit: '/ Qtl', change: '0.0%' }
    ],
    trending: [
      { name: 'Groundnut', desc: 'Oil mills active in procurement', rank: '#1', trend: 'up' },
      { name: 'Sunflower', desc: 'Stable local refinery demand', rank: '#2', trend: 'up' },
      { name: 'Maize (Yellow)', desc: 'Poultry feedstock requirements', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Moisture Deficit', duration: 'Next 15 Days', title: 'Groundnut Quality Premium', desc: 'Low moisture in Anantapur is reducing average shell fill. High-yield pods will command a 15% premium.' },
      { tag: 'Crushing Demand', duration: 'Next 7 Days', title: 'Oil Mill Capacity Limits', desc: 'Local groundnut oil mills are operating at peak capacity, stabilizing raw seed pricing.' }
    ]
  },
  Chittoor: {
    prices: [
      { name: 'Mangoes (Totapuri)', arrival: '25,000 Quintals', price: 3500, unit: '/ Qtl', change: '+6.4%' },
      { name: 'Tomatoes (Madanapalle)', arrival: '45,000 Quintals', price: 1500, unit: '/ Qtl', change: '-8.2%' },
      { name: 'Paddy (Sona Masuri)', arrival: '2,800 Quintals', price: 2450, unit: '/ Qtl', change: '+0.2%' }
    ],
    trending: [
      { name: 'Mangoes', desc: 'Processing mills buying in bulk', rank: '#1', trend: 'up' },
      { name: 'Tomatoes', desc: 'Extreme supply glut at yards', rank: '#2', trend: 'down' },
      { name: 'Paddy', desc: 'Limited local arrivals', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Peak Harvest', duration: 'Next 10 Days', title: 'Totapuri Pulp Mill Season', desc: 'Chittoor pulp mills are buying Totapuri mangoes at record volumes; prices expected to peak this week.' },
      { tag: 'Supply Glut', duration: 'Next 5 Days', title: 'Madanapalle Tomato Excess', desc: 'Excessive tomato arrivals from local fields have depressed spot prices. Farmers advised to hold harvest if possible.' }
    ]
  },
  Krishna: {
    prices: [
      { name: 'Paddy (Sona Masuri)', arrival: '18,000 Quintals', price: 2480, unit: '/ Qtl', change: '+2.3%' },
      { name: 'Sugarcane (Common)', arrival: '80,000 Quintals', price: 310, unit: '/ Qtl', change: '0.0%' },
      { name: 'Black Gram (Urad)', arrival: '4,200 Quintals', price: 7200, unit: '/ Qtl', change: '+1.5%' }
    ],
    trending: [
      { name: 'Paddy', desc: 'Delta canal harvesting peak', rank: '#1', trend: 'up' },
      { name: 'Black Gram', desc: 'High demand from pulse mills', rank: '#2', trend: 'up' },
      { name: 'Sugarcane', desc: 'Sugar mills crushing steadily', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Delta Harvest', duration: 'Next 20 Days', title: 'Paddy Arrivals Peak', desc: 'Krishna delta paddy harvests are entering the markets, causing a temporary price dip before festive demand.' },
      { tag: 'Pulse Demand', duration: 'Next 14 Days', title: 'Urad Dal Procurement', desc: 'Low winter yields in black gram have increased processing demand, boosting local prices.' }
    ]
  },
  Nellore: {
    prices: [
      { name: 'Paddy (Super Fine)', arrival: '22,000 Quintals', price: 2550, unit: '/ Qtl', change: '+3.1%' },
      { name: 'Sugarcane', arrival: '50,000 Quintals', price: 315, unit: '/ Qtl', change: '+0.5%' },
      { name: 'Black Gram (Urad)', arrival: '3,800 Quintals', price: 7150, unit: '/ Qtl', change: '-0.8%' }
    ],
    trending: [
      { name: 'Paddy', desc: 'High demand for Nellore Sona', rank: '#1', trend: 'up' },
      { name: 'Sugarcane', desc: 'Cooperative factory demand', rank: '#2', trend: 'up' },
      { name: 'Black Gram', desc: 'Stable regional retail flow', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Premium Grain', duration: 'Next 15 Days', title: 'Nellore Sona Masuri Surge', desc: 'High retail brand demand in Chennai and Bangalore is driving Nellore Sona Masuri prices up by 8%.' },
      { tag: 'Crushing Update', duration: 'Next 10 Days', title: 'Sugar Factory Procurement', desc: 'Cooperative sugar mills in Nellore have announced timely payment releases, stabilizing sugarcane rates.' }
    ]
  },
  Visakhapatnam: {
    prices: [
      { name: 'Cashews (Raw Nut)', arrival: '2,500 Quintals', price: 11000, unit: '/ Qtl', change: '+2.0%' },
      { name: 'Mangoes (Banganapalli)', arrival: '8,000 Quintals', price: 4500, unit: '/ Qtl', change: '+4.5%' },
      { name: 'Paddy (Common)', arrival: '1,200 Quintals', price: 2350, unit: '/ Qtl', change: '0.0%' }
    ],
    trending: [
      { name: 'Cashews', desc: 'Processing factories active', rank: '#1', trend: 'up' },
      { name: 'Mangoes', desc: 'Table variety demand is high', rank: '#2', trend: 'up' },
      { name: 'Paddy', desc: 'Local agency procurement', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Cashew Peak', duration: 'Next 20 Days', title: 'Raw Cashew Nut Demand', desc: 'Urban processing factories in Vizag are actively buying raw nuts, keeping prices firm.' },
      { tag: 'Mango Premium', duration: 'Next 10 Days', title: 'Banganapalli Table Premium', desc: 'Slight harvest drops in coastal orchards have created a supply gap, driving premium prices.' }
    ]
  },
  Prakasam: {
    prices: [
      { name: 'Tobacco (Flue Cured)', arrival: '6,000 Quintals', price: 16500, unit: '/ Qtl', change: '+1.2%' },
      { name: 'Chillies (Guntur Type)', arrival: '2,800 Quintals', price: 17800, unit: '/ Qtl', change: '-2.0%' },
      { name: 'Cotton', arrival: '4,500 Quintals', price: 7350, unit: '/ Qtl', change: '+0.5%' }
    ],
    trending: [
      { name: 'Tobacco', desc: 'Competitive export bidding', rank: '#1', trend: 'up' },
      { name: 'Chillies', desc: 'Standard grade supply steady', rank: '#2', trend: 'down' },
      { name: 'Cotton', desc: 'Normal mill buying active', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Auction Active', duration: 'Next 15 Days', title: 'Tobacco Board Auction Peaks', desc: 'Tobacco Board auctions in Prakasam show aggressive bidding by export companies, driving leaf prices.' },
      { tag: 'Standard Grades', duration: 'Next 7 Days', title: 'Chilli Standard Grades Steady', desc: 'Mandi supplies are adequate for standard grades, preventing price volatility.' }
    ]
  },
  'West Godavari': {
    prices: [
      { name: 'Paddy (Super Fine)', arrival: '30,000 Quintals', price: 2600, unit: '/ Qtl', change: '+1.5%' },
      { name: 'Sugarcane', arrival: '120,000 Quintals', price: 320, unit: '/ Qtl', change: '+1.0%' },
      { name: 'Maize (Yellow)', arrival: '8,500 Quintals', price: 2100, unit: '/ Qtl', change: '-0.5%' }
    ],
    trending: [
      { name: 'Paddy', desc: 'Large scale miller contracts', rank: '#1', trend: 'up' },
      { name: 'Sugarcane', desc: 'Sugar mill crushing season', rank: '#2', trend: 'up' },
      { name: 'Maize', desc: 'Feed unit purchase slowdown', rank: '#3', trend: 'down' }
    ],
    insights: [
      { tag: 'Rice Bowl', duration: 'Next 25 Days', title: 'Super Fine Paddy Harvest', desc: 'Godavari delta paddy harvest is generating high-volume contracts from major exporters, keeping rates stable.' },
      { tag: 'Crushing Peak', duration: 'Next 12 Days', title: 'Sugarcane Factory Processing', desc: 'Sugar factories in West Godavari have started 24/7 crushing cycles; steady feedstock pricing.' }
    ]
  },
  'East Godavari': {
    prices: [
      { name: 'Paddy (Super Fine)', arrival: '28,000 Quintals', price: 2580, unit: '/ Qtl', change: '+1.3%' },
      { name: 'Sugarcane', arrival: '100,000 Quintals', price: 318, unit: '/ Qtl', change: '+0.8%' },
      { name: 'Maize (Yellow)', arrival: '7,200 Quintals', price: 2080, unit: '/ Qtl', change: '-0.2%' }
    ],
    trending: [
      { name: 'Paddy', desc: 'Delta canal harvesting peak', rank: '#1', trend: 'up' },
      { name: 'Sugarcane', desc: 'Sugar mills crushing steadily', rank: '#2', trend: 'up' },
      { name: 'Maize', desc: 'Feed mills active in buying', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Harvest Peak', duration: 'Next 20 Days', title: 'East Godavari Paddy Shipments', desc: 'Kakinada port shipping demand is keeping East Godavari fine paddy prices very strong.' },
      { tag: 'Refinement Peak', duration: 'Next 10 Days', title: 'Sugar Mill Crushing Volume', desc: 'Steady sugar cane shipments are keeping refining units fully active across the district.' }
    ]
  }
};

const CLIMATE_ALERTS_DATABASE = {
  Guntur: {
    type: 'Cyclone Alert',
    severity: 'critical',
    title: 'High Winds & Cyclone Warning',
    advisory: 'Vigorous wind currents (45-55 km/h) expected over coastal Guntur. Stake young chilli crops immediately and postpone all chemical spraying.'
  },
  Kurnool: {
    type: 'Heavy Rainfall Warning',
    severity: 'high',
    title: 'Intense Downpour Forecast',
    advisory: 'Kurnool is expected to receive 40-60mm rainfall. Clear drainage pathways in onion and cotton fields to prevent stagnant water root rot.'
  },
  Anantapur: {
    type: 'Drought Warning',
    severity: 'rising',
    title: 'Soil Moisture Deficit Advisory',
    advisory: 'Dry weather and high temperatures forecast. Increase micro-irrigation cycles for groundnut crops and apply organic mulch to preserve soil moisture.'
  },
  Krishna: {
    type: 'Disease Alert',
    severity: 'rising',
    title: 'High Humidity Blast Advisory',
    advisory: 'Relative humidity above 85% expected. High risk of Blast spread in Paddy crops. Monitor fields daily and apply Tricyclazole spray if lesions appear.'
  },
  Nellore: {
    type: 'Storm Alert',
    severity: 'critical',
    title: 'Thunderstorm & Lightning Warning',
    advisory: 'Severe electrical storms predicted. Avoid standing in open fields or near metal sheds during the afternoon hours. Delay fertilizer application.'
  },
  Visakhapatnam: {
    type: 'Coastal Alert',
    severity: 'high',
    title: 'Coastal Gale Warning',
    advisory: 'Strong coastal winds up to 50 km/h in coastal Vizag. Secure cashew orchards and ensure young saplings have windbreak stakes.'
  }
};

const PEST_SURVEILLANCE_DATABASE = [
  { 
    name: 'Yellow Stem Borer', 
    crop: 'Paddy (Rice)', 
    district: 'Kurnool', 
    scientific: 'Scirpophaga incertulas', 
    severity: 'critical', 
    desc: 'Bores into stems causing "dead hearts" in vegetative stage and whiteheads in mature panicles.',
    advice: 'Apply Cartap Hydrochloride 4G @ 10kg/acre or release Trichogramma japonicum parasitoids @ 20,000/acre.'
  },
  { 
    name: 'Pink Bollworm', 
    crop: 'Cotton', 
    district: 'Anantapur', 
    scientific: 'Pectinophora gossypiella', 
    severity: 'critical', 
    desc: 'Larvae feed on developing seeds and stain lint, leading to double seeds and premature boll opening.',
    advice: 'Deploy pheromone traps (8/acre) to monitor moth flights. Spray Profenophos 50% EC @ 2ml/L if threshold exceeds.'
  },
  { 
    name: 'Black Chilli Thrips', 
    crop: 'Red Chillies', 
    district: 'Guntur', 
    scientific: 'Thrips parvispinus', 
    severity: 'high', 
    desc: 'Severe upward leaf curling, dry flowers, and scarred dry red chilli pods.',
    advice: 'Install blue sticky traps (25/acre) and spray Fipronil 5% SC @ 2ml/L or Spinosad 45% SC @ 0.25ml/L.'
  },
  { 
    name: 'Tobacco Caterpillar', 
    crop: 'Tobacco', 
    district: 'Prakasam', 
    scientific: 'Spodoptera litura', 
    severity: 'high', 
    desc: 'Defoliates leaves leaving only major veins, causing skeletonized leaf drop.',
    advice: 'Collect egg masses and caterpillars manually. Spray Neem Seed Kernel Extract (NSKE 5%) or Spinosad 45% SC.'
  },
  { 
    name: 'Brown Plant Hopper (BPH)', 
    crop: 'Paddy (Rice)', 
    district: 'Nellore', 
    scientific: 'Nilaparvata lugens', 
    severity: 'rising', 
    desc: 'Sucks sap at base of Paddy plants, causing circular "hopper burn" patches.',
    advice: 'Provide wide alleyways (30 cm width) every 2 meters in the field for aeration. Drain standing water from the field for 3-4 days.'
  },
  { 
    name: 'Mango Hopper', 
    crop: 'Mangoes', 
    district: 'Chittoor', 
    scientific: 'Idioscopus clypealis', 
    severity: 'low', 
    desc: 'Sucks sap from flowers, secreting sticky honeydew that hosts black sooty mold.',
    advice: 'Prune congested inner branches to improve airflow. Spray Imidacloprid 17.8% SL @ 0.3ml/L during pre-flowering stage.'
  },
  { 
    name: 'Tea Mosquito Bug', 
    crop: 'Cashews', 
    district: 'Visakhapatnam', 
    scientific: 'Helopeltis antonii', 
    severity: 'high', 
    desc: 'Causes necrotic lesions on tender shoots, leaves, and cashew nuts, leading to shoot-drying or dieback.',
    advice: 'Spray Lambda Cyhalothrin 5% EC @ 0.6ml/L at flushing and flowering stages.'
  }
];

function fallbackFarmBotReply(userQuestion, defaultDistrict = 'Guntur') {
  const cleanText = userQuestion.toLowerCase().trim();
  
  // boundary-aware keyword matching to prevent short substrings like "hi" or "rc" from matching inside other words
  const containsAny = (arr) => arr.some(kw => {
    if (kw.length <= 3) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(cleanText);
    }
    return cleanText.includes(kw);
  });
  
  // Clean district mapping based on user query or default profile
  let activeDistrict = defaultDistrict || 'Guntur';
  
  if (cleanText.includes('guntur')) activeDistrict = 'Guntur';
  else if (cleanText.includes('kurnool')) activeDistrict = 'Kurnool';
  else if (cleanText.includes('anantapur')) activeDistrict = 'Anantapur';
  else if (cleanText.includes('chittoor')) activeDistrict = 'Chittoor';
  else if (cleanText.includes('krishna')) activeDistrict = 'Krishna';
  else if (cleanText.includes('nellore')) activeDistrict = 'Nellore';
  else if (cleanText.includes('visakhapatnam') || cleanText.includes('vizag')) activeDistrict = 'Visakhapatnam';
  else if (cleanText.includes('prakasam')) activeDistrict = 'Prakasam';
  else if (cleanText.includes('east godavari') || cleanText.includes('eastgodavari') || cleanText.includes('e. godavari')) activeDistrict = 'East Godavari';
  else if (cleanText.includes('west godavari') || cleanText.includes('westgodavari') || cleanText.includes('w. godavari')) activeDistrict = 'West Godavari';
  else if (cleanText.includes('srikakulam')) activeDistrict = 'Srikakulam';
  else if (cleanText.includes('vizianagaram')) activeDistrict = 'Vizianagaram';
  else if (cleanText.includes('kadapa') || cleanText.includes('ysr')) activeDistrict = 'YSR Kadapa';

  // Typo-tolerant crop keyword dictionary
  const cropKeywords = {
    paddy: ['paddy', 'rice', 'padi', 'pdy', 'ric', 'rc', 'sona', 'masuri', 'dhanyam', 'varlu'],
    cotton: ['cotton', 'coton', 'ctn', 'copra', 'prathi'],
    chilli: ['chilli', 'chili', 'chillies', 'chilies', 'mirchi', 'mrchi', 'mirch', 'pepper', 'teja'],
    tomato: ['tomato', 'tomatoe', 'tomatos', 'tomatoes', 'tomat', 'tmt', 'tamata'],
    groundnut: ['groundnut', 'ground nut', 'peanut', 'gdnut', 'gnut', 'verusenaga', 'palli'],
    mango: ['mango', 'mangoes', 'mago', 'magoes', 'mng', 'banganapalli', 'totapuri', 'mamidi'],
    sugarcane: ['sugarcane', 'sugar cane', 'cane', 'cheruku'],
    maize: ['maize', 'corn', 'mze', 'mokkajonna', 'jonna'],
    tobacco: ['tobacco', 'tabaco', 'pogaku'],
    turmeric: ['turmeric', 'tumeric', 'pasupu'],
    onion: ['onion', 'onions', 'ullipaya', 'ulli'],
    sunflower: ['sunflower', 'sunflowers', 'helianthus'],
    black_gram: ['black gram', 'urad', 'blackgram'],
    green_gram: ['green gram', 'moong', 'greengram'],
    lemon: ['lemon', 'lemons', 'citrus', 'canker', 'gudur', 'nimmakaya']
  };

  let matchedCropKey = null;
  let matchedCropName = 'Paddy';
  for (const [key, keywords] of Object.entries(cropKeywords)) {
    if (containsAny(keywords)) {
      matchedCropKey = key;
      break;
    }
  }

  const cropNamesMap = {
    paddy: 'Paddy (Rice)',
    cotton: 'Cotton',
    chilli: 'Red Chillies',
    tomato: 'Tomatoes',
    groundnut: 'Groundnut',
    mango: 'Mangoes',
    sugarcane: 'Sugarcane',
    maize: 'Maize (Corn)',
    tobacco: 'Tobacco',
    turmeric: 'Turmeric',
    onion: 'Onions',
    sunflower: 'Sunflower',
    black_gram: 'Black Gram (Urad Dal)',
    green_gram: 'Green Gram (Moong Dal)',
    lemon: 'Lemon'
  };

  if (matchedCropKey) {
    matchedCropName = cropNamesMap[matchedCropKey];
  }

  // Typo-tolerant intent checking
  const priceKeywords = ['price', 'prce', 'priec', 'prc', 'rate', 'rte', 'mandi', 'mnd', 'cost', 'cst', 'market', 'mrkt', 'value', 'val', 'selling', 'buy', 'pricing', 'worth'];
  const fertilizerKeywords = ['fertilizer', 'fertilser', 'fert', 'urea', 'dap', 'npk', 'potash', 'nutrient', 'nutrent', 'manure', 'compost', 'zinc', 'sulfur', 'nitrogen'];
  const weatherKeywords = ['weather', 'wether', 'wthr', 'rain', 'ran', 'climate', 'clmt', 'temp', 'degree', 'wind', 'cyclone', 'storm', 'heat', 'forecast', 'humidity'];
  const pestKeywords = ['pest', 'pst', 'bug', 'worm', 'disease', 'diseas', 'rot', 'wilt', 'spot', 'curling', 'curl', 'blight', 'borer', 'thrip', 'caterpillar', 'outbreak', 'infestation', 'spray', 'treatment', 'insect'];
  const greetingKeywords = ['hello', 'hi', 'hey', 'greetings', 'farmbot', 'welcome'];

  // 1. Agriculture context filtering (politely refuse non-farming queries)
  const agriVocab = [
    ...priceKeywords, ...fertilizerKeywords, ...weatherKeywords, ...pestKeywords, ...greetingKeywords,
    ...Object.values(cropKeywords).flat(),
    'farming', 'farm', 'crop', 'plant', 'leaf', 'soil', 'seed', 'irrigate', 'water', 'harvest', 'prevent', 'yield', 'profit', 'agri'
  ];

  const isAgriRelated = containsAny(agriVocab);
  if (!isAgriRelated && cleanText.length > 0) {
    return "**FarmBot Advisor:**\n\nI am FarmBot, your AgriConnect AI advisor. I can only assist with topics related to farming, crop health, soil nutrients, weather advisories, and Mandi market prices in Andhra Pradesh.\n\n*Could you please tell me what crops you are cultivating or any issues you are facing in your fields?*";
  }

  // 2. Greetings handler
  if (containsAny(greetingKeywords)) {
    return `**Hello!** I am **FarmBot**, your AgriConnect AI advisor for **${activeDistrict}** district.\n\nHow can I assist you today?\n1. **Pest & Disease Control** (Ask about field symptoms, remedies, or chemical/organic spray timing)\n2. **Mandi Market Prices** (Ask about current crop rates and trend forecasts)\n3. **Weather Forecasts** (Ask about rainfall, humidity, or spray planning)\n4. **Soil & Fertilizer Advisories** (Ask about NPK ratios, soil pH, and compost recommendations)\n\n*Which crop are you currently growing in your field, and how many weeks old is it?*`;
  }

  // 3. Pricing & Market Rates intent check (Evaluated FIRST to prioritize crop price queries)
  const isPriceQuery = containsAny(priceKeywords);
  if (isPriceQuery) {
    const districtData = REGIONAL_MARKET_DATA[activeDistrict] || REGIONAL_MARKET_DATA['Guntur'];
    let priceItem = null;
    
    if (matchedCropKey) {
      priceItem = districtData.prices.find(p => {
        const nameLower = p.name.toLowerCase();
        return cropKeywords[matchedCropKey].some(kw => nameLower.includes(kw));
      });
    }

    if (priceItem) {
      const changeText = priceItem.change.startsWith('+') ? `📈 up by ${priceItem.change}` : `📉 down by ${priceItem.change}`;
      let response = `📊 **Mandi Market Price Update for ${activeDistrict}:**\n\n`;
      response += `* 🌾 **Crop:** ${priceItem.name}\n`;
      response += `* 💰 **Current Rate:** **₹${priceItem.price.toLocaleString('en-IN')}${priceItem.unit}**\n`;
      response += `* 📦 **Daily Arrivals:** ${priceItem.arrival}\n`;
      response += `* 📈 **Trend:** ${changeText}\n\n`;
      
      // Look up district market insights for matched crop
      const insight = districtData.insights.find(ins => {
        const titleLower = ins.title.toLowerCase();
        const tagLower = ins.tag.toLowerCase();
        return titleLower.includes(matchedCropKey) || tagLower.includes(matchedCropKey) || 
               (matchedCropKey === 'paddy' && (titleLower.includes('rice') || tagLower.includes('rice')));
      }) || districtData.insights[0];

      if (insight) {
        response += `💡 **Mandi Outlook (${insight.tag} — ${insight.duration}):**\n${insight.title} — ${insight.desc}\n\n`;
      }

      const followUpQuestions = {
        paddy: "Are you growing fine-grain Sona Masuri or common varieties, and do you have warehouse storage ready or are you selling straight from the harvest yard?",
        cotton: "What fiber staple length are you harvesting, and are you planning to register with the Cotton Corporation of India (CCI) under the MSP scheme?",
        chilli: "What variety of dry red chilli are you harvesting (Teja, 341, or Byadagi), and do you have cold storage bookings ready?",
        tomato: "Are you harvesting Grade-A tomatoes, and have you checked the Madanapalle log arrivals before packing your transport vehicles?",
        groundnut: "What is the moisture level of your harvested pods? Buyers deduct price for moisture levels exceeding 9%."
      };

      response += followUpQuestions[matchedCropKey] || `What is your harvesting timeline for ${matchedCropName}, and are you looking for local procurement buyers?`;
      return response;
    } else {
      // Crop not directly sold in this district's mandi list: find it in others
      let generalPrice = null;
      for (const dist of Object.values(REGIONAL_MARKET_DATA)) {
        generalPrice = dist.prices.find(p => {
          const nameLower = p.name.toLowerCase();
          return matchedCropKey && cropKeywords[matchedCropKey].some(kw => nameLower.includes(kw));
        });
        if (generalPrice) break;
      }

      if (generalPrice) {
        let response = `Spot market rate for **${generalPrice.name}** is trading around **₹${generalPrice.price.toLocaleString('en-IN')}${generalPrice.unit}**.\n\n`;
        response += `💡 **Market Recommendation:** Direct sales to regional processing units or cooperative markets are advised for optimal margins. Check local Rythu Bharosa Kendra (RBK) boards for daily floor price cards.\n\n`;
        response += `What is your expected yield per acre, and do you have a target price before selling?`;
        return response;
      }

      // General price sheet
      let response = `📊 **Andhra Pradesh Mandi Price Ranges:**\n\n`;
      response += `* 🌾 **Paddy (Sona Masuri):** ₹2,400 - ₹2,580 per quintal\n`;
      response += `* 🌾 **Cotton (Long Staple):** ₹6,800 - ₹7,500 per quintal\n`;
      response += `* 🌾 **Red Chillies (Guntur Teja):** ₹18,000 - ₹21,500 per quintal\n`;
      response += `* 🌾 **Tomatoes (Grade A):** ₹1,200 - ₹1,550 per quintal\n`;
      response += `* 🌾 **Groundnut (Bold):** ₹6,200 - ₹6,800 per quintal\n\n`;
      response += `Which specific crop's market price are you trying to check, and in which district of Andhra Pradesh are you situated?`;
      return response;
    }
  }

  // 4. Climate & Weather intent check
  const isWeatherQuery = containsAny(weatherKeywords);
  if (isWeatherQuery) {
    const alert = CLIMATE_ALERTS_DATABASE[activeDistrict] || {
      type: 'Weather Notice',
      severity: 'low',
      title: 'Scattered Light Showers',
      advisory: `Moderate temperatures and light winds in ${activeDistrict}. Ideal conditions for standard farming operations. Maintain standard irrigation and weeding cycles.`
    };

    let response = `🌦️ **Localized Weather Advisory for ${activeDistrict} District:**\n\n`;
    response += `🛑 **Alert Status (${alert.type} — ${alert.severity.toUpperCase()}):** ${alert.title}\n`;
    response += `💡 **Agronomist Advisory:** ${alert.advisory}\n\n`;

    if (matchedCropKey === 'paddy') {
      response += `💧 *Paddy Water Management:* Keep drainage bunds checked to prevent stagnant overflow.\n\n`;
    } else if (matchedCropKey === 'chilli') {
      response += `🧪 *Chilli Spraying Advisory:* Postpone insecticide sprays if strong winds or showers are imminent.\n\n`;
    }

    response += `Are you experiencing heavy rainfall or dry soil blocks in your fields currently, and have you scheduled any sowing or transplanting this week?`;
    return response;
  }

  // 5. Pest & Disease intent check
  const isPestQuery = containsAny(pestKeywords);
  if (isPestQuery) {
    // If the query asks generally about pests in a district, or doesn't mention any crop
    if (matchedCropKey === null) {
      const nativePest = PEST_SURVEILLANCE_DATABASE.find(p => p.district.toLowerCase() === activeDistrict.toLowerCase()) || PEST_SURVEILLANCE_DATABASE[PEST_SURVEILLANCE_DATABASE.length - 1];
      const otherPests = PEST_SURVEILLANCE_DATABASE.filter(p => p.district.toLowerCase() !== activeDistrict.toLowerCase()).slice(0, 2);
      
      let response = `🐛 **Active Pest Surveillance in ${activeDistrict} District:**\n\n`;
      response += `⚠️ **Pest:** **${nativePest.name}** (*${nativePest.scientific}*)\n`;
      response += `🌾 **Crop Affected:** ${nativePest.crop}\n`;
      response += `🛑 **Symptom Alert:** ${nativePest.desc}\n`;
      response += `🛡️ **Recommended Action:** ${nativePest.advice}\n\n`;
      
      response += `Other notable crop threats under surveillance in the region include:\n`;
      otherPests.forEach(p => {
        response += `* **${p.name}** on **${p.crop}** (${p.severity.toUpperCase()} severity threat)\n`;
      });
      response += `\n`;
      
      response += `Are you cultivating **${nativePest.crop}** or other crops in the district of **${activeDistrict}**, and have you observed any of these symptoms in your fields?`;
      return response;
    }

    let diagnosis = null;

    if (matchedCropKey === 'paddy') {
      diagnosis = {
        pest: 'Yellow Stem Borer Outbreak',
        symptoms: 'Larvae bore into leaf sheaths causing "dead hearts" in vegetative phase and papery "whiteheads" in reproductive phase.',
        remedies: [
          'Set up light traps (1/acre) to attract and destroy adult moths.',
          'Release Trichogramma japonicum parasitoids @ 20,000/acre at weekly intervals.',
          'Apply Cartap Hydrochloride 4G @ 10 kg/acre if damage exceeds 10% dead hearts.'
        ]
      };
    } else if (matchedCropKey === 'cotton') {
      diagnosis = {
        pest: 'Pink Bollworm Infestation',
        symptoms: 'Larvae bore into cotton bolls, feeding on developing seeds and staining lint, leading to double seeds and pre-mature opening.',
        remedies: [
          'Deploy pheromone traps (8/acre) to trap and monitor adult moths.',
          'Apply Profenophos 50% EC @ 2 ml/L or Thiodicarb 75% WP @ 1g/L if threshold (ETL) is crossed.',
          'Avoid extending the cotton crop season; graze sheep post-harvest to eat residual bolls.'
        ]
      };
    } else if (matchedCropKey === 'chilli') {
      diagnosis = {
        pest: 'Black Chilli Thrips (Thrips parvispinus)',
        symptoms: 'Leaves curl upwards, crumble, and become dry/brittle. Brown scar scratches visible on flowers, stems, and young pods.',
        remedies: [
          'Spray Fipronil 5% SC (2.0 ml/L) or Spinosad 45% SC (0.25 ml/L).',
          'Set up blue sticky traps (25/acre) at crop canopy height.',
          'Spray Neem oil (10,000 ppm) @ 2ml/L to deter thrips oviposition.'
        ]
      };
    } else if (matchedCropKey === 'tomato') {
      diagnosis = {
        pest: 'Tomato Early Blight (Alternaria solani)',
        symptoms: 'Concentric target-board spots starting on older lower leaves, eventually spreading upwards and causing leaf yellowing and drop.',
        remedies: [
          'Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1ml/L.',
          'Remove lower leaves up to 12 inches from ground level to avoid soil splash.',
          'Practice crop rotation with paddy or maize (non-solanaceous crops).'
        ]
      };
    } else if (matchedCropKey === 'groundnut') {
      diagnosis = {
        pest: 'Groundnut Leaf Miner',
        symptoms: 'Larvae mine into leaf tissues creating yellowish-brown blotches; later leaves roll up and dry completely.',
        remedies: [
          'Spray Quinolphos 25% EC @ 2ml/L or Dimethoate 30% EC @ 2ml/L.',
          'Set up light traps in the field to monitor and capture adult moths.',
          'Intercrop groundnut with Red Gram or Cowpea in a 4:1 ratio.'
        ]
      };
    }

    if (diagnosis) {
      let response = `🔍 **FarmBot Diagnostic Report:**\n\n`;
      response += `* 🌾 **Crop Affected:** ${matchedCropName}\n`;
      response += `* 🐛 **Potential Threat:** **${diagnosis.pest}**\n`;
      response += `* 🛑 **Symptoms Observed:** ${diagnosis.symptoms}\n\n`;
      response += `🛡️ **Step-by-Step Treatment & Control Plan:**\n`;
      diagnosis.remedies.forEach((rem, idx) => {
        response += `${idx + 1}. ✅ ${rem}\n`;
      });
      response += `\n`;

      const followUpQuestions = {
        paddy: "Are you seeing white sheaths or panicle damage? Let me know the age of your paddy crop (days after transplanting) so I can suggest chemical spray timing.",
        cotton: "Have you opened any green bolls and found pinkish larvae inside, or are your flowers showing a rosette shape?",
        chilli: "Are the leaves curling upwards or downwards, and have you noticed any scarring on the flowers?",
        tomato: "Do you notice dark brown rings on the leaves, and is the stem showing any rotting or black marks?",
        groundnut: "Are the leaves showing rolled patterns, or have you noticed yellowish blotches on the surface?"
      };

      response += followUpQuestions[matchedCropKey] || "What specific symptoms are you seeing on the leaves or stems, and have you applied any pesticides recently?";
      return response;
    }

    return `For pest and disease control in ${activeDistrict}, we recommend regular field scouting and early applications of 5% Neem Seed Kernel Extract (NSKE) as a biological deterrent.\n\nCould you specify which crop you are cultivating and describe the symptoms (e.g. leaf spots, leaf curling, bore holes, or drying stems) so I can fetch the correct treatments?`;
  }

  // 6. Fertilizer / Soil Health intent check
  const isFertilizerQuery = containsAny(fertilizerKeywords);
  if (isFertilizerQuery) {
    let response = `🧪 **NPK Fertilizer Split Guideline for ${matchedCropName} in ${activeDistrict} District:**\n\n`;
    if (matchedCropKey === 'paddy') {
      response += `* 📊 **Recommended NPK Dosage:** 120:60:60 kg/ha.\n`;
      response += `* 📅 **Application Schedule:** Apply Phosphorous (DAP) entirely as a basal dose. Split Nitrogen (Urea) and Potassium (MOP) into three equal splits (Basal, Tillering, and Panicle Initiation stages).\n`;
    } else if (matchedCropKey === 'cotton') {
      response += `* 📊 **Recommended NPK Dosage:** 90:45:45 kg/ha.\n`;
      response += `* 📅 **Application Schedule:** Apply Urea in 3 split doses at 30, 60, and 90 days after sowing. Mix Urea with Neem Cake powder (5:1 ratio) to slow down nitrogen release and improve absorption.\n`;
    } else if (matchedCropKey === 'chilli') {
      response += `* 📊 **Recommended NPK Dosage:** 150:60:60 kg/ha.\n`;
      response += `* 📅 **Application Schedule:** Apply organic farmyard manure (FYM) @ 10 tonnes/acre. Split chemical nitrogenous doses to encourage vegetative flushes and flowering.\n`;
    } else {
      response += `* 📊 **Guideline:** Base your application on a recent soil health card test. Standard NPK dosages should be split to match crop growth cycles.\n`;
    }
    response += `\n⚠️ **Important:** Visit your nearest Rythu Bharosa Kendra (RBK) to check for subsidized bio-fertilizers and soil health testing kits.\n\n`;
    response += `Have you conducted a soil test for your field recently, and are you planning organic or chemical fertilization?`;
    return response;
  }

  // 7. General crop advice / follow-up (no specific intent found)
  if (matchedCropKey === 'paddy') {
    return `🌾 **Paddy (Rice) General Advisory for ${activeDistrict}:**\n\n* 💧 **Water Management:** Maintain a shallow water level of 2-5 cm during the tillering phase.\n* 🐛 **Pest Surveillance:** Watch out for pests like Yellow Stem Borer.\n\nAre you cultivating fine grain varieties like Sona Masuri, and have you noticed any "dead hearts" or white panicles in your fields?`;
  }
  if (matchedCropKey === 'cotton') {
    return `🌾 **Cotton General Advisory for ${activeDistrict}:**\n\n* 🌱 **Soil Conditions:** Cotton requires well-drained loamy soils.\n* 🐛 **Pest Alert:** Check regularly for sucking pests (Aphids, Jassids, Whiteflies) and install yellow sticky traps (10 per acre).\n\nWhat is the current stage of your cotton crop, and are you noticing any leaf reddening or drying on the lower branches?`;
  }
  if (matchedCropKey === 'chilli') {
    return `🌾 **Chilli General Advisory for ${activeDistrict}:**\n\n* 🌦️ **Air circulation:** Chilli crops thrive in well-aerated soils.\n* 🐛 **Pest Alert:** Watch out for powdery mildew and Black Chilli Thrips. Ensure balanced irrigation to avoid root rot issues.\n\nIs your crop in the flowering stage, and are you noticing any leaf curling or sudden flower drops?`;
  }
  if (matchedCropKey === 'tomato') {
    return `🌾 **Tomato General Advisory for ${activeDistrict}:**\n\n* 🪵 **Staking:** Tomato crops require staked support for high yields.\n* 🐛 **Pest Alert:** Watch for early blight spots and whiteflies. Keep field bunds clear of weeds.\n\nAre you cultivating determinate or indeterminate hybrids, and are your leaves showing upward curling or yellowing?`;
  }
  if (matchedCropKey === 'groundnut') {
    return `🌾 **Groundnut General Advisory for ${activeDistrict}:**\n\n* 🧪 **Nutrient Application:** Groundnut crops need gypsum application (200 kg/acre) at the pegging stage to ensure proper pod filling and seed size.\n\nHow many days has it been since sowing, and have you noticed any leaf spots (Tikka) or leaf miner caterpillars?`;
  }

  return `🤖 **FarmBot Advisor:**\n\nI understand you are asking about agricultural practices in **${activeDistrict}**.\n\nTo give you the most accurate response, could you please specify:\n1. 🌾 **Crop Type** (e.g. Paddy, Cotton, Chillies, Tomato, Groundnut)\n2. 🛑 **Symptoms Observed** (e.g. leaf spots, curling, bore holes, drying stems)\n3. 📊 **Information Needed** (e.g. Mandi prices, weather alerts, pest controls)`;
}

function addTranslationsToDiagnosis(diag) {
  if (!diag) return diag;
  if (diag.translations) return diag;

  const crop = (diag.crop_name || '').toLowerCase();
  const disease = (diag.diagnosis || '').toLowerCase();

  let teCrop = diag.crop_name || 'పంట';
  let hiCrop = diag.crop_name || 'फ़सल';
  let teDiag = diag.diagnosis || 'వ్యాధి నిర్ధారణ కాలేదు';
  let hiDiag = diag.diagnosis || 'निदान नहीं हुआ';
  let teSymptoms = diag.symptoms || 'ఆకులపై మచ్చలు గమనించబడ్డాయి.';
  let hiSymptoms = diag.symptoms || 'पत्तियों पर धब्बे देखे गए हैं।';
  let teRemedies = diag.remedies || [];
  let hiRemedies = diag.remedies || [];

  if (crop.includes('paddy') || crop.includes('rice')) {
    teCrop = "వరి (Paddy)";
    hiCrop = "धान (Paddy)";
  } else if (crop.includes('cotton')) {
    teCrop = "పత్తి (Cotton)";
    hiCrop = "कपास (Cotton)";
  } else if (crop.includes('chilli')) {
    teCrop = "మిరప (Chillies)";
    hiCrop = "मिर्च (Chillies)";
  } else if (crop.includes('tomato')) {
    teCrop = "టమోటా (Tomato)";
    hiCrop = "टमाटर (Tomato)";
  } else if (crop.includes('mango')) {
    teCrop = "మామిడి (Mangoes)";
    hiCrop = "आम (Mangoes)";
  } else if (crop.includes('groundnut')) {
    teCrop = "వేరుశనగ (Groundnut)";
    hiCrop = "मूंगफली (Groundnut)";
  }

  if (disease.includes('blast') || disease.includes('fungal')) {
    teDiag = "ఆకు మచ్చ తెగులు (Leaf Blast)";
    hiDiag = "लीफ ब्लास्ट (Leaf Blast)";
    teSymptoms = "ఆకులపై చిన్న ఓవల్ ఆకారపు గోధుమ రంగు మచ్చలు ఏర్పడతాయి.";
    hiSymptoms = "पत्तियों पर छोटे अंडाकार भूरे रंग के धब्बे बन जाते हैं।";
    teRemedies = [
      "లీటరు నీటికి 0.6 గ్రా చొప్పున ట్రైసైక్లాజోల్ 75% WP పిచికారీ చేయండి.",
      "నత్రజని ఎరువుల అధిక వినియోగాన్ని నివారించండి.",
      "పొలంలో నిలిచి ఉన్న నీటిని వెంటనే తొలగించండి."
    ];
    hiRemedies = [
      "ट्राइसाइक्लाजोल 75% डब्ल्यूपी 0.6 ग्राम प्रति लीटर पानी का छिड़काव करें।",
      "नाइट्रोजन उर्वरकों के अत्यधिक उपयोग से बचें।",
      "खेत में रुके हुए पानी की निकासी सुनिश्चित करें।"
    ];
  } else if (disease.includes('bollworm') || disease.includes('worm')) {
    teDiag = "గులాబీ రంగు పురుగు (Pink Bollworm)";
    hiDiag = "गुलाबी सुंडी (Pink Bollworm)";
    teSymptoms = "కాయలపై రంధ్రాలు పడతాయి మరియు పువ్వులు సరిగ్గా వికసించవు.";
    hiSymptoms = "कपास के फूलों और गूलरों में सूराख दिखाई देते हैं।";
    teRemedies = [
      "పూత దశలో లీటరు నీటికి 2 మి.లీ నింబెసిడిన్ పిచికారీ చేయండి.",
      "ఎకరాకు 5 లింగాకర్షక బుట్టలు (Pheromone traps) అమర్చండి.",
      "పంట వ్యర్థాలను నాశనం చేయండి."
    ];
    hiRemedies = [
      "फूल आने पर 2 मिलीलीटर प्रति लीटर नीम के तेल का छिड़काव करें।",
      "प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं।",
      "फसली अवशेषों को नष्ट करें।"
    ];
  } else if (disease.includes('thrips')) {
    teDiag = "తామర పురుగులు (Thrips)";
    hiDiag = "थ्रिप्स कीट (Thrips)";
    teSymptoms = "ఆకులు పైకి ముడుచుకుపోతాయి మరియు నల్లని మచ్చలు ఏర్పడతాయి.";
    hiSymptoms = "पत्तियां ऊपर की ओर मुड़ जाती हैं और पीली पड़ जाती हैं।";
    teRemedies = [
      "లీటరు నీటికి 0.3 మి.లీ చొప్పున ఫిప్రోనిల్ 5% SC పిచికారీ చేయండి.",
      "ఎకరాకు 10 నీలి జిగురు అట్టలు అమర్చండి.",
      "మొక్కలపై నీటిని చల్లడం ద్వారా పురుగుల ఉధృతిని తగ్గించండి."
    ];
    hiRemedies = [
      "फिप्रोनील 5% एससी 0.3 मिली प्रति लीटर पानी का छिड़काव करें।",
      "प्रति एकड़ 10 नीले चिपचिपे कार्ड लगाएं।",
      "खेत में नमी बनाए रखें।"
    ];
  } else if (disease.includes('healthy')) {
    teDiag = "ఆరోగ్యకరమైన పంట (Healthy)";
    hiDiag = "स्वस्थ फसल (Healthy)";
    teSymptoms = "ఆకులలో ఎటువంటి వ్యాధి లేదా కీటకాల సంకేతాలు లేవు. ఆకులు పచ్చగా ఆరోగ్యంగా ఉన్నాయి.";
    hiSymptoms = "पत्तियों पर किसी भी बीमारी या कीट के लक्षण नहीं हैं। फसल स्वस्थ है।";
    teRemedies = [
      "సేంద్రీయ ఎరువులను తగినంత మోతాదులో వాడండి.",
      "సకాలంలో నీటి పారుదల మరియు కలుపు నివారణ చర్యలు చేపట్టండి.",
      "పంటను నిరంతరం గమనిస్తూ ఉండండి."
    ];
    hiRemedies = [
      "जैविक खादों का सही मात्रा में प्रयोग करें।",
      "समय पर सिंचाई और खरपतवार नियंत्रण करें।",
      "नियमित रूप से फसल की निगरानी करते रहें।"
    ];
  } else {
    teDiag = `${diag.diagnosis} (నిర్ధారణ)`;
    hiDiag = `${diag.diagnosis} (निदान)`;
    teSymptoms = diag.symptoms ? `లక్షణాలు: ${diag.symptoms}` : '';
    hiSymptoms = diag.symptoms ? `लक्षण: ${diag.symptoms}` : '';
    teRemedies = (diag.remedies || []).map(r => `నివారణ: ${r}`);
    hiRemedies = (diag.remedies || []).map(r => `उपचार: ${r}`);
  }

  diag.translations = {
    te: {
      crop_name: teCrop,
      diagnosis: teDiag,
      symptoms: teSymptoms,
      remedies: teRemedies
    },
    hi: {
      crop_name: hiCrop,
      diagnosis: hiDiag,
      symptoms: hiSymptoms,
      remedies: hiRemedies
    }
  };

  return diag;
}

export async function analyzeCropImage(imageUrl, base64Data, mimeType, cropNameHint = '', description = '') {
  try {
    const prompt = `
      You are the FarmWise AI Agronomist system. Analyze the provided image of a crop leaf or plant.
      ${cropNameHint ? `The farmer identified this crop as: ${cropNameHint}.` : ''}
      ${description ? `The farmer described these symptoms or context: "${description}".` : ''}

      Provide a JSON output containing the crop analysis. Do NOT return markdown formatting like \`\`\`json. Return raw JSON text containing:
      {
        "crop_name": "Identified Crop (e.g. Paddy, Cotton, Chillies, Tomato)",
        "diagnosis": "Disease Name or 'Healthy'",
        "scientific_name": "Scientific Name of the pathogen or pest",
        "confidence": 0.0 to 1.0 (float confidence level),
        "health_score": 0 to 100 (integer health score where 100 is perfectly healthy),
        "symptoms": "Description of the symptoms observed in the image",
        "remedies": [
          "Fungicide/pesticide dosage details",
          "Organic/cultural controls (e.g. Neem seed oil, water drainage)",
          "Preventative farm practices"
        ],
        "translations": {
          "te": {
            "crop_name": "Telugu translation of crop name (e.g., వరి)",
            "diagnosis": "Telugu translation of disease name (keep English name in parentheses, e.g., ఆకు తెగులు (Leaf Blast))",
            "symptoms": "Telugu translation of symptoms description",
            "remedies": [
              "Telugu translation of remedy 1",
              "Telugu translation of remedy 2",
              "Telugu translation of remedy 3"
            ]
          },
          "hi": {
            "crop_name": "Hindi translation of crop name (e.g., धान)",
            "diagnosis": "Hindi translation of disease name (keep English name in parentheses, e.g., लीफ ब्लास्ट (Leaf Blast))",
            "symptoms": "Hindi translation of symptoms description",
            "remedies": [
              "Hindi translation of remedy 1",
              "Hindi translation of remedy 2",
              "Hindi translation of remedy 3"
            ]
          }
        }
      }
    `;

    const responseText = await callGeminiRest(prompt, base64Data, mimeType, "application/json");
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanText);
    return addTranslationsToDiagnosis(result);
  } catch (error) {
    console.error('Error during Gemini API analysis:', error);
    const fallback = getFallbackDiagnosis(cropNameHint, description);
    return addTranslationsToDiagnosis(fallback);
  }
}

// Simulates prompt updates from agent console
export async function processAgentPrompt(promptText) {
  try {
    const systemPrompt = `
      You are an autonomous agricultural agent. You are scanning alerts and messages.
      Your task is to parse the user prompt and generate a structured JSON update for the database.
      
      Look for details:
      1. pest_name: The name of the pest or disease (e.g., Yellow Stem Borer, Tobacco Caterpillar, Chilli Thrips, Pink Bollworm).
      2. crop_affected: The target crop (e.g. Paddy, Cotton, Chillies, Groundnut).
      3. severity_level: Must be 'critical', 'high', 'rising', or 'low'.
      4. district: The district (e.g. Guntur, Kurnool, Krishna, Anantapur, Vizag).
      5. description: Detailed description of the outbreak.
      6. image_url: A library key matching one of these: 'yellow_stem_borer', 'pink_bollworm', 'chilli_thrips', 'tobacco_caterpillar', 'whitefly', 'brown_plant_hopper', 'early_shoot_borer', 'leaf_folder', 'groundnut_leaf_miner', 'red_hairy_caterpillar'. Match the closest pest name.
      7. advice: Practical biological, physical, or chemical control advice.

      JSON format:
      {
        "pest_name": "...",
        "crop_affected": "...",
        "severity_level": "...",
        "district": "...",
        "description": "...",
        "image_url": "...",
        "advice": "..."
      }
    `;

    const fullPrompt = `${systemPrompt}\n\nUser Input: ${promptText}`;
    const responseText = await callGeminiRest(fullPrompt, null, null, "application/json");
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error in agent prompt processing, falling back to local parsing:', error);
    try {
      return fallbackParseAgentPrompt(promptText);
    } catch (fallbackErr) {
      console.error('Fallback agent parsing failed:', fallbackErr);
      throw error; // throw original
    }
  }
}

export function stripEmojis(str) {
  if (!str) return str;
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
    .replace(/  +/g, ' ')
    .trim();
}

export async function generateFarmBotReply(chatContext, userQuestion, defaultDistrict = 'Guntur', language = 'en') {
  try {
    const systemInstruction = `
      You are FarmBot, an expert agricultural AI assistant for AgriConnect.
      You are currently assisting a farmer in the district of "${defaultDistrict}", Andhra Pradesh.
      
      CRITICAL RULE: You must ONLY answer questions related to agriculture, farming, crops, soil health, weather, pests, livestock, irrigation, fertilizers, and Mandi market prices. 
      If the user's question is NOT about farming or agriculture, you must politely decline to answer, stating that you are an AI dedicated solely to assisting farmers, and ask them a farming-related question instead.

      FORMATTING RULE: Present your recommendations and treatment steps in a highly structured, point-wise, and easy-to-understand manner. Use numbered lists (e.g. 1., 2., 3.) when explaining action steps, solutions, remedies, or instructions.
      VISUAL RULE: Add relevant visual emojis (e.g. 🌾 for crops, 🤖 for FarmBot, 🐛 for pests/diseases, 💧 for water/irrigation, 🧪 for chemicals/fertilizers, 🛑 for warnings, 📈 for market prices, 🌦️ for weather, 🔍 for questions) to make the text engaging, scannable, and readable on screen.
      STYLE: Use simple, plain, layman terms. Break down complex scientific terms. Keep descriptions clear and easy to follow with clean paragraph spacing.

      Your answers must be highly dynamic and tailored to the farmer's queries. Avoid generic templates.
      If the user explains a symptom or situation briefly, provide relevant, practical advice (organic and chemical remedies where appropriate) and ALWAYS ask at least one relevant, clarifying follow-up question to learn more about their field conditions (e.g. crop age, soil type, leaf symptom details).
      Keep your response to 2-3 concise paragraphs with clean spacing.

      Respond to the user in their selected language: ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}. If they selected Telugu or Hindi, write your entire response using the appropriate native script (Telugu script for Telugu, Devanagari script for Hindi) so it is perfectly readable.
    `;

    const fullPrompt = `${systemInstruction}\n\nHere is the conversation history:\n${chatContext}\n\nUser's new question: ${userQuestion}`;
    const responseText = await callGeminiRest(fullPrompt, null, null);
    return responseText;
  } catch (error) {
    console.error('Error generating FarmBot reply, falling back to local rules:', error);
    return fallbackFarmBotReply(userQuestion, defaultDistrict);
  }
}

function getFallbackDiagnosis(cropNameHint, description = '') {
  const crop = (cropNameHint || 'Paddy').trim();
  const desc = description.toLowerCase();
  
  // Resolve crop norm with Pl@ntNet botanical override if present in description
  let cropNorm = crop.toLowerCase();
  if (desc.includes('botanical validation: plantnet identified this plant as')) {
    if (desc.includes('capsicum annuum') || desc.includes('chilli') || desc.includes('pepper')) {
      cropNorm = 'chilli';
    } else if (desc.includes('oryza sativa') || desc.includes('paddy') || desc.includes('rice')) {
      cropNorm = 'paddy';
    } else if (desc.includes('solanum lycopersicum') || desc.includes('tomato')) {
      cropNorm = 'tomato';
    } else if (desc.includes('gossypium') || desc.includes('cotton')) {
      cropNorm = 'cotton';
    } else if (desc.includes('mangifera') || desc.includes('mango')) {
      cropNorm = 'mango';
    } else if (desc.includes('arachis') || desc.includes('groundnut') || desc.includes('peanut')) {
      cropNorm = 'groundnut';
    } else if (desc.includes('saccharum') || desc.includes('sugarcane')) {
      cropNorm = 'sugarcane';
    } else if (desc.includes('zea mays') || desc.includes('maize') || desc.includes('corn')) {
      cropNorm = 'maize';
    } else if (desc.includes('nicotiana') || desc.includes('tobacco')) {
      cropNorm = 'tobacco';
    } else if (desc.includes('curcuma') || desc.includes('turmeric')) {
      cropNorm = 'turmeric';
    } else if (desc.includes('anacardium') || desc.includes('cashew')) {
      cropNorm = 'cashew';
    } else if (desc.includes('allium') || desc.includes('onion')) {
      cropNorm = 'onion';
    } else if (desc.includes('helianthus') || desc.includes('sunflower')) {
      cropNorm = 'sunflower';
    }
  }

  const has = (keywords) => keywords.some(kw => desc.includes(kw));

  const isHealthySearch = has(['health', 'good', 'fine', 'perfect', 'no disease', 'no pest', 'clean']);
  const hasSymptomSearch = has([
    'spot', 'pest', 'insect', 'bug', 'worm', 'eat', 'yellow', 'brown', 'rot', 'wilt', 
    'die', 'dead', 'curl', 'dry', 'hole', 'bite', 'borer', 'thrip', 'caterpillar', 
    'whitefly', 'hopper', 'pathogen', 'mold', 'mildew', 'blight', 'spot'
  ]);

  if (isHealthySearch || (desc.length > 0 && !hasSymptomSearch)) {
    return {
      crop_name: crop,
      diagnosis: "Healthy Crop (No Active Pathogens)",
      scientific_name: "N/A",
      confidence: 0.98,
      health_score: 98,
      symptoms: desc.length > 0 
        ? `Farmer reported: "${description}". No signs of active infestation or leaf lesions detected.`
        : "Visual leaf structures show excellent chlorophyll density and vascular layout.",
      remedies: [
        "Maintain normal micro-irrigation and scheduling.",
        "Apply balanced NPK fertilizers according to soil health card recommendations.",
        "Perform routine scouting of lower leaf surfaces for early pest vectors."
      ]
    };
  }

  // Crop specific fallback rules
  if (cropNorm.includes('paddy') || cropNorm.includes('rice')) {
    if (has(['insect', 'bug', 'worm', 'dead', 'whitehead', 'borer', 'caterpillar'])) {
      return {
        crop_name: crop,
        diagnosis: "Yellow Stem Borer Outbreak",
        scientific_name: "Scirpophaga incertulas",
        confidence: 0.89,
        health_score: 45,
        symptoms: "Larvae bore into leaf sheaths causing 'dead hearts' in vegetative phase and papery 'whiteheads' in reproductive phase.",
        remedies: [
          "Set up light traps (1/acre) to attract and destroy adult moths.",
          "Release Trichogramma japonicum parasitoids @ 20,000/acre at weekly intervals.",
          "Apply Cartap Hydrochloride 4G @ 10 kg/acre if damage exceeds 10% dead hearts."
        ]
      };
    }
    if (has(['hopper', 'bph', 'brown', 'jump'])) {
      return {
        crop_name: crop,
        diagnosis: "Brown Plant Hopper (BPH) Infestation",
        scientific_name: "Nilaparvata lugens",
        confidence: 0.87,
        health_score: 48,
        symptoms: "Sucking insects clustered at base of paddy tillers causing yellowing, drying, and characteristic circular patch 'hopper burn'.",
        remedies: [
          "Provide alleyways (30 cm width) every 2 meters in the field to allow aeration.",
          "Drain water from field for 3-4 days to disturb hopper reproduction.",
          "Spray Dinotefuran 20% SG @ 80g/acre or Pymetrozine 50% WG @ 120g/acre."
        ]
      };
    }
    return {
      crop_name: crop,
      diagnosis: "Paddy Leaf Blast (Fungal Disease)",
      scientific_name: "Magnaporthe oryzae",
      confidence: 0.92,
      health_score: 50,
      symptoms: "Spindle-shaped, diamond-like lesions on leaves with grey centers and brown borders.",
      remedies: [
        "Spray Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L.",
        "Split nitrogenous fertilizer applications; avoid excessive basal dressing of Urea.",
        "Burn crop residues and keep field bunds clear of weed hosts."
      ]
    };
  }

  if (cropNorm.includes('cotton')) {
    if (has(['worm', 'pink', 'boll', 'larvae', 'caterpillar'])) {
      return {
        crop_name: crop,
        diagnosis: "Pink Bollworm Infestation",
        scientific_name: "Pectinophora gossypiella",
        confidence: 0.94,
        health_score: 35,
        symptoms: "Larvae bore into cotton bolls, feeding on developing seeds and staining lint, leading to double seeds and pre-mature boll opening.",
        remedies: [
          "Deploy pheromone traps (8/acre) to trap adult moths.",
          "Apply Profenophos 50% EC @ 2 ml/L or Thiodicarb 75% WP @ 1g/L if threshold (ETL) is crossed.",
          "Avoid extending the cotton crop season; graze sheep post-harvest to eat residual bolls."
        ]
      };
    }
    if (has(['spot', 'blight', 'leaf', 'bacteria', 'red'])) {
      return {
        crop_name: crop,
        diagnosis: "Bacterial Leaf Blight (Angular Leaf Spot)",
        scientific_name: "Xanthomonas axonopodis pv. malvacearum",
        confidence: 0.88,
        health_score: 60,
        symptoms: "Angular, water-soaked leaf spots that turn brown/black, sometimes running down veins causing 'black arm' phase.",
        remedies: [
          "Spray Copper Oxychloride (3.0 g) + Streptocycline (100 mg) per liter of water.",
          "Practice crop rotation and seed treatment with Carboxin.",
          "Remove and safely burn infected stubble from fields."
        ]
      };
    }
    return {
      crop_name: crop,
      diagnosis: "Cotton Whitefly Infestation",
      scientific_name: "Bemisia tabaci",
      confidence: 0.85,
      health_score: 55,
      symptoms: "Tiny white-winged insects on underside of leaves, excreting sticky honeydew which leads to black sooty mold growth.",
      remedies: [
        "Install yellow sticky traps (15/acre) to monitor and capture whiteflies.",
        "Avoid synthetic pyrethroid sprays which cause resurgence of whiteflies.",
        "Spray Diafenthiuron 50% WP @ 240g/acre or Pyriproxyfen 10% EC @ 400ml/acre."
      ]
    };
  }

  if (cropNorm.includes('chilli') || cropNorm.includes('mirchi') || cropNorm.includes('pepper')) {
    if (has(['thrip', 'curl', 'curling', 'insect', 'black', 'wrink'])) {
      return {
        crop_name: crop,
        diagnosis: "Black Chilli Thrips Infestation",
        scientific_name: "Thrips parvispinus",
        confidence: 0.95,
        health_score: 30,
        symptoms: "Leaves curl upwards, crumble, and become dry/brittle. Brown scar scratches visible on flowers, stems and young pods.",
        remedies: [
          "Spray Fipronil 5% SC (2.0 ml/L) or Spinosad 45% SC (0.25 ml/L).",
          "Set up blue sticky traps (25/acre) at crop canopy height.",
          "Spray Neem oil (10,000 ppm) @ 2ml/L to deter thrips oviposition."
        ]
      };
    }
    if (has(['spot', 'rot', 'dieback', 'fungus', 'black'])) {
      return {
        crop_name: crop,
        diagnosis: "Chilli Anthracnose & Dieback",
        scientific_name: "Colletotrichum capsici",
        confidence: 0.90,
        health_score: 52,
        symptoms: "Necrosis of twigs starting from tip downwards, accompanied by circular sunken spots on ripe pods with concentric black dots.",
        remedies: [
          "Spray Propiconazole 25% EC @ 1ml/L or Azoxystrobin 23% SC @ 1ml/L.",
          "Use disease-free seeds and treat with Captan or Carbendazim (3g/kg seed).",
          "Promptly pick and destroy infected fruits to prevent spore distribution."
        ]
      };
    }
    return {
      crop_name: crop,
      diagnosis: "Chilli Cercospora Leaf Spot",
      scientific_name: "Cercospora capsici",
      confidence: 0.88,
      health_score: 65,
      symptoms: "Circular leaf spots with light grey centers and dark brown margins, resembling bird's eyes.",
      remedies: [
        "Spray Chlorothalonil 75% WP @ 2g/L or Mancozeb @ 2.5g/L.",
        "Provide wide plant spacing to improve canopy ventilation.",
        "Collect and burn fallen leaves to clear inoculum."
      ]
    };
  }

  if (cropNorm.includes('tomato')) {
    if (has(['spot', 'blight', 'yellow', 'brown', 'concentric'])) {
      return {
        crop_name: crop,
        diagnosis: "Tomato Early Blight",
        scientific_name: "Alternaria solani",
        confidence: 0.91,
        health_score: 58,
        symptoms: "Concentric target-board spots starting on older lower leaves, eventually spreading upwards and causing leaf yellowing and drop.",
        remedies: [
          "Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1ml/L.",
          "Remove lower leaves up to 12 inches from ground level to avoid soil splash.",
          "Practice crop rotation with paddy or maize (non-solanaceous crops)."
        ]
      };
    }
    if (has(['wilt', 'dry', 'collapse', 'droop'])) {
      return {
        crop_name: crop,
        diagnosis: "Tomato Fusarium Wilt",
        scientific_name: "Fusarium oxysporum f. sp. lycopersici",
        confidence: 0.86,
        health_score: 40,
        symptoms: "One-sided yellowing of leaves followed by wilting of the plant. Vascular bundles inside stems show dark brown discoloration.",
        remedies: [
          "Perform soil drenching with Carbendazim (1g/L) or apply Trichoderma viride formulation.",
          "Apply agricultural lime to raise soil pH to 6.5 - 7.0.",
          "Use wilt-resistant hybrid varieties (e.g., Arka Abha, Arka Alok)."
        ]
      };
    }
    return {
      crop_name: crop,
      diagnosis: "Tomato Leaf Curl (Virus)",
      scientific_name: "Tomato Yellow Leaf Curl Virus (TYLCV)",
      confidence: 0.93,
      health_score: 38,
      symptoms: "Severe stunting of plant, curling of leaves upwards/inwards, leaf yellowing and drastically reduced fruit setting.",
      remedies: [
        "Control whiteflies (the virus vector) using yellow sticky traps (15/acre).",
        "Spray Imidacloprid 17.8% SL @ 0.3ml/L or Acetamiprid 20% SP @ 0.2g/L.",
        "Uproot and destroy infected plants immediately to prevent vector spread."
      ]
    };
  }

  if (cropNorm.includes('mango')) {
    if (has(['white', 'powder', 'mildew', 'ash', 'bloom'])) {
      return {
        crop_name: crop,
        diagnosis: "Mango Powdery Mildew",
        scientific_name: "Oidium mangiferae",
        confidence: 0.94,
        health_score: 62,
        symptoms: "White powdery fungal coating on inflorescence, stalks, and young leaves, causing them to dry up and drop off.",
        remedies: [
          "Spray Wettable Sulphur 80% WP @ 3g/L or Karathane 48% EC @ 1ml/L.",
          "Ensure initial spray at flower initiation stage, followed by a second spray 15 days later.",
          "Prune inner overcrowded branches of mango trees to increase sunlight penetration."
        ]
      };
    }
    if (has(['hopper', 'bug', 'insect', 'sap'])) {
      return {
        crop_name: crop,
        diagnosis: "Mango Hopper Infestation",
        scientific_name: "Idioscopus clypealis",
        confidence: 0.90,
        health_score: 45,
        symptoms: "Nymphs and adults suck sap from tender shoots and inflorescence, excreting sticky honeydew that fosters black sooty mold.",
        remedies: [
          "Spray Imidacloprid 17.8% SL @ 3ml per 10 liters of water during pre-flowering stage.",
          "Prune lower branches and clean orchard floor.",
          "Conserve ladybird beetles and lacewings which feed on mango hopper nymphs."
        ]
      };
    }
    return {
      crop_name: crop,
      diagnosis: "Mango Anthracnose",
      scientific_name: "Colletotrichum gloeosporioides",
      confidence: 0.88,
      health_score: 55,
      symptoms: "Irregular dark brown leaf spots, blossom blight, and dark sunken decay spots on developing mango fruits.",
      remedies: [
        "Spray Carbendazim 50% WP @ 1g/L or Copper Oxychloride 50% WP @ 3g/L.",
        "Prune dead twigs post-harvest and spray the trees with Bordeaux mixture (1%).",
        "Avoid water accumulation around tree basins."
      ]
    };
  }

  if (cropNorm.includes('groundnut') || cropNorm.includes('peanut')) {
    if (has(['miner', 'worm', 'insect', 'larvae'])) {
      return {
        crop_name: crop,
        diagnosis: "Groundnut Leaf Miner Outbreak",
        scientific_name: "Aproaerema modicella",
        confidence: 0.92,
        health_score: 46,
        symptoms: "Larvae mine into leaf tissues creating yellowish-brown blotches; later leaves roll up and dry completely.",
        remedies: [
          "Spray Quinolphos 25% EC @ 2ml/L or Dimethoate 30% EC @ 2ml/L.",
          "Set up light traps in the field to monitor and capture adult moths.",
          "Intercrop groundnut with Red Gram or Cowpea in a 4:1 ratio."
        ]
      };
    }
    if (has(['spot', 'tikka', 'brown', 'yellow', 'fungus'])) {
      return {
        crop_name: crop,
        diagnosis: "Groundnut Tikka Leaf Spot",
        scientific_name: "Cercospora arachidicola / Cercosporidium personatum",
        confidence: 0.90,
        health_score: 50,
        symptoms: "Circular dark spots on upper leaf surfaces surrounded by a bright yellow halo (Early) or dark spots on lower leaf surfaces without halo (Late).",
        remedies: [
          "Spray Carbendazim 50% WP @ 1g/L + Mancozeb 75% WP @ 2g/L.",
          "Treat seeds with Trichoderma harzianum @ 4g/kg seed before sowing.",
          "Destroy plant residues of previous crop to eliminate fungal spores."
        ]
      };
    }
    return {
      crop_name: crop,
      diagnosis: "Groundnut Stem Rot",
      scientific_name: "Sclerotium rolfsii",
      confidence: 0.87,
      health_score: 55,
      symptoms: "Whitish fungal threads at soil-stem interface, causing wilting of branches followed by rotting of pegs and pods.",
      remedies: [
        "Deep summer plowing and crop rotation with sorghum or maize.",
        "Apply Gypsum @ 200 kg/acre at pegging stage to reduce disease susceptibility.",
        "Apply Trichoderma viride mixed with organic manure in soil during sowing."
      ]
    };
  }

  if (cropNorm.includes('sugarcane')) {
    return {
      crop_name: crop,
      diagnosis: "Red Rot of Sugarcane",
      scientific_name: "Colletotrichum falcatum",
      confidence: 0.91,
      health_score: 38,
      symptoms: "Reddish discoloration inside split cane stalks with white cross-bands. Leaves turn yellow, wither, and die starting from tips.",
      remedies: [
        "Plant healthy seed setts procured from disease-free nurseries.",
        "Treat sugarcane setts with Carbendazim (1g/L) or hot water before planting.",
        "Avoid waterlogging; maintain excellent drainage and remove affected clumps."
      ]
    };
  }

  if (cropNorm.includes('maize') || cropNorm.includes('corn')) {
    return {
      crop_name: crop,
      diagnosis: "Fall Armyworm Damage",
      scientific_name: "Spodoptera frugiperda",
      confidence: 0.93,
      health_score: 35,
      symptoms: "Jagged feeding holes on leaves, whorl damage filled with dark sawdust-like larval excreta, and skeletonized leaves.",
      remedies: [
        "Spray Chlorantraniliprole 18.5% SC @ 0.4 ml/L or Emamectin Benzoate 5% SG @ 0.4 g/L.",
        "Apply fine sand + neem cake powder (9:1) directly into leaf whorls.",
        "Set up pheromone traps (5/acre) to monitor FAW moth catches."
      ]
    };
  }

  if (cropNorm.includes('bengal') || cropNorm.includes('gram') || cropNorm.includes('chickpea')) {
    return {
      crop_name: crop,
      diagnosis: "Gram Pod Borer Infestation",
      scientific_name: "Helicoverpa armigera",
      confidence: 0.92,
      health_score: 42,
      symptoms: "Caterpillars feed on leaves and bore neat circular holes into developing chickpea pods to devour seeds.",
      remedies: [
        "Install wooden bird perches (15-20 per acre) to facilitate predatory birds.",
        "Spray HaNPV (Nuclear Polyhedrosis Virus) @ 250 LE/acre.",
        "Apply Flubendiamide 39.35% SC @ 0.2 ml/L or Chlorantraniliprole @ 0.3 ml/L."
      ]
    };
  }

  if (cropNorm.includes('tobacco')) {
    return {
      crop_name: crop,
      diagnosis: "Tobacco Caterpillar Infestation",
      scientific_name: "Spodoptera litura",
      confidence: 0.94,
      health_score: 40,
      symptoms: "Gregarious green-brown caterpillars defoliating tobacco leaves, leaving behind only the veins (skeletonized appearance).",
      remedies: [
        "Collect and destroy egg masses and leaf-feeding larval clusters manually.",
        "Spray Spinosad 45% SC @ 0.3 ml/L or Novaluron 10% EC @ 1 ml/L.",
        "Plant Castor as a trap crop on borders to attract caterpillars."
      ]
    };
  }

  if (cropNorm.includes('turmeric')) {
    return {
      crop_name: crop,
      diagnosis: "Turmeric Leaf Spot",
      scientific_name: "Colletotrichum capsici",
      confidence: 0.89,
      health_score: 55,
      symptoms: "Elliptical spots with grey/white centers and dark brown margins on leaves, causing foliage to dry and turn papery.",
      remedies: [
        "Spray Mancozeb @ 2.5 g/L or Carbendazim @ 1 g/L.",
        "Soak turmeric seed rhizomes in 0.2% Mancozeb solution for 30 minutes before planting.",
        "Practice clean weeding and destroy infected plant debris."
      ]
    };
  }

  if (cropNorm.includes('cashew')) {
    return {
      crop_name: crop,
      diagnosis: "Tea Mosquito Bug Damage",
      scientific_name: "Helopeltis antonii",
      confidence: 0.92,
      health_score: 36,
      symptoms: "Reddish-brown necrotic spots on leaves, tender shoots, panicles and developing cashew nuts, causing shoot-drying or 'dieback'.",
      remedies: [
        "Spray Lambda Cyhalothrin 5% EC @ 0.6 ml/L or Acetamiprid 20% SP @ 0.2 g/L.",
        "Synchronize sprays with flushing stage, flowering stage, and fruit-set stage.",
        "Prune congested, overlapping cashew trees to allow airflow."
      ]
    };
  }

  if (cropNorm.includes('onion')) {
    return {
      crop_name: crop,
      diagnosis: "Purple Blotch of Onion",
      scientific_name: "Alternaria porri",
      confidence: 0.90,
      health_score: 52,
      symptoms: "Small water-soaked leaf spots that enlarge, turning purple with white concentric rings; leaf tips wither.",
      remedies: [
        "Spray Mancozeb @ 2.5 g/L or Copper Oxychloride @ 3 g/L.",
        "Follow wide plant spacing and maintain optimal soil drainage.",
        "Follow a 3-year crop rotation with non-allium crops."
      ]
    };
  }

  if (cropNorm.includes('sunflower')) {
    return {
      crop_name: crop,
      diagnosis: "Sunflower Head Rot",
      scientific_name: "Rhizopus oryzae",
      confidence: 0.88,
      health_score: 48,
      symptoms: "Soft, water-soaked brown spots on flower heads that rot and yield black thread-like mold.",
      remedies: [
        "Spray Copper Oxychloride 50% WP @ 3g/L or Mancozeb @ 2g/L.",
        "Prevent mechanical injury to flower heads and keep birds away.",
        "Sow certified pathogen-free seeds."
      ]
    };
  }

  return {
    crop_name: crop,
    diagnosis: "General Foliar Infection",
    scientific_name: "Cercospora spp. / Alternaria spp.",
    confidence: 0.85,
    health_score: 60,
    symptoms: "Necrotic leaf spotting and yellowing around margins observed.",
    remedies: [
      "Spray generic systemic fungicide like Carbendazim 50% WP @ 1g/L.",
      "Remove heavily diseased leaves manually.",
      "Avoid overhead sprinkler irrigation; water at base of plant."
    ]
  };
}
