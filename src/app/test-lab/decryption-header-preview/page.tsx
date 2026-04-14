"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, ChevronLeft } from "lucide-react";
import { DecryptionHeader } from "@/components/SeshatInterface/euclid/DecryptionHeader";

// ─────────────────────────────────────────────────────────────────────────────
// Live timing config — single source of truth, passed directly as props
// ─────────────────────────────────────────────────────────────────────────────
interface Timing {
  line1Speed:     number;
  line2Speed:     number;
  teletypeHold:   number;
  initialDelay:   number;
  interLineDelay: number;
  scrambleRamp:   number;
  lockRate:       number;
  line1LockStart: number;
  greekHold:      number;
  morphDuration:  number;
  morphStagger:   number;
  englishHold:    number;
  scrambleSlowTick: number;
}

const DEFAULTS: Timing = {
  line1Speed:     130,
  line2Speed:      60,
  teletypeHold:   900,
  initialDelay:   1950,  // ≈ 3 blink cycles (3 × 650 ms)
  interLineDelay: 1300,  // ≈ 2 blink cycles on line 2 before typing
  scrambleRamp:  1800,
  lockRate:       120,
  line1LockStart: 480,
  greekHold:     1200,
  morphDuration: 2200,  // sand-dissolve crossfade ms
  morphStagger:   60,
  englishHold:   800,
  scrambleSlowTick: 450,
};

const TIMING_DEFS: {
  key: keyof Timing; label: string; min: number; max: number; step: number; detail: string;
}[] = [
  { key: "line1Speed",    label: "Line 1 speed (ms/char)",        min: 20,  max: 500,  step: 10,  detail: "Interval between each line-1 glyph" },
  { key: "line2Speed",    label: "Line 2 speed (ms/char)",        min: 10,  max: 300,  step: 5,   detail: "Line 2 types faster" },
  { key: "teletypeHold",  label: "Hold after typing (ms)",        min: 100, max: 3000, step: 50,  detail: "Cursor blinks before scramble begins" },
  { key: "initialDelay",  label: "Initial delay (ms)",            min: 0,   max: 4000, step: 50,  detail: "Pause before first glyph — 650ms ≈ 1 cursor blink" },
  { key: "interLineDelay",label: "Inter-line delay (ms)",          min: 0,   max: 4000, step: 50,  detail: "Cursor blinks on line 2 before typing — 650ms ≈ 1 blink" },
  { key: "scrambleRamp",   label: "Scramble ramp (ms)",            min: 200, max: 5000, step: 100, detail: "Time to accelerate from slow to peak scramble speed" },
  { key: "scrambleSlowTick", label: "Scramble slow tick (ms)",      min: 50,  max: 1500, step: 25,  detail: "ms between glyph changes at the START of scramble — higher = lazier start" },
  { key: "lockRate",      label: "Line 2 lock rate (ms/letter)",  min: 20,  max: 500,  step: 10,  detail: "Uniform gap between each ELEMENTS letter locking" },
  { key: "line1LockStart",label: "Line 1 first gap (ms)",          min: 50,  max: 2000, step: 25,  detail: "Gap before 2nd letter; each next gap = prev × 0.8" },
  { key: "greekHold",     label: "Greek hold (ms)",               min: 100, max: 3000, step: 50,  detail: "How long Greek shows before morph animation begins" },
  { key: "morphDuration", label: "Sand dissolve (ms)",             min: 200, max: 6000, step: 100, detail: "Greek → Latin crossfade speed — higher = slower sand-blow" },
  { key: "morphStagger",  label: "Morph stagger (ms) — legacy",    min: 10,  max: 300,  step: 10,  detail: "Legacy: no longer used" },
  { key: "englishHold",   label: "English hold → onComplete (ms)", min: 100, max: 3000, step: 100, detail: "How long English shows before onComplete fires" },
];

