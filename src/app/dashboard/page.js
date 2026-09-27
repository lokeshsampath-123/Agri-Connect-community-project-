'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import FallbackImage from '@/components/FallbackImage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TRANSLATIONS } from '@/lib/translations';

// AP District Weather Alerts / Advisories Map (Local Fallback)
const CLIMATE_ALERTS = {
  Guntur: {
    type: 'Cyclone Alert',
    severity: 'critical',
    icon: 'cyclone',
    title: 'High Winds & Cyclone Warning',
    advisory: 'Vigorous wind currents (45-55 km/h) expected over coastal Guntur in the next 24 hours. Stake young chilli crops immediately and postpone all pesticide spraying operations.'
  },
  Kurnool: {
    type: 'Heavy Rainfall Warning',
    severity: 'high',
    icon: 'rainy',
    title: 'Intense Downpour Forecast',
    advisory: 'Kurnool is expected to receive 40-60mm rainfall in the next 18 hours. Clear drainage pathways in onion and cotton fields to prevent stagnant water root rot.'
  },
  Anantapur: {
    type: 'Drought Warning',
    severity: 'rising',
    icon: 'sunny',
    title: 'Soil Moisture Deficit Advisory',
    advisory: 'Dry weather and high temperatures forecast for Anantapur. Increase micro-irrigation cycles for groundnut crops and apply organic mulch to preserve soil moisture.'
  },
  Krishna: {
    type: 'Disease Alert',
    severity: 'rising',
    icon: 'water_drop',
    title: 'High Humidity Blast Advisory',
    advisory: 'Relative humidity above 85% expected. High risk of Blast spread in Paddy crops. Monitor fields daily and apply Tricyclazole Basal spray if symptoms appear.'
  },
  'Visakhapatnam (Vizag)': {
    type: 'Coastal Alert',
    severity: 'high',
    icon: 'tsunami',
    title: 'Coastal Gale Warning',
    advisory: 'Strong coastal winds up to 50 km/h in coastal Vizag. Secure cashew orchards and ensure young saplings have windbreak stakes.'
  },
  Nellore: {
    type: 'Storm Alert',
    severity: 'critical',
    icon: 'thunderstorm',
    title: 'Thunderstorm & Lightning Warning',
    advisory: 'Severe electrical storms predicted in Nellore. Avoid standing in open fields or near metal sheds during the afternoon hours. Delay fertilizer application.'
  }
};

// Default generic advisory
const DEFAULT_CLIMATE_ALERT = {
  type: 'Weather Notice',
  severity: 'low',
  icon: 'partly_cloudy_day',
  title: 'Scattered Light Showers',
  advisory: 'Moderate temperatures and light winds. Ideal conditions for standard farming operations. Maintain standard irrigation and weeding cycles.'
};

