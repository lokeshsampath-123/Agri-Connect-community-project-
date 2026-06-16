'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ClientLayoutHelper() {
  const pathname = usePathname();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ringRef = useRef(null);

  useEffect(() => {
    // 1. Scroll Reveal Intersection Observer
    const handleScrollReveal = () => {
      const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, observerOptions);

      document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
      return observer;
    };

    const observer = handleScrollReveal();

    // 2. Custom Cursor Move Listener
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Smoothly animate the ring using transform in ref (to avoid React re-render lag)
      if (ringRef.current) {
        ringRef.current.style.left = `${e.clientX}px`;
        ringRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseOver = (e) => {
      // Check if hovering a button, link, input, or item with 'hoverable' class
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

    const handleMouseLeaveWindow = () => {
      setIsVisible(false);
    };

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

  if (!isVisible) return null;

  return (
    <>
      {/* Custom Cursor Dot */}
      <div 
        className={`custom-cursor hidden md:block ${isHovered ? 'custom-cursor-hover' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      />
      {/* Custom Cursor Ring */}
      <div 
        ref={ringRef}
        className={`custom-cursor-ring hidden md:block ${isHovered ? 'custom-cursor-ring-hover' : ''}`}
      />
    </>
  );
}
