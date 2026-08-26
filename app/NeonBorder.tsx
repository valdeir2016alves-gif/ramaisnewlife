'use client';

import React from 'react';
import styles from './page.module.css';

export default function NeonBorder({
  children,
  className = '',
  borderRadius = 12,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`${styles.neonBorderCard} ${className}`}
      style={{ ...style, '--neon-radius': `${borderRadius}px` } as React.CSSProperties}
    >
      <div className={styles.neonBorderGlow} />
      <div className={styles.neonBorderInner}>
        {children}
      </div>
    </div>
  );
}
