'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ParticleCanvas from '@/components/ParticleCanvas';
import { TRANSLATIONS } from '@/lib/translations';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLang, setActiveLang] = useState('en');

  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      setIsLoggedIn(true);
      const profile = JSON.parse(session);
      if (profile.language) {
        setActiveLang(profile.language);
      }
    } else {
      const savedLang = localStorage.getItem('agri_lang');
      if (savedLang) {
        setActiveLang(savedLang);
      }
    }
  }, []);

  const handleLangChange = (lang) => {
    setActiveLang(lang);
    localStorage.setItem('agri_lang', lang);
    const session = localStorage.getItem('user_profile');
    if (session) {
      const profile = JSON.parse(session);
      profile.language = lang;
      localStorage.setItem('user_profile', JSON.stringify(profile));
    }
    // Dispatch event to notify layout/other components if needed
    window.dispatchEvent(new Event('language-change'));
  };

  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  // Localized landing page strings
  const strings = {
    home: activeLang === 'te' ? 'హోమ్' : activeLang === 'hi' ? 'होम' : 'Home',
    tutorial: activeLang === 'te' ? 'ట్యుటోరియల్' : activeLang === 'hi' ? 'ट्यूटोरियल' : 'Tutorial',
    vision: activeLang === 'te' ? 'దార్శనికత' : activeLang === 'hi' ? 'दृष्टिकोण' : 'Vision',
    features: activeLang === 'te' ? 'ఫీచర్లు' : activeLang === 'hi' ? 'विशेषताएं' : 'Features',
    states: activeLang === 'te' ? 'రాష్ట్రాలు' : activeLang === 'hi' ? 'राज्य' : 'States',
    signIn: activeLang === 'te' ? 'లాగిన్' : activeLang === 'hi' ? 'लॉग इन' : 'Sign In',
    
    heroTitle: activeLang === 'te' 
      ? 'ప్రతి మట్టిలో మేధస్సును పెంపొందించడం.' 
      : activeLang === 'hi' 
      ? 'हर मिट्टी में बुद्धिमत्ता का विकास।' 
      : 'Cultivating Intelligence in every soil.',
    heroDesc: activeLang === 'te'
      ? 'నిజ-సమయ స్కానింగ్ మరియు నిపుణులైన ఏఐ సలహాల ద్వారా భారతీయ వ్యవసాయంలో విప్లవాత్మక మార్పులు తీసుకురావడానికి సంప్రదాయ జ్ఞానాన్ని కృత్రిమ మేధస్సుతో అనుసంధానించడం.'
      : activeLang === 'hi'
      ? 'वास्तविक समय स्कैनिंग और विशेषज्ञ एआई अंतर्दृष्टि के माध्यम से भारतीय कृषि में क्रांति लाने के लिए पारंपरिक ज्ञान को कृत्रिम बुद्धिमत्ता से जोड़ना।'
      : 'Bridging traditional wisdom with Artificial Intelligence to revolutionize Indian agriculture through real-time scanning and expert AI insights.',
    getStarted: activeLang === 'te' ? 'ప్రారంభించండి' : activeLang === 'hi' ? 'शुरू करें' : 'Get Started',
    goDashboard: activeLang === 'te' ? 'డాష్‌బోర్డ్‌కి వెళ్ళండి' : activeLang === 'hi' ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard',
    liveEfficiency: activeLang === 'te' ? 'నిజ-సమయ సామర్థ్యం' : activeLang === 'hi' ? 'लाइव दक्षता' : 'Live Efficiency',
    
    quickSteps: activeLang === 'te' ? 'త్వరిత దశలు' : activeLang === 'hi' ? 'त्वरित कदम' : 'Quick Steps',
    step1Title: activeLang === 'te' ? '1. క్యాప్చర్' : activeLang === 'hi' ? '1. कैप्चर' : '1. Capture',
    step1Desc: activeLang === 'te'
      ? 'పంట చిత్రాన్ని తీయండి. మా నిపుణులైన దృష్టి వ్యవస్థ వెంటనే వివరాలను సేకరిస్తుంది.'
      : activeLang === 'hi'
      ? 'बस किसी भी फसल की फोटो लें। हमारा विज़न सिस्टम तुरंत विवरण कैप्चर करता है।'
      : 'Simply point your camera at any crop. Our high-fidelity vision system captures visual signatures instantly.',
    
    step2Title: activeLang === 'te' ? '2. ఏఐ విశ్లేషణ' : activeLang === 'hi' ? '2. एआई विश्लेषण' : '2. AI Analysis',
    step2Desc: activeLang === 'te'
      ? 'తెగుళ్లు లేదా లోపాలను ఖచ్చితంగా గుర్తించడానికి న్యూరల్ నెట్‌వర్క్‌లు వేలాది డేటా పాయింట్‌లను విశ్లేషిస్తాయి.'
      : activeLang === 'hi'
      ? 'सटीकता के साथ रोगों या कमियों की पहचान करने के लिए न्यूरल नेटवर्क हजारों डेटा बिंदुओं को संसाधित करते हैं।'
      : 'Neural networks process thousands of data points to identify diseases or deficiencies with precision.',
    
    step3Title: activeLang === 'te' ? '3. ఏఐ సలహా' : activeLang === 'hi' ? '3. एआई सलाह' : '3. AI Advice',
    step3Desc: activeLang === 'te'
      ? 'మీ స్థానిక పొలం పరిస్థితులకు తగినట్లుగా రూపొందించిన నిజ-సమయ ఏఐ వ్యవసాయ సలహాలను పొందండి.'
      : activeLang === 'hi'
      ? 'विशेष रूप से आपके खेत की स्थानीय परिस्थितियों के अनुरूप वास्तविक समय एआई कृषि सलाह प्राप्त करें।'
      : 'Receive instant, AI-powered agricultural recommendations tailored specifically to your localized field conditions.',
    primaryTool: activeLang === 'te' ? 'ప్రధాన సాధనం' : activeLang === 'hi' ? 'मुख्य उपकरण' : 'Primary Tool',
    
    ourMission: activeLang === 'te' ? 'మా లక్ష్యం' : activeLang === 'hi' ? 'हमara मिशन' : 'Our Mission',
    missionTitle: activeLang === 'te'
      ? 'కృత్రిమ మేధస్సు ద్వారా భారతీయ రైతులను బలోపేతం చేయడం'
      : activeLang === 'hi'
      ? 'कृत्रिम बुद्धिमत्ता के माध्यम से भारतीय किसानों को सशक्त बनाना'
      : 'Empowering Indian Farmers Through Artificial Intelligence',
    missionQuote: activeLang === 'te'
      ? '"వ్యవసాయం మన దేశానికి వెన్నెముక. ఆ వెన్నెముకకు భవిష్యత్ సాంకేతిక పరిజ్ఞానాన్ని అందించడమే మా ధ్యేయం."'
      : activeLang === 'hi'
      ? '"कृषि हमारे देश की रीढ़ है। हम यहाँ उस रीढ़ को भविष्य की तकनीक की ताकत देने के लिए हैं।"'
      : '"Agriculture is the backbone of our nation. We are here to give that backbone the strength of future-proof technology."',
    missionDesc: activeLang === 'te'
      ? 'రైతులు తమ ఆలోచనలను పంచుకునేందుకు, ఏఐ నుండి మార్గదర్శకత్వాన్ని పొందేందుకు మరియు మొత్తం సంఘం వృద్ధి చెందడానికి సహాయపడే వేదిక.'
      : activeLang === 'hi'
      ? 'एक मंच जहां किसान विचार साझा करते हैं, मार्गदर्शन के लिए एआई से परामर्श करते हैं, और पूरे समुदाय को बढ़ने में मदद करने के लिए अपने परिणाम साझा करते हैं।'
      : 'A platform where farmers share ideas, consult AI for guidance, and document their real-world results—pros and cons—to help the entire community grow.',
    
    coreEcosystem: activeLang === 'te' ? 'ప్రధాన పర్యావరణ వ్యవస్థ' : activeLang === 'hi' ? 'मुख्य पारिस्थितिकी तंत्र' : 'Core Ecosystem',
    ecosystemDesc: activeLang === 'te'
      ? 'ఆధునిక వ్యవసాయం కోసం రూపొందించబడిన అధునాతన ఏఐ సాధనాలు.'
      : activeLang === 'hi'
      ? 'आधुनिक कृषि के लिए डिज़ाइन किए गए परिष्कृत उपकरण।'
      : 'Sophisticated tools designed for the modern agrarian, powered by advanced atmospheric and biological modeling.',
    
    scannerDesc: activeLang === 'te'
      ? 'తెగుళ్లు మరియు వ్యాధులను గుర్తించడానికి ఆకు స్థాయి నిర్ధారణలను వెంటనే నిర్వహించండి.'
      : activeLang === 'hi'
      ? 'रोगजनकों और बीमारियों का पता लगाने के लिए तत्काल पत्ती-स्तरीय निदान चलाएं।'
      : 'Run immediate, cellular-level leaf diagnostics to detect pathogens and diseases with complete remedies.',
    pestsDesc: activeLang === 'te'
      ? 'జిల్లా వ్యాప్తంగా తెగుళ్ల వ్యాప్తిని మరియు వలసలను గుర్తించే ప్రారంభ గుర్తింపు వ్యవస్థలు.'
      : activeLang === 'hi'
      ? 'प्रारंभिक पहचान प्रणाली जो वास्तविक समय अपडेट का उपयोग करके कीट प्रवासन और प्रकोप का मानचित्रण करती है।'
      : 'Early detection systems that map pest migration patterns and district outbreaks using real-time agent updates.',
    marketDesc: activeLang === 'te'
      ? 'నిజ-సమయ మండి ధరలు మరియు విశ్లేషణలు మీ పంటను విక్రయించడానికి సరైన సమయం మరియు స్థానాన్ని నిర్ణయించడంలో సహాయపడతాయి.'
      : activeLang === 'hi'
      ? 'लाइव मंडी कीमतें और विश्लेषण जो आपको अपनी उपज बेचने के लिए सही समय और स्थान चुनने में मदद करते।'
      : 'Live Mandi prices and analytics helping you choose the perfect time and place to sell your yield.',
    agentDesc: activeLang === 'te'
      ? 'స్వయంప్రతిపత్త వ్యవసాయ శాస్త్రవేత్తల నవీకరణలను అనుకరించండి. డేటాబేస్ పుష్లను ప్రేరేపించడానికి ప్రాంప్ట్‌లను ఇన్‌పుట్ చేయండి.'
      : activeLang === 'hi'
      ? 'स्वायत्त कृषि वैज्ञानिक अपडेट का अनुकरण करें। डेटाबेस पुश को ट्रिगर करने के लिए इनपुट प्रॉम्प्ट।'
      : 'Simulate autonomous agronomist updates. Input prompts to trigger structured JSON database pushes.',
    
    expandingHorizons: activeLang === 'te' ? 'పరిధులను విస్తరిస్తున్నాము' : activeLang === 'hi' ? 'क्षितिज का विस्तार' : 'Expanding Horizons',
    nowLiveAP: activeLang === 'te' ? 'ఇప్పుడు ఆంధ్రప్రదేశ్‌లో అందుబాటులో ఉంది' : activeLang === 'hi' ? 'अब आंध्र प्रदेश में लाइव है' : 'Now Live in Andhra Pradesh',
    liveAPDesc: activeLang === 'te'
      ? 'తెలుగు నేల యొక్క ప్రత్యేక నేల రసాయన శాస్త్రం, ప్రాంతీయ భాషలు మరియు వాతావరణ సరళిని అర్థం చేసుకోవడానికి మా ఏఐ ఇంజిన్‌లను సిద్ధం చేసాము.'
      : activeLang === 'hi'
      ? 'हमने अपने एआई इंजनों को तेलुगु क्षेत्र के अनूठे मिट्टी रसायन विज्ञान, क्षेत्रीय भाषाओं और मौसम के मिजाज को समझने के लिए तैयार किया है।'
      : "We've tailored our AI engines to understand the unique soil chemistry, regional languages, and weather patterns of the Telugu heartland.",
    joinUsNow: activeLang === 'te' ? 'ఇప్పుడే చేరండి' : activeLang === 'hi' ? 'अभी शामिल हों' : 'Join Us Now',
    openDashboard: activeLang === 'te' ? 'డాష్‌బోర్డ్ తెరవండి' : activeLang === 'hi' ? 'डैशबोर्ड खोलें' : 'Open Dashboard',
    
    privacy: activeLang === 'te' ? 'గోప్యతా విధానం' : activeLang === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy',
    terms: activeLang === 'te' ? 'సేవా నిబంధనలు' : activeLang === 'hi' ? 'सेवा की शर्तें' : 'Terms of Service',
    contact: activeLang === 'te' ? 'మద్దతు సంప్రదించండి' : activeLang === 'hi' ? 'समर्थन से संपर्क करें' : 'Contact Support',
    footerDesc: activeLang === 'te' ? '© 2026 అగ్రి-కనెక్ట్. వ్యవసాయంలో కృత్రిమ మేధస్సు.' : activeLang === 'hi' ? '© 2026 एग्री-कनेक्ट। कृषि में कृत्रिम बुद्धिमत्ता।' : '© 2026 AgriConnect. Artificial Intelligence in Agriculture.'
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AgriConnect Logo" className="h-14 object-contain" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <a href="#home" className="text-primary border-b-2 border-primary pb-1">{strings.home}</a>
            <a href="#tutorial" className="text-on-surface-variant hover:text-primary transition-colors">{strings.tutorial}</a>
            <a href="#vision" className="text-on-surface-variant hover:text-primary transition-colors">{strings.vision}</a>
            <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors">{strings.features}</a>
            <a href="#states" className="text-on-surface-variant hover:text-primary transition-colors">{strings.states}</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Neat language selector in Nav */}
            <div className="relative inline-block text-left">
              <select
                value={activeLang}
                onChange={(e) => handleLangChange(e.target.value)}
                className="bg-white/80 border border-outline-variant/60 rounded-xl py-1.5 px-3 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>

            <Link 
              href={isLoggedIn ? "/dashboard" : "/login"} 
              className="magnetic-btn bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm"
            >
              {isLoggedIn ? t.dashboard : strings.signIn}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Interactive Background Canvas */}
        <ParticleCanvas />
        
        {/* Decorative Blur Layers */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[15%] right-[5%] w-96 h-96 bg-tertiary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center z-10 w-full">
          <div className="scroll-reveal visible">
            <h1 className="text-4xl md:text-7xl font-display font-black text-on-surface leading-[1.1] tracking-tighter mb-8">
              {strings.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed font-medium">
              {strings.heroDesc}
            </p>
            <div className="flex flex-wrap gap-5">
              <Link 
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="magnetic-btn bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
              >
                {isLoggedIn ? strings.goDashboard : strings.getStarted}
              </Link>
            </div>
          </div>

          {/* Sprout Visualization */}
          <div className="relative scroll-reveal flex justify-center visible" style={{ transitionDelay: '0.2s' }}>
            <div className="animate-sprout relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110" />
              <div className="glass-panel-elevated p-6 rounded-[3rem] relative z-10">
                <img 
                  alt="Agricultural AI Visualization" 
                  className="w-[500px] h-[550px] object-cover rounded-[2.5rem] shadow-2xl" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxpm-USTdH8mK01ZxJvtfcv9WIPBUwRbkmP73xSi8NTcDll8QUXH121dlf0-axYMYePcfMGEKVrz-pM7qUoylJSdoxjElh618cK0KrU5PxPz3X7UkJ0HuQWUltY93cT0G_FJvTNNq73VPaqEZt7TbK7m5Ty0eblO1IMViuxlvJRk5BCpzB-K9TQlMcE8v-1NjjziQ61xAyE2G1_HW-WYkzmGzRjynR8H1FG6Vn14BOgdUkCX-TouWHNMhNGuZCaVwPf2W8TfFXGCJw"
                />
                
                {/* Floating Metric Card */}
                <div className="absolute -bottom-8 -left-8 glass-panel-elevated p-8 rounded-3xl shadow-2xl border-l-4 border-l-primary">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">analytics</span>
                    </div>
                    <div>
                      <p className="text-[11px] text-primary font-black uppercase tracking-widest font-label mb-1">
                        {strings.liveEfficiency}
                      </p>
                      <p className="text-3xl font-black text-on-surface">98.4%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tutorial Section (Quick Steps) */}
      <section id="tutorial" className="py-32 relative bg-white/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-display font-black text-on-surface mb-6">{strings.quickSteps}</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="glass-panel-elevated p-10 rounded-[2.5rem] scroll-reveal hover:translate-y-[-12px] hover:border-primary/40 transition-all duration-500 group">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary">
                <span className="material-symbols-outlined text-4xl">photo_camera</span>
              </div>
              <h3 className="text-2xl font-black mb-4">{strings.step1Title}</h3>
              <p className="text-on-surface-variant text-base leading-relaxed font-medium">
                {strings.step1Desc}
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="glass-panel-elevated p-10 rounded-[2.5rem] scroll-reveal hover:translate-y-[-12px] hover:border-primary/40 transition-all duration-500 group">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary">
                <span className="material-symbols-outlined text-4xl">document_scanner</span>
              </div>
              <h3 className="text-2xl font-black mb-4">{strings.step2Title}</h3>
              <p className="text-on-surface-variant text-base leading-relaxed font-medium">
                {strings.step2Desc}
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="glass-panel-elevated p-10 rounded-[2.5rem] scroll-reveal hover:translate-y-[-12px] hover:border-primary/40 transition-all duration-500 group border-primary">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary">
                <span className="material-symbols-outlined text-4xl">psychology</span>
              </div>
              <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                {strings.primaryTool}
              </span>
              <h3 className="text-2xl font-black mb-4">{strings.step3Title}</h3>
              <p className="text-on-surface-variant text-base leading-relaxed font-medium">
                {strings.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-40 bg-surface-container-lowest/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="scroll-reveal">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-[3rem]" />
                <img 
                  alt="Indian Farming Vision" 
                  className="relative rounded-[3rem] shadow-2xl border-8 border-white/80 w-full" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqZnz-DHGfYbgsRhgU4izBz2lqidZt4HLu5s9HRvPRHhnT8JcjzUbjMFgsunvvXs_cUypZ_9d4ArTUCJDA76zQ5O706PD8DTHVpYmqhgXSEvVdoTCt3luzxIT0F5OA4yU4i3IRq9xUrpHuLFTpyY-02U6pdMAHX5kRCoCJ5M-plJJdsqOiGpPEr6izzNGJ5bdXACP1DyqaUzf_Y38WNDj60FnjzLM5VdEvQDF8pfvX4C4Urty0VPbadlqbqZTO8EJW2GLIik_SKo22"
                />
              </div>
            </div>
            
            <div className="scroll-reveal">
              <h4 className="text-primary font-black tracking-[0.25em] uppercase mb-6 text-sm font-label">{strings.ourMission}</h4>
              <h2 className="text-3xl md:text-5xl font-display font-black text-on-surface mb-10 leading-[1.1]">
                {strings.missionTitle}
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8 italic font-serif font-medium opacity-90 border-l-4 border-primary/20 pl-6">
                {strings.missionQuote}
              </p>
              <p className="text-base text-on-surface-variant leading-relaxed mb-12 font-medium">
                {strings.missionDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-display font-black text-on-surface mb-6">{strings.coreEcosystem}</h2>
            <p className="text-on-surface-variant text-base max-w-2xl mx-auto font-medium">
              {strings.ecosystemDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Crop Health Scanner */}
            <Link href="/scanner" className="glass-panel-elevated p-8 rounded-[2.5rem] hover:bg-primary/5 hover:translate-y-[-8px] transition-all duration-500 group scroll-reveal block">
              <div className="flex justify-between items-start mb-12">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">center_focus_strong</span>
                </div>
                <span className="text-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-primary/10 rounded-full font-label">Active</span>
              </div>
              <h3 className="text-xl font-black mb-4">{t.scanner}</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                {strings.scannerDesc}
              </p>
            </Link>

            {/* Pest Tracker */}
            <Link href="/pests" className="glass-panel-elevated p-8 rounded-[2.5rem] hover:bg-primary/5 hover:translate-y-[-8px] transition-all duration-500 group scroll-reveal block">
              <div className="flex justify-between items-start mb-12">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">bug_report</span>
                </div>
                <span className="text-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-primary/10 rounded-full font-label">Live</span>
              </div>
              <h3 className="text-xl font-black mb-4">{t.pests}</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                {strings.pestsDesc}
              </p>
            </Link>

            {/* Market Data */}
            <Link href="/market" className="glass-panel-elevated p-8 rounded-[2.5rem] hover:bg-primary/5 hover:translate-y-[-8px] transition-all duration-500 group scroll-reveal block">
              <div className="flex justify-between items-start mb-12">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">trending_up</span>
                </div>
                <span className="text-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-primary/10 rounded-full font-label">Fin-AI</span>
              </div>
              <h3 className="text-xl font-black mb-4">{t.market}</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                {strings.marketDesc}
              </p>
            </Link>

            {/* FarmBot AI Console */}
            <Link href="/admin" className="glass-panel-elevated p-8 rounded-[2.5rem] hover:bg-primary/5 hover:translate-y-[-8px] transition-all duration-500 group scroll-reveal block">
              <div className="flex justify-between items-start mb-12">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">smart_toy</span>
                </div>
                <span className="text-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-primary/10 rounded-full font-label">Agentic</span>
              </div>
              <h3 className="text-xl font-black mb-4">{t.agentConsole}</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                {strings.agentDesc}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* States Live Section */}
      <section id="states" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10 -skew-y-3 transform origin-right" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-panel-elevated p-12 md:p-24 rounded-[5rem] text-center shadow-2xl shadow-primary/10 border-2 border-white/50 scroll-reveal">
            <div className="inline-block px-6 py-2 bg-primary text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-10 font-label shadow-lg shadow-primary/20">
              {strings.expandingHorizons}
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-10 text-on-surface leading-[1.1]">
              {strings.nowLiveAP}
            </h2>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
              {strings.liveAPDesc}
            </p>
            <div className="mt-10">
              <Link 
                href={isLoggedIn ? "/dashboard" : "/login"} 
                className="magnetic-btn bg-primary text-white px-16 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 hover:-translate-y-2 transition-all active:scale-95"
              >
                {isLoggedIn ? strings.openDashboard : strings.joinUsNow}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full border-t border-primary/10 font-body text-on-surface-variant py-12">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-12 md:space-y-0">
          <div className="flex flex-col md:items-start items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="AgriConnect Logo" className="h-10 object-contain" />
              <span className="text-2xl font-display font-black text-primary">AgriConnect</span>
            </div>
            <p className="text-sm font-medium opacity-70">{strings.footerDesc}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-12 font-bold text-sm">
            <a href="#" className="hover:text-primary transition-colors">{strings.privacy}</a>
            <a href="#" className="hover:text-primary transition-colors">{strings.terms}</a>
            <a href="#" className="hover:text-primary transition-colors">{strings.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
