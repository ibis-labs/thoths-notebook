"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// --- Moon Phase Calculation (mirrors moon-phase-icon.tsx, accepts a date) ---
function getMoonPhaseForDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();

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

  const KNOWN_NEW_MOON_JD = 2451550.26;
  const SYNODIC_PERIOD = 29.530588853;

  let daysSinceNew = (JD - KNOWN_NEW_MOON_JD) % SYNODIC_PERIOD;
  if (daysSinceNew < 0) daysSinceNew += SYNODIC_PERIOD;

  const b = Math.floor((daysSinceNew / SYNODIC_PERIOD) * 8) % 8;

  const phases = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
  ];

  return { phase: b, name: phases[b], daysSinceNew };
}

// --- SVG Icons (identical to moon-phase-icon.tsx) ---
const NewMoon = () => <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />;
const WaxingCrescent = () => <g transform="rotate(30 12 12)"><path d="M12 2 A10 10 0 1 1 12 22 A8 10 0 1 0 12 2 Z" fill="currentColor" /></g>;
const FirstQuarter = () => <path d="M12 2 V22 A10 10 0 0 0 12 2 Z" fill="currentColor" />;
const WaxingGibbous = () => <path d="M12 2 A10 10 0 0 1 12 22 A4 10 0 0 1 12 2 Z" fill="currentColor" />;
const FullMoon = () => <circle cx="12" cy="12" r="10" fill="currentColor" />;
const WaningGibbous = () => <path d="M12 2 A10 10 0 0 0 12 22 A4 10 0 0 0 12 2 Z" fill="currentColor" />;
const LastQuarter = () => <path d="M12 2 V22 A10 10 0 0 1 12 2 Z" fill="currentColor" />;
const WaningCrescent = () => <g transform="rotate(-30 12 12)"><path d="M12 2 A10 10 0 1 0 12 22 A8 10 0 1 1 12 2 Z" fill="currentColor" /></g>;

const phaseIcons = [
  <NewMoon key="new" />,
  <WaxingCrescent key="waxcres" />,
  <FirstQuarter key="fq" />,
  <WaxingGibbous key="waxgib" />,
  <FullMoon key="full" />,
  <WaningGibbous key="wangib" />,
  <LastQuarter key="lq" />,
  <WaningCrescent key="wancres" />,
];

// --- Single day preview — matches the exact sidebar header markup ---
function SidebarHeaderPreview({ date, isToday }: { date: Date; isToday: boolean }) {
  const moon = getMoonPhaseForDate(date);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-1.5">
      {/* Sidebar header — bg-sidebar + exact inner markup from AppSidebar */}
      <div className="bg-sidebar rounded w-[270px]">
        {/* SidebarHeader: flex flex-col gap-2 p-2 */}
        <div className="flex flex-col gap-2 p-2">
          {/* inner div from AppSidebar */}
          <div className="flex items-center justify-between p-2">
            <h1 className="text-xl font-bold text-cyan-400 font-display tracking-wider">
              Thoth's Notebook
            </h1>
            {/* MoonPhaseIcon internals */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 flex items-center justify-center text-cyan-400/70 cursor-pointer">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    {phaseIcons[moon.phase]}
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <p>{moon.name}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-2 text-xs px-1">
        {isToday && (
          <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            Today
          </span>
        )}
        <span className="text-muted-foreground">{dateLabel}</span>
        <span className="text-cyan-400/80">{moon.name}</span>
        <span className="text-slate-500">{moon.daysSinceNew.toFixed(1)}d</span>
      </div>
    </div>
  );
}

// --- Page ---
export default function MoonPhasePreviewPage() {
  const today = new Date();

  const days = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <h2 className="text-2xl font-bold text-cyan-400 mb-1 font-display tracking-wider">
        Moon Phase Preview
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Sidebar header rendered exactly as in the app — today through +30 days.
      </p>

      <div className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
        {days.map((date, i) => (
          <SidebarHeaderPreview key={i} date={date} isToday={i === 0} />
        ))}
      </div>
    </div>
  );
}
