'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// AP Only Districts
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

// District to Mandal Mapping (Prevents false connections)
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

// Predefined Farmer Avatars
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150', // Avatar 1
  'https://images.unsplash.com/photo-1592949873599-8ab2ccd5844a?auto=format&fit=crop&q=80&w=150', // Avatar 2
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150', // Avatar 3
  'https://images.unsplash.com/photo-1589923188900-85dae4409f7c?auto=format&fit=crop&q=80&w=150'  // Avatar 4
];

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
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATARS[0]);

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

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password Validation (Complexity check: min 6 chars, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Must contain at least 1 number and 1 special character');
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

    if (!email || !password) return;

    const savedUserJson = localStorage.getItem('registered_user');
    let userToLog = null;

    if (savedUserJson) {
      const savedUser = JSON.parse(savedUserJson);
      if (savedUser.email === email && savedUser.password === password) {
        userToLog = savedUser;
      }
    }

    if (!userToLog) {
      // Create a default demo account if none exists
      if (email === 'farmer@agriconnect.com' && password === 'Farmer@123') {
        userToLog = {
          name: 'Ramesh Babu',
          email: email,
          district: 'Guntur',
          village: 'Tenali',
          crops: { paddy: 5.0, chillies: 3.0 },
          profileImage: DEFAULT_AVATARS[0],
          areaUnit: 'acres',
          weightUnit: 'quintal',
          language: 'en'
        };
        localStorage.setItem('registered_user', JSON.stringify({ ...userToLog, password }));
      } else {
        setLoginError('Invalid email credentials or password. Please use farmer@agriconnect.com / Farmer@123 for testing.');
        return;
      }
    }

    localStorage.setItem('user_profile', JSON.stringify(userToLog));
    router.push('/dashboard');
  };

  // Registration next step
  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!village) {
        alert('Please specify your Mandal / area');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (selectedCrops.length === 0) {
        alert('Please select at least one crop');
        return;
      }
      const updatedAcreage = { ...cropAcreage };
      selectedCrops.forEach(cropId => {
        if (!updatedAcreage[cropId]) {
          updatedAcreage[cropId] = 1.0;
        }
      });
      setCropAcreage(updatedAcreage);
      setStep(4);
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
    e.preventDefault();

    const userProfile = {
      name,
      email,
      district,
      village,
      profileImage,
      areaUnit: 'acres',
      weightUnit: 'quintal',
      language: activeLang,
      crops: selectedCrops.reduce((acc, cropId) => {
        acc[cropId] = cropAcreage[cropId] || 1.0;
        return acc;
      }, {})
    };

    localStorage.setItem('registered_user', JSON.stringify({ ...userProfile, password }));
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    router.push('/dashboard');
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
          <img src="/logo.png" alt="AgriConnect Logo" className="h-24 object-contain mx-auto" />
          <p className="text-xs text-on-surface-variant font-black mt-2 uppercase tracking-widest font-label">
            Verdant Onboarding Portal
          </p>
        </div>

        {isLoginMode ? (
          /* LOGIN FLOW */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-black text-primary mb-1">Welcome Back Farmer</h2>
              <p className="text-xs text-on-surface-variant font-medium">Enter your credentials to enter your farm console.</p>
            </div>

            {loginError && (
              <div className="p-4 bg-error/10 border border-error/20 text-error text-xs font-semibold rounded-2xl">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-white border border-outline-variant rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                  placeholder="name@farm.com"
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
              New to AgriConnect?{' '}
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
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email"
                      className={`w-full bg-white border rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold ${
                        emailError ? 'border-error' : 'border-outline-variant'
                      }`}
                      placeholder="name@farm.com"
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
                        Complexity: At least 6 characters, including a number and special character.
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

                {/* Profile Image upload / avatar picker section */}
                <div className="border-t border-outline-variant/40 pt-4 space-y-3">
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Choose Profile Avatar</label>
                  
                  <div className="flex flex-col sm:flex-row gap-5 items-center">
                    <div className="relative shrink-0 group">
                      <img 
                        src={profileImage} 
                        alt="Current Avatar" 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-sm"
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

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {DEFAULT_AVATARS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProfileImage(av)}
                            className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                              profileImage === av ? 'border-primary scale-105' : 'border-outline-variant hover:scale-102'
                            }`}
                          >
                            <img src={av} alt={`Avatar ${idx+1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-on-surface-variant font-medium">
                        Click on an avatar to select it, or hover/click the profile frame to upload a custom image.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Crop Selection */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-display text-xl font-black text-primary">Step 3: Select Crops Grown</h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">Select which crops are currently cultivated in your farms.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {AP_CROPS.map(crop => {
                    const isSelected = selectedCrops.includes(crop.id);
                    return (
                      <div 
                        key={crop.id}
                        onClick={() => handleToggleCrop(crop.id)}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all select-none hover:shadow-xs ${
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                            : 'bg-white border-outline-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-xl shrink-0">{crop.icon}</span>
                        <span className="text-xs truncate leading-normal">{crop.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Define Acreage */}
            {step === 4 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h4 className="font-display text-xl font-black text-primary">Step 4: Cultivation Acreage</h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">Specify the acreage cultivated for each crop.</p>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedCrops.map(cropId => {
                    const crop = AP_CROPS.find(c => c.id === cropId);
                    return (
                      <div key={cropId} className="flex items-center justify-between p-3 bg-surface-container rounded-2xl border border-outline-variant/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">{crop?.icon}</span>
                          <span className="text-xs font-bold text-primary truncate">{crop?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input 
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="w-20 bg-white border border-outline-variant rounded-lg p-1.5 text-center text-xs font-bold"
                            value={cropAcreage[cropId] || ''}
                            onChange={(e) => handleAcreageChange(cropId, e.target.value)}
                            required
                          />
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase">Acres</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all mt-4"
                >
                  Complete Onboarding
                </button>
              </form>
            )}

            {/* Stepper Navigation Buttons */}
            {step < 4 && (
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
                  Continue
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
