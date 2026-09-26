'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { TRANSLATIONS } from '@/lib/translations';
import ErrorBoundary from '@/components/ErrorBoundary';

const AP_DISTRICTS = [
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

const AP_MANDALS = {
  'Srikakulam': ['Palasa', 'Amadalavalasa', 'Srikakulam Rural', 'Tekkali', 'Narasannapeta', 'Ichchapuram', 'Sompeta', 'Rajam', 'Etcherla', 'Pathapatnam'],
  'Parvathipuram Manyam': ['Parvathipuram', 'Balajipeta', 'Seethampeta', 'Makkuva', 'Komarada', 'Salur', 'Kurupam', 'Gummalaxmipuram', 'Pachipenta', 'Jiththajodu'],
  'Vizianagaram': ['Bhogapuram', 'Chelluru', 'Vizianagaram Rural', 'Gajapathinagaram', 'Srungavarapukota', 'Nellimarla', 'Bobbili', 'Badangi', 'Pusapatirega', 'Garividi'],
  'Visakhapatnam': ['Pendurthi', 'Anandapuram', 'Bheemunipatnam', 'Gajuwaka', 'Seethammadhara', 'Maharanipeta', 'Gopalapatnam', 'Padmanabham', 'Mulagada', 'Pedagantyada'],
  'Alluri Sitharama Raju (ASR)': ['Araku Valley', 'Chintapalle', 'Paderu', 'Ananthagiri', 'Rampachodavaram', 'Maredumilli', 'Dumbriguda', 'G.Madugula', 'Addateegala', 'Devipatnam'],
  'Anakapalli': ['Anakapalli', 'Atchutapuram', 'Chodavaram', 'Narsipatnam', 'Yelamanchili', 'Paravada', 'Sabbavaram', 'Kasimkota', 'Nakkapalli', 'Payakaraopeta'],
  'Kakinada': ['Kakinada Rural', 'Samalkota', 'Peddapuram', 'Pithapuram', 'Tuni', 'Prathipadu', 'Gollaprolu', 'Jaggampeta', 'Karapa', 'Thallarevu'],
  'East Godavari': ['Rajahmundry Rural', 'Ravulapalem', 'Kovvur', 'Nidadavole', 'Anaparthi', 'Gopalapuram', 'Devarapalle', 'Korukonda', 'Chagallu', 'Kadiam'],
  'Dr. B.R. Ambedkar Konaseema': ['Amalapuram', 'Razole', 'Kothapeta', 'Mandapeta', 'Mummidivaram', 'P.Gannavaram', 'Rayavaram', 'Malikipuram', 'Ambajipeta', 'Kapileswarapuram'],
  'Eluru': ['Eluru Rural', 'Jangareddygudem', 'Chintalapudi', 'Tadepalligudem', 'Denduluru', 'Nuzvid', 'Bhimadole', 'Chatrai', 'Pedapadu', 'Kukunoor'],
  'West Godavari': ['Bhimavaram', 'Tanuku', 'Palakollu', 'Narasapuram', 'Achanta', 'Penugonda', 'Penumantra', 'Undi', 'Iragavaram', 'Mogalthur'],
  'NTR': ['Vijayawada Rural', 'Jaggayyapeta', 'Ibrahimpatnam', 'Kanchikacherla', 'Nandigama', 'Mylavaram', 'Tiruvuru', 'G.Konduru', 'Vatsavai', 'Penuganchiprolu'],
  'Krishna': ['Gudivada', 'Machilipatnam', 'Vuyyuru', 'Pamarru', 'Challapalli', 'Avanigadda', 'Gannavaram', 'Penamaluru', 'Bantumilli', 'Krittivennu'],
  'Palnadu': ['Narasaraopet', 'Macherla', 'Piduguralla', 'Chilakaluripet', 'Sattenapalle', 'Gurazala', 'Vinukonda', 'Dachepalle', 'Krosuru', 'Bellamkonda'],
  'Guntur': ['Guntur Rural', 'Tenali', 'Duggirala', 'Tadikonda', 'Medikonduru', 'Chebrolu', 'Mangalagiri', 'Ponnur', 'Pedakakani', 'Prathipadu'],
  'Bapatla': ['Chirala', 'Bapatla', 'Parchur', 'Addanki', 'Repalle', 'Vemuru', 'Martur', 'Korisapadu', 'Karlapalem', 'Nizampatnam'],
  'Prakasam': ['Ongole', 'Kandukur', 'Podili', 'Kanigiri', 'Markapuram', 'Singarayakonda', 'Chimakurthi', 'Giddalur', 'Yerragondapalem', 'Donakonda'],
  'SPSR Nellore': ['Nellore Rural', 'Kavali', 'Gudur', 'Atmakur', 'Venkatagiri', 'Naidupeta', 'Buchireddypalem', 'Kovur', 'Udayagiri', 'Podalakur'],
  'Kurnool': ['Adoni', 'Kurnool Rural', 'Yemmiganur', 'Kodumur', 'Pathikonda', 'Alur', 'Mantralayam', 'Goneganandla', 'Nandavaram', 'Orvakal'],
  'Nandyal': ['Nandyal', 'Dhone', 'Allagadda', 'Banaganapalle', 'Koilkuntla', 'Atmakur', 'Srisailam', 'Owk', 'Nandikotkur', 'Bethamcherla'],
  'Ananthapuramu': ['Tadipatri', 'Anantapuramu Rural', 'Kalyandurg', 'Guntakal', 'Gooty', 'Uravakonda', 'Rayadurg', 'Pamidi', 'Singanamala', 'Raptadu'],
  'Sri Sathya Sai': ['Puttaparthi', 'Hindupur', 'Kadiri', 'Dharmavaram', 'Madakasira', 'Penukonda', 'Gorantla', 'Somandepalle', 'Bukkapatnam', 'Tanakal'],
  'YSR Kadapa': ['Pulivendula', 'Kadapa Rural', 'Jammalamadugu', 'Proddatur', 'Badvel', 'Mydukur', 'Kamalapuram', 'Vempalli', 'Yerraguntla', 'Pendlimarri'],
  'Annamayya': ['Madanapalle', 'Rajampet', 'Rayachoti', 'Piler', 'Railway Koduru', 'Punganur', 'Chowdepalle', 'Lakkireddipalli', 'Tamballapalle', 'Chinnamandem'],
  'Tirupati': ['Srikalahasti', 'Chandragiri', 'Tirupati Rural', 'Venkatagiri-border', 'Sullurpeta', 'Naidupeta-fringe', 'Tada', 'Satyavedu', 'Puttur', 'Narayanavanam'],
  'Chittoor': ['Chittoor Rural', 'Palamaner', 'Kuppam', 'Nagari', 'GD Nellore', 'Bangarupalem', 'Santhipuram', 'Gudupalle', 'Karvetinagar', 'Vedurukuppam']
};

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a0a0a0"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z"/></svg>`;

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Guntur');
  const [mandal, setMandal] = useState('Tenali');
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
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
      setProfileImage(parsed.profileImage || DEFAULT_AVATAR);
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

    // Set Google Translate cookie dynamically
    let googtransVal = '';
    if (language === 'te') googtransVal = '/en/te';
    else if (language === 'hi') googtransVal = '/en/hi';

    document.cookie = `googtrans=${googtransVal}; path=/;`;
    document.cookie = `googtrans=${googtransVal}; path=/; domain=${window.location.hostname};`;

    // Sync registered user database as well
    const savedUserJson = localStorage.getItem('registered_user');
    if (savedUserJson) {
      const savedUser = JSON.parse(savedUserJson);
      if (savedUser.email === profile.email) {
        localStorage.setItem('registered_user', JSON.stringify({ ...savedUser, ...updatedProfile }));
      }
    }

    setProfile(updatedProfile);
    window.location.reload();

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

  const t = TRANSLATIONS.en;

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

              {/* Profile Image upload section */}
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="relative shrink-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={profileImage} 
                    alt="Farmer Avatar" 
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-primary shadow-md bg-surface-container"
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

                <div className="space-y-2 text-center sm:text-left">
                  <label className="inline-block bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">
                    Upload Custom Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="text-[10px] text-on-surface-variant/70 font-medium">
                    Upload your custom profile photo (up to 2MB). If no photo is uploaded, the default profile silhouette will be used.
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
