import React, { useRef, useEffect, useState } from 'react';
import styles from './page.module.css';

export default function TextHoverEffect({ text }: { text: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const updateCursor = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    svg.addEventListener('mousemove', updateCursor);
    svg.addEventListener('mouseenter', () => setHovered(true));
    svg.addEventListener('mouseleave', () => setHovered(false));
    return () => {
      svg.removeEventListener('mousemove', updateCursor);
      svg.removeEventListener('mouseenter', () => setHovered(true));
      svg.removeEventListener('mouseleave', () => setHovered(false));
    };
  }, []);
  
  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 600 40"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.textHoverSvg}
    >
      <defs>
        <radialGradient
          id="textHoverGradient"
          cx={cursor.x}
          cy={cursor.y}
          r="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--primary-color)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      
      {/* Base stroke text (very faint) */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="1.5"
        className={styles.textHoverStroke}
      >
        {text}
      </text>
      
      {/* Glow on hover */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="2"
        className={styles.textHoverStrokeGlow}
        style={{ opacity: hovered ? 1 : 0 }}
      >
        {text}
      </text>

      {/* Solid fill revealing with mask */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="none"
        fill="url(#textHoverGradient)"
        className={styles.textHoverFill}
      >
        {text}
      </text>
    </svg>
  );
}
