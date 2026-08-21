'use client';
import React, { useRef, useState } from 'react';
import styles from './page.module.css';

export default function GlareCard({ children, className = '', style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  const rotateX = isHovered ? (position.y - 50) / -3 : 0;
  const rotateY = isHovered ? (position.x - 50) / 3 : 0;

  return (
    <div 
      ref={ref}
      className={`${styles.glareCard} ${className}`}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPosition({ x: 50, y: 50 });
      }}
      onMouseMove={handleMouseMove}
    >
      <div 
        className={styles.glareOverlay} 
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${position.x}% ${position.y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`
        }}
      />
      <div className={styles.glareContent}>
        {children}
      </div>
    </div>
  );
}
