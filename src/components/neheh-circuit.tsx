"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { NehehCircuitSvg, type IndicatorState } from "@/components/icons/neheh-circuit-svg";
import {
  getRankInfo,
  getNextMilestone,
  TIER_COLORS,
  applyDecay,
} from "@/lib/neheh-circuit";
import { cn } from "@/lib/utils";

interface OathStats {
  rankDay: number;
  currentStreak: number;
  bestStreak: number;
  lastOathDate: string;
}

function calendarDaysBetween(laterYMD: string, earlierYMD: string): number {
  if (!earlierYMD) return 0;
  const a = new Date(laterYMD  + 'T12:00:00');
  const b = new Date(earlierYMD + 'T12:00:00');
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function getEffectiveToday(): string {
  const now = new Date();
  const hours = now.getHours(), mins = now.getMinutes();
  if (hours < 3 || (hours === 3 && mins < 5)) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

// Build the 10 decan-bar indicator states from current streak data.
// Slot 0 = 9 days ago, slot 9 = today.
function buildDecanStates(
  currentStreak: number,
  oathTakenToday: boolean,
  daysSinceLast: number,
): IndicatorState[] {
  return Array.from({ length: 10 }, (_, slot) => {
    const daysAgo = 9 - slot;
    if (oathTakenToday) {
      if (daysAgo < currentStreak) return "active";
    } else {
      if (daysAgo === 0) return "unlit";
      if (daysAgo < daysSinceLast) return "missed";
      if (daysAgo >= daysSinceLast && daysAgo < daysSinceLast + currentStreak) return "active";
    }
    return "unlit";
  }) as IndicatorState[];
}

export function NehehCircuit() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<OathStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const currentStreak = d?.stats?.oathCurrentStreak || 0;
        setStats({
          rankDay:       d?.stats?.oathRankDay ?? Math.min(currentStreak, 360),
          currentStreak,
          bestStreak:    d?.stats?.oathBestStreak    || 0,
          lastOathDate:  d?.stats?.lastOathDate      || '',
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="w-full max-w-md border border-cyan-900/30 rounded-3xl p-6 flex items-center justify-center">
        <p className="text-[10px] font-mono text-slate-600 tracking-widest uppercase animate-pulse">
          Consulting the Eternal Record...
        </p>
      </div>
    );
  }

  if (!stats) return null;

  // Compute the display rank day, applying decay for time since last oath
  const today            = getEffectiveToday();
  const daysSinceLast    = calendarDaysBetween(today, stats.lastOathDate);
  const oathTakenToday   = stats.lastOathDate === today;
  const decayDaysDisplay = oathTakenToday ? 0 : Math.max(0, daysSinceLast - 1);
  const hasReached120    = stats.bestStreak >= 120 || stats.rankDay >= 120;
  const displayRankDay   = applyDecay(stats.rankDay, decayDaysDisplay, hasReached120);

  const rankInfo    = getRankInfo(displayRankDay);
  const colors      = TIER_COLORS[rankInfo.tier];
  const nextMile    = getNextMilestone(displayRankDay);
  const isMaxRank   = displayRankDay >= 360;

  // ── Circuit indicator states ──
  const decanStates      = buildDecanStates(stats.currentStreak, oathTakenToday, daysSinceLast);
  const decansCompleted  = Math.min(7, Math.floor(displayRankDay / 10));
  const irisStates       = Array.from({ length: 7 }, (_, i) =>
    (i < decansCompleted ? "active" : "unlit") as IndicatorState
  );
  const outerRingState:     IndicatorState = displayRankDay >= 120 ? "active" : "unlit";
  const outermostRingState: IndicatorState = displayRankDay >= 360 ? "active" : "unlit";

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-3xl border-2 p-6 space-y-5 relative overflow-hidden",
        colors.borderClass,
      )}
      style={{ boxShadow: `0 0 30px ${TIER_COLORS[rankInfo.tier].glow}` }}
    >
      {/* ── Ambient background glow ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: `radial-gradient(circle at 50% 40%, ${TIER_COLORS[rankInfo.tier].glow} 0%, transparent 70%)` }}
      />

      {/* ── Section Header ── */}
      <div className="relative z-10 text-center">
        <p className={cn("text-[9px] font-mono tracking-[0.35em] uppercase", colors.textClass)}>
          The Neheh-Circuit
        </p>
        <p className="text-[8px] text-slate-600 font-mono tracking-widest uppercase mt-0.5">
          Oath of Commitment — Eternal Record
        </p>
      </div>

      {/* ── Neheh-Circuit SVG ── */}
      <div className="relative z-10 flex justify-center">
        <NehehCircuitSvg
          decanStates={decanStates}
          irisStates={irisStates}
          outerRingState={outerRingState}
          outermostRingState={outermostRingState}
          size={220}
        />
      </div>

      {/* ── Rank Title ── */}
      <div className="relative z-10 text-center space-y-1">
        <p className={cn("text-xl font-headline font-bold tracking-widest uppercase", colors.textClass)}>
          {rankInfo.title}
        </p>
        {rankInfo.description && (
          <p className="text-[10px] text-slate-500 font-mono leading-relaxed max-w-xs mx-auto">
            {rankInfo.description}
          </p>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="relative z-10 grid grid-cols-3 gap-2 text-center">
        <div className="space-y-0.5">
          <p className={cn("text-lg font-headline font-bold", colors.textClass)}>
            {stats.currentStreak}
          </p>
          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Streak</p>
        </div>
        <div className="space-y-0.5">
          <p className={cn("text-lg font-headline font-bold", colors.textClass)}>
            {displayRankDay}
          </p>
          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Rank Day</p>
        </div>
        <div className="space-y-0.5">
          <p className={cn("text-lg font-headline font-bold", colors.textClass)}>
            {stats.bestStreak}
          </p>
          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Best</p>
        </div>
      </div>

      {/* ── Next Milestone ── */}
      {!isMaxRank && nextMile && (
        <div
          className={cn(
            "relative z-10 border rounded-xl px-4 py-2.5 text-center space-y-0.5",
            colors.borderClass,
          )}
        >
          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em]">
            Next Milestone — {nextMile.daysAway} day{nextMile.daysAway !== 1 ? 's' : ''} away
          </p>
          <p className={cn("text-[10px] font-headline font-bold uppercase tracking-wider", colors.textClass)}>
            {nextMile.title}
          </p>
        </div>
      )}

      {/* ── Transcendent Badge ── */}
      {isMaxRank && (
        <div className="relative z-10 text-center">
          <p className="text-[9px] font-mono text-white/60 tracking-[0.25em] uppercase">
            ☥ The Circuit is Complete ☥
          </p>
        </div>
      )}

      {/* ── Decay Notice (shown only if measurable decay is accumulating) ── */}
      {!oathTakenToday && daysSinceLast > 1 && displayRankDay < stats.rankDay && (
        <div className="relative z-10 text-center">
          <p className="text-[8px] font-mono text-red-500/60 tracking-widest uppercase">
            ⚠ Rank decaying — {daysSinceLast - 1} day{daysSinceLast - 2 !== 0 ? 's' : ''} without the Oath
          </p>
        </div>
      )}

      {/* ── Last Oath Date ── */}
      {stats.lastOathDate && (
        <div className="relative z-10 text-center">
          <p className="text-[8px] font-mono text-slate-700 tracking-widest uppercase">
            Last Oath: {stats.lastOathDate}
            {oathTakenToday ? ' — ✓ Sealed today' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
