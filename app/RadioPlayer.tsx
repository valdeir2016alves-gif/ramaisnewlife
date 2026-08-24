'use client';
import { useState, useRef } from 'react';

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#a3efe9', // Light cyan background
      borderRadius: '50px',
      padding: '6px 16px 6px 6px',
      gap: '12px',
      width: 'max-content',
      margin: '0 auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      cursor: 'pointer'
    }}
    onClick={togglePlay}
    >
      {/* Audio Element (Hidden) - Replace src with the actual radio stream URL */}
      <audio ref={audioRef} src="https://stream.zeno.fm/5y4p1ym38tzuv" preload="none" />

      {/* Play/Pause Button */}
      <button 
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#ff3b6a', // Pinkish red
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {isPlaying ? (
          // Pause Icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          // Play Icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '4px' }}>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Text Info */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ color: '#ff3b6a', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AO VIVO</span>
        <span style={{ color: '#111', fontSize: '15px', fontWeight: '900', lineHeight: '1.2' }}>TÁ VAZANDO</span>
        <span style={{ color: '#333', fontSize: '11px', fontWeight: '500' }}>SANTA MARIA 94.3 FM</span>
      </div>

      {/* Chevron down */}
      <div style={{ marginLeft: '12px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  );
}
