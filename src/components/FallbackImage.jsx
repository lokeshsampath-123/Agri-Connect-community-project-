'use client';

import { useState } from 'react';

export default function FallbackImage({ src, alt, className = '', fallbackSrc = '/default_pest.png', ...props }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        src={fallbackSrc || '/default_pest.png'} 
        alt={alt || 'Fallback'} 
        className={className} 
        onError={(e) => {
          e.target.style.display = 'none';
        }} 
        {...props} 
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt || 'Crop Asset'} 
      className={className} 
      onError={() => setError(true)} 
      {...props} 
    />
  );
}
