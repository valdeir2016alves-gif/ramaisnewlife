'use client';
import React, { useRef } from 'react';
import styles from './page.module.css';

export default function GlowCard({ children, className = '', style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--x', `${x}px`);
    ref.current.style.setProperty('--y', `${y}px`);
  };

  return (
    <div 
      ref={ref} 
      className={`${styles.glowCard} ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
    >
      <div className={styles.glowCardInner}>
        {children}
      </div>
    </div>
  );
}
