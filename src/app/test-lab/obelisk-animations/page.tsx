"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Obelisk } from '@/components/IstanbulProtocol/Obelisk';
import { HeroGlyphs } from '@/components/IstanbulProtocol/HeroGlyphs';
import { VariousGlyphs } from '@/components/IstanbulProtocol/VariousGlyphs';
import { Pedestal } from '@/components/IstanbulProtocol/Pedestal';
import { Keypad } from '@/components/IstanbulProtocol/Keypad';

export default function ObeliskAnimationsLab() {
  const [stage, setStage] = useState('summit'); 
  const [knockCount, setKnockCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const maatX = 42.5;

  const views = {
    summit: "07 0 40 40",
    landing: "07 235 40 40",
    anchored: "-10 235 65 65",
    totality: "-25 0 100 300",
    panelZoom: "17.5 255 20 20" 
  };

  const RITUAL_TIMINGS = {
    settle: 1000,
    descent: 1,
    anchor: 1,
    totality: 5,
    keypad: 10
  };

  const handleKnock = () => {
    if (stage === 'totality' && knockCount < 3) {
      setKnockCount(prev => prev + 1);
    }
  };

  const getHeroColor = () => {
    if (knockCount === 0) return "#00FFFF";
    if (knockCount === 1) return "#6a0dad";
    if (knockCount === 2) return "#a020f0";
    return "#00ff41";
  };

  const getPanelOpacity = () => knockCount * 0.33;

  useEffect(() => {
    if (knockCount === 3) {
      const migrationTimer = setTimeout(() => {
        setIsMigrating(true);
      }, 2000);
      return () => clearTimeout(migrationTimer);
    }
  }, [knockCount]);

  useEffect(() => {
    const startTimer = setTimeout(() => setStage('descending'), RITUAL_TIMINGS.settle);
    const anchorTimer = setTimeout(() => setStage('anchored'), RITUAL_TIMINGS.settle + (RITUAL_TIMINGS.descent * 1000));
    const totalityTimer = setTimeout(() => setStage('totality'), RITUAL_TIMINGS.settle + (RITUAL_TIMINGS.descent * 1000) + 2000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(anchorTimer);
      clearTimeout(totalityTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden touch-none"
      onClick={handleKnock}
    >
      <div className="w-full h-full max-w-[500px] aspect-[1/2] flex items-center justify-center">
        <motion.svg 
          animate={{ 
            viewBox: isMigrating ? views.panelZoom : 
                     (knockCount === 3 ? views.totality : 
                     (stage === 'totality' ? views.totality : 
                     (stage === 'anchored' ? views.anchored : views.landing)))
          }}
          transition={{
            duration: isMigrating ? 4 : 
                      stage === 'descending' ? RITUAL_TIMINGS.descent :
                      stage === 'anchored' ? RITUAL_TIMINGS.anchor : 0.8,
            ease: [0.45, 0.05, 0.55, 0.95]
          }}
          className="w-full h-full"
        >
          {/* 1. THE FLOATING ASSEMBLY (Stone + Background Glyphs) */}
          <g className={isMigrating ? "" : "animate-float-slow"}>
            <Obelisk ritualStage={2} color="#00FFFF" capstoneColor={getHeroColor()} />
            <g transform={`translate(${maatX - 43}, 0)`}>
              <motion.g animate={{ opacity: 1 - (knockCount * 0.25) }}>
                <VariousGlyphs ritualStage={2} />
              </motion.g>
            </g>
          </g>

          {/* 2. THE STATIONARY ANCHOR (Pedestal & Interface) */}
          <g transform="translate(0.5, 6.0)">
            <Pedestal ritualStage={2} />
            
            {/* The Green UI Panel */}
            <motion.rect
              x="22.1" y="254" width="10" height="15" rx="1"
              fill="none"
              stroke="#00ff41"
              strokeWidth="0.2"
              animate={{ opacity: getPanelOpacity() }}
              className="drop-shadow-[0_0_5px_#00ff41]"
            />

            <g transform="translate(22.1, 254)">
              <Keypad isVisible={isMigrating} />
            </g>
          </g>

          {/* 3. THE HERO MIGRATION (The Spirits - Top Layer) */}
          <motion.g 
            animate={{ rotate: isMigrating ? 360 : 0 }}
            transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
            style={{ transformOrigin: "27.1px 261.5px" }} 
          >
            
            <HeroGlyphs 
              ritualStage={2} 
              color={getHeroColor()} 
              /*isMigrating={isMigrating} */
            />
            
          </motion.g>

        </motion.svg>
      </div>

      {/* Progress HUD */}
      <div className="absolute top-10 font-mono text-[10px] text-purple-500/50 uppercase tracking-[0.3em]">
        {isMigrating ? "PROTOCOL: MIGRATION_ACTIVE" : `KNOCK_SEQUENCE: ${knockCount}/3`}
      </div>
    </div>
  );
}