const PHASE_LABELS: Record<string, string> = {
  teletype: "Phase 1 · Hieroglyph Teletype",
  scramble: "Phase 2 · Scramble → Lock",
  greek:    "Phase 3 · Greek",
  morph:    "Phase 4 · Morph (tighten + letter-swap)",
  english:  "Phase 5 · English Hold",
  done:     "✓ onComplete fired",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function DecryptionHeaderPreview() {
  const [key, setKey]             = useState(0);
  const [phase, setPhase]         = useState<string>("teletype");
  const [completed, setCompleted] = useState(false);
  const [log, setLog]             = useState<{ ts: number; msg: string }[]>([]);
  const [timing, setTiming]       = useState<Timing>({ ...DEFAULTS });

  const addLog = useCallback((msg: string) => {
    setLog(prev => [{ ts: Date.now(), msg }, ...prev].slice(0, 20));
  }, []);

  const replay = () => {
    setKey(k => k + 1);
    setPhase("teletype");
    setCompleted(false);
    addLog("→ replay");
  };

  const resetDefaults = () => {
    setTiming({ ...DEFAULTS });
    setKey(k => k + 1);
    setPhase("teletype");
    setCompleted(false);
    addLog("→ reset to defaults");
  };

  const handleComplete = useCallback(() => {
    setPhase("done");
    setCompleted(true);
    addLog("✓ onComplete() fired");
  }, [addLog]);

  const handlePhaseChange = useCallback((p: string) => {
    setPhase(p);
    addLog(`→ phase: ${p}`);
  }, [addLog]);

  const setVal = (k: keyof Timing, v: number) =>
    setTiming(t => ({ ...t, [k]: v }));

  return (
    <div className="min-h-screen bg-black text-fuchsia-200 font-mono p-6 flex flex-col gap-6">

      {/* ── BACK / TITLE ── */}
      <div className="flex items-center gap-4">
        <a href="/test-lab" className="text-fuchsia-700 hover:text-fuchsia-400 transition-colors">
          <ChevronLeft size={20} />
        </a>
        <h1 className="text-sm uppercase tracking-[0.3em] text-fuchsia-500">
          Test Lab · Decryption Header Animation
        </h1>
      </div>

      {/* ── STATIC TITLE (displayed above box, not part of animation) ── */}
      <div className="text-center py-2 select-none">
        <div className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-amber-300"
          style={{ textShadow: "0 0 6px #d4af37, 0 0 18px #d4af37" }}>
          EUCLID&apos;S
        </div>
        <div className="text-4xl font-display font-bold tracking-[0.15em] text-amber-400"
          style={{ textShadow: "0 0 6px #d4af37, 0 0 18px #d4af37" }}>
          Elements
        </div>
        <div className="h-[1px] w-48 mx-auto mt-3 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        <div className="text-[10px] text-amber-800/50 font-mono uppercase tracking-[0.3em] mt-2">
          static title — not part of the animation sequence
        </div>
      </div>

      {/* ── ANIMATION PREVIEW BOX ── */}
      <div className="relative rounded-2xl border border-fuchsia-700/30 bg-black overflow-hidden"
        style={{ boxShadow: "0 0 0 1px #bc13fe33, 0 0 30px #9400d322 inset" }}>
        <div className="absolute top-3 right-3 z-10 text-[10px] text-fuchsia-700/60 uppercase tracking-widest">
          {PHASE_LABELS[phase] ?? phase}
        </div>
        <div className="py-10 px-6 flex items-center justify-center min-h-[240px]">
          <DecryptionHeader
            key={key}
            onComplete={handleComplete}
            onPhaseChange={handlePhaseChange}
            line1Speed={timing.line1Speed}
            line2Speed={timing.line2Speed}
            teletypeHold={timing.teletypeHold}
            initialDelay={timing.initialDelay}
            interLineDelay={timing.interLineDelay}
            scrambleRamp={timing.scrambleRamp}
            scrambleSlowTick={timing.scrambleSlowTick}
            lockRate={timing.lockRate}
            line1LockStart={timing.line1LockStart}
            greekHold={timing.greekHold}
            morphDuration={timing.morphDuration}
            morphStagger={timing.morphStagger}
            englishHold={timing.englishHold}
          />
        </div>
        {completed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)" }}
          />
        )}
      </div>

      {/* ── REPLAY CONTROLS ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={replay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-fuchsia-700/40 text-fuchsia-400 hover:bg-fuchsia-900/20 active:scale-95 transition-all text-xs uppercase tracking-widest">
          <RotateCcw size={14} /> Replay
        </button>
        <button onClick={resetDefaults}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-900/30 text-amber-700 hover:bg-amber-900/10 active:scale-95 transition-all text-xs uppercase tracking-widest">
          Reset defaults
        </button>
        <span className="text-fuchsia-900/40 text-[10px]">Timing changes take effect on next Replay</span>
      </div>

      {/* ── LIVE TIMING CONTROLS — single source of truth ── */}
      <div className="rounded-xl border border-amber-700/30 p-4 flex flex-col gap-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-amber-600/70">
          Live timing — single source of truth
        </div>
        {TIMING_DEFS.map(def => (
          <div key={def.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fuchsia-300/80">{def.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timing[def.key]}
                  min={def.min} max={def.max} step={def.step}
                  onChange={e => setVal(def.key, Number(e.target.value))}
                  className="w-20 bg-black border border-fuchsia-900/40 rounded-lg px-2 py-1 text-xs text-amber-400 text-right focus:outline-none focus:border-fuchsia-600/60 tabular-nums"
                />
                <span className="text-[10px] text-fuchsia-900/50 w-6">ms</span>
              </div>
            </div>
            <input
              type="range"
              min={def.min} max={def.max} step={def.step}
              value={timing[def.key]}
              onChange={e => setVal(def.key, Number(e.target.value))}
              className="w-full accent-fuchsia-600 h-1"
            />
            <div className="text-[10px] text-fuchsia-900/50">{def.detail}</div>
          </div>
        ))}
      </div>

      {/* ── EVENT LOG ── */}
      {log.length > 0 && (
        <div className="rounded-xl border border-fuchsia-900/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-800 mb-2">Event log</div>
          <div className="flex flex-col gap-1">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-3 text-[11px]">
                <span className="text-fuchsia-900/50 tabular-nums min-w-[80px]">
                  +{((entry.ts - (log[log.length - 1]?.ts ?? entry.ts)) * -1).toFixed(0)} ms
                </span>
                <span className="text-fuchsia-400/80">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
