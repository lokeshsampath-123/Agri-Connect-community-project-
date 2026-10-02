'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// AP Only Districts
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

// District to Mandal Mapping (Prevents false connections)
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

// Expanded Crops List
const AP_CROPS = [
  { id: 'paddy', name: 'Paddy (Rice)', icon: '🌾' },
  { id: 'cotton', name: 'Cotton', icon: '☁️' },
  { id: 'chillies', name: 'Red Chillies', icon: '🌶️' },
  { id: 'mangoes', name: 'Mangoes', icon: '🥭' },
  { id: 'groundnut', name: 'Groundnut', icon: '🥜' },
  { id: 'sugarcane', name: 'Sugarcane', icon: '🎋' },
  { id: 'maize', name: 'Maize (Corn)', icon: '🌽' },
  { id: 'bengal_gram', name: 'Bengal Gram (Chickpeas)', icon: '🍲' },
  { id: 'tobacco', name: 'Tobacco', icon: '🍂' },
  { id: 'tomatoes', name: 'Tomatoes', icon: '🍅' },
  { id: 'turmeric', name: 'Turmeric', icon: '🪵' },
  { id: 'cashews', name: 'Cashews', icon: '🌰' },
  { id: 'onions', name: 'Onions', icon: '🧅' },
  { id: 'sunflower', name: 'Sunflower', icon: '🌻' },
  { id: 'lemon', name: 'Lemon', icon: '🍋' },
  { id: 'black_gram', name: 'Black Gram (Urad)', icon: '⚫' },
  { id: 'green_gram', name: 'Green Gram (Moong)', icon: '🟢' },
  { id: 'coconut', name: 'Coconut', icon: '🥥' },
  { id: 'banana', name: 'Banana', icon: '🍌' },
  { id: 'papaya', name: 'Papaya', icon: '🍈' },
  { id: 'oil_palm', name: 'Oil Palm', icon: '🌴' },
  { id: 'ginger', name: 'Ginger', icon: '🫚' }
];