// Expanded Crop metadata (all 22 crops)
const CROP_META = {
  paddy: { name: 'Paddy (Rice)', icon: '🌾', baseHealth: 92, priceRange: '₹2,200 - ₹2,350' },
  cotton: { name: 'Cotton', icon: '☁️', baseHealth: 88, priceRange: '₹6,800 - ₹7,200' },
  chillies: { name: 'Red Chillies', icon: '🌶️', baseHealth: 74, priceRange: '₹18,000 - ₹21,500' },
  mangoes: { name: 'Mangoes', icon: '🥭', baseHealth: 95, priceRange: '₹4,500 - ₹6,000' },
  groundnut: { name: 'Groundnut', icon: '🥜', baseHealth: 81, priceRange: '₹6,200 - ₹6,800' },
  sugarcane: { name: 'Sugarcane', icon: '🎋', baseHealth: 90, priceRange: '₹3,150 - ₹3,400' },
  maize: { name: 'Maize (Corn)', icon: '🌽', baseHealth: 85, priceRange: '₹1,950 - ₹2,100' },
  bengal_gram: { name: 'Bengal Gram (Chickpeas)', icon: '🍲', baseHealth: 89, priceRange: '₹5,300 - ₹5,600' },
  tobacco: { name: 'Tobacco', icon: '🍂', baseHealth: 78, priceRange: '₹15,000 - ₹17,500' },
  tomatoes: { name: 'Tomatoes', icon: '🍅', baseHealth: 68, priceRange: '₹1,200 - ₹1,500' },
  turmeric: { name: 'Turmeric', icon: '🪵', baseHealth: 91, priceRange: '₹8,500 - ₹9,800' },
  cashews: { name: 'Cashews', icon: '🌰', baseHealth: 94, priceRange: '₹9,000 - ₹10,500' },
  onions: { name: 'Onions', icon: '🧅', baseHealth: 80, priceRange: '₹1,400 - ₹1,700' },
  sunflower: { name: 'Sunflower', icon: '🌻', baseHealth: 87, priceRange: '₹5,800 - ₹6,300' },
  lemon: { name: 'Lemon', icon: '🍋', baseHealth: 88, priceRange: '₹4,000 - ₹4,800' },
  black_gram: { name: 'Black Gram (Urad)', icon: '⚫', baseHealth: 85, priceRange: '₹7,000 - ₹7,500' },
  green_gram: { name: 'Green Gram (Moong)', icon: '🟢', baseHealth: 84, priceRange: '₹7,200 - ₹7,800' },
  coconut: { name: 'Coconut', icon: '🥥', baseHealth: 93, priceRange: '₹2,500 - ₹3,000' },
  banana: { name: 'Banana', icon: '🍌', baseHealth: 89, priceRange: '₹1,800 - ₹2,200' },
  papaya: { name: 'Papaya', icon: '🍈', baseHealth: 82, priceRange: '₹1,500 - ₹1,900' },
  oil_palm: { name: 'Oil Palm', icon: '🌴', baseHealth: 91, priceRange: '₹12,000 - ₹13,500' },
  ginger: { name: 'Ginger', icon: '🫚', baseHealth: 87, priceRange: '₹9,500 - ₹11,000' }
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigateTo = (href) => {
    const activeLang = localStorage.getItem('agri_lang') || 'en';
    if (activeLang !== 'en') {
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  // Live Climate state
  const [climateData, setClimateData] = useState(null);
  const [isClimateLoading, setIsClimateLoading] = useState(true);

  // Live Soil state
  const [soilData, setSoilData] = useState(null);
  const [isSoilLoading, setIsSoilLoading] = useState(true);

  // Authenticate user session
  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('user_profile');
      if (!session) {
        router.push('/login');
      } else {
        setProfile(JSON.parse(session));
        setIsLoading(false);
      }
    };
    checkSession();

    // Check periodically for updates from Settings
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Fetch dynamic Soil details
  useEffect(() => {
    if (!profile?.district) return;
    let active = true;

    const fetchSoil = async () => {
      const activeMandal = profile.village || 'Tenali';
      const cacheKey = `soil_data_v5_${profile.district}_${activeMandal}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setSoilData(JSON.parse(cached));
        setIsSoilLoading(false);
      } else {
        setIsSoilLoading(true);
      }

      try {
        const res = await fetch('/api/soil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district: profile.district,
            mandal: activeMandal
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setSoilData(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.warn('Error fetching soil data:', err);
      } finally {
        if (active) {
          setIsSoilLoading(false);
        }
      }
    };
    fetchSoil();

    return () => { active = false; };
  }, [profile?.district, profile?.village]);

  // Fetch live climate advisory
  useEffect(() => {
    if (!profile?.district) return;
    let active = true;

    const fetchClimate = async () => {
      setIsClimateLoading(true);
      try {
        const cleanedDist = profile.district.replace(/\s*\(.*\)\s*/g, '').trim();
        const res = await fetch(`/api/climate?district=${encodeURIComponent(cleanedDist)}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setClimateData(data);
          }
        }
      } catch (err) {
        console.warn('Error fetching climate data:', err);
      } finally {
        if (active) {
          setIsClimateLoading(false);
        }
      }
    };
    fetchClimate();

    return () => { active = false; };
  }, [profile?.district]);

  // Load recent community posts
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res = await fetch('/api/community');
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecentPosts(data.slice(0, 3)); // show last 3 posts
        }
      } catch (err) {
        console.warn('Error loading recent posts:', err);
      }
    };
    fetchRecentPosts();
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold text-sm">
        Checking farm profile session...
      </div>
    );
  }

  // Set active language translation Catalogs (Forcing English on React side to prevent Translate conflicts)
  const activeLang = 'en';
  const t = TRANSLATIONS.en;

  // Measurement unit settings
  const areaUnit = profile.areaUnit || 'acres';
  const weightUnit = profile.weightUnit || 'quintal';

  // Area conversion helper
  const convertArea = (acresVal) => {
    if (areaUnit === 'hectares') {
      return acresVal * 0.404686;
    }
    if (areaUnit === 'sqMeters') {
      return acresVal * 4046.86;
    }
    return acresVal; // default is 'acres'
  };

  const getAreaLabel = () => {
    if (areaUnit === 'hectares') return t.hectares || 'Hectares';
    if (areaUnit === 'sqMeters') return t.sqMeters || 'Sq Meters';
    return t.acres || 'Acres';
  };

  // Price conversion helper (per Quintal default -> per Kg or per Tonne)
  const convertPriceRange = (priceRangeStr) => {
    const matches = priceRangeStr.replace(/,/g, '').match(/\d+/g);
    if (!matches || matches.length < 2) return priceRangeStr;
    const p1 = parseFloat(matches[0]);
    const p2 = parseFloat(matches[1]);
    
    let factor = 1.0;
    if (weightUnit === 'kg') {
      factor = 0.01;
    } else if (weightUnit === 'tonne') {
      factor = 10.0;
    }
    
    const formatNum = (val) => {
      if (val % 1 !== 0) {
        return val.toFixed(1);
      }
      return Math.round(val).toLocaleString('en-IN');
    };
    
    return `₹${formatNum(p1 * factor)} - ₹${formatNum(p2 * factor)}`;
  };

  const getWeightLabel = () => {
    if (weightUnit === 'kg') return t.kg || 'Kg';
    if (weightUnit === 'tonne') return t.tonne || 'Tonne';
    return t.quintal || 'Quintal';
  };

  // Calculate total acreage
  const totalAcreage = Object.values(profile.crops || {}).reduce((acc, curr) => acc + curr, 0);

  // Weather advisory parsing (Live AI data priority, else static maps fallback)
  const localFallbackAlert = CLIMATE_ALERTS[profile.district] || DEFAULT_CLIMATE_ALERT;
  
  const liveAlert = climateData?.alerts?.[0] || {
    title: localFallbackAlert.title,
    severity: localFallbackAlert.severity,
    desc: localFallbackAlert.advisory
  };

  const activeAdvisory = climateData?.advisory || localFallbackAlert.advisory;
  const currentTemp = climateData?.current?.temp || 33;
  const currentHumidity = climateData?.current?.humidity || 72;
  const currentCondition = climateData?.current?.condition || 'Optimal weather';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full overflow-x-hidden">
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="font-headline text-lg font-bold text-primary">{t.dashboard || 'Farmer Dashboard'}</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <div className="flex items-center text-on-surface-variant gap-2 text-sm font-semibold">
              <span className="material-symbols-outlined text-primary text-lg">location_on</span>
              {profile.village}, {profile.district} (AP)
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {profile.profileImage ? (
                <img 
                  src={profile.profileImage} 
                  alt="Farmer Profile" 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-md shrink-0 animate-float"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-3xl">account_circle</span>
                </div>
              )}
              <div>
                <h2 className="font-display text-2xl sm:text-4xl font-black text-primary tracking-tight">
                  {t.welcome || 'Welcome'}, Farmer {profile.name}!
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-semibold">
                  {t.liveAnalytics || 'Here is the real-time crop analytics overview for your farm.'} ({(convertArea(totalAcreage)).toFixed(1)} {getAreaLabel()})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full font-bold uppercase tracking-wider font-label">
                {t.apSection || 'Andhra Pradesh Section'}
              </span>
            </div>
          </div>

          {/* Localized Live AI Climate Alert System */}
          <ErrorBoundary>
            <section className={`rounded-[2.5rem] p-6 md:p-8 border-l-8 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all ${
              liveAlert.severity === 'critical' 
                ? 'bg-error-container/20 border-l-error border-error-container/30' 
                : liveAlert.severity === 'high'
                ? 'bg-amber-500/10 border-l-amber-500 border-amber-500/20'
                : liveAlert.severity === 'rising'
                ? 'bg-secondary-container/30 border-l-secondary border-secondary-container/40'
                : 'bg-primary-container/20 border-l-primary border-primary-container/30'
            }`}>
              <div className="flex gap-4 items-start min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  liveAlert.severity === 'critical'
                    ? 'bg-error/10 text-error'
                    : liveAlert.severity === 'high'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined text-3xl">
                    {liveAlert.severity === 'critical' ? 'cyclone' : liveAlert.severity === 'high' ? 'thunderstorm' : 'partly_cloudy_day'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase text-white ${
                      liveAlert.severity === 'critical' ? 'bg-error' : 'bg-primary'
                    }`}>
                      {liveAlert.severity.toUpperCase()} ALERT
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-bold">
                      {isClimateLoading ? 'Connecting Live AI...' : 'Live OpenWeather & AI Advisory'}
                    </span>
                  </div>
                  <h4 className="font-headline font-black text-primary text-base sm:text-lg mt-1 truncate">
                    {liveAlert.title}
                  </h4>
                  <div className="mt-2.5 space-y-1.5 max-w-3xl">
                    {activeAdvisory.split('\n').map((point, index) => {
                      const cleanPoint = point.replace(/^-\s*/, '').trim();
                      if (!cleanPoint) return null;
                      return (
                        <div key={index} className="flex items-start gap-2 text-xs font-semibold text-on-surface-variant leading-relaxed">
                          <span className="text-primary font-bold select-none mt-0.5">•</span>
                          <span>{cleanPoint}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* OpenWeather Current Telemetry & 1-Hour Step Mini Timeline */}
                  {climateData?.current && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 space-y-3">
                      <div className="flex flex-wrap items-center gap-4 text-xs font-black text-primary">
                        <span>LIVE OPENWEATHER: {currentTemp}°C</span>
                        <span>•</span>
                        <span>HUMIDITY: {currentHumidity}%</span>
                        <span>•</span>
                        <span>WIND: {climateData.current.windSpeed} km/h</span>
                        <span>•</span>
                        <span>CONDITION: {currentCondition}</span>
                      </div>

                      {climateData?.hourly && climateData.hourly.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                          {climateData.hourly.map((h, i) => (
                            <div key={i} className="bg-white/80 border border-outline-variant/60 p-2 rounded-xl text-center flex flex-col items-center">
                              <span className="text-[9px] font-black text-primary uppercase">{h.time}</span>
                              <span className="text-xs font-black text-on-surface mt-0.5">{h.temp}°C</span>
                              <span className="text-[8px] font-bold text-emerald-600">☔ {h.pop}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </ErrorBoundary>

          {/* Real-Time Soil Health Monitor */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">landscape</span>
              <h3 className="font-display text-2xl font-black text-on-surface">
                {t.soilHealthMonitor || 'Real-Time Soil Health Monitor'}
              </h3>
            </div>

            {isSoilLoading && !soilData ? (
              <div className="glass-card rounded-[2.5rem] p-8 border border-outline-variant/60 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-xs font-bold text-primary animate-pulse">Running AI Soil Analysis...</p>
              </div>
            ) : soilData ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Circular Soil Gauge & Location Card */}
                <div className="col-span-12 lg:col-span-4 glass-card rounded-[2.5rem] p-6 border border-outline-variant/60 flex flex-col justify-between items-center text-center">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest font-label">Soil Quality Score</span>
                    <h4 className="font-headline font-black text-on-surface text-base truncate">{soilData.soilType}</h4>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                      📍 {(profile.village || 'Tenali').replace(/\s*mandal\s*/gi, '').trim().toUpperCase()} MANDAL, {profile.district}
                    </p>
                  </div>

                  {/* Circular SVG Gauge */}
                  <div className="relative w-40 h-40 flex items-center justify-center my-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(var(--color-outline-variant), 0.2)" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        stroke="rgb(var(--color-primary))" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (soilData.sqiScore || 80)) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-primary">{soilData.sqiScore}</span>
                      <span className="text-[9px] uppercase font-black text-on-surface-variant font-label tracking-widest mt-0.5">
                        {soilData.sqiRating || 'OPTIMAL'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigateTo('/soil')}
                    className="w-full py-3 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-outline-variant/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">explore</span>
                    Detailed Soil Analysis
                  </button>
                </div>

                {/* Macronutrients Progress Bars */}
                <div className="col-span-12 lg:col-span-4 glass-card rounded-[2.5rem] p-6 border border-outline-variant/60 flex flex-col justify-between">
                  <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3 mb-4">
                    <span className="material-symbols-outlined text-primary text-lg">science</span>
                    <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">NPK & Chemistry Meter</h4>
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {/* Nitrogen */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-on-surface font-black">Nitrogen (N)</span>
                        <span className="text-primary font-black">{soilData.nitrogen} kg/ha</span>
                      </div>
                      <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/15 p-0.5">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (soilData.nitrogen / 450) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Phosphorus */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-on-surface font-black">Phosphorus (P)</span>
                        <span className="text-primary font-black">{soilData.phosphorus} kg/ha</span>
                      </div>
                      <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/15 p-0.5">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (soilData.phosphorus / 50) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Potassium */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-on-surface font-black">Potassium (K)</span>
                        <span className="text-primary font-black">{soilData.potassium} kg/ha</span>
                      </div>
                      <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/15 p-0.5">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (soilData.potassium / 500) * 100)}%` }} />
                      </div>
                    </div>

                    {/* pH and Organic Carbon */}
                    <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-outline-variant/30">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-on-surface-variant">Soil pH</span>
                        <span className="text-base font-black text-primary">{soilData.ph}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-on-surface-variant">Organic Carbon</span>
                        <span className="text-base font-black text-primary">{soilData.organicCarbon}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Agronomist Advisory Block */}
                <div className="col-span-12 lg:col-span-4 glass-card rounded-[2.5rem] p-6 border border-outline-variant/60 flex flex-col justify-between bg-primary/[0.01]">
                  <div>
                    <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3 mb-4">
                      <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                      <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">AI Soil Advisory</h4>
                    </div>

                    <div className="space-y-2.5 py-1">
                      {(soilData.advisoryList || (soilData.advisory || '').split('\n')).filter(Boolean).map((line, lIdx) => {
                        const match = line.match(/^(🧪\s*[^:]+:)(.*)$/);
                        if (match) {
                          return (
                            <div key={lIdx} className="bg-[#f4fbf6] border border-emerald-100 p-2.5 rounded-2xl text-xs font-semibold text-emerald-950 leading-relaxed">
                              <strong className="text-[#0f5132] font-black">{match[1]}</strong>
                              {match[2]}
                            </div>
                          );
                        }
                        return (
                          <div key={lIdx} className="bg-[#f4fbf6] border border-emerald-100 p-2.5 rounded-2xl text-xs font-semibold text-emerald-950 leading-relaxed">
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-3 mt-4">
                    <span className="text-[9px] uppercase font-black text-secondary font-label tracking-wider block">Recommended Crops</span>
                    <p className="text-xs font-black text-primary mt-1">
                      {soilData.suitableCrops ? soilData.suitableCrops.join(', ') : 'Paddy, Chillies'}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="glass-card rounded-[2.5rem] p-8 border border-outline-variant/60 text-center text-xs font-semibold text-on-surface-variant">
                Failed to load soil details. Please check your network connection.
              </div>
            )}
          </section>

          {/* Bottom Columns: Quick Tools & Community Preview */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* Left Column: Quick Actions */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <h3 className="font-display text-xl font-black text-on-surface">
                {t.shortcuts || 'Ecosystem Shortcuts'}
              </h3>
              <div className="glass-card rounded-[2.5rem] p-6 border border-outline-variant/60 space-y-3">
                <button 
                  onClick={() => navigateTo('/scanner')}
                  className="w-full py-4 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-left px-5 text-xs font-bold flex items-center gap-3 border border-outline-variant/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">center_focus_strong</span>
                  <span>{t.scanner || 'AI Scanner'}</span>
                </button>
                <button 
                  onClick={() => navigateTo('/pests')}
                  className="w-full py-4 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-left px-5 text-xs font-bold flex items-center gap-3 border border-outline-variant/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">bug_report</span>
                  <span>{t.pests || 'Pest Tracker'}</span>
                </button>
                <button 
                  onClick={() => navigateTo('/community')}
                  className="w-full py-4 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-left px-5 text-xs font-bold flex items-center gap-3 border border-outline-variant/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">forum</span>
                  <span>{t.community || 'Community'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Community Feed Preview */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display text-xl font-black text-on-surface">
                  {t.discussions || 'AP Community Discussions'}
                </h3>
                <button 
                  onClick={() => navigateTo('/community')}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {t.viewAllForums || 'View All Forums'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <ErrorBoundary>
                <div className="space-y-3">
                  {recentPosts.length === 0 ? (
                    <div className="p-8 bg-surface-container-low border border-outline-variant rounded-[2rem] text-center italic text-on-surface-variant text-xs">
                      {t.noForums || 'No forum discussions posted yet.'}
                    </div>
                  ) : (
                    recentPosts.map((post) => (
                      <div 
                        key={post.id}
                        onClick={() => navigateTo('/community')}
                        className="bg-white p-4 rounded-2xl border border-outline-variant/60 flex justify-between items-center gap-4 hover:border-primary/40 transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded">
                              {post.crop_category}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-bold">
                              {post.author} • {post.district}
                            </span>
                          </div>
                          <h5 className="font-headline font-bold text-primary text-sm mt-1 truncate group-hover:text-primary-dark transition-colors">
                            {post.title}
                          </h5>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5 leading-normal">
                            {post.content}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-all text-base shrink-0">
                          chevron_right
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ErrorBoundary>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
