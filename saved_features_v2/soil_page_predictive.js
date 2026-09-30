'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const DISTRICTS = [
  'Srikakulam',
  'Parvathipuram Manyam',
  'Vizianagaram',
  'Visakhapatnam',
  'Alluri Sitharama Raju (ASR)',
  'Anakapalli',
  'Kakinada',
  'East Godavari',
  'Dr. B.R. Ambedkar Konaseema',
  'Eluru',
  'West Godavari',
  'NTR',
  'Krishna',
  'Palnadu',
  'Guntur',
  'Bapatla',
  'Prakasam',
  'SPSR Nellore',
  'Kurnool',
  'Nandyal',
  'Ananthapuramu',
  'Sri Sathya Sai',
  'YSR Kadapa',
  'Annamayya',
  'Tirupati',
  'Chittoor'
];

const MANDALS = {
  'Srikakulam': ['Palasa', 'Amadalavalasa', 'Srikakulam Rural', 'Tekkali', 'Narasannapeta'],
  'Parvathipuram Manyam': ['Parvathipuram', 'Balajipeta', 'Seethampeta', 'Makkuva', 'Salur'],
  'Vizianagaram': ['Bhogapuram', 'Chelluru', 'Vizianagaram Rural', 'Gajapathinagaram', 'Bobbili'],
  'Visakhapatnam': ['Pendurthi', 'Anandapuram', 'Bheemunipatnam', 'Gajuwaka', 'Seethammadhara'],
  'Alluri Sitharama Raju (ASR)': ['Araku Valley', 'Chintapalle', 'Paderu', 'Rampachodavaram'],
  'Anakapalli': ['Anakapalli', 'Atchutapuram', 'Chodavaram', 'Narsipatnam'],
  'Kakinada': ['Kakinada Rural', 'Samalkota', 'Peddapuram', 'Pithapuram'],
  'East Godavari': ['Rajahmundry Rural', 'Ravulapalem', 'Kovvur', 'Nidadavole'],
  'Dr. B.R. Ambedkar Konaseema': ['Amalapuram', 'Razole', 'Kothapeta', 'Mandapeta'],
  'Eluru': ['Eluru Rural', 'Jangareddygudem', 'Chintalapudi', 'Tadepalligudem'],
  'West Godavari': ['Bhimavaram', 'Tanuku', 'Palakollu', 'Narasapuram'],
  'NTR': ['Vijayawada Rural', 'Jaggayyapeta', 'Ibrahimpatnam', 'Nandigama'],
  'Krishna': ['Gudivada', 'Machilipatnam', 'Vuyyuru', 'Gannavaram'],
  'Palnadu': ['Narasaraopet', 'Macherla', 'Piduguralla', 'Chilakaluripet'],
  'Guntur': ['Guntur Rural', 'Tenali', 'Duggirala', 'Tadikonda', 'Mangalagiri'],
  'Bapatla': ['Chirala', 'Bapatla', 'Parchur', 'Addanki'],
  'Prakasam': ['Ongole', 'Kandukur', 'Podili', 'Markapuram'],
  'SPSR Nellore': ['Nellore Rural', 'Kavali', 'Gudur', 'Atmakur'],
  'Kurnool': ['Adoni', 'Kurnool Rural', 'Yemmiganur', 'Kodumur'],
  'Nandyal': ['Nandyal', 'Dhone', 'Allagadda', 'Banaganapalle'],
  'Ananthapuramu': ['Tadipatri', 'Anantapuramu Rural', 'Kalyandurg', 'Guntakal'],
  'Sri Sathya Sai': ['Puttaparthi', 'Hindupur', 'Kadiri', 'Dharmavaram'],
  'YSR Kadapa': ['Pulivendula', 'Kadapa Rural', 'Jammalamadugu', 'Proddatur'],
  'Annamayya': ['Madanapalle', 'Rajampet', 'Rayachoti', 'Piler'],
  'Tirupati': ['Srikalahasti', 'Chandragiri', 'Tirupati Rural', 'Sullurpeta'],
  'Chittoor': ['Chittoor Rural', 'Palamaner', 'Kuppam', 'Nagari']
};

const CROP_ICONS = {
  'paddy': '🌾',
  'paddy (rice)': '🌾',
  'rice': '🌾',
  'cotton': '☁️',
  'chillies': '🌶️',
  'red chillies': '🌶️',
  'mangoes': '🥭',
  'mango': '🥭',
  'groundnut': '🥜',
  'sugarcane': '🎋',
  'maize': '🌽',
  'bengal gram': '🍲',
  'tomato': '🍅',
  'turmeric': '🪵',
  'black gram': '⚫',
  'banana': '🍌',
  'coconut': '🥥'
};

