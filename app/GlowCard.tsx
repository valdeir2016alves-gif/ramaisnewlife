'use client';
import React from 'react';
import styles from './page.module.css';

export default function GlowCard({ children, className = '', innerClassName = '', style, onClick }: { children: React.ReactNode, className?: string, innerClassName?: string, style?: React.CSSProperties, onClick?: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ref.current.style.setProperty('--x', `${x}px`);
      ref.current.style.setProperty('--y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={ref}
      className={`${styles.glowCard} ${className}`}
      style={style}
      onClick={onClick}
    >
      <div className={innerClassName || styles.glowCardInner}>
        {children}
      </div>
    </div>
  );
}
