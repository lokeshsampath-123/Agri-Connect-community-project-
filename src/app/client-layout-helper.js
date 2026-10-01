'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

export default function ClientLayoutHelper() {
  const pathname = usePathname();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ringRef = useRef(null);

  // Accessibility Speech Synthesis Controller State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [headerPortalNode, setHeaderPortalNode] = useState(null);
  const [activeAudioNodes, setActiveAudioNodes] = useState([]);

  // Pre-load voices list when window loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Monitor header node dynamic additions to render portal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname === '/') {
      setHeaderPortalNode(null);
      return;
    }

    const findAndSetupHeader = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) {
        let target = headerEl.querySelector('#header-tts-portal-target');
        if (!target) {
          target = document.createElement('div');
          target.id = 'header-tts-portal-target';
          target.className = 'flex items-center gap-3 shrink-0 ml-auto notranslate';
          target.setAttribute('translate', 'no');
          headerEl.appendChild(target);
        }
        setHeaderPortalNode(target);
      } else {
        setHeaderPortalNode(null);
      }
    };

    findAndSetupHeader();

    const observer = new MutationObserver(findAndSetupHeader);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      activeAudioNodes.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {
          console.warn("Error pausing audio node:", e);
        }
      });
      setActiveAudioNodes([]);
      setIsSpeaking(false);
    }
  };

  // Helper to play raw text chunks via Google TTS / Web Speech API
  const playTextChunks = (rawTextToRead, langOverride) => {
    stopSpeaking();
    if (!rawTextToRead) return;

    // Clean text for voice synthesis so emojis and markdown symbols are NOT spoken aloud!
    const textToRead = rawTextToRead
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!textToRead) return;

    let langCode = langOverride || localStorage.getItem('agri_lang') || 'en';
    if (/[\u0C00-\u0C7F]/.test(textToRead)) langCode = 'te';
    else if (/[\u0900-\u097F]/.test(textToRead)) langCode = 'hi';

    // Split text by punctuation into chunks under 170 chars
    const sentences = textToRead.match(/[^.!?\n]+[.!?\n]*/g) || [textToRead];
    const chunks = [];
    let currentChunk = "";

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return;
      
      if ((currentChunk + " " + trimmedSentence).length < 170) {
        currentChunk = currentChunk ? (currentChunk + " " + trimmedSentence) : trimmedSentence;
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmedSentence;
      }
    });
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    if (chunks.length === 0) return;

    setIsSpeaking(true);
    let currentIdx = 0;
    const audios = [];

    const playNextChunk = () => {
      if (currentIdx >= chunks.length) {
        setIsSpeaking(false);
        setActiveAudioNodes([]);
        return;
      }

      const chunkText = chunks[currentIdx];
      const audioUrl = `/api/tts?text=${encodeURIComponent(chunkText)}&lang=${langCode}`;
      const audio = new Audio(audioUrl);
      
      audios.push(audio);
      setActiveAudioNodes([...audios]);

      audio.onended = () => {
        currentIdx++;
        playNextChunk();
      };

      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        
        const fallbackUtterance = new SpeechSynthesisUtterance(chunkText);
        const synthLang = langCode === 'te' ? 'te-IN' : langCode === 'hi' ? 'hi-IN' : 'en-IN';
        fallbackUtterance.lang = synthLang;
        
        const voices = window.speechSynthesis.getVoices();
        const getFallbackVoice = (lang) => {
          const matchLang = lang.split('-')[0];
          if (matchLang === 'te') {
            return voices.find(v => v.lang.startsWith('te')) || voices.find(v => v.lang.startsWith('te'));
          }
          if (matchLang === 'hi') {
            return voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang.startsWith('hi'));
          }
          return voices.find(v => v.lang.startsWith(matchLang));
        };

        const voice = getFallbackVoice(synthLang);
        if (voice) {
          fallbackUtterance.voice = voice;
        }

        fallbackUtterance.rate = 0.95;
        fallbackUtterance.pitch = 1.0;
        
        fallbackUtterance.onend = () => {
          currentIdx++;
          playNextChunk();
        };
        fallbackUtterance.onerror = () => {
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(fallbackUtterance);
      };

      audio.onerror = triggerFallback;
      audio.play().catch(err => {
        console.warn("Audio play error, triggering local fallback:", err);
        triggerFallback();
      });
    };

    playNextChunk();
  };

  // MODE 1: Speak Highlighted Text Selection
  const speakSelection = () => {
    if (typeof window === 'undefined') return;
    const text = window.getSelection().toString().trim();
    if (!text) {
      const activeLang = localStorage.getItem('agri_lang') || 'en';
      const SELECT_TEXT_MESSAGES = {
        en: "Please select or highlight text to read aloud.",
        te: "దయచేసి బిగ్గరగా చదవడానికి కొంత వచనాన్ని ఎంచుకోండి.",
        hi: "कृपया ज़ोर से पढ़ने के लिए कुछ पाठ चुनें।"
      };
      const warning = SELECT_TEXT_MESSAGES[activeLang] || SELECT_TEXT_MESSAGES['en'];
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
      playTextChunks(warning, activeLang);
    } else {
      playTextChunks(text);
    }
  };

  // MODE 2: Read Full Page Aloud (Excludes Sidebar, Icons, Buttons, and Header Navigation)
  const readFullPageAloud = () => {
    if (typeof window === 'undefined') return;
    
    // 1. Locate main content area
    const mainEl = document.querySelector('main') || document.querySelector('#main-content') || document.body;
    
    // 2. Collect readable text elements while skipping sidebars & icons
    const textBlocks = [];
    const elementsToRead = mainEl.querySelectorAll('h1, h2, h3, h4, h5, p, li, span, div');

    const iconNamesRegex = /\b(eco|science|bar_chart|location_on|refresh|volume_up|volume_off|menu|trending_up|shopping_bag|open_in_new|check_circle|warning|smart_toy|bolt|biotech|arrow_forward|search)\b/gi;

    elementsToRead.forEach(el => {
      // Exclude elements inside sidebar, nav, header controls, or buttons
      if (
        el.closest('aside') || 
        el.closest('.sidebar') || 
        el.closest('header') || 
        el.closest('button') || 
        el.closest('nav') ||
        el.classList.contains('material-symbols-outlined') ||
        el.classList.contains('notranslate')
      ) {
        return;
      }

      // Check if node has direct text child to avoid duplicates
      const directText = Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join(' ');

      if (directText && directText.length > 2) {
        // Clean out material symbol icon keywords
        const cleanedText = directText.replace(iconNamesRegex, '').trim();
        if (cleanedText && !textBlocks.includes(cleanedText)) {
          textBlocks.push(cleanedText);
        }
      }
    });

    const fullPageText = textBlocks.join('. ');
    if (fullPageText) {
      playTextChunks(fullPageText);
    } else {
      speakSelection();
    }
  };

  const handleAudioTrigger = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      if (typeof window !== 'undefined') {
        const selectedText = window.getSelection() ? window.getSelection().toString().trim() : '';
        if (selectedText) {
          playTextChunks(selectedText);
        } else {
          const activeLang = localStorage.getItem('agri_lang') || 'en';
          const PROMPT_MESSAGES = {
            en: "Please highlight or select the text you want me to read.",
            te: "దయచేసి బిగ్గరగా చదవడానికి స్క్రీన్‌పై ఉన్న వచనాన్ని సెలెక్ట్ చేయండి.",
            hi: "कृपया ज़ोर से पढ़ने के लिए स्क्रीन पर पाठ चुनें।"
          };
          const promptText = PROMPT_MESSAGES[activeLang] || PROMPT_MESSAGES['en'];
          setShowTooltip(true);
          setTimeout(() => setShowTooltip(false), 4000);
          playTextChunks(promptText, activeLang);
        }
      }
    }
  };

  // Fix Material Symbols translation glitches globally, and sync HTML lang attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHtmlLang = () => {
        const activeLang = localStorage.getItem('agri_lang') || 'en';
        document.documentElement.setAttribute('lang', activeLang);
      };
      updateHtmlLang();

      const secureIcons = () => {
        document.querySelectorAll('.material-symbols-outlined').forEach(el => {
          if (!el.classList.contains('notranslate')) {
            el.classList.add('notranslate');
            el.setAttribute('translate', 'no');
          }
        });
      };
      secureIcons();

      const observer = new MutationObserver(secureIcons);
      observer.observe(document.body, { childList: true, subtree: true });

      window.addEventListener('language-change', updateHtmlLang);

      return () => {
        observer.disconnect();
        window.removeEventListener('language-change', updateHtmlLang);
      };
    }
  }, [pathname]);

  // Background Google Translate elements injector
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.googleTranslateElementInit) {
        window.googleTranslateElementInit = function() {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,te,hi',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google_translate_element');
        };

        const style = document.createElement('style');
        style.innerHTML = `
          .skiptranslate, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame {
            display: none !important;
            visibility: hidden !important;
          }
          body { top: 0 !important; }
          .goog-tooltip { display: none !important; }
          .goog-tooltip:hover { display: none !important; }
          .goog-text-highlight {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
        `;
        document.head.appendChild(style);
      }

      const activeLang = localStorage.getItem('agri_lang') || 'en';
      if (activeLang === 'en') {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      } else {
        let googtransVal = '';
        if (activeLang === 'te') googtransVal = '/en/te';
        else if (activeLang === 'hi') googtransVal = '/en/hi';

        document.cookie = `googtrans=${googtransVal}; path=/;`;
        document.cookie = `googtrans=${googtransVal}; path=/; domain=${window.location.hostname};`;

        if (!document.getElementById('google-translate-script')) {
          const script = document.createElement('script');
          script.id = 'google-translate-script';
          script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          script.async = true;
          document.body.appendChild(script);
        }

        if (!document.getElementById('google_translate_element')) {
          const translateDiv = document.createElement('div');
          translateDiv.id = 'google_translate_element';
          translateDiv.style.display = 'none';
          document.body.appendChild(translateDiv);
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleScrollReveal = () => {
      const observerOptions = { threshold: 0.05, rootMargin: '0px 0px -50px 0px' };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      }, observerOptions);

      document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
      return observer;
    };

    const observer = handleScrollReveal();

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      if (ringRef.current) {
        ringRef.current.style.left = `${e.clientX}px`;
        ringRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isClickable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' || 
        target.closest('a') || 
        target.closest('button') || 
        target.classList.contains('hoverable');

      setIsHovered(!!isClickable);
    };

    const handleMouseLeaveWindow = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
    };
  }, [pathname, isVisible]);

  return (
    <>
      {/* Header-injected Accessibility Speech Assistant via React Portal */}
      {headerPortalNode && createPortal(
        <div className="relative flex items-center gap-2 mr-2 notranslate" translate="no">
          {/* Tooltip Warning Balloon */}
          {showTooltip && (
            <div className="absolute right-0 top-12 bg-primary text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-lg border border-primary-container/20 w-60 z-50 text-center animate-bounce">
              <div className="absolute -top-1 right-4 w-2.5 h-2.5 bg-primary rotate-45" />
              {localStorage.getItem('agri_lang') === 'te' 
                ? "దయచేసి చదవడానికి కొంత వచనాన్ని సెలెక్ట్ చేయండి" 
                : localStorage.getItem('agri_lang') === 'hi'
                ? "कृपया पढ़ने के लिए कुछ पाठ चुनें"
                : "Please highlight/select text to read"}
            </div>
          )}

          {/* Single Speaker Icon Button (Icon Only) */}
          <button
            onClick={handleAudioTrigger}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
              isSpeaking 
                ? 'bg-primary text-white animate-pulse shadow-md border-primary/30 ring-2 ring-primary/20' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-primary border-emerald-200/60 hover:scale-105'
            }`}
            title={isSpeaking ? "Pause / Stop Audio" : "Read Selected Text Aloud"}
            aria-label="Read Aloud Speaker"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">
              {isSpeaking ? 'pause' : 'volume_up'}
            </span>
          </button>
        </div>,
        headerPortalNode
      )}

      {/* Custom Cursor elements */}
      {isVisible && (
        <>
          <div 
            className={`custom-cursor hidden md:block ${isHovered ? 'custom-cursor-hover' : ''}`}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
          />
          <div 
            ref={ringRef}
            className={`custom-cursor-ring hidden md:block ${isHovered ? 'custom-cursor-ring-hover' : ''}`}
          />
        </>
      )}
    </>
  );
}