export default function SoilOverview() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('Guntur');
  const [selectedMandal, setSelectedMandal] = useState('Tenali');
  
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timelineMode, setTimelineMode] = useState('1year'); // '1week', '1month', '1year'

  // Load profile on mount
  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      const parsed = JSON.parse(session);
      setProfile(parsed);
      if (parsed.district) {
        setSelectedDistrict(parsed.district);
        const userMandals = MANDALS[parsed.district] || [];
        if (parsed.village && userMandals.includes(parsed.village)) {
          setSelectedMandal(parsed.village);
        } else if (userMandals.length > 0) {
          setSelectedMandal(userMandals[0]);
        }
      }
    } else {
      setProfile({ name: 'Farmer' });
    }
  }, [router]);

  // Fetch soil data whenever district or mandal changes
  useEffect(() => {
    if (!selectedDistrict || !selectedMandal) return;
    fetchSoilAnalysis();
  }, [selectedDistrict, selectedMandal]);

  const fetchSoilAnalysis = async () => {
    const cacheKey = `soil_data_v4_${selectedDistrict}_${selectedMandal}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.advisory && parsed.pesticidesProducts && parsed.predictiveAnalytics.projected1Week) {
          setSoilData(parsed);
          return;
        }
      } catch (e) {
        console.warn("Invalid cached soil data, refetching...");
      }
    }
    setLoading(true);

    try {
      const response = await fetch('/api/soil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: selectedDistrict, mandal: selectedMandal })
      });
      const data = await response.json();
      setSoilData(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching soil data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    const list = MANDALS[dist] || [];
    if (list.length > 0) {
      setSelectedMandal(list[0]);
    }
  };

  const getNutrientStatus = (val, type) => {
    if (type === 'n') {
      if (val < 200) return { label: 'Low (Deficient)', color: 'text-error', barColor: 'bg-error' };
      if (val <= 300) return { label: 'Medium (Optimal)', color: 'text-primary', barColor: 'bg-primary' };
      return { label: 'High (Abundant)', color: 'text-secondary', barColor: 'bg-secondary' };
    }
    if (type === 'p') {
      if (val < 15) return { label: 'Low (Deficient)', color: 'text-error', barColor: 'bg-error' };
      if (val <= 25) return { label: 'Medium (Optimal)', color: 'text-primary', barColor: 'bg-primary' };
      return { label: 'High (Abundant)', color: 'text-secondary', barColor: 'bg-secondary' };
    }
    if (type === 'k') {
      if (val < 200) return { label: 'Low (Deficient)', color: 'text-error', barColor: 'bg-error' };
      if (val <= 350) return { label: 'Medium (Optimal)', color: 'text-primary', barColor: 'bg-primary' };
      return { label: 'High (Abundant)', color: 'text-secondary', barColor: 'bg-secondary' };
    }
  };

  // Helper to extract active timeline metrics
  const getActiveTimelineData = () => {
    if (!soilData || !soilData.predictiveAnalytics) return null;
    const pa = soilData.predictiveAnalytics;
    if (timelineMode === '1week') {
      return {
        label: '1-Week Forecast (Immediate Status)',
        nVal: pa.projected1Week ? pa.projected1Week.nitrogen : Math.round(soilData.nitrogen * 0.98),
        nChange: pa.projected1Week ? pa.projected1Week.nitrogenChange : '-2%',
        pVal: pa.projected1Week ? pa.projected1Week.phosphorus : Math.round(soilData.phosphorus * 0.99),
        pChange: pa.projected1Week ? pa.projected1Week.phosphorusChange : '-1%',
        kVal: pa.projected1Week ? pa.projected1Week.potassium : Math.round(soilData.potassium * 0.985),
        kChange: pa.projected1Week ? pa.projected1Week.potassiumChange : '-1%',
        descN: `In 7 days, nitrogen level shifts from ${soilData.nitrogen} to ${pa.projected1Week ? pa.projected1Week.nitrogen : Math.round(soilData.nitrogen * 0.98)} kg/ha. Soil moisture is optimal.`,
        descP: `Phosphorus stays stable at ${pa.projected1Week ? pa.projected1Week.phosphorus : Math.round(soilData.phosphorus * 0.99)} kg/ha with active root absorption.`,
        descYield: 'Short-term soil moisture and nitrate absorption are currently stable.'
      };
    }
    if (timelineMode === '1month') {
      return {
        label: '1-Month Forecast (Mid-Term Growth)',
        nVal: pa.projected1Month ? pa.projected1Month.nitrogen : Math.round(soilData.nitrogen * 0.93),
        nChange: pa.projected1Month ? pa.projected1Month.nitrogenChange : '-7%',
        pVal: pa.projected1Month ? pa.projected1Month.phosphorus : Math.round(soilData.phosphorus * 0.95),
        pChange: pa.projected1Month ? pa.projected1Month.phosphorusChange : '-5%',
        kVal: pa.projected1Month ? pa.projected1Month.potassium : Math.round(soilData.potassium * 0.94),
        kChange: pa.projected1Month ? pa.projected1Month.potassiumChange : '-6%',
        descN: `After 30 days of crop growth, available nitrogen will drop from ${soilData.nitrogen} to ${pa.projected1Month ? pa.projected1Month.nitrogen : Math.round(soilData.nitrogen * 0.93)} kg/ha without foliar urea.`,
        descP: `Phosphorus decreases to ${pa.projected1Month ? pa.projected1Month.phosphorus : Math.round(soilData.phosphorus * 0.95)} kg/ha during active tillering/branching.`,
        descYield: 'Mid-term crop vegetative phase requires timely bio-fertilizer top-dressing.'
      };
    }
    // Default 1year
    return {
      label: '1-Year Forecast (Long-Term Depletion)',
      nVal: pa.projected1Year ? pa.projected1Year.nitrogen : Math.round(soilData.nitrogen * 0.88),
      nChange: pa.projected1Year ? pa.projected1Year.nitrogenChange : '-12%',
      pVal: pa.projected1Year ? pa.projected1Year.phosphorus : Math.round(soilData.phosphorus * 0.91),
      pChange: pa.projected1Year ? pa.projected1Year.phosphorusChange : '-9%',
      kVal: pa.projected1Year ? pa.projected1Year.potassium : Math.round(soilData.potassium * 0.90),
      kChange: pa.projected1Year ? pa.projected1Year.potassiumChange : '-10%',
      descN: `Without nitrogen replenishment, soil N will drop from ${soilData.nitrogen} to ${pa.projected1Year ? pa.projected1Year.nitrogen : Math.round(soilData.nitrogen * 0.88)} kg/ha after 1 crop cycle.`,
      descP: `Phosphate reserves will decrease from ${soilData.phosphorus} to ${pa.projected1Year ? pa.projected1Year.phosphorus : Math.round(soilData.phosphorus * 0.91)} kg/ha due to continuous crop root uptake.`,
      descYield: `Unmanaged: ${pa.projected3Year ? pa.projected3Year.yieldImpactUnmanaged : '-22% yield loss'} | Managed: ${pa.projected3Year ? pa.projected3Year.yieldImpactManaged : '+28% yield gain'}`
    };
  };

  const currentTimeline = getActiveTimelineData();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full overflow-x-hidden">
        {/* Header Bar */}
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div>
              <span className="font-headline text-lg font-bold text-primary">Soil Predictive Analytics & Overview</span>
              <p className="text-[10px] text-on-surface-variant font-medium hidden sm:block">Powered by 500 Andhra Pradesh Soil Sample Dataset</p>
            </div>
          </div>

          {/* Regional Selectors */}
          <div className="flex items-center gap-3 bg-white/50 border border-outline-variant/60 p-2 rounded-2xl backdrop-blur-md shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-primary font-bold">location_on</span>
              <select
                className="bg-transparent border-none outline-none text-xs font-bold text-primary cursor-pointer pr-4"
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                {DISTRICTS.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            <div className="h-4 w-px bg-outline-variant/50" />
            <div>
              <select
                className="bg-transparent border-none outline-none text-xs font-bold text-on-surface cursor-pointer pr-4"
                value={selectedMandal}
                onChange={(e) => setSelectedMandal(e.target.value)}
              >
                {(MANDALS[selectedDistrict] || []).map(mnd => (
                  <option key={mnd} value={mnd}>{mnd} Mandal</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
          {loading && !soilData ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-primary animate-pulse">Running AI Predictive Soil Analytics Engine...</p>
            </div>
          ) : soilData ? (
            <>
              {/* Top Overview & Chemistry Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Soil Score & Chemistry Meters */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                  
                  {/* Soil Health Score & Dataset Badge Card */}
                  <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Gauge Circle */}
                    <div className="md:col-span-5 flex flex-col items-center text-center">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest font-label">Soil Quality Index (SQI)</span>
                      
                      <div className="relative w-36 h-36 flex items-center justify-center my-4">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="rgba(var(--color-outline-variant), 0.2)" strokeWidth="6" fill="transparent" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            stroke="rgb(var(--color-primary))" 
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * soilData.sqiScore) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-primary">{soilData.sqiScore}</span>
                          <span className="text-[8px] uppercase font-black text-on-surface-variant font-label tracking-widest mt-0.5">{soilData.sqiRating}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-headline font-black text-on-surface text-sm leading-normal">{soilData.soilType}</h4>
                      <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                        📍 {selectedMandal}, {selectedDistrict} ({soilData.sampleCountAnalyzed} Samples Analyzed)
                      </p>
                    </div>

                    {/* Parameters grid */}
                    <div className="md:col-span-7 grid grid-cols-3 gap-3">
                      <div className="bg-surface-container/60 border border-outline-variant/35 p-3.5 rounded-2xl text-center space-y-1">
                        <span className="material-symbols-outlined text-primary text-base">science</span>
                        <p className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold">pH Level</p>
                        <p className="text-lg font-black text-primary">{soilData.ph}</p>
                        <span className="text-[8px] text-primary font-bold block bg-primary/10 rounded-full px-1 py-0.5">
                          {soilData.ph < 6.2 ? 'Acidic' : soilData.ph <= 7.5 ? 'Neutral' : 'Alkaline'}
                        </span>
                      </div>

                      <div className="bg-surface-container/60 border border-outline-variant/35 p-3.5 rounded-2xl text-center space-y-1">
                        <span className="material-symbols-outlined text-primary text-base">biotech</span>
                        <p className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold">Carbon</p>
                        <p className="text-lg font-black text-primary">{soilData.organicCarbon}</p>
                        <span className="text-[8px] text-primary font-bold block bg-primary/10 rounded-full px-1 py-0.5">Organic</span>
                      </div>

                      <div className="bg-surface-container/60 border border-outline-variant/35 p-3.5 rounded-2xl text-center space-y-1">
                        <span className="material-symbols-outlined text-primary text-base">bolt</span>
                        <p className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold">EC Level</p>
                        <p className="text-lg font-black text-primary">{soilData.ec} <span className="text-[9px] font-normal">dS/m</span></p>
                        <span className="text-[8px] text-on-surface-variant font-bold block">Salinity</span>
                      </div>
                    </div>
                  </div>

                  {/* NPK Macronutrient Chemistry Meters */}
                  <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-6">
                    <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4">
                      <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                      <h3 className="text-lg font-black text-on-surface">Soil Macronutrients (NPK)</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Nitrogen */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-lg">N</span>
                            <span className="text-xs font-black text-on-surface">Nitrogen (Available N)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-primary">{soilData.nitrogen} kg/ha</span>
                            <span className={`text-[10px] font-bold block ${getNutrientStatus(soilData.nitrogen, 'n').color}`}>
                              {getNutrientStatus(soilData.nitrogen, 'n').label}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/20 p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getNutrientStatus(soilData.nitrogen, 'n').barColor}`}
                            style={{ width: `${Math.min(100, (soilData.nitrogen / 450) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-on-surface-variant font-bold">
                          <span>0 kg/ha</span>
                          <span>280 kg/ha (Optimal)</span>
                          <span>450 kg/ha</span>
                        </div>
                      </div>

                      {/* Phosphorus */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-lg">P</span>
                            <span className="text-xs font-black text-on-surface">Phosphorus (Available P)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-primary">{soilData.phosphorus} kg/ha</span>
                            <span className={`text-[10px] font-bold block ${getNutrientStatus(soilData.phosphorus, 'p').color}`}>
                              {getNutrientStatus(soilData.phosphorus, 'p').label}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/20 p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getNutrientStatus(soilData.phosphorus, 'p').barColor}`}
                            style={{ width: `${Math.min(100, (soilData.phosphorus / 50) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-on-surface-variant font-bold">
                          <span>0 kg/ha</span>
                          <span>22 kg/ha (Optimal)</span>
                          <span>50 kg/ha</span>
                        </div>
                      </div>

                      {/* Potassium */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-lg">K</span>
                            <span className="text-xs font-black text-on-surface">Potassium (Available K)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-primary">{soilData.potassium} kg/ha</span>
                            <span className={`text-[10px] font-bold block ${getNutrientStatus(soilData.potassium, 'k').color}`}>
                              {getNutrientStatus(soilData.potassium, 'k').label}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/20 p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getNutrientStatus(soilData.potassium, 'k').barColor}`}
                            style={{ width: `${Math.min(100, (soilData.potassium / 500) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-on-surface-variant font-bold">
                          <span>0 kg/ha</span>
                          <span>340 kg/ha (Optimal)</span>
                          <span>500 kg/ha</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: AI Pointwise Advisory & Ideal Crops */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                  
                  {/* Pointwise AI Soil Advisory Card */}
                  <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 bg-primary/[0.02] relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
                          <h3 className="text-lg font-black text-on-surface">AI Soil Advisory</h3>
                        </div>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      </div>

                      <div className="space-y-3 py-1">
                        {(soilData.advisory || '').split('\n').filter(Boolean).map((line, lIdx) => (
                          <div key={lIdx} className="bg-white/80 border border-outline-variant/20 p-3.5 rounded-2xl text-xs font-bold text-on-surface leading-relaxed shadow-xs">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={fetchSoilAnalysis}
                      disabled={loading}
                      className="w-full mt-6 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Re-Analyze Soil Samples
                    </button>
                  </div>

                  {/* Crop Match Cards */}
                  <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
                      <span className="material-symbols-outlined text-primary text-xl">eco</span>
                      <h3 className="text-base font-black text-on-surface">Ideal Crop Matches</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(soilData.suitableCrops || []).map((crop, idx) => {
                        const normCrop = (crop || '').toLowerCase().trim();
                        const firstWord = normCrop.split(' ')[0] || '';
                        const icon = CROP_ICONS[normCrop] || CROP_ICONS[firstWord] || '🌱';
                        return (
                          <div key={idx} className="p-3 bg-surface-container/60 border border-outline-variant/35 rounded-2xl flex items-center gap-2.5">
                            <span className="text-2xl shrink-0">{icon}</span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-primary text-xs truncate">{crop}</h4>
                              <span className="text-[8px] text-secondary font-bold uppercase">Suitable</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Predictive Analytics & Future Soil Forecast Section (Interactive Timeline Tabs: 1-Week, 1-Month, 1-Year) */}
              {soilData.predictiveAnalytics && (
                <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-6 bg-linear-to-br from-primary/5 via-surface to-surface">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-outline-variant/40 pb-4 gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">trending_up</span>
                      <div>
                        <h3 className="text-lg font-black text-on-surface">Predictive Analytics & Future Soil Forecast</h3>
                        <p className="text-[11px] text-on-surface-variant font-medium">Interactive forecast for 1-Week, 1-Month, and 1-Year nutrient depletion trajectory</p>
                      </div>
                    </div>

                    {/* Timeline Selector Tabs */}
                    <div className="flex items-center bg-white/80 p-1 rounded-2xl border border-outline-variant/60 shadow-xs">
                      <button
                        onClick={() => setTimelineMode('1week')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          timelineMode === '1week' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        📅 1-Week
                      </button>
                      <button
                        onClick={() => setTimelineMode('1month')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          timelineMode === '1month' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        🗓️ 1-Month
                      </button>
                      <button
                        onClick={() => setTimelineMode('1year')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          timelineMode === '1year' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        📈 1-Year
                      </button>
                    </div>
                  </div>

                  {currentTimeline && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Nitrogen Forecast Card */}
                      <div className="p-5 bg-white/80 border border-outline-variant/40 rounded-3xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary uppercase tracking-wider">Nitrogen ({timelineMode.toUpperCase()})</span>
                          <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-lg">
                            {currentTimeline.nChange}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-on-surface">{currentTimeline.nVal}</span>
                          <span className="text-xs text-on-surface-variant font-bold">kg/ha projected</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          {currentTimeline.descN}
                        </p>
                      </div>

                      {/* Phosphorus Forecast Card */}
                      <div className="p-5 bg-white/80 border border-outline-variant/40 rounded-3xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary uppercase tracking-wider">Phosphorus ({timelineMode.toUpperCase()})</span>
                          <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-lg">
                            {currentTimeline.pChange}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-on-surface">{currentTimeline.pVal}</span>
                          <span className="text-xs text-on-surface-variant font-bold">kg/ha projected</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          {currentTimeline.descP}
                        </p>
                      </div>

                      {/* Health & Yield Impact Card */}
                      <div className="p-5 bg-white/80 border border-outline-variant/40 rounded-3xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary uppercase tracking-wider">Yield & Soil Health Risk</span>
                          <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-lg">
                            Managed +28%
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-error">Unmanaged: -22% yield loss without fertilizer</p>
                          <p className="text-xs font-bold text-secondary">Managed: +28% yield gain with recommended inputs</p>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                          {currentTimeline.descYield}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pesticides & Soil Product Recommendations Section (with Buy & Details Links) */}
              <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-6">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-2xl font-bold">shopping_bag</span>
                    <div>
                      <h3 className="text-lg font-black text-on-surface">Recommended Pesticides & Soil Amendment Products</h3>
                      <p className="text-[11px] text-on-surface-variant font-medium">Verified products with pros, cons, application guide & direct store buy links</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(soilData.pesticidesProducts || []).map((prod) => (
                    <div key={prod.id} className="p-6 bg-white/80 border border-outline-variant/40 rounded-3xl space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-headline font-black text-primary text-base">{prod.name}</h4>
                            <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                              {prod.category} • {prod.rating}
                            </span>
                          </div>
                          
                          {/* Small Details / Buy Button next to pesticide product */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={prod.buyLinks.amazon}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-primary text-white rounded-xl text-[11px] font-bold hover:bg-primary/90 hover:scale-105 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Buy or View Product Details on Amazon"
                            >
                              <span>Details / Buy</span>
                              <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </a>
                          </div>
                        </div>

                        {/* Pros / Advantages */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check_circle</span> Advantages (Pros):
                          </p>
                          <ul className="space-y-1 text-xs text-on-surface font-medium pl-4 list-disc">
                            {prod.advantages.map((adv, aIdx) => (
                              <li key={aIdx}>{adv}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Cons / Disadvantages */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">warning</span> Disadvantages / Cautions:
                          </p>
                          <ul className="space-y-1 text-xs text-on-surface-variant font-medium pl-4 list-disc">
                            {prod.disadvantages.map((dis, dIdx) => (
                              <li key={dIdx}>{dis}</li>
                            ))}
                          </ul>
                        </div>

                        {/* How to Treat */}
                        <div className="p-3 bg-surface-container/50 border border-outline-variant/30 rounded-2xl space-y-1">
                          <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">How to Apply / Treat:</p>
                          <p className="text-xs text-on-surface font-semibold leading-relaxed">{prod.howToTreat}</p>
                        </div>
                      </div>

                      {/* Store Links row */}
                      <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                        <span>Buy on Online Stores:</span>
                        <div className="flex items-center gap-2">
                          <a 
                            href={prod.buyLinks.amazon} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline"
                          >
                            Amazon ↗
                          </a>
                          <span>•</span>
                          <a 
                            href={prod.buyLinks.flipkart} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline"
                          >
                            Flipkart ↗
                          </a>
                          {prod.buyLinks.iffcoBazar && (
                            <>
                              <span>•</span>
                              <a 
                                href={prod.buyLinks.iffcoBazar} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline"
                              >
                                IFFCO ↗
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Organic & Chemical Soil Amendments Guidelines */}
              <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-6">
                <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4">
                  <span className="material-symbols-outlined text-primary text-xl">science</span>
                  <h3 className="text-lg font-black text-on-surface">Recommended Organic & Chemical Soil Treatments</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Organic Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-primary">
                      <span className="material-symbols-outlined text-lg">eco</span>
                      <h4 className="text-sm font-black uppercase tracking-wider">Organic Soil Feeding</h4>
                    </div>
                    <div className="space-y-3">
                      {(soilData.organicMethods || []).map((method, idx) => (
                        <div key={idx} className="p-4 bg-surface-container/40 border border-outline-variant/30 rounded-2xl text-xs font-semibold text-on-surface leading-relaxed">
                          {method}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chemical Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-secondary">
                      <span className="material-symbols-outlined text-lg">science</span>
                      <h4 className="text-sm font-black uppercase tracking-wider">Chemical & Mineral Correctors</h4>
                    </div>
                    <div className="space-y-3">
                      {(soilData.chemicalMethods || []).map((method, idx) => (
                        <div key={idx} className="p-4 bg-surface-container/40 border border-outline-variant/30 rounded-2xl text-xs font-semibold text-on-surface leading-relaxed">
                          {method}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
