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

  // Live Climate state
  const [climateData, setClimateData] = useState(null);
  const [isClimateLoading, setIsClimateLoading] = useState(true);

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

  // Set active language translation Catalogs
  const activeLang = profile.language || 'en';
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

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
                      {isClimateLoading ? 'Connecting Live AI...' : 'Live Agricultural Meteorology'}
                    </span>
                  </div>
                  <h4 className="font-headline font-black text-primary text-base sm:text-lg mt-1 truncate">
                    {liveAlert.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-semibold max-w-3xl">
                    {activeAdvisory}
                  </p>
                  {climateData?.current && (
                    <p className="text-[10px] text-on-surface-variant/80 font-black mt-2 font-label">
                      CURRENT STATE: {currentTemp}°C | {currentHumidity}% Humidity | {currentCondition}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </ErrorBoundary>

          {/* Dynamic Grid: My Crops */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">eco</span>
              <h3 className="font-display text-2xl font-black text-on-surface">
                {t.cultivatedCrops || 'Cultivated Crops'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(profile.crops || {}).map(([cropId, acreage]) => {
                const meta = CROP_META[cropId] || { name: cropId, icon: '🌱', baseHealth: 85, priceRange: '₹1,500 - ₹2,000' };
                const healthScore = meta.baseHealth;
                let healthStatus = 'Excellent';
                let healthColor = 'text-primary bg-primary/10 border-primary/20';

                if (healthScore < 75) {
                  healthStatus = 'Warning';
                  healthColor = 'text-error bg-error/10 border-error/20';
                } else if (healthScore < 85) {
                  healthStatus = 'Moderate';
                  healthColor = 'text-secondary bg-secondary/10 border-secondary/20';
                }

                return (
                  <div key={cropId} className="glass-card rounded-[2.5rem] p-6 border border-outline-variant/60 flex flex-col justify-between hover:shadow-lg transition-all h-full">
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl">
                            {meta.icon}
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-primary text-base">{meta.name}</h4>
                            <p className="text-[10px] text-on-surface-variant font-bold">
                              {(convertArea(acreage)).toFixed(1)} {getAreaLabel()} {t.acresPlanted || 'Planted'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-[9px] font-bold rounded-full border ${healthColor}`}>
                          {healthStatus}
                        </span>
                      </div>

                      {/* Card Stats */}
                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-outline-variant/40 mb-6">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">
                            {t.healthScore || 'Health Score'}
                          </p>
                          <p className="text-2xl font-black text-primary mt-1">{healthScore}%</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">
                            {t.marketPrice || 'Market Price'}
                          </p>
                          <p className="text-xs font-bold text-primary mt-2">{convertPriceRange(meta.priceRange)}</p>
                          <p className="text-[8px] text-on-surface-variant">
                            {t.perQuintal || 'per'} {getWeightLabel()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/scanner?crop=${cropId}`)}
                        className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">center_focus_strong</span>
                        {t.scanCrop || 'Scan Crop'}
                      </button>
                      <button 
                        onClick={() => router.push('/pests')}
                        className="py-3 px-4 border border-outline-variant rounded-xl text-xs font-bold hover:bg-surface-container active:scale-[0.98] transition-all flex items-center justify-center text-on-surface-variant cursor-pointer shrink-0"
                      >
                        {t.pestButton || 'Pests'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  onClick={() => router.push('/scanner')}
                  className="w-full py-4 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-left px-5 text-xs font-bold flex items-center gap-3 border border-outline-variant/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">center_focus_strong</span>
                  <span>{t.scanner || 'AI Scanner'}</span>
                </button>
                <button 
                  onClick={() => router.push('/pests')}
                  className="w-full py-4 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-left px-5 text-xs font-bold flex items-center gap-3 border border-outline-variant/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">bug_report</span>
                  <span>{t.pests || 'Pest Tracker'}</span>
                </button>
                <button 
                  onClick={() => router.push('/market')}
                  className="w-full py-4 bg-surface-container hover:bg-primary/10 hover:text-primary transition-all text-on-surface rounded-2xl text-left px-5 text-xs font-bold flex items-center gap-3 border border-outline-variant/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">trending_up</span>
                  <span>{t.market || 'Market Trends'}</span>
                </button>
                <button 
                  onClick={() => router.push('/community')}
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
                  onClick={() => router.push('/community')}
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
                        onClick={() => router.push('/community')}
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
