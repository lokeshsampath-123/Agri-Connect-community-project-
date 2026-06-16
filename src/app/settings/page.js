'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { TRANSLATIONS } from '@/lib/translations';
import ErrorBoundary from '@/components/ErrorBoundary';

const AP_DISTRICTS = [
  'Guntur',
  'Kurnool',
  'Krishna',
  'Anantapur',
  'Visakhapatnam (Vizag)',
  'Nellore',
  'Chittoor',
  'Prakasam',
  'Srikakulam',
  'Vizianagaram',
  'West Godavari',
  'East Godavari',
  'Kadapa (YSR Kadapa)'
];

const AP_MANDALS = {
  'Guntur': ['Tenali', 'Mangalagiri', 'Ponnur', 'Bapatla', 'Repalle', 'Narasaraopet', 'Amaravathi'],
  'Kurnool': ['Adoni', 'Nandyal', 'Yemmiganur', 'Dhone', 'Banaganapalle', 'Nandikotkur'],
  'Krishna': ['Vijayawada', 'Machilipatnam', 'Gudivada', 'Nuzvid', 'Jaggaiahpeta', 'Vuyyuru'],
  'Anantapur': ['Dharmavaram', 'Guntakal', 'Hindupur', 'Kadiri', 'Tadipatri', 'Rayadurg'],
  'Visakhapatnam (Vizag)': ['Gajuwaka', 'Anakapalle', 'Pendurthi', 'Bheemunipatnam', 'Araku', 'Madugula'],
  'Nellore': ['Gudur', 'Kavali', 'Udayagiri', 'Atmakur', 'Sullurpeta', 'Naidupeta'],
  'Chittoor': ['Tirupati', 'Madanapalle', 'Chittoor', 'Punganur', 'Sri Kalahasti', 'Kuppam'],
  'Prakasam': ['Ongole', 'Chirala', 'Markapur', 'Kandukur', 'Kanigiri', 'Giddalur'],
  'Srikakulam': ['Palasa', 'Tekkali', 'Ichchapuram', 'Pathapatnam', 'Sompeta'],
  'Vizianagaram': ['Bobbili', 'Parvathipuram', 'Salur', 'Cheepurupalli', 'Srungavarapukota'],
  'West Godavari': ['Eluru', 'Bhimavaram', 'Tadepalligudem', 'Tanuku', 'Palakollu', 'Narsapuram'],
  'East Godavari': ['Rajamahendravaram', 'Kakinada', 'Amalapuram', 'Mandapeta', 'Peddapuram', 'Tuni'],
  'Kadapa (YSR Kadapa)': ['Proddatur', 'Pulivendula', 'Badvel', 'Rayachoty', 'Jammalamadugu']
};

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1592949873599-8ab2ccd5844a?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1589923188900-85dae4409f7c?auto=format&fit=crop&q=80&w=150'
];

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Guntur');
  const [mandal, setMandal] = useState('Tenali');
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATARS[0]);
  const [language, setLanguage] = useState('en');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [weightUnit, setWeightUnit] = useState('quintal');

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load session profile on mount
  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (!session) {
      router.push('/login');
    } else {
      const parsed = JSON.parse(session);
      setProfile(parsed);
      setName(parsed.name || '');
      setDistrict(parsed.district || 'Guntur');
      setMandal(parsed.village || 'Tenali');
      setProfileImage(parsed.profileImage || DEFAULT_AVATARS[0]);
      setLanguage(parsed.language || 'en');
      setAreaUnit(parsed.areaUnit || 'acres');
      setWeightUnit(parsed.weightUnit || 'quintal');
      setIsLoading(false);
    }
  }, [router]);

  // Sync mandals on district change
  const handleDistrictChange = (selectedDist) => {
    setDistrict(selectedDist);
    const mandals = AP_MANDALS[selectedDist] || [];
    setMandal(mandals.length > 0 ? mandals[0] : '');
  };

  // Convert uploaded image to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('File size exceeds 2MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!name.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (name.trim().length < 3) {
      setErrorMsg('Name must be at least 3 characters');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      setErrorMsg('Name must only contain alphabets and spaces');
      return;
    }

    const updatedProfile = {
      ...profile,
      name: name.trim(),
      district,
      village: mandal, // storing mandal in 'village' field to match onboarding format
      profileImage,
      language,
      areaUnit,
      weightUnit
    };

    localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
    localStorage.setItem('agri_lang', language); // synchronize active translation language globally

    // Sync registered user database as well
    const savedUserJson = localStorage.getItem('registered_user');
    if (savedUserJson) {
      const savedUser = JSON.parse(savedUserJson);
      if (savedUser.email === profile.email) {
        localStorage.setItem('registered_user', JSON.stringify({ ...savedUser, ...updatedProfile }));
      }
    }

    setSuccessMsg(TRANSLATIONS[language]?.changesSaved || 'Settings updated successfully!');
    setProfile(updatedProfile);

    // Auto-scroll to top to show success banner
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold text-sm">
        Loading farm settings profile...
      </div>
    );
  }

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full overflow-x-hidden">
        {/* Header */}
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="font-headline text-lg font-bold text-primary">{t.settings || 'Settings'}</span>
          </div>
        </header>

        <div className="p-8 max-w-4xl mx-auto space-y-8">
          {/* Welcome Info */}
          <div>
            <h2 className="font-display text-4xl font-black text-primary tracking-tight">
              {t.profileSettings || 'Profile & System Settings'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {t.settingsDesc || 'Configure your farm dashboard, localization choices, and measurement units.'}
            </p>
          </div>

          {/* Success / Error Banners */}
          {successMsg && (
            <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-2xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-error/10 border border-error/20 text-error text-xs font-bold rounded-2xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Card 1: Profile Details & Avatar */}
            <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-6">
              <div className="border-b border-outline-variant/40 pb-4">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">account_circle</span>
                  {t.editProfileCard || 'Edit Profile Details'}
                </h3>
              </div>

              {/* Avatar Selector and Custom Upload */}
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="relative shrink-0 group">
                  <img 
                    src={profileImage} 
                    alt="Farmer Avatar" 
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-primary shadow-md"
                  />
                  <label className="absolute inset-0 bg-black/55 text-white text-[10px] font-black rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <span className="material-symbols-outlined text-lg">upload</span>
                    Upload Custom
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-surface-variant">
                    {t.avatarLabel || 'Click Avatar to Change Profile Image'}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {DEFAULT_AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileImage(av)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                          profileImage === av ? 'border-primary scale-105' : 'border-outline-variant hover:scale-102'
                        }`}
                      >
                        <img src={av} alt={`Avatar ${idx+1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70 font-medium">
                    Supports JPG, PNG, or GIF up to 2MB. Updates live instantly in the sidebar.
                  </p>
                </div>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.fullName || 'Full Name'}
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold"
                    placeholder="e.g. Ramesh Babu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.district || 'District'}
                  </label>
                  <select 
                    className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold text-on-surface"
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    {AP_DISTRICTS.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.mandal || 'Mandal Area'}
                  </label>
                  <select 
                    className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold text-on-surface"
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                  >
                    {(AP_MANDALS[district] || []).map(mnd => (
                      <option key={mnd} value={mnd}>{mnd} Mandal</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: App Preferences (Language & Units) */}
            <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 space-y-6">
              <div className="border-b border-outline-variant/40 pb-4">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">tune</span>
                  {t.appPreferencesCard || 'App Preferences'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Language Select */}
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.selectLanguage || 'Interface Language'}
                  </label>
                  <select 
                    className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold text-on-surface"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>

                {/* Land Area Select */}
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.areaUnitLabel || 'Land Area Unit'}
                  </label>
                  <select 
                    className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold text-on-surface"
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                  >
                    <option value="acres">{t.acres || 'Acres'}</option>
                    <option value="hectares">{t.hectares || 'Hectares'}</option>
                    <option value="sqMeters">{t.sqMeters || 'Square Meters'}</option>
                  </select>
                </div>

                {/* Weight Unit Select */}
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.weightUnitLabel || 'Weight / Price Unit'}
                  </label>
                  <select 
                    className="w-full bg-white border border-outline-variant rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold text-on-surface"
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                  >
                    <option value="quintal">{t.quintal || 'Quintal'}</option>
                    <option value="kg">{t.kg || 'Kilogram (Kg)'}</option>
                    <option value="tonne">{t.tonne || 'Tonne'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className="py-4 px-10 bg-primary text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                {t.saveChanges || 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
