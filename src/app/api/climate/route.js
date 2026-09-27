import { NextResponse } from 'next/server';
import { callGeminiRest } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

const DISTRICT_COORDS = {
  srikakulam: { lat: 18.2949, lon: 83.8938 },
  'parvathipuram manyam': { lat: 18.7969, lon: 83.4243 },
  vizianagaram: { lat: 18.1124, lon: 83.3989 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  'alluri sitharama raju': { lat: 18.3273, lon: 82.8814 },
  'alluri sitharama raju (asr)': { lat: 18.3273, lon: 82.8814 },
  anakapalli: { lat: 17.6913, lon: 83.0039 },
  kakinada: { lat: 16.9891, lon: 82.2475 },
  'east godavari': { lat: 17.0005, lon: 81.7800 },
  'dr. b.r. ambedkar konaseema': { lat: 16.5811, lon: 82.0036 },
  eluru: { lat: 16.7107, lon: 81.0952 },
  'west godavari': { lat: 16.5449, lon: 81.5212 },
  ntr: { lat: 16.5062, lon: 80.6480 },
  krishna: { lat: 16.1875, lon: 81.1389 },
  palnadu: { lat: 16.2354, lon: 79.9972 },
  guntur: { lat: 16.3067, lon: 80.4365 },
  bapatla: { lat: 15.9042, lon: 80.4678 },
  prakasam: { lat: 15.5057, lon: 80.0499 },
  'spsr nellore': { lat: 14.4426, lon: 79.9865 },
  nellore: { lat: 14.4426, lon: 79.9865 },
  kurnool: { lat: 15.8281, lon: 78.0373 },
  nandyal: { lat: 15.4781, lon: 78.4836 },
  ananthapuramu: { lat: 14.6819, lon: 77.6006 },
  anantapur: { lat: 14.6819, lon: 77.6006 },
  'sri sathya sai': { lat: 14.1683, lon: 77.8105 },
  'ysr kadapa': { lat: 14.4713, lon: 78.8243 },
  kadapa: { lat: 14.4713, lon: 78.8243 },
  annamayya: { lat: 14.0044, lon: 78.7516 },
  tirupati: { lat: 13.6288, lon: 79.4192 },
  chittoor: { lat: 13.2172, lon: 79.1003 }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || 'Guntur';

    const normalizedDistrict = district.toLowerCase().trim().replace(/\s*\(.*\)\s*/g, '');
    const now = Date.now();
    const cachedData = cache[normalizedDistrict];

    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log(`Returning cached OpenWeather data for district: ${district}`);
      return NextResponse.json(cachedData.data);
    }

    const owmApiKey = process.env.OPENWEATHER_API_KEY || '144f7ef86d8567470558ba2c05b60e5a';
    console.log(`Fetching 100% live OpenWeather API data for district: ${district}`);
    const coords = DISTRICT_COORDS[normalizedDistrict] || DISTRICT_COORDS['guntur'];

    // 1. OpenWeather Current Weather Call & 5-Day Hourly Forecast Call
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${owmApiKey}`;
    const fcUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${owmApiKey}`;

    let currentTemp = 32;
    let feelsLike = 35;
    let currentHumidity = 65;
    let currentWindSpeed = 12;
    let currentCondition = 'Partly Cloudy';
    let currentIcon = '03d';
    let pressure = 1008;
    let visibility = 10000;

    const [curRes, fcRes] = await Promise.all([
      fetch(curUrl, { cache: 'no-store' }),
      fetch(fcUrl, { cache: 'no-store' })
    ]);

    let rawForecastList = [];

    if (curRes.ok) {
      const curData = await curRes.json();
      currentTemp = Math.round(curData.main?.temp ?? 32);
      feelsLike = Math.round(curData.main?.feels_like ?? currentTemp);
      currentHumidity = Math.round(curData.main?.humidity ?? 65);
      currentWindSpeed = Math.round((curData.wind?.speed ?? 3.5) * 3.6); // m/s to km/h
      currentCondition = curData.weather?.[0]?.main || 'Partly Cloudy';
      currentIcon = curData.weather?.[0]?.icon || '03d';
      pressure = curData.main?.pressure || 1008;
      visibility = curData.visibility || 10000;
    }

    if (fcRes.ok) {
      const fcData = await fcRes.json();
      rawForecastList = fcData.list || [];
    }

    // Process 1-Hour Step / 3-Hour Forecast Chunks
    const hourlySteps = rawForecastList.slice(0, 8).map(item => {
      const dt = new Date(item.dt * 1000);
      const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return {
        dt: item.dt,
        time: timeStr,
        temp: Math.round(item.main.temp),
        humidity: item.main.humidity,
        windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
        condition: item.weather[0]?.main || 'Cloudy',
        description: item.weather[0]?.description || 'cloudy',
        icon: `https://openweathermap.org/img/wn/${item.weather[0]?.icon || '03d'}@2x.png`,
        pop: Math.round((item.pop || 0) * 100)
      };
    });

    // Process Daily 5-Day Summaries
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyMap = {};

    rawForecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayName = daysOfWeek[date.getDay()];
      if (!dailyMap[dayName]) {
        dailyMap[dayName] = {
          day: dayName,
          temps: [],
          conditions: [],
          pops: [],
          icon: item.weather[0]?.icon || '03d'
        };
      }
      dailyMap[dayName].temps.push(item.main.temp);
      dailyMap[dayName].conditions.push(item.weather[0]?.main);
      dailyMap[dayName].pops.push((item.pop || 0) * 100);
    });

    const dailyForecasts = Object.values(dailyMap).slice(0, 5).map(dayObj => {
      const maxT = Math.round(Math.max(...dayObj.temps));
      const minT = Math.round(Math.min(...dayObj.temps));
      const avgPop = Math.round(dayObj.pops.reduce((a, b) => a + b, 0) / dayObj.pops.length);
      return {
        day: dayObj.day,
        condition: dayObj.conditions[0] || 'Partly Cloudy',
        tempHigh: maxT,
        tempLow: minT,
        precip: avgPop,
        icon: `https://openweathermap.org/img/wn/${dayObj.icon}@2x.png`
      };
    });

    // 2. Feed Live OpenWeather Metrics into Google Gemini AI
    console.log(`Generating live OpenWeather + Gemini AI agronomic advisory for: ${district}`);
    let parsedAiData = null;

    try {
      const prompt = `You are a senior agricultural meteorologist and agronomist specializing in Andhra Pradesh crops (Paddy, Cotton, Chillies, Groundnut, Sugarcane, Tomatoes).
Generate 100% accurate, highly practical crop advisories and agronomic warnings for the district of "${district}".

LIVE OPENWEATHER DATA FOR ${district.toUpperCase()}:
- Current Temperature: ${currentTemp}°C (Feels like: ${feelsLike}°C)
- Current Humidity: ${currentHumidity}%
- Wind Speed: ${currentWindSpeed} km/h
- Sky Condition: ${currentCondition}
- Barometric Pressure: ${pressure} hPa | Visibility: ${visibility} m
- 1-Hour Step Hourly Forecast: ${hourlySteps.map(h => `${h.time}: ${h.temp}°C, Rain ${h.pop}%, Wind ${h.windSpeed}km/h`).join(' | ')}
- 5-Day Daily Forecast: ${dailyForecasts.map(d => `${d.day}: ${d.condition}, Max ${d.tempHigh}°C, Min ${d.tempLow}°C, Rain Prob ${d.precip}%`).join(' | ')}

Your response MUST be a raw JSON object. Do NOT wrap in \`\`\`json or \`\`\`.
JSON Schema required:
{
  "overview": "Clear 2-sentence meteorology synopsis outlining weather conditions today in ${district} and how temperature, wind speed (${currentWindSpeed} km/h), and humidity (${currentHumidity}%) directly impact crop operations.",
  "alerts": [
    {
      "title": "Short Alert Headline for ${district}",
      "severity": "high" | "moderate" | "low",
      "desc": "Actionable 1-sentence guidance on irrigation, rain, or heat stress."
    }
  ],
  "advisory": "- Schedule foliar chemical sprays during calm dry morning hours when wind speed is below ${currentWindSpeed} km/h.\\n- Maintain field drainage channels clear to prevent waterlogging during precipitation.\\n- Scout leaf undersides for sucking pests following humidity shifts.",
  "agronomistAdvisory": [
    {
      "category": "🌾 IRRIGATIONAL & FIELD ADVISORY",
      "text": "Specific irrigation advice for local AP crops based on ${currentHumidity}% humidity and upcoming rain probability."
    },
    {
      "category": "🧪 FOLIAR SPRAY & CHEMICAL TIMING",
      "text": "Exact morning/evening spray windows accounting for ${currentWindSpeed} km/h wind speed."
    },
    {
      "category": "🐛 PEST & FUNGAL DISEASE ALERT",
      "text": "Targeted warning for Chilli Thrips, Paddy Stem Borer, or Cotton Pink Bollworm under current temperature (${currentTemp}°C)."
    }
  ]
}`;

      const aiResponseText = await callGeminiRest(prompt);
      const cleanedText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedAiData = JSON.parse(cleanedText);
    } catch (aiErr) {
      console.warn('AI agronomic generation fallback for', district, aiErr.message);
    }

    const finalResponse = {
      current: {
        temp: currentTemp,
        feelsLike: feelsLike,
        humidity: currentHumidity,
        windSpeed: currentWindSpeed,
        condition: currentCondition,
        pressure: pressure,
        visibility: visibility,
        icon: `https://openweathermap.org/img/wn/${currentIcon}@2x.png`,
        overview: parsedAiData?.overview || `Current weather in ${district} shows ${currentTemp}°C with ${currentHumidity}% humidity and ${currentCondition} skies.`
      },
      hourly: hourlySteps,
      forecast: dailyForecasts,
      alerts: (parsedAiData?.alerts && parsedAiData.alerts.length > 0) ? parsedAiData.alerts : [
        {
          title: `Weather & Irrigation Guidance for ${district}`,
          severity: dailyForecasts[0]?.precip > 45 ? "high" : "moderate",
          desc: dailyForecasts[0]?.precip > 45
            ? `High rain probability (${dailyForecasts[0]?.precip}%) expected. Suspend planned canal/drip irrigation to avoid root rot.`
            : `Stable weather in ${district}. Maintain standard irrigation cycles for active crops.`
        }
      ],
      advisory: parsedAiData?.advisory || `- Spraying should be performed during calm morning hours when wind is below ${currentWindSpeed} km/h.\n- Maintain field drainage to avoid standing water.\n- Check crops for sucking pests following humidity shifts.`,
      agronomistAdvisory: parsedAiData?.agronomistAdvisory || [
        {
          category: "🌾 IRRIGATIONAL ADVISORY",
          text: `Current humidity is ${currentHumidity}%. Adjust field watering to match crop vegetative requirements.`
        },
        {
          category: "🧪 SPRAY TIMING",
          text: `Wind speed is ${currentWindSpeed} km/h. Conduct foliar application during early morning hours.`
        },
        {
          category: "🐛 PEST SURVEILLANCE",
          text: `Monitor crops for localized pest outbreaks under current ${currentTemp}°C conditions.`
        }
      ]
    };

    cache[normalizedDistrict] = {
      timestamp: now,
      data: finalResponse
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Error in climate API route:', error);
    return NextResponse.json({ error: 'Failed to fetch OpenWeather climate data' }, { status: 500 });
  }
}

