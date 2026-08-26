'use client';
import React from 'react';
import styles from './page.module.css';
import Meteors from './Meteors';

export default function MeteorCard({ children, className = '', style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div className={styles.meteorCardGlow} />
      <div className={styles.meteorCardInner}>
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {children}
        </div>
        <Meteors number={15} />
      </div>
    </div>
  );
}
