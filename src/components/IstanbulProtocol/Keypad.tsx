"use client";
import React from 'react';
import { motion } from 'framer-motion';

// This is the "Blueprint" that tells TypeScript onKeyClick is allowed!
interface KeypadProps {
  isVisible: boolean;
  onKeyClick: (num: number) => void;
}

export const Keypad = ({ isVisible, onKeyClick }: KeypadProps) => {
  const rows = 4;
  const cols = 3;
  const keyW = 2.8;
  const keyH = 3.2;
  const gap = 0.4;

  return (
    <motion.g
      id="keypad-terminal"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1 }}
    >
      {/* 1. THE GLASS PANEL BACKGROUND */}
      <rect
        width="10" height="15" rx="1"
        fill="rgba(0, 10, 5, 0.95)"
        stroke="#00ff41"
        strokeWidth="0.1"
        className="drop-shadow-[0_0_2px_#00ff41]"
      />

      {/* 2. THE 3x4 GRID */}
      <g transform="translate(0.4, 0.8)">
        {[...Array(rows)].map((_, r) =>
          [...Array(cols)].map((_, c) => {
            const index = r * cols + c + 1; // 1 through 12
            const displayNum = index.toString().padStart(2, '0'); // "01", "02"...

            return (
             <g 
  key={`${r}-${c}`}
  // tabIndex={-1} tells the browser: "Do not highlight or focus this element"
  tabIndex={-1} 
  className="cursor-pointer outline-none select-none focus:outline-none focus:ring-0"
  style={{ 
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
    touchAction: 'none'
  }}
  onPointerDown={(e) => {
    e.stopPropagation();
    // Pre-emptively blur to remove any accidental focus
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(10); 
    }
    onKeyClick(index);
  }}
>
                <motion.rect
                  className="outline-none ring-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVisible ? 1 : 0 }}
                  layout={false} // THE CRUCIAL FIX: Stops Framer from "guessing" a layout circle
                  x={c * (keyW + gap)}
                  y={r * (keyH + gap)}
                  width={keyW}
                  height={keyH}
                  rx="0.3"
                  fill="rgba(20, 20, 20, 0.4)"
                  stroke="#333"
                  strokeWidth="0.05"
                  // Clean, high-performance tap effect
                 whileTap={{
                    fill: "rgba(0, 255, 65, 0.25)",
                    stroke: "#00ff41",
                    scale: 0.94,
                    transition: { duration: 0.2 }
                  }}
                
                />

                <text
                  x={c * (keyW + gap) + keyW / 2}
                  y={r * (keyH + gap) + keyH - 0.5}
                  textAnchor="middle"
                  fill="#00ff41"
                  fontSize="0.7"
                  fontFamily="monospace"
                  // THE SHIELD:
                  style={{
                    opacity: 0.3,
                    pointerEvents: 'none',     // Clicks pass through to the key
                    userSelect: 'none',        // Prevents highlighting
                    WebkitUserSelect: 'none',  // Safari/Chrome specific
                    msUserSelect: 'none',      // Legacy support
                    touchAction: 'none'        // Prevents mobile "magnifying glass"
                  }}
                >
                  {index.toString().padStart(2, '0')}
                </text>
              </g>
            );
          })
        )}
      </g>
    </motion.g>
  );
};