'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Admin() {
  // FarmBot chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const getPlaceholder = () => {
    let userLanguage = 'en';
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_profile');
      if (session) {
        try {
          const profile = JSON.parse(session);
          userLanguage = profile.language || 'en';
        } catch (e) {}
      }
    }

    if (isListening) {
      if (userLanguage === 'te') return 'వినబడుతోంది, మాట్లాడండి...';
      if (userLanguage === 'hi') return 'सुन रहा हूँ, कृपया बोलें...';
      return 'Listening to your voice...';
    } else {
      if (userLanguage === 'te') return 'పురుగుమందులు, తెగుళ్లు, ధరల గురించి అడగండి...';
      if (userLanguage === 'hi') return 'कीटनाशकों, कीटों, मंडी दरों के बारे में पूछें...';
      return 'Ask FarmBot about pesticides, biological controls, pricing...';
    }
  };

  // Dynamic speech input handler with fresh configurations on demand
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      let langCode = 'en-IN';
      const session = localStorage.getItem('user_profile');
      if (session) {
        try {
          const profile = JSON.parse(session);
          if (profile.language === 'te') {
            langCode = 'te-IN'; // Telugu (India)
          } else if (profile.language === 'hi') {
            langCode = 'hi-IN'; // Hindi (India)
          }
        } catch (e) {
          console.warn('Failed to parse user language settings for speech recognition:', e);
        }
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = langCode;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => prev ? prev + ' ' + transcript : transcript);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      console.log(`Starting speech recognition with language setting: ${langCode}`);
      rec.start();
    }
  };

  // Load user session ID on mount
  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.email) {
          const userSessionKey = `farmbot_${parsed.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          setSessionId(userSessionKey);
        }
      } catch (err) {
        console.error('Failed to parse user profile for session ID:', err);
        setSessionId('farmbot_anonymous_session');
      }
    } else {
      // Generate a random session ID for anonymous users and save it in sessionStorage
      let anonSession = sessionStorage.getItem('farmbot_anon_session');
      if (!anonSession) {
        anonSession = `farmbot_anon_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('farmbot_anon_session', anonSession);
      }
      setSessionId(anonSession);
    }
  }, []);

  // Load chat messages when sessionId is available
  useEffect(() => {
    const loadChat = async () => {
      if (!sessionId) return;
      try {
        const response = await fetch(`/api/messages?session_id=${sessionId}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setChatMessages(data);
        }
      } catch (err) {
        console.error('Could not load chat messages:', err);
      }
    };

    loadChat();
  }, [sessionId]);

  useEffect(() => {
    // Scroll to bottom
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, isSendingMessage]);

  // Send message to FarmBot
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');
    setIsSendingMessage(true);

    // Optimistically add user message
    setChatMessages((prev) => [...prev, { role: 'user', content: userText, created_at: new Date().toISOString() }]);

    // Get user district and language from localStorage
    let userDistrict = 'Guntur';
    let userLanguage = 'en';
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_profile');
      if (session) {
        try {
          const profile = JSON.parse(session);
          if (profile.district) {
            userDistrict = profile.district.replace(/\s*\(.*\)\s*/g, '').trim();
          }
          if (profile.language) {
            userLanguage = profile.language;
          }
        } catch (err) {
          console.error('Failed to parse user profile:', err);
        }
      }
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content: userText,
          district: userDistrict,
          language: userLanguage
        })
      });

      const data = await response.json();
      if (data.success) {
        // Append assistant reply from database
        setChatMessages((prev) => [...prev, data.assistantMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
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
            <span className="font-headline text-lg font-bold text-primary">Intelligence &amp; Operations Center</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <span className="text-xs text-on-surface-variant font-semibold">AI Console</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="font-display text-4xl font-black text-primary tracking-tight">AI Assistant Portal</h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              Interact with the database-backed FarmBot AI to diagnose issues, review treatments, and check weather or spot prices.
            </p>
          </div>

          <div className="max-w-3xl mx-auto w-full">
            <ErrorBoundary>
              <section className="glass-card rounded-[3rem] p-6 sm:p-8 border border-outline-variant shadow-sm flex flex-col h-[600px] bg-white">
                
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 shrink-0">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        smart_toy
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-primary leading-tight text-base">FarmBot AI</h4>
                      <p className="text-[10px] font-black tracking-widest text-secondary uppercase font-label">
                        Dynamic Agricultural Advisor
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase">AI Live</span>
                  </div>
                </div>

                {/* Chat Messages Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar my-4 pr-2 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-75">
                      <span className="material-symbols-outlined text-outline-variant text-4xl mb-2">forum</span>
                      <p className="text-xs font-bold text-on-surface-variant">Ask FarmBot anything about farming</p>
                      <p className="text-[10px] text-on-surface-variant/80 mt-1 max-w-[280px] leading-relaxed">
                        I can assist with pests, crop diseases, fertilizer recommendations, Mandi market pricing, or local forecasts.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div 
                        key={msg.id || idx}
                        className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-white ml-auto rounded-tr-none shadow-sm shadow-primary/15'
                            : 'bg-surface-container-low text-on-surface border border-outline-variant/40 rounded-tl-none font-medium'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                        <span className={`text-[8px] block mt-1.5 opacity-60 text-right ${
                          msg.role === 'user' ? 'text-white' : 'text-on-surface-variant'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                  {isSendingMessage && (
                    <div className="bg-surface-container-low text-on-surface border border-outline-variant/40 rounded-2xl rounded-tl-none p-4 max-w-[85%] text-xs font-bold font-label italic animate-pulse">
                      FarmBot is formulating recommendations...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendMessage} className="relative mt-auto">
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      className="w-full bg-surface-container-low border border-outline-variant/80 rounded-2xl py-4 pl-4 pr-28 text-sm placeholder:text-outline/80 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      placeholder={getPlaceholder()}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={isSendingMessage}
                      required
                    />
                    
                    {/* Voice-to-Text Button */}
                    <button 
                      type="button"
                      onClick={toggleListening}
                      className={`absolute right-14 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isListening 
                          ? 'bg-error text-white animate-pulse' 
                          : 'bg-surface-container hover:bg-surface-container-high text-outline hover:text-primary'
                      }`}
                      title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isListening ? 'mic_off' : 'mic'}
                      </span>
                    </button>

                    {/* Send Button */}
                    <button 
                      type="submit"
                      disabled={isSendingMessage || !inputMessage.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  </div>
                </form>

              </section>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
