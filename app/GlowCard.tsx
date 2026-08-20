'use client';
import React from 'react';
import styles from './page.module.css';

export default function GlowCard({ children, className = '', style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
  return (
    <div 
      className={`${styles.glowCard} ${className}`}
      style={style}
    >
      <div className={styles.glowCardInner}>
        {children}
      </div>
    </div>
  );
}
