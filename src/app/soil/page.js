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
  'maize': '🌽',
  'groundnut': '🥜',
  'millet': '🌾',
  'ragi': '🌾',
  'mango': '🥭',
  'paddy': '🌾',
  'rice': '🌾',
  'cotton': '☁️',
  'chillies': '🌶️',
  'sugarcane': '🎋',
  'bengal gram': '🫘',
  'bengalgram': '🫘',
  'black gram': '⚫',
  'blackgram': '⚫',
  'green gram': '🟢',
  'greengram': '🟢',
  'red gram': '🍲',
  'redgram': '🍲',
  'cashew': '🌰',
  'tomato': '🍅',
  'tobacco': '🍂',
  'coconut': '🥥',
  'banana': '🍌'
};

export default function SoilOverview() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState('Vizianagaram');
  const [selectedMandal, setSelectedMandal] = useState('Vizianagaram Rural');
  
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleInput, setSampleInput] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.district && DISTRICTS.includes(parsed.district)) {
        setSelectedDistrict(parsed.district);
        const list = MANDALS[parsed.district] || [];
        if (parsed.village && list.includes(parsed.village)) {
          setSelectedMandal(parsed.village);
        } else if (list.length > 0) {
          setSelectedMandal(list[0]);
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (!selectedDistrict || !selectedMandal) return;
    fetchSoilData();
  }, [selectedDistrict, selectedMandal]);

  const fetchSoilData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/soil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: selectedDistrict, mandal: selectedMandal })
      });
      const data = await response.json();
      setSoilData(data);
    } catch (err) {
      console.error('Error fetching soil data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleSearch = async () => {
    const queryId = sampleInput.trim();
    if (!queryId) {
      alert("Please enter a Soil Sample ID (e.g. AP_SOIL_0003)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/soil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId: queryId, district: selectedDistrict, mandal: selectedMandal })
      });
      const data = await response.json();
      if (data && data.soilType) {
        setSoilData(data);
        if (data.district && DISTRICTS.includes(data.district)) {
          setSelectedDistrict(data.district);
        }
      } else {
        alert(data.error || `Sample ID '${queryId}' not found.`);
      }
    } catch (err) {
      console.error('Error fetching soil sample:', err);
      alert("Failed to query soil sample. Please try again.");
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

  return (
    <div className="flex min-h-screen bg-[#eefbf3]">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full bg-[#eefbf3] text-emerald-950 font-sans">
        {/* Top Header Bar matching Image 2 */}
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-[#eefbf3]/95 backdrop-blur-md border-b border-emerald-100 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-emerald-800 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <h1 className="text-lg md:text-xl font-black text-[#0f5132] tracking-tight">Soil Overview</h1>
            <span className="text-emerald-300 font-light hidden sm:inline">|</span>

            {/* Location Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white border border-emerald-200/80 px-3 py-1 rounded-full shadow-xs">
                <span className="text-emerald-700 text-xs">📍</span>
                <select
                  className="bg-transparent border-none outline-none text-xs font-bold text-[#0f5132] cursor-pointer pr-2"
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                >
                  {DISTRICTS.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-emerald-200/80 px-3 py-1 rounded-full shadow-xs">
                <select
                  className="bg-transparent border-none outline-none text-xs font-bold text-emerald-800 cursor-pointer pr-2"
                  value={selectedMandal}
                  onChange={(e) => setSelectedMandal(e.target.value)}
                >
                  {(MANDALS[selectedDistrict] || []).map(mnd => (
                    <option key={mnd} value={mnd}>{mnd} Mandal</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area matching Image 2 */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          {loading && !soilData ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-[#0f5132] border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-[#0f5132] animate-pulse">Running Predictive Soil Health Analysis...</p>
            </div>
          ) : soilData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* TOP LEFT CARD: Soil Quality Score (Image 2) */}
              <div className="col-span-12 lg:col-span-7 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-emerald-100/80 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-4">SOIL QUALITY SCORE</span>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Circle Gauge Score */}
                    <div className="flex flex-col items-center text-center">
                      <div className="text-5xl font-black text-[#0f5132] tracking-tight">
                        {soilData.sqiScore}
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-widest mt-1">
                        {soilData.sqiRating || 'OPTIMAL'}
                      </span>
                    </div>

                    {/* 3 Metrics Pills */}
                    <div className="grid grid-cols-3 gap-3 flex-1 w-full">
                      <div className="bg-[#f4fbf6] border border-emerald-100 p-3 rounded-2xl text-center">
                        <span className="text-xs text-emerald-700 block">🧪</span>
                        <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider">PH LEVEL</span>
                        <p className="text-lg font-black text-[#0f5132] mt-0.5">{soilData.ph}</p>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 rounded-full px-2 py-0.5 inline-block mt-1">
                          {soilData.ph < 6.2 ? 'Acidic' : soilData.ph <= 7.5 ? 'Neutral' : 'Alkaline'}
                        </span>
                      </div>

                      <div className="bg-[#f4fbf6] border border-emerald-100 p-3 rounded-2xl text-center">
                        <span className="text-xs text-emerald-700 block">🔬</span>
                        <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider">CARBON</span>
                        <p className="text-lg font-black text-[#0f5132] mt-0.5">{soilData.organicCarbon}</p>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 rounded-full px-2 py-0.5 inline-block mt-1">
                          Optimal
                        </span>
                      </div>

                      <div className="bg-[#f4fbf6] border border-emerald-100 p-3 rounded-2xl text-center">
                        <span className="text-xs text-emerald-700 block">💧</span>
                        <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider">RETENTION</span>
                        <p className="text-lg font-black text-[#0f5132] mt-0.5">{soilData.moistureCapacity || '34%'}</p>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 rounded-full px-2 py-0.5 inline-block mt-1">
                          Water
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-emerald-100 pt-4">
                  <h3 className="font-extrabold text-[#0f5132] text-base">{soilData.soilType}</h3>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mt-0.5">
                    📍 {selectedMandal.toUpperCase()} MANDAL
                  </p>
                </div>
              </div>

              {/* TOP RIGHT CARD: Ideal Crop Matches (Image 2) */}
              <div className="col-span-12 lg:col-span-5 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-emerald-100/80 space-y-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                  <span className="text-emerald-700 text-lg">🌱</span>
                  <h3 className="text-base font-extrabold text-[#0f5132]">Ideal Crop Matches</h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(soilData.suitableCrops || ['Maize', 'Groundnut', 'Millet', 'Mango']).slice(0, 5).map((crop, idx) => {
                    const formattedName = (crop || '')
                      .replace(/bengalgram/i, 'Bengal Gram')
                      .replace(/blackgram/i, 'Black Gram')
                      .replace(/greengram/i, 'Green Gram')
                      .replace(/redgram/i, 'Red Gram');
                    const norm = (crop || '').toLowerCase().trim();
                    const icon = CROP_ICONS[norm] || CROP_ICONS[norm.replace(/\s+/g, '')] || CROP_ICONS[norm.split(' ')[0]] || '🌱';
                    const isFifthItem = idx === 4;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 bg-[#f4fbf6] border border-emerald-100/80 rounded-2xl flex items-center gap-2.5 ${
                          isFifthItem ? 'col-span-2 sm:col-span-1' : ''
                        }`}
                      >
                        <span className="text-2xl shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-[#0f5132] text-xs leading-snug whitespace-normal break-words">
                            {formattedName}
                          </h4>
                          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider block mt-0.5">
                            PERFECT MATCH
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM LEFT CARD: Soil Macronutrients Index (NPK) (Image 2) */}
              <div className="col-span-12 lg:col-span-7 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-emerald-100/80 space-y-6">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                  <span className="text-emerald-700 text-lg">📊</span>
                  <h3 className="text-base font-extrabold text-[#0f5132]">Soil Macronutrients Index (NPK)</h3>
                </div>

                <div className="space-y-5">
                  {/* Nitrogen */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-[#0f5132] font-black text-[10px] flex items-center justify-center">N</span>
                        <span className="font-extrabold text-emerald-950">Nitrogen (Nitrates)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#0f5132]">{soilData.nitrogen} kg/ha</span>
                        <span className="text-[10px] font-bold text-rose-600 block">Low (Deficient)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-emerald-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-600 rounded-full transition-all duration-700" 
                        style={{ width: `${Math.min(100, (soilData.nitrogen / 450) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-emerald-700/80 font-bold">
                      <span>0 kg/ha</span>
                      <span>280 kg/ha (Target)</span>
                      <span>450 kg/ha</span>
                    </div>
                  </div>

                  {/* Phosphorus */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-[#0f5132] font-black text-[10px] flex items-center justify-center">P</span>
                        <span className="font-extrabold text-emerald-950">Phosphorus (Phosphates)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#0f5132]">{soilData.phosphorus} kg/ha</span>
                        <span className="text-[10px] font-bold text-rose-600 block">Low (Deficient)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-emerald-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-600 rounded-full transition-all duration-700" 
                        style={{ width: `${Math.min(100, (soilData.phosphorus / 50) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-emerald-700/80 font-bold">
                      <span>0 kg/ha</span>
                      <span>22 kg/ha (Target)</span>
                      <span>50 kg/ha</span>
                    </div>
                  </div>

                  {/* Potassium */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-[#0f5132] font-black text-[10px] flex items-center justify-center">K</span>
                        <span className="font-extrabold text-emerald-950">Potassium (Potash)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#0f5132]">{soilData.potassium} kg/ha</span>
                        <span className="text-[10px] font-bold text-emerald-700 block">Medium (Optimal)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-emerald-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-700" 
                        style={{ width: `${Math.min(100, (soilData.potassium / 500) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-emerald-700/80 font-bold">
                      <span>0 kg/ha</span>
                      <span>340 kg/ha (Target)</span>
                      <span>500 kg/ha</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM RIGHT CARD: AI Soil Advisory (Image 2) */}
              <div className="col-span-12 lg:col-span-5 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-emerald-100/80 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 text-lg">🤖</span>
                      <h3 className="text-base font-extrabold text-[#0f5132]">AI Soil Advisory</h3>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-3">
                    {(soilData.advisoryList || (soilData.advisory || '').split('\n')).filter(Boolean).map((item, idx) => {
                      const match = item.match(/^(🧪\s*[^:]+:)(.*)$/);
                      if (match) {
                        return (
                          <div key={idx} className="p-4 bg-[#f4fbf6] border border-emerald-100/80 rounded-2xl text-xs font-medium text-emerald-950 leading-relaxed shadow-xs">
                            <strong className="text-[#0f5132] font-black">{match[1]}</strong>
                            {match[2]}
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="p-4 bg-[#f4fbf6] border border-emerald-100/80 rounded-2xl text-xs font-medium text-emerald-950 leading-relaxed shadow-xs">
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
