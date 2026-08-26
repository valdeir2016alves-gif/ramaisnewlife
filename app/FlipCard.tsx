'use client';

import React from 'react';
import styles from './page.module.css';

export default function FlipCard({ 
  front, 
  back, 
  className = '',
  style
}: { 
  front: React.ReactNode; 
  back: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`${styles.flipCard} ${className}`} style={style}>
      <div className={styles.flipCardInner}>
        <div className={styles.flipCardFront}>
          {front}
        </div>
        <div className={styles.flipCardBack}>
          {back}
        </div>
      </div>
    </div>
  );
}
