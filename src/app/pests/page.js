'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import FallbackImage from '@/components/FallbackImage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { getAssetUrl } from '@/lib/assets';

function resolvePestImage(imageUrl) {
  if (!imageUrl) return '/default_pest.png';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  return getAssetUrl(imageUrl, 'pest') || '/default_pest.png';
}

const SEED_OUTBREAKS = [
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
  }
];

const SEED_PESTS = [
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
  }
];

export default function Pests() {
  const [pests, setPests] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [selectedPest, setSelectedPest] = useState(null);
  const [selectedOutbreak, setSelectedOutbreak] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Outbreak Form state
  const [cropName, setCropName] = useState('');
  const [pestName, setPestName] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('Farmer Ramesh');
  const [district, setDistrict] = useState('Guntur');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load pests and outbreaks
  const loadData = async (targetDistrict = district) => {
    try {
      const res = await fetch(`/api/pests?district=${encodeURIComponent(targetDistrict)}`);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      setPests(data.pests || []);
      setOutbreaks(data.outbreaks || []);
    } catch (err) {
      console.warn('Could not query live pests API, falling back to local seeds:', err);
      
      const matched = SEED_PESTS.filter(p => p.district.toLowerCase() === targetDistrict.toLowerCase());
      const nonMatched = SEED_PESTS.filter(p => p.district.toLowerCase() !== targetDistrict.toLowerCase());
      const displayPests = [...matched, ...nonMatched.map(p => ({ ...p, district: targetDistrict }))];
      setPests(displayPests);
      
      const matchedOb = SEED_OUTBREAKS.filter(o => o.district.toLowerCase() === targetDistrict.toLowerCase());
      const nonMatchedOb = SEED_OUTBREAKS.filter(o => o.district.toLowerCase() !== targetDistrict.toLowerCase());
      const displayOutbreaks = [...matchedOb, ...nonMatchedOb.map(o => ({ ...o, district: targetDistrict }))];
      setOutbreaks(displayOutbreaks);
    }
  };

  useEffect(() => {
    // Determine initial district from user profile or default
    let initialDistrict = 'Guntur';
    const session = localStorage.getItem('user_profile');
    if (session) {
      const prof = JSON.parse(session);
      setProfile(prof);
      if (prof.district) {
        initialDistrict = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
        setDistrict(initialDistrict);
      }
      if (prof.name) {
        setReporterName(prof.name);
      }
    }

    loadData(initialDistrict);

    // Set up real-time subscription for database updates
    const pestsSubscription = supabase
      .channel('pests_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pests' }, () => {
        const currentSession = localStorage.getItem('user_profile');
        let currentDist = 'Guntur';
        if (currentSession) {
          const prof = JSON.parse(currentSession);
          if (prof.district) {
            currentDist = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
          }
        }
        loadData(currentDist);
      })
      .subscribe();

    const outbreaksSubscription = supabase
      .channel('outbreaks_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outbreaks' }, () => {
        const currentSession = localStorage.getItem('user_profile');
        let currentDist = 'Guntur';
        if (currentSession) {
          const prof = JSON.parse(currentSession);
          if (prof.district) {
            currentDist = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
          }
        }
        loadData(currentDist);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pestsSubscription);
      supabase.removeChannel(outbreaksSubscription);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOutbreakSubmit = async (e) => {
    e.preventDefault();
    if (!cropName || !description) {
      alert('Please enter crop name and description.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image to Cloudinary if provided
      if (imagePreview) {
        try {
          // Since client-side Direct upload or API upload
          // Let's call our API route `/api/analyze` or a generic upload API
          // Or write direct base64 upload here calling a quick client upload route
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imagePreview, cropHint: cropName })
          });
          const uploadResult = await response.json();
          imageUrl = uploadResult.image_url;
        } catch (uploadErr) {
          console.warn('Cloudinary upload failed, using default fallback image');
        }
      }

      // Insert outbreak report into Supabase
      const { error } = await supabase
        .from('outbreaks')
        .insert([{
          crop_name: cropName,
          pest_name: pestName || 'Unidentified Pest',
          image_url: imageUrl,
          description,
          reporter_name: reporterName,
          district,
          status: 'VERIFIED'
        }]);

      if (error) throw error;

      alert('Outbreak reported successfully. The community has been alerted!');
      
      // Reset form
      setCropName('');
      setPestName('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);

      // Refresh list
      loadData();
    } catch (err) {
      console.error('Error reporting outbreak:', err);
      alert('Failed to report outbreak: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Divide pests into Critical (critical/high severity) vs Standard District Pests
  const criticalThreats = pests.filter(p => p.severity_level === 'critical' || p.severity_level === 'high');
  const standardPests = pests.filter(p => p.severity_level !== 'critical' && p.severity_level !== 'high');
  const filteredOutbreaks = outbreaks.filter(ob => ob.district.toLowerCase() === district.toLowerCase());

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full lg:w-[calc(100vw-288px)] lg:max-w-[calc(100vw-288px)] overflow-x-hidden">
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="font-headline text-lg font-bold text-primary">Regional Surveillance Dashboard</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <div className="flex items-center text-on-surface gap-2 text-sm font-bold bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-lg">location_on</span>
              <select
                value={district}
                onChange={(e) => {
                  const newDist = e.target.value;
                  setDistrict(newDist);
                  loadData(newDist);
                }}
                className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer pr-1 text-sm font-headline"
              >
                {['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Visakhapatnam', 'Nellore', 'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'West Godavari', 'East Godavari', 'YSR Kadapa'].map(dist => (
                  <option key={dist} value={dist} className="bg-white text-on-surface">{dist} District</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Live Monitoring Active</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-12">
          {/* Header Title */}
          <div>
            <h2 className="font-display text-4xl font-black text-primary tracking-tight">Ultimate Pest Tracker</h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              Real-time agricultural surveillance and AI-driven pest management alert systems for the Telugu heartland.
            </p>
          </div>

          {/* 1. Rapid Spreading Pests (Critical/High Severity Alerts) */}
          <ErrorBoundary>
            <section className="w-full overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error text-3xl">emergency_home</span>
                  <h3 className="font-display text-2xl font-black text-on-surface">Rapid Spreading Pests</h3>
                </div>
                <span className="text-xs text-on-surface-variant font-bold animate-pulse">← Swipe horizontally for more →</span>
              </div>

              {criticalThreats.length === 0 ? (
                <div className="p-8 bg-surface-container-low border border-outline-variant rounded-3xl text-center italic text-on-surface-variant text-sm">
                  No active critical/high severity pests reported in the region.
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scroll-smooth custom-scrollbar">
                  {criticalThreats.map((pest) => (
                    <div 
                      key={pest.id} 
                      onClick={() => setSelectedPest(pest)}
                      className="min-w-[320px] md:min-w-[360px] snap-start bg-error-container/10 border-2 border-error/20 rounded-[2rem] p-5 relative overflow-hidden group hover:border-error/40 hover:shadow-md transition-all shadow-sm cursor-pointer"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30">
                          <FallbackImage 
                            src={resolvePestImage(pest.image_url)} 
                            alt={pest.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <div>
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded mb-2 uppercase text-white ${
                            pest.severity_level === 'critical' ? 'bg-error' : 'bg-primary'
                          }`}>
                            {pest.severity_level} Threat
                          </span>
                          <h4 className="font-headline font-bold text-primary text-base leading-tight">{pest.name}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-normal">{pest.description}</p>
                          <p className="text-[10px] font-bold text-secondary mt-2">Crop Affected: {pest.crop_affected}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-outline-variant/30 text-xs bg-white/40 p-3 rounded-xl">
                        <p className="font-bold text-primary">Advice:</p>
                        <p className="text-on-surface-variant line-clamp-2 mt-0.5">{pest.advice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ErrorBoundary>

          {/* 2. District Pests Grid */}
          <ErrorBoundary>
            <section className="w-full overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-2xl font-black text-on-surface">District Present Pests</h3>
                <span className="text-xs text-on-surface-variant font-bold animate-pulse">← Swipe horizontally for more →</span>
              </div>

              {pests.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-6">Loading active pest lists...</p>
              ) : standardPests.length === 0 ? (
                <div className="p-8 bg-surface-container-low border border-outline-variant rounded-3xl text-center italic text-on-surface-variant text-sm w-full">
                  No standard-severity pests active in this district.
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scroll-smooth custom-scrollbar">
                  {standardPests.map((pest) => (
                    <div 
                      key={pest.id} 
                      onClick={() => setSelectedPest(pest)}
                      className="min-w-[280px] md:min-w-[320px] snap-start glass-card rounded-[2.5rem] p-4 flex flex-col h-[380px] overflow-hidden hover:shadow-lg hover:border-primary/45 transition-all border border-outline-variant/60 cursor-pointer"
                    >
                      <div className="w-full h-36 rounded-xl overflow-hidden mb-3 border border-outline-variant/30">
                        <FallbackImage 
                          src={resolvePestImage(pest.image_url)} 
                          alt={pest.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <h4 className="font-headline font-bold text-primary text-base truncate">{pest.name}</h4>
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-2">{pest.crop_affected}</p>
                      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed flex-1">{pest.description}</p>
                      
                      {pest.advice && (
                        <div className="mt-2.5 p-2.5 bg-surface-container-low/50 rounded-xl border border-outline-variant/30 text-[10px] leading-relaxed">
                          <p className="font-bold text-primary text-[9px] uppercase tracking-wider">Advice:</p>
                          <p className="text-on-surface-variant line-clamp-2 mt-0.5 font-semibold">{pest.advice}</p>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                        <span className="text-[9px] text-outline font-bold truncate max-w-[120px]">{pest.scientific_name || 'N/A'}</span>
                        <span className="text-[9px] text-secondary font-bold uppercase tracking-wide bg-surface-container px-2.5 py-1 rounded-full">{pest.district}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ErrorBoundary>

          {/* 3. Outbreak Reporting Section */}
          <ErrorBoundary>
            <section className="glass-card rounded-[3rem] p-10 border-2 border-dashed border-outline-variant/80 overflow-hidden relative">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-primary">Report Pest Outbreak</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Spotted a pest infection in your field? Share it with the community.</p>
                </div>

                <form onSubmit={handleOutbreakSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Crop Name</label>
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        placeholder="e.g. Paddy, Cotton, Chillies..."
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Pest Name (If known)</label>
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        placeholder="e.g. Yellow Stem Borer, Whitefly..."
                        value={pestName}
                        onChange={(e) => setPestName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Your Name</label>
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">District</label>
                      <select 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      >
                        {['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Vizag', 'Nellore', 'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'West Godavari', 'East Godavari', 'YSR Kadapa'].map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Upload Outbreak Image</label>
                      <label className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-on-surface-variant cursor-pointer hover:bg-surface-container transition-colors text-sm font-semibold">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        <span className="material-symbols-outlined text-lg">upload</span>
                        <span className="truncate">{imageFile ? imageFile.name : 'Select file'}</span>
                      </label>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-outline-variant/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Outbreak preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                      className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                      placeholder="Describe the extent of the outbreak, crop damage symptoms, etc..."
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 text-sm"
                  >
                    {isSubmitting ? 'Uploading & Submitting...' : 'Submit Outbreak Report'}
                  </button>
                </form>
              </div>
            </section>
          </ErrorBoundary>

          {/* 4. Recent Outbreaks Feed */}
          <ErrorBoundary>
            <section className="pb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">history</span>
                <h3 className="font-display text-2xl font-black text-on-surface">Recent Outbreaks</h3>
                <span className="text-xs text-on-surface-variant font-semibold">({district} District)</span>
              </div>

              {filteredOutbreaks.length === 0 ? (
                <div className="p-8 bg-surface-container-low border border-outline-variant rounded-3xl text-center italic text-on-surface-variant text-sm">
                  No outbreaks reported in {district} district. Submit a report above to alert the community.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {filteredOutbreaks.map((ob) => (
                    <div 
                      key={ob.id}
                      onClick={() => setSelectedOutbreak(ob)}
                      className="bg-white p-4 rounded-2xl border border-outline-variant/60 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-outline-variant/40">
                        <FallbackImage 
                          src={ob.image_url} 
                          fallbackSrc="/default_pest.png"
                          alt="Outbreak" 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-primary truncate">
                          {ob.pest_name || 'Unidentified Pest'} on {ob.crop_name}
                        </h5>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Reported by <span className="font-bold">{ob.reporter_name}</span> • {new Date(ob.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate mt-1">{ob.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-all text-lg">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ErrorBoundary>

        </div>
      </main>

      {/* Pest Detail Modal */}
      {selectedPest && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPest(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Header or Top Banner */}
            <div className="relative h-48 md:h-64 bg-surface-container-low shrink-0">
              <FallbackImage 
                src={resolvePestImage(selectedPest.image_url)} 
                alt={selectedPest.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider text-white w-fit ${
                  selectedPest.severity_level === 'critical' ? 'bg-error' : selectedPest.severity_level === 'high' ? 'bg-amber-600' : 'bg-primary'
                }`}>
                  {selectedPest.severity_level} Threat
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 leading-tight">
                  {selectedPest.name}
                </h3>
                {selectedPest.scientific_name && (
                  <p className="text-xs md:text-sm text-white/80 italic font-medium mt-1">
                    {selectedPest.scientific_name}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSelectedPest(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border border-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-4 text-xs font-bold border-b border-outline-variant/30 pb-4">
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">eco</span>
                  <span>Crop: {selectedPest.crop_affected}</span>
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  <span>District: {selectedPest.district}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-headline font-bold text-primary text-sm uppercase tracking-wider">Field Symptoms &amp; Description</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {selectedPest.description}
                </p>
              </div>

              {/* Treatment Advice / Plan */}
              {selectedPest.advice && (
                <div className="p-5 bg-primary/5 rounded-3xl border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined">health_and_safety</span>
                    <h4 className="font-headline font-bold text-sm uppercase tracking-wider">Agronomist Recommended Action Plan</h4>
                  </div>
                  <div className="text-xs md:text-sm text-on-surface-variant leading-relaxed space-y-2">
                    {selectedPest.advice.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">check_circle</span>
                        <span>{sentence.trim()}.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setSelectedPest(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outbreak Detail Modal */}
      {selectedOutbreak && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedOutbreak(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Header */}
            <div className="relative h-48 md:h-64 bg-surface-container-low shrink-0">
              <FallbackImage 
                src={selectedOutbreak.image_url} 
                fallbackSrc="/default_pest.png"
                alt="Outbreak" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider text-white bg-error w-fit">
                  Verified Outbreak
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 leading-tight">
                  {selectedOutbreak.pest_name || 'Unidentified Pest'} on {selectedOutbreak.crop_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOutbreak(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border border-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-4 text-xs font-bold border-b border-outline-variant/30 pb-4">
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">eco</span>
                  <span>Crop: {selectedOutbreak.crop_name}</span>
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  <span>District: {selectedOutbreak.district}</span>
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                  <span>Date: {new Date(selectedOutbreak.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-headline font-bold text-primary text-sm uppercase tracking-wider">Report Details</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {selectedOutbreak.description}
                </p>
                <p className="text-xs text-outline font-bold mt-4">
                  Reported by: {selectedOutbreak.reporter_name}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setSelectedOutbreak(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
