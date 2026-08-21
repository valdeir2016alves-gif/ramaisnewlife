import React, { useEffect, useState } from 'react';
import styles from './page.module.css';

interface MeteorsProps {
  number?: number;
}

export default function Meteors({ number = 20 }: MeteorsProps) {
  const [meteors, setMeteors] = useState<any[]>([]);

  useEffect(() => {
    const arr = new Array(number).fill(true).map(() => ({
      top: Math.floor(Math.random() * 100) + '%',
      left: Math.floor(Math.random() * 100) + '%',
      animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + 's',
      animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + 's',
    }));
    setMeteors(arr);
  }, [number]);

  return (
    <>
      {meteors.map((m, idx) => (
        <span
          key={'meteor' + idx}
          className={styles.meteor}
          style={{
            top: m.top,
            left: m.left,
            animationDelay: m.animationDelay,
            animationDuration: m.animationDuration,
          }}
        ></span>
      ))}
    </>
  );
}
