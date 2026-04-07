"use client";

import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// --- Moon Phase Calculation Logic ---
function getMoonPhase() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  const day = now.getDate();

  let c = 0, e = 0, jd = 0, b = 0;

  if (month < 3) {
    year--;
    month += 12;
  }

  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09;
  jd /= 29.5305882;
  b = parseInt(jd.toString());
  jd -= b;
  b = Math.round(jd * 8);
  if (b >= 8) b = 0;

  const phases = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
  ];
  
  return { phase: b, name: phases[b] };
}

// --- SVG Icon Components for Each Phase (Finalized Designs) ---
const NewMoon = () => <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />;
const WaxingCrescent = () => <g transform="rotate(30 12 12)"><path d="M12 2 A10 10 0 1 1 12 22 A8 10 0 1 0 12 2 Z" fill="currentColor" /></g>;
const FirstQuarter = () => <path d="M12 2 V22 A10 10 0 0 0 12 2 Z" fill="currentColor" />;
const WaxingGibbous = () => <path d="M12 2 A10 10 0 0 1 12 22 A4 10 0 0 1 12 2 Z" fill="currentColor" />;
const FullMoon = () => <circle cx="12" cy="12" r="10" fill="currentColor" />;
const WaningGibbous = () => <path d="M12 2 A10 10 0 0 0 12 22 A4 10 0 0 0 12 2 Z" fill="currentColor" />;
const LastQuarter = () => <path d="M12 2 V22 A10 10 0 0 1 12 2 Z" fill="currentColor" />;
const WaningCrescent = () => <g transform="rotate(-30 12 12)"><path d="M12 2 A10 10 0 1 0 12 22 A8 10 0 1 1 12 2 Z" fill="currentColor" /></g>;

const phaseIcons = [
  <NewMoon />, <WaxingCrescent />, <FirstQuarter />, <WaxingGibbous />,
  <FullMoon />, <WaningGibbous />, <LastQuarter />, <WaningCrescent />
];

// --- The Main Component ---
export function MoonPhaseIcon() {
  const [moon, setMoon] = useState({ phase: 0, name: 'New Moon' });

  useEffect(() => {
    // Calculate the moon phase once when the component mounts
    setMoon(getMoonPhase());
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-8 h-8 flex items-center justify-center text-cyan-400/70 cursor-pointer">
          <svg viewBox="0 0 24 24" width="24" height="24">
            {phaseIcons[moon.phase]}
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        {/* THE FIX IS HERE: Removed "Current Phase:" for a cleaner look */}
        <p>{moon.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