// Default Farmer Profile Silhouette
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a0a0a0"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z"/></svg>`;

export default function Login() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [step, setStep] = useState(1);
  const [activeLang, setActiveLang] = useState('en');

  // Load language settings on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('agri_lang');
    if (savedLang) {
      setActiveLang(savedLang);
    }
  }, []);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('Guntur');
  const [village, setVillage] = useState('Tenali');
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [cropAcreage, setCropAcreage] = useState({});
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);

  // Security Validation States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  // Auto-redirect if logged in
  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  // Sync mandal list to select first item when district changes
  const handleDistrictChange = (selectedDist) => {
    setDistrict(selectedDist);
    const mandals = AP_MANDALS[selectedDist] || [];
    setVillage(mandals.length > 0 ? mandals[0] : '');
  };

  // Profile Image Upload / Convert to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Onboarding Validations
  const validateStep1 = () => {
    let isValid = true;

    // Name Validation
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else if (name.trim().length < 3) {
      setNameError('Name must be at least 3 characters');
      isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(name)) {
      setNameError('Name must only contain alphabets and spaces');
      isValid = false;
    } else {
      setNameError('');
    }

    // Email/Username Validation
    if (!email.trim()) {
      setEmailError('Email or Username is required');
      isValid = false;
    } else if (email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      } else {
        setEmailError('');
      }
    } else {
      const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
      if (!usernameRegex.test(email.trim())) {
        setEmailError('Username must be at least 3 characters (letters, numbers, or underscores)');
        isValid = false;
      } else {
        setEmailError('');
      }
    }

    // Password Validation (User-friendly: min 4 characters)
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters long');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  // Sign In Handler
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter your email/username and password');
      return;
    }

    const savedUserJson = localStorage.getItem('registered_user');
    let userToLog = null;

    if (savedUserJson) {
      try {
        const savedUser = JSON.parse(savedUserJson);
        const input = email.trim().toLowerCase();
        const userEmail = (savedUser.email || '').toLowerCase();
        const userName = (savedUser.name || '').toLowerCase().replace(/\s+/g, '_');
        const emailPrefix = (savedUser.email || '').split('@')[0].toLowerCase();

        const isMatch = userEmail === input || userName === input || (savedUser.name || '').toLowerCase() === input || emailPrefix === input;

        if (isMatch) {
          userToLog = { ...savedUser, password: password.trim() };
        }
      } catch (err) {
        console.warn("Failed to parse saved user:", err);
      }
    }

    if (!userToLog) {
      const cleanInput = email.trim();
      const displayName = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
      const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      
      userToLog = {
        name: formattedName || 'User',
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@farmwise.com`,
        district: 'Guntur',
        village: 'Tenali',
        crops: {},
        profileImage: DEFAULT_AVATAR,
        areaUnit: 'acres',
        weightUnit: 'quintal',
        language: activeLang || 'en'
      };
      localStorage.setItem('registered_user', JSON.stringify({ ...userToLog, password: password.trim() }));
    }

    const lang = userToLog.language || activeLang || 'en';
    localStorage.setItem('agri_lang', lang);
    localStorage.setItem('user_profile', JSON.stringify(userToLog));

    // Set Google Translate cookie
    let googtransVal = '';
    if (lang === 'te') googtransVal = '/en/te';
    else if (lang === 'hi') googtransVal = '/en/hi';

    document.cookie = `googtrans=${googtransVal}; path=/;`;
    document.cookie = `googtrans=${googtransVal}; path=/; domain=${window.location.hostname};`;

    window.location.href = '/dashboard';
  };

  // Registration next step
  const handleNextStep = (e) => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!village) {
        alert('Please specify your Mandal / area');
        return;
      }
      handleRegisterSubmit(e);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleToggleCrop = (cropId) => {
    if (selectedCrops.includes(cropId)) {
      setSelectedCrops(prev => prev.filter(id => id !== cropId));
    } else {
      setSelectedCrops(prev => [...prev, cropId]);
    }
  };

  const handleAcreageChange = (cropId, value) => {
    setCropAcreage(prev => ({
      ...prev,
      [cropId]: Math.max(0.1, parseFloat(value) || 0.1)
    }));
  };

  // Complete Registration
  const handleRegisterSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const userProfile = {
      name,
      email,
      district,
      village,
      profileImage,
      areaUnit: 'acres',
      weightUnit: 'quintal',
      language: activeLang,
      crops: {} // Crops removed from profile onboarding
    };

    localStorage.setItem('agri_lang', activeLang);

    // Set Google Translate cookie
    let googtransVal = '';
    if (activeLang === 'te') googtransVal = '/en/te';
    else if (activeLang === 'hi') googtransVal = '/en/hi';

    document.cookie = `googtrans=${googtransVal}; path=/;`;
    document.cookie = `googtrans=${googtransVal}; path=/; domain=${window.location.hostname};`;

    localStorage.setItem('registered_user', JSON.stringify({ ...userProfile, password }));
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl glass-panel-elevated p-8 md:p-12 rounded-[3rem] shadow-2xl relative z-10 border border-outline-variant/60">
        
        {/* Brand Header */}
        <div className="text-center mb-8 bg-white/40 p-4 rounded-3xl border border-outline-variant/35 backdrop-blur-sm">
          <img src="/logo.png" alt="FarmWise Logo" className="h-20 object-contain mx-auto mb-1" />
          <span className="text-2xl font-display font-black tracking-wide animate-gradient-flow block">FarmWise</span>
          <p className="text-xs text-on-surface-variant font-black mt-1 uppercase tracking-widest font-label">
            Verdant Onboarding Portal
          </p>
        </div>

        {isLoginMode ? (
          /* LOGIN FLOW */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-black text-primary mb-1">Welcome Back</h2>
              <p className="text-xs text-on-surface-variant font-medium">Enter your credentials to access your console.</p>
            </div>

            {loginError && (
              <div className="p-4 bg-error/10 border border-error/20 text-error text-xs font-semibold rounded-2xl">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Username or Email Address</label>
                <input 
                  type="text"
                  className="w-full bg-white border border-outline-variant rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                  placeholder="e.g. user_123 or name@farm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password"
                  className="w-full bg-white border border-outline-variant rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Sign In to Farm
            </button>

            <div className="text-center text-xs font-semibold text-on-surface-variant pt-2 border-t border-outline-variant/40">
              New to FarmWise?{' '}
              <button 
                type="button" 
                onClick={() => { setIsLoginMode(false); setStep(1); }} 
                className="text-primary hover:underline font-bold"
              >
                Create an account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION / ONBOARDING STEPS */
          <div className="space-y-6">
            
            {/* Step Indicators */}
            <div className="flex justify-between items-center px-2 mb-6">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center gap-1.5 md:gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                    step === s ? 'bg-primary text-white' : step > s ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {s}
                  </div>
                  {s < 4 && <div className={`h-[2px] w-8 md:w-16 ${step > s ? 'bg-primary/40' : 'bg-outline-variant/40'}`} />}
                </div>
              ))}
            </div>

            {/* STEP 1: Account Credentials */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-display text-xl font-black text-primary">Step 1: Set Up Credentials</h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">Verify credentials for a secure profile session.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text"
                      className={`w-full bg-white border rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold ${
                        nameError ? 'border-error' : 'border-outline-variant'
                      }`}
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {nameError && <p className="text-[10px] text-error font-bold mt-1.5 pl-1">{nameError}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Username or Email Address</label>
                    <input 
                      type="text"
                      className={`w-full bg-white border rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold ${
                        emailError ? 'border-error' : 'border-outline-variant'
                      }`}
                      placeholder="e.g. user_123 or name@farm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {emailError && <p className="text-[10px] text-error font-bold mt-1.5 pl-1">{emailError}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Password</label>
                    <input 
                      type="password"
                      className={`w-full bg-white border rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold ${
                        passwordError ? 'border-error' : 'border-outline-variant'
                      }`}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordError ? (
                      <p className="text-[10px] text-error font-bold mt-1.5 pl-1">{passwordError}</p>
                    ) : (
                      <p className="text-[9px] text-on-surface-variant font-medium mt-1 pl-1">
                        Password must be at least 4 characters long.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location Profile & Profile Image Picker */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-display text-xl font-black text-primary">Step 2: Region &amp; Avatar</h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">Select location parameters to align alerts and customize profile.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">District</label>
                    <select 
                      className="w-full bg-white border border-outline-variant rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold text-on-surface"
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                    >
                      {AP_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Mandal Area</label>
                    <select 
                      className="w-full bg-white border border-outline-variant rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold text-on-surface"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    >
                      {(AP_MANDALS[district] || []).map(mandal => (
                        <option key={mandal} value={mandal}>{mandal} Mandal</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profile Image upload section */}
                <div className="border-t border-outline-variant/40 pt-4 space-y-3">
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Profile Picture</label>
                  
                  <div className="flex flex-col sm:flex-row gap-5 items-center">
                    <div className="relative shrink-0 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={profileImage} 
                        alt="Profile Avatar" 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-sm bg-surface-container"
                      />
                      <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-bold rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left">
                      <label className="inline-block bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors text-[11px] font-bold px-3.5 py-2 rounded-xl cursor-pointer">
                        Upload Custom Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="text-[9px] text-on-surface-variant font-medium">
                        Upload your custom profile photo (up to 2MB). If no photo is uploaded, the default profile silhouette will be used.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            {step < 3 && (
              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
                <button 
                  type="button" 
                  disabled={step === 1}
                  onClick={handlePrevStep}
                  className="px-6 py-3 border border-outline-variant rounded-xl text-xs font-bold hover:bg-surface-container active:scale-95 transition-all disabled:opacity-30"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all"
                >
                  {step === 2 ? 'Complete Onboarding' : 'Continue'}
                </button>
              </div>
            )}

            <div className="text-center text-xs font-semibold text-on-surface-variant pt-2 border-t border-outline-variant/40">
              Already registered?{' '}
              <button 
                type="button" 
                onClick={() => setIsLoginMode(true)} 
                className="text-primary hover:underline font-bold"
              >
                Sign In Instead
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
