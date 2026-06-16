'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ClimatePage() {
  const [district, setDistrict] = useState('Guntur');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync with user profile on mount
  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      const prof = JSON.parse(session);
      if (prof.district) {
        const cleanedDist = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
        setDistrict(cleanedDist);
      }
    }
  }, []);

  // Fetch weather data when district changes
  useEffect(() => {
    let active = true;
    async function fetchWeather() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/climate?district=${encodeURIComponent(district)}`);
        if (!res.ok) throw new Error('Failed to fetch weather data');
        const data = await res.json();
        if (active) {
          setWeatherData(data);
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
        if (active) {
          setError(err.message || 'Unable to retrieve forecast.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchWeather();
    return () => { active = false; };
  }, [district]);

  // Helper to get weather icon based on description/condition
  const getWeatherIcon = (condition = '') => {
    const cond = condition.toLowerCase();
    if (cond.includes('sunny') || cond.includes('clear')) return 'wb_sunny';
    if (cond.includes('thunder') || cond.includes('storm')) return 'thunderstorm';
    if (cond.includes('heavy rain')) return 'rainy_heavy';
    if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) return 'rainy';
    if (cond.includes('cloudy') || cond.includes('overcast') || cond.includes('cloud')) return 'cloud';
    if (cond.includes('wind') || cond.includes('breeze') || cond.includes('gale')) return 'air';
    return 'filter_drama';
  };

  // Helper for alert colors
  const getSeverityStyles = (severity = 'moderate') => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-error/10 border-error/20 text-error';
      case 'high':
        return 'bg-amber-600/10 border-amber-600/20 text-amber-700';
      case 'moderate':
        return 'bg-warning/10 border-warning/20 text-warning-dark';
      default:
        return 'bg-primary/10 border-primary/20 text-primary';
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
            <span className="font-headline text-lg font-bold text-primary">Climate Advisory</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <div className="flex items-center text-on-surface gap-2 text-sm font-bold bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-lg">location_on</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer pr-1 text-sm font-headline"
              >
                {['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Visakhapatnam', 'Nellore', 'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'West Godavari', 'East Godavari', 'YSR Kadapa'].map(dist => (
                  <option key={dist} value={dist} className="bg-white text-on-surface">{dist} District</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Meteo Feed Live</span>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Skeletons Loading State */}
          {loading ? (
            <div className="space-y-8 animate-pulse">
              {/* Weather Banner Skeleton */}
              <div className="h-64 bg-surface-container rounded-3xl" />
              {/* Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  <div className="h-48 bg-surface-container rounded-3xl" />
                  <div className="h-64 bg-surface-container rounded-3xl" />
                </div>
                <div className="lg:col-span-4 h-96 bg-surface-container rounded-3xl" />
              </div>
            </div>
          ) : error ? (
            <div className="p-8 bg-error/10 border border-error/20 rounded-3xl text-center">
              <span className="material-symbols-outlined text-[48px] text-error mb-4">cloud_off</span>
              <h3 className="font-bold text-lg text-error mb-2">Failed to retrieve weather feed</h3>
              <p className="text-sm text-on-surface-variant mb-6">{error}</p>
              <button 
                onClick={() => setDistrict(district)} 
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:shadow-md transition-all"
              >
                Retry Fetching
              </button>
            </div>
          ) : (
            <>
              {/* Current Weather Banner */}
              <section className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-4 text-center md:text-left relative z-10">
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                    Current Meteorology
                  </span>
                  <h2 className="text-4xl font-black">{district} District</h2>
                  <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                    {weatherData.current.overview}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/5 text-xs font-semibold">
                      <span className="material-symbols-outlined text-sm">humidity_percentage</span>
                      <span>Humidity: {weatherData.current.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/5 text-xs font-semibold">
                      <span className="material-symbols-outlined text-sm">air</span>
                      <span>Wind: {weatherData.current.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>

                {/* Big Temp Display */}
                <div className="flex items-center gap-6 relative z-10 shrink-0 text-center md:text-right">
                  <span className="material-symbols-outlined text-[96px] text-success-bright animate-bounce-slow">
                    {getWeatherIcon(weatherData.current.condition)}
                  </span>
                  <div>
                    <div className="text-6xl sm:text-7xl font-black leading-none">{weatherData.current.temp}°C</div>
                    <div className="text-xs font-bold text-success-bright uppercase tracking-wider mt-1">
                      {weatherData.current.condition}
                    </div>
                  </div>
                </div>
              </section>

              {/* Bento Grid Content */}
              <div className="grid grid-cols-12 gap-8">
                
                {/* 5-Day Forecast Grid (8 Cols) */}
                <ErrorBoundary>
                  <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                    <div className="flex justify-between items-center flex-wrap gap-4 border-b border-outline-variant/30 pb-4">
                      <h3 className="font-display text-lg font-black text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                        5-Day Daily Outlook
                      </h3>
                      <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        Next 5 Days
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      {weatherData.forecast.map((fc, index) => (
                        <div key={index} className="bg-surface-container-lowest border border-outline-variant/60 p-4 rounded-2xl flex flex-col justify-between items-center text-center hover:shadow-md transition-all group">
                          <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">{fc.day}</span>
                          <span className="material-symbols-outlined text-[40px] text-primary my-3 group-hover:scale-110 transition-transform">
                            {getWeatherIcon(fc.condition)}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface-variant mb-2 line-clamp-1">{fc.condition}</span>
                          <div className="font-headline font-black text-sm text-primary">
                            {fc.tempHigh}° <span className="text-[10px] text-outline font-normal">/ {fc.tempLow}°</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-[9px] text-primary/70 font-bold mt-2">
                            <span className="material-symbols-outlined text-[10px] text-primary">umbrella</span>
                            <span>{fc.precip}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ErrorBoundary>

                {/* AI Agronomic Advisory Box (4 Cols) */}
                <ErrorBoundary>
                  <div className="col-span-12 lg:col-span-4 bg-primary text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-2 text-success-bright">
                        <span className="material-symbols-outlined text-[24px]">psychology</span>
                        <h3 className="font-display text-lg font-black">AI Agronomist advice</h3>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed font-medium pt-2">
                        {weatherData.advisory}
                      </p>
                    </div>

                    <div className="pt-6 relative z-10">
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/5 text-[10px] font-semibold flex items-center gap-3">
                        <span className="material-symbols-outlined text-success-bright text-lg">info</span>
                        <span>This advisory adapts in real-time as local weather forecasts adjust.</span>
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>

              </div>

              {/* Climate Warnings / Active Alerts */}
              <section className="bg-white border border-outline-variant p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <h3 className="font-display text-lg font-black text-primary">Agricultural Weather Warnings</h3>
                </div>

                {weatherData.alerts.length === 0 ? (
                  <div className="p-8 text-center bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                    <span className="text-xs font-bold">No active weather warnings for {district} at this time. Sowing parameters optimal.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {weatherData.alerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        className={`p-5 border rounded-2xl flex gap-4 items-start ${getSeverityStyles(alert.severity)}`}
                      >
                        <span className="material-symbols-outlined mt-0.5 select-none text-[22px]">
                          {alert.severity === 'critical' ? 'cancel' : alert.severity === 'high' ? 'error' : 'warning'}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm leading-none">{alert.title}</h4>
                            <span className="px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider bg-white/40">
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed opacity-90">{alert.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
