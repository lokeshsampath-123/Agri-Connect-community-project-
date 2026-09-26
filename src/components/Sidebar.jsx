'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TRANSLATIONS } from '@/lib/translations';

const menuItems = [
  { name: 'Dashboard', translationKey: 'dashboard', icon: 'dashboard', href: '/dashboard' },
  { name: 'AI Scanner', translationKey: 'scanner', icon: 'center_focus_strong', href: '/scanner' },
  { name: 'Pest Tracker', translationKey: 'pests', icon: 'bug_report', href: '/pests' },
  { name: 'Climate Advisory', translationKey: 'climate', icon: 'thermostat', href: '/climate' },
  { name: 'Soil Overview', translationKey: 'soil', icon: 'landscape', href: '/soil' },
  { name: 'Community', translationKey: 'community', icon: 'forum', href: '/community' },
  { name: 'Agent Console', translationKey: 'agentConsole', icon: 'smart_toy', href: '/admin' },
  { name: 'Settings', translationKey: 'settings', icon: 'settings', href: '/settings' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const session = localStorage.getItem('user_profile');
      if (session) {
        setUser(JSON.parse(session));
      } else {
        setUser(null);
      }
    };
    checkUser();
    
    // Periodically sync user profile (in case of changes across pages)
    const interval = setInterval(checkUser, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    
    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('close-sidebar', handleClose);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('close-sidebar', handleClose);
    };
  }, []);

  // Close sidebar drawer automatically on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user_profile');
    setUser(null);
    window.location.href = '/login';
  };

  const activeLang = user?.language || (typeof window !== 'undefined' ? localStorage.getItem('agri_lang') : 'en') || 'en';
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`notranslate w-[288px] h-screen fixed left-0 top-0 bg-white border-r border-outline-variant shadow-sm flex flex-col p-6 z-50 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Logo & Mobile Close */}
        <div className="flex justify-center mb-8 border-b border-outline-variant/40 pb-6 relative shrink-0">
          <Link href="/" className="flex flex-col items-center group">
            <img src="/logo.png" alt="FarmWise Logo" className="h-20 object-contain mb-1" />
            <span className="text-xl font-display font-black tracking-wide animate-gradient-flow">FarmWise</span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-surface-container text-outline absolute top-0 right-0 flex items-center justify-center border border-outline-variant/40"
            title="Close Menu"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const label = t[item.translationKey] || item.name;
            const isRegional = activeLang !== 'en';
            
            return isRegional ? (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all rounded-2xl font-semibold text-sm ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <span 
                  className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-[currentColor]' : ''}`}
                >
                  {item.icon}
                </span>
                <span>{label}</span>
              </a>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all rounded-2xl font-semibold text-sm ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <span 
                  className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-[currentColor]' : ''}`}
                >
                  {item.icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Session Status */}
        <div className="mb-4 pt-4 border-t border-outline-variant/60 shrink-0">
          {user ? (
            <div className="px-3 py-3 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt="Farmer Avatar" 
                    className="w-9 h-9 rounded-xl object-cover border border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-base">account_circle</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">{t.farmerProfile || 'Farmer Profile'}</p>
                  <p className="text-xs font-black text-primary truncate leading-normal mt-0.5">{user.name}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-[9px] bg-primary text-white hover:bg-primary/95 transition-colors font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[10px]">logout</span>
                {t.logout || 'Logout'}
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-2xl text-xs font-bold hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              {t.signInAccount || 'Sign In Account'}
            </Link>
          )}
        </div>

        {/* System Status and Foot */}
        <div className="pt-4 border-t border-outline-variant space-y-4 shrink-0">
          <div className="px-4 py-3 bg-surface-container rounded-2xl text-secondary font-bold text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
            <span>{t.systemStatus || 'System Status: Optimal'}</span>
          </div>
          <div className="text-[10px] text-on-surface-variant/60 font-medium px-4">
            © 2026 FarmWise.
          </div>
        </div>
      </aside>
    </>
  );
}
