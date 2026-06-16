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
      console.log(`Returning cached market insights for district: ${district}`);
      return NextResponse.json(cachedData.data);
    }

    console.log(`Generating live AI market insights for district: ${district}`);
    try {
      const prompt = `You are an expert agricultural economist and agronomist specializing in Andhra Pradesh, India.
Generate two highly localized future crop-focused market insights for the district of "${district}" during the current month (June 2026, early Kharif season).

Your output must focus ONLY on crops, crop profitability, yields, agronomical suggestions, and pros/cons.

Provide a raw JSON response. Do NOT wrap it in a markdown block. Do NOT use \`\`\`json or \`\`\`. The JSON must match the following schema:
{
  "insights": [
    {
      "crop": "Name of crop (e.g., Paddy, Cotton, Chilli, Tomato, Groundnut, Sugarcane, Mangoes, Turmeric, Bengal Gram)",
      "tag": "Short status tag (e.g., High Profit, High Yield, Supply Glut, Export Surge, Pest Risk)",
      "duration": "Timing duration (e.g., Next 15 Days, Next 30 Days, Next 10 Days)",
      "title": "A short compelling title about the crop profit/yield trend",
      "desc": "A detailed 2-3 sentence analysis of why this crop is highly profitable or facing a risk, mentioning local markets, prices, or weather patterns in ${district} for June 2026.",
      "suggestion": "A detailed agronomical suggestion for the farmer to maximize their yield/profit or protect their crop.",
      "pros": [
        "First positive factor (e.g., Strong export demand from Asian hubs)",
        "Second positive factor (e.g., High local spot price at Mandi yards)"
      ],
      "cons": [
        "First challenge/risk (e.g., High thrips vector populations in hot weather)",
        "Second challenge/risk (e.g., 20% moisture discount applied by buyers)"
      ],
      "theme": "primary" | "success" | "warning" | "error"
    }
  ]
}

Ensure the crops and insights are realistic for "${district}". For example:
- Guntur: Chilli, Cotton, Paddy.
- Kurnool: Cotton, Bengal Gram, Paddy.
- Anantapur: Groundnut, Sweet Orange, Tomato.
- Chittoor: Tomato, Mangoes, Paddy.
- Krishna/Godavari: Paddy, Black Gram, Sugarcane, Coconut.
- YSR Kadapa: Turmeric, Banana, Bengal Gram.
- Vizag: Cashews, Mangoes.
Ensure the suggestions are highly practical and name local institutions like Rythu Bharosa Kendras (RBKs) or specific pesticides/practices where appropriate.`;

      const responseText = await callGeminiRest(prompt, null, null, 'application/json');
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
        cache[district] = {
          data: parsed,
          timestamp: now
        };
        return NextResponse.json(parsed);
      }
      throw new Error("Invalid insights JSON format from Gemini");
    } catch (apiErr) {
      console.warn(`Gemini API failed for market insights of ${district}, using local fallback:`, apiErr);
      const fallbackData = { insights: getFallbackMarketInsights(district) };
      return NextResponse.json(fallbackData);
    }
  } catch (error) {
    console.error('Error in market insights API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getFallbackMarketInsights(district) {
  const normalizedDistrict = district.toLowerCase().trim();

  const fallbackDatabase = {
    guntur: [
      {
        crop: "Dry Chilli",
        tag: "High Profit",
        duration: "Next 15 Days",
        title: "Export Arbitrage Surge",
        desc: "Aggressive buying by spice exporters for Guntur Teja and 341 varieties is driving mandi rates up. Spot prices are projected to rise by 8-10% due to low cold-storage stocks.",
        suggestion: "Solar-dry chillies on clean tarpaulins to avoid moisture cuts and achieve Grade-A color specifications required by international markets.",
        pros: ["Record-high export bidding from Southeast Asia", "Strong demand from local grinding mills"],
        cons: ["High drying costs due to sudden pre-monsoon showers", "High thrips vector populations in adjacent fields"],
        theme: "success"
      },
      {
        crop: "Cotton",
        tag: "Yield Gains",
        duration: "Next 30 Days",
        title: "BT Cotton Sowing Advisory",
        desc: "Sufficient pre-monsoon showers have primed Guntur soils for cotton. High-yielding BT cotton hybrids are commanding early seed premiums.",
        suggestion: "Deploy 5-8 pheromone traps per acre at 45 days. Coordinate with the local Rythu Bharosa Kendra (RBK) to procure subsidized neem oil for sucking pest prevention.",
        pros: ["Excellent early soil moisture levels", "Guaranteed MSP support from Cotton Corporation of India"],
        cons: ["High seed premium prices", "Potential labor shortage during early weeding stages"],
        theme: "primary"
      }
    ],
    kurnool: [
      {
        crop: "Bengal Gram",
        tag: "High Yield",
        duration: "Next 25 Days",
        title: "Post-Harvest Storage Yields",
        desc: "Kurnool's post-harvest storage scheme is encouraging farmers to hold chickpea stock. Processing mills are offering premium rates for low-moisture desi varieties.",
        suggestion: "Store chickpeas in standard plastic-lined gunny bags. Keep moisture levels below 9% to prevent storage weevil attacks and maintain premium grade.",
        pros: ["Low initial watering requirements", "High demand from regional dal processing mills"],
        cons: ["Susceptibility to wilt disease in low-drainage soils", "Temporary local transport bottlenecks"],
        theme: "success"
      },
      {
        crop: "Cotton",
        tag: "Price Spike",
        duration: "Next 15 Days",
        title: "Sowing Delay Pricing Premium",
        desc: "Late rains in certain Kurnool mandals have delayed bulk cotton sowing, creating immediate spot rate premiums for farmers with early cotton pickups.",
        suggestion: "Optimize nitrogen applications in split doses to accelerate vegetative growth. Mix urea with neem cake powder in a 5:1 ratio for slow release.",
        pros: ["Aggressive bidding by regional spinning mills", "Low initial pest pressure"],
        cons: ["Unpredictable monsoon onset timing", "Increased weed competition in early phases"],
        theme: "warning"
      }
    ],
    anantapur: [
      {
        crop: "Groundnut",
        tag: "High Profit",
        duration: "Next 20 Days",
        title: "Seed Quality Premium Opportunity",
        desc: "Dry weather conditions in Anantapur have reduced average pod sizes, meaning verified bold, high-fill groundnut pods will command a 15% pricing premium.",
        suggestion: "Procure certified K-6 groundnut seeds from your nearest Rythu Bharosa Kendra (RBK). Store harvested pods in well-aerated racks to prevent aflatoxin contamination.",
        pros: ["Strong demand from oil extraction factories", "Drought-resilient crop traits fit for Anantapur"],
        cons: ["Variable shell filling rates due to dry soil blocks", "Seed cost is higher this season"],
        theme: "success"
      },
      {
        crop: "Tomato",
        tag: "Glut Risk",
        duration: "Next 7 Days",
        title: "Supply Surge Spot Price Dip",
        desc: "Extreme tomato harvests across Anantapur are creating temporary market gluts. Prices at local yards are facing a downward correction.",
        suggestion: "Consider processing tomato surpluses into paste, or coordinate with regional cold storage facilities to delay immediate mandi deliveries.",
        pros: ["Extremely high yield per acre", "Low water-use hybrid varieties available"],
        cons: ["Steep decline in daily spot rates", "Short shelf life under high summer heat"],
        theme: "error"
      }
    ],
    chittoor: [
      {
        crop: "Mangoes",
        tag: "High Profit",
        duration: "Next 15 Days",
        title: "Totapuri Pulp Mill Season Peak",
        desc: "Chittoor's massive fruit processing mills are operating at 100% capacity. Buyback contract prices for Totapuri mangoes have hit a three-year high.",
        suggestion: "Use fruit fly pheromone traps (10 per acre) to protect ripe fruits. Harvest early in the morning when temperatures are cool to maintain quality.",
        pros: ["Direct, bulk buybacks from local pulp factories", "High fruit density on mature trees"],
        cons: ["High transport container costs", "Severe fruit fly attacks in unmanaged orchards"],
        theme: "success"
      },
      {
        crop: "Tomato",
        tag: "Glut Risk",
        duration: "Next 10 Days",
        title: "Madanapalle Tomato Excess",
        desc: "Madanapalle market yard is receiving record daily tomato truckloads, leading to steep price drops. Buyers are enforcing strict grading cuts.",
        suggestion: "Pre-sort tomatoes at the farm to separate Grade-A fruits. Grade-A bins command double the price compared to mixed bins.",
        pros: ["Excellent hybrid crop health", "Ample water availability from local reservoirs"],
        cons: ["Distress selling at yard gates", "High pest risk from tomato fruit borer"],
        theme: "error"
      }
    ],
    krishna: [
      {
        crop: "Paddy",
        tag: "High Yield",
        duration: "Next 30 Days",
        title: "Delta Canal Sowing Peak",
        desc: "Canal water release in the Krishna delta has triggered widespread paddy transplanting. Sona Masuri and fine grains show excellent growth.",
        suggestion: "Avoid excessive application of Nitrogen (Urea) to prevent Leaf Blast disease. Apply balanced NPK fertilizers in three splits.",
        pros: ["Abundant canal irrigation water", "High market demand for Nellore/Krishna rice varieties"],
        cons: ["High cost of chemical fertilizers", "Risk of labor shortage during transplanting"],
        theme: "success"
      },
      {
        crop: "Black Gram",
        tag: "High Profit",
        duration: "Next 15 Days",
        title: "Urad Dal Sourcing Shortage",
        desc: "Low arrivals in pulse mandis have driven Black Gram (Urad) prices up. Mills are offering spot payments to secure premium dry stocks.",
        suggestion: "Spray Carbendazim (1g/L) if powdery mildew symptoms appear on lower leaves. Ensure the crop is harvested when 80% of pods turn black.",
        pros: ["Very high market spot rates", "Soil fertilization via nitrogen fixation"],
        cons: ["Powdery mildew risk during humid mornings", "High weed density in delta soils"],
        theme: "primary"
      }
    ],
    nellore: [
      {
        crop: "Paddy",
        tag: "High Profit",
        duration: "Next 25 Days",
        title: "Nellore Sona Masuri Price Surge",
        desc: "Strong consumer brand preference in Chennai and Bangalore markets has driven Nellore Sona Masuri rates to record levels.",
        suggestion: "Harvest paddy when moisture is around 15% to minimize grain breakage during milling. Dry the grains on concrete yards before bagging.",
        pros: ["Close proximity to major urban distribution centers", "Premium pricing for regional brands"],
        cons: ["High rental costs for harvest machinery", "Water logging risks in low-lying delta fields"],
        theme: "success"
      },
      {
        crop: "Lemon",
        tag: "High Profit",
        duration: "Next 15 Days",
        title: "Gudur Lemon Market Demand",
        desc: "Gudur yard lemon prices are holding strong due to high demand for citrus concentrates and fresh juice markets in North India.",
        suggestion: "Prune dead branches regularly. Spray Copper Oxychloride (3g/L) to prevent bacterial citrus canker during humid weather.",
        pros: ["Continuous year-round harvesting cycles", "High returns during peak summer months"],
        cons: ["Citrus canker reduces fruit appearance grade", "High water requirement during fruiting"],
        theme: "success"
      }
    ],
    visakhapatnam: [
      {
        crop: "Cashews",
        tag: "High Profit",
        duration: "Next 20 Days",
        title: "Vizag Processing Sourcing Peak",
        desc: "Urban processing units in Visakhapatnam are bidding aggressively for raw cashew nuts. Quality checks on kernel outturn ratio are positive.",
        suggestion: "Apply early pruning to ensure adequate sunlight penetration. Spray Lambda-cyhalothrin at pre-flushing to prevent tea mosquito bug attacks.",
        pros: ["Aggressive bidding from export-oriented units", "Easy storage of dried raw nuts"],
        cons: ["Heavy tea mosquito bug infestations in high humidity", "Cyclone vulnerability in coastal zones"],
        theme: "success"
      },
      {
        crop: "Mangoes",
        tag: "Yield Gains",
        duration: "Next 15 Days",
        title: "Banganapalli Harvest Premium",
        desc: "Coastal Vizag mango orchards report moderate yields, which is protecting table-variety Banganapalli prices from crashing.",
        suggestion: "Use protective fruit covers or bags on premium fruits. Avoid spraying chemicals within 15 days of expected harvest.",
        pros: ["High consumer price for premium table mangoes", "Direct retail connections in Vizag city"],
        cons: ["Fruit drops due to high wind speeds", "Post-harvest black spot disease"],
        theme: "primary"
      }
    ],
    prakasam: [
      {
        crop: "Tobacco",
        tag: "High Profit",
        duration: "Next 15 Days",
        title: "Export Company Auction Bids",
        desc: "Tobacco Board auctions in Prakasam are seeing intense competition between international export houses, driving premium leaf prices.",
        suggestion: "Sort and grade tobacco leaves meticulously based on leaf color, thickness, and size. Grade-1 leaves fetch 30% higher prices.",
        pros: ["Guaranteed prompt payments at auction platforms", "Drought-resilient crop requiring minimal watering"],
        cons: ["Strict quality controls on pesticide residue", "Heavy labor requirement for curing barns"],
        theme: "success"
      },
      {
        crop: "Dry Chilli",
        tag: "Price Spike",
        duration: "Next 20 Days",
        title: "Prakasam Chilli Price Rally",
        desc: "Limited arrivals at Prakasam sub-yards are stabilizing prices for medium grades. Low cold storage allocations are forcing buyers to pay premiums.",
        suggestion: "Store harvested chillies in cold storages to obtain loan receipts from banks, allowing you to defer sales until peak festival demand.",
        pros: ["High capsaicin content variety demand", "Flexible sale timing via cold storage cards"],
        cons: ["High cost of cold storage rental", "Anthracnose disease risk in late-planted crops"],
        theme: "warning"
      }
    ],
    srikakulam: [
      {
        crop: "Coconut",
        tag: "High Yield",
        duration: "Next 30 Days",
        title: "Copra Processing Demand",
        desc: "Srikakulam copra drying yards are operating at capacity. Oil mills are offering higher rates due to strong demand for coconut oil.",
        suggestion: "Apply 50 kg of organic compost per palm annually. Spray Bordeaux mixture on the leaf crown before monsoon to prevent bud rot.",
        pros: ["Steady, predictable year-round crop returns", "High demand for organic coir and copra"],
        cons: ["Bud rot disease can damage mature palms", "Frequent coastal windstorms"],
        theme: "success"
      },
      {
        crop: "Cashews",
        tag: "High Profit",
        duration: "Next 15 Days",
        title: "Palasa Cashew Sourcing",
        desc: "The famous Palasa cashew processing cluster is bidding for local raw nuts, stabilizing prices across Srikakulam.",
        suggestion: "Gather fallen nuts daily. Dry them in the sun for 3 days until they rattle inside the shell before taking them to Palasa yards.",
        pros: ["Direct access to Palasa processing network", "Low input cost crop fit for poor soils"],
        cons: ["Stem borer insect attacks", "Unorganized local middle-men networks"],
        theme: "primary"
      }
    ],
    vizianagaram: [
      {
        crop: "Maize",
        tag: "High Yield",
        duration: "Next 25 Days",
        title: "Poultry Feed mill Contracts",
        desc: "Vizianagaram corn harvests are seeing high interest from poultry feed manufacturers. Spot rates are stable for grain moisture under 14%.",
        suggestion: "Damp maize grains are prone to fungal growth. Use mechanical dryers or dry on sheets until kernel moisture drops below 14% before storage.",
        pros: ["Short crop lifecycle and high biomass yield", "Direct buyback contracts from poultry feed units"],
        cons: ["High risk of Fall Armyworm infestation", "Severe storage weevil damage in humid rooms"],
        theme: "success"
      },
      {
        crop: "Sugarcane",
        tag: "Price Spike",
        duration: "Next 20 Days",
        title: "Sugar Cane Crushing Premium",
        desc: "Local cooperative sugar factories are competing with private jaggery units, resulting in early delivery price premiums.",
        suggestion: "Apply earthing-up operations at 4 months to prevent sugarcane lodging. Treat setts with warm water to prevent Red Rot.",
        pros: ["Guaranteed buyer network in crushing season", "Jaggery offers instant cash alternatives"],
        cons: ["High manual labor cost for harvesting", "Delayed payment clearance from select sugar mills"],
        theme: "primary"
      }
    ],
    'west godavari': [
      {
        crop: "Paddy",
        tag: "High Profit",
        duration: "Next 25 Days",
        title: "Rice Bowl Sona Masuri Exports",
        desc: "Godavari delta paddy harvest is generating high-volume contracts from major exporters, keeping rates stable.",
        suggestion: "Utilize combine harvesters to save labor. Incorporate paddy straw back into the soil to improve soil organic carbon.",
        pros: ["Perennial canal irrigation access", "Highly organized dealer and mill network"],
        cons: ["Paddy lodging due to sudden summer storms", "High cost of machinery rent"],
        theme: "success"
      },
      {
        crop: "Sugarcane",
        tag: "High Yield",
        duration: "Next 30 Days",
        title: "Jaggery Mill Sourcing",
        desc: "West Godavari's private jaggery processing units are actively buying cane. Jaggery exports to neighbouring states are highly profitable.",
        suggestion: "Plant red-rot resistant cane varieties Co-86032 or Co-V-09356. Clean trash leaves regularly to prevent scale insect buildup.",
        pros: ["Immediate cash payouts at jaggery crushers", "High recovery yield under warm Godavari weather"],
        cons: ["Water logging in low drainage zones", "High weeding costs"],
        theme: "primary"
      }
    ],
    'east godavari': [
      {
        crop: "Paddy",
        tag: "High Profit",
        duration: "Next 20 Days",
        title: "Kakinada Port Export Shipments",
        desc: "Exporters at Kakinada port are actively sourcing paddy from East Godavari farms, driving local prices above the MSP.",
        suggestion: "Perform timely field weeding during the first 30 days. Maintain a shallow water level (2-3 cm) during tillering.",
        pros: ["Direct export shipping logistics advantage", "High density crop yields in Godavari soils"],
        cons: ["High grain moisture deductions at buying points", "Lodging risks in heavy rains"],
        theme: "success"
      },
      {
        crop: "Coconut",
        tag: "Yield Gains",
        duration: "Next 30 Days",
        title: "Coconut Coir and Copra Processing",
        desc: "High demand for coir mattress fibers and edible copra has boosted coconut processing margins in East Godavari.",
        suggestion: "Install drip irrigation to maintain soil moisture during hot days. Release predatory mites to biologically control leaf pests.",
        pros: ["Multi-income crop (water, copra, coir, shell)", "Stable pricing due to strong domestic markets"],
        cons: ["Rhino beetle attacks crown of young palms", "High labor cost for tree climbers"],
        theme: "primary"
      }
    ],
    'ysr kadapa': [
      {
        crop: "Turmeric",
        tag: "High Profit",
        duration: "Next 20 Days",
        title: "Curcumin Premium Pricing",
        desc: "Kadapa's turmeric crop is showing high curcumin content (above 5%), attracting premium spice buyers from Maharashtra and Tamil Nadu.",
        suggestion: "Adopt raised bed planting to prevent rhizome rot disease. Clean rhizomes thoroughly before boiling and drying to preserve curcumin colors.",
        pros: ["Exceptional curcumin content premium pricing", "Excellent shelf life of polished dry turmeric"],
        cons: ["Susceptibility to rhizome rot in heavy soils", "Long crop cycle (8-9 months) restricts rotation"],
        theme: "success"
      },
      {
        crop: "Banana",
        tag: "Yield Gains",
        duration: "Next 15 Days",
        title: "Grand Naine Export Contracts",
        desc: "Middle East export buyers are signing buyback contracts for Grand Naine banana bunches in Kadapa, keeping local rates firm.",
        suggestion: "Prop banana plants with bamboo poles to prevent wind damage. Apply high potash fertilizer during flowering for larger bunches.",
        pros: ["Very high yield per acre under drip irrigation", "Lucrative export buyback price agreements"],
        cons: ["Panama wilt disease threat", "High risk of plant falling during high winds"],
        theme: "primary"
      }
    ]
  };

  return fallbackDatabase[normalizedDistrict] || fallbackDatabase.guntur;
}
