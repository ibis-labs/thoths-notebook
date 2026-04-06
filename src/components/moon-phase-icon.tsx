"use client";

import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// --- Moon Phase Calculation Logic ---
function getMoonPhase() {
  const now = new Date();

  // Calculate Julian Date from UTC time for accuracy across timezones
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  let Y = year;
  let M = month;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    day + (hour / 24) + (minute / 1440) + B - 1524.5;

  // Reference new moon: January 6, 2000 at 18:14 UTC (JD 2451550.26)
  const KNOWN_NEW_MOON_JD = 2451550.26;
  const SYNODIC_PERIOD = 29.530588853;

  let daysSinceNew = (JD - KNOWN_NEW_MOON_JD) % SYNODIC_PERIOD;
  if (daysSinceNew < 0) daysSinceNew += SYNODIC_PERIOD;

  const b = Math.floor(daysSinceNew / SYNODIC_PERIOD * 8) % 8;

  const phases = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
  ];

  return { phase: b, name: phases[b] };
}

// --- SVG Icon Components for Each Phase (Finalized Designs) ---
// SVG viewBox is 0 0 24 24; circle center=(12,12), radius=10, so top=(12,2), bottom=(12,22).
// Gibbous icons use a half-circle (left or right) plus a centered ellipse (rx=4,ry=10)
// to create ~70% illumination, mirrored between waxing (right lit) and waning (left lit).
const NewMoon = () => <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />;
const WaxingCrescent = () => <g transform="rotate(30 12 12)"><path d="M12 2 A10 10 0 1 1 12 22 A8 10 0 1 0 12 2 Z" fill="currentColor" /></g>;
const FirstQuarter = () => <path d="M12 2 V22 A10 10 0 0 0 12 2 Z" fill="currentColor" />;
const WaxingGibbous = () => <g><path d="M12 2 V22 A10 10 0 0 0 12 2 Z" fill="currentColor" /><ellipse cx="12" cy="12" rx="4" ry="10" fill="currentColor" /></g>;
const FullMoon = () => <circle cx="12" cy="12" r="10" fill="currentColor" />;
const WaningGibbous = () => <g><path d="M12 2 V22 A10 10 0 0 1 12 2 Z" fill="currentColor" /><ellipse cx="12" cy="12" rx="4" ry="10" fill="currentColor" /></g>;
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
