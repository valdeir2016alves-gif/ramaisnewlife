'use client';

import React from 'react';
import styles from './page.module.css';

export default function UnderlineText({ text }: { text: string }) {
  return (
    <span className={styles.underlineText}>
      {text}
    </span>
  );
}
