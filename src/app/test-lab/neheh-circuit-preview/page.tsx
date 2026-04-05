"use client";

import { useState } from "react";
import { NehehCircuitSvg, IndicatorState } from "@/components/icons/neheh-circuit-svg";

// ── Preset configurations ─────────────────────────────────────────────────

const PRESETS = {
  empty: {
    label: "Empty",
    decan: Array<IndicatorState>(10).fill("unlit"),
    iris:  Array<IndicatorState>(7).fill("unlit"),
    outer: "unlit" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
  "day-5": {
    label: "Day 5",
    decan: [...Array<IndicatorState>(5).fill("active"), ...Array<IndicatorState>(5).fill("unlit")],
    iris:  Array<IndicatorState>(7).fill("unlit"),
    outer: "unlit" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
  "day-10": {
    label: "Day 10",
    decan: Array<IndicatorState>(10).fill("active"),
    iris:  Array<IndicatorState>(7).fill("unlit"),
    outer: "unlit" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
  "iris-half": {
    label: "Iris ½",
    decan: Array<IndicatorState>(10).fill("active"),
    iris:  [...Array<IndicatorState>(4).fill("active"), ...Array<IndicatorState>(3).fill("unlit")],
    outer: "unlit" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
  "day-17": {
    label: "All Iris",
    decan: Array<IndicatorState>(10).fill("active"),
    iris:  Array<IndicatorState>(7).fill("active"),
    outer: "unlit" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
  "outer-ring": {
    label: "+ Outer",
    decan: Array<IndicatorState>(10).fill("active"),
    iris:  Array<IndicatorState>(7).fill("active"),
    outer: "active" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
  full: {
    label: "Full / Akh",
    decan: Array<IndicatorState>(10).fill("active"),
    iris:  Array<IndicatorState>(7).fill("active"),
    outer: "active" as IndicatorState,
    outermost: "active" as IndicatorState,
  },
  decay: {
    label: "Decay",
    decan: ["active","active","active","missed","active","active","missed","missed","active","unlit"] as IndicatorState[],
    iris:  Array<IndicatorState>(7).fill("unlit"),
    outer: "unlit" as IndicatorState,
    outermost: "unlit" as IndicatorState,
  },
} as const;

type PresetKey = keyof typeof PRESETS;

// ── Cycle helper ──────────────────────────────────────────────────────────
function cycle(s: IndicatorState): IndicatorState {
  if (s === "unlit")  return "active";
  if (s === "active") return "missed";
  return "unlit";
}

const COLOR_MAP: Record<IndicatorState, { bg: string; text: string; border: string }> = {
  active: { bg: "rgba(57,255,20,0.12)",  text: "#39FF14", border: "#39FF14" },
  missed: { bg: "rgba(248,113,113,0.12)", text: "#f87171", border: "#f87171" },
  unlit:  { bg: "rgba(15,23,42,0.7)",    text: "#334155", border: "#1e293b" },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function NehehCircuitPreviewPage() {
  const [decan,     setDecan]     = useState<IndicatorState[]>(Array(10).fill("active"));
  const [iris,      setIris]      = useState<IndicatorState[]>(Array(7).fill("active"));
  const [outer,     setOuter]     = useState<IndicatorState>("active");
  const [outermost, setOutermost] = useState<IndicatorState>("active");

  const loadPreset = (key: PresetKey) => {
    const p = PRESETS[key];
    setDecan([...p.decan]);
    setIris([...p.iris]);
    setOuter(p.outer);
    setOutermost(p.outermost);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 px-4 py-8 flex flex-col items-center gap-8">

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-headline text-cyan-400 tracking-[0.2em] uppercase">
          Neheh-Circuit Preview
        </h1>
        <p className="text-[9px] font-mono text-slate-600 tracking-widest uppercase">
          Shen Ring of Commitment · Interactive Color Test
        </p>
      </div>

      {/* SVG preview */}
      <div
        className="relative rounded-2xl border border-slate-900/80 bg-black/60 p-4 flex items-center justify-center"
        style={{ boxShadow: "0 0 60px rgba(34,211,238,0.06)" }}
      >
        <NehehCircuitSvg
          decanStates={decan}
          irisStates={iris}
          outerRingState={outer}
          outermostRingState={outermost}
          size={360}
        />
      </div>

      {/* Preset strip */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(Object.keys(PRESETS) as PresetKey[]).map(key => (
          <button
            key={key}
            onClick={() => loadPreset(key)}
            className="px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] rounded-lg border border-slate-800 bg-black text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
          >
            {PRESETS[key].label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="w-full max-w-md space-y-5">

        {/* Decan toggles */}
        <div className="space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-600">
            Decan Indicators 1–10 &nbsp;·&nbsp; tap to cycle: unlit → active → missed
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {decan.map((state, i) => {
              const c = COLOR_MAP[state];
              return (
                <button
                  key={i}
                  onClick={() => setDecan(prev => prev.map((s, idx) => idx === i ? cycle(s) : s))}
                  className="w-9 h-9 rounded text-[9px] font-bold font-mono transition-all border"
                  style={{ background: c.bg, color: c.text, borderColor: c.border }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Iris toggles */}
        <div className="space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-600">
            Iris Indicators 1–7 &nbsp;·&nbsp; purple when active
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {iris.map((state, i) => {
              const isActive = state === "active";
              return (
                <button
                  key={i}
                  onClick={() => setIris(prev => prev.map((s, idx) => idx === i ? (s === "active" ? "unlit" : "active") : s))}
                  className="w-9 h-9 rounded text-[9px] font-bold font-mono transition-all border"
                  style={{
                    background: isActive ? "rgba(192,132,252,0.15)" : "rgba(15,23,42,0.7)",
                    color:      isActive ? "#c084fc" : "#334155",
                    borderColor:isActive ? "#c084fc" : "#1e293b",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ring indicator toggles */}
        <div className="grid grid-cols-2 gap-3">
          {/* Outer ring */}
          <button
            onClick={() => setOuter(s => s === "active" ? "unlit" : "active")}
            className="py-3 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-widest transition-all"
            style={{
              background:  outer === "active" ? "rgba(248,113,113,0.12)" : "rgba(15,23,42,0.7)",
              color:       outer === "active" ? "#f87171" : "#334155",
              borderColor: outer === "active" ? "#f87171" : "#1e293b",
            }}
          >
            Outer Ring<br />
            <span className="opacity-60 normal-case tracking-normal font-normal">Red · {outer}</span>
          </button>

          {/* Outermost ring */}
          <button
            onClick={() => setOutermost(s => s === "active" ? "unlit" : "active")}
            className="py-3 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-widest transition-all"
            style={{
              background:  outermost === "active" ? "rgba(34,211,238,0.12)" : "rgba(15,23,42,0.7)",
              color:       outermost === "active" ? "#22d3ee" : "#334155",
              borderColor: outermost === "active" ? "#22d3ee" : "#1e293b",
            }}
          >
            Outermost Ring<br />
            <span className="opacity-60 normal-case tracking-normal font-normal">Cyan · {outermost}</span>
          </button>
        </div>
      </div>

      {/* Color legend */}
      <div className="w-full max-w-md rounded-2xl border border-slate-900/60 p-4 space-y-3">
        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-600 mb-1">
          Color Legend
        </p>
        {[
          { dot: "#39FF14", label: "Decan — Day completed (active)",     note: "Neon lime" },
          { dot: "#f87171", label: "Decan — Day missed",                 note: "Soft red" },
          { dot: "#c084fc", label: "Iris indicators — Sector active",    note: "Bright purple" },
          { dot: "#f87171", label: "Outer ring — Milestone active",      note: "Red" },
          { dot: "#22d3ee", label: "Outermost ring — Transcendent",      note: "Cyber cyan" },
          { dot: "#f59e0b", label: "Ankh / decan-bar frame",             note: "Amber gold (structural)" },
          { dot: "#22d3ee", label: "Outer orbit rings",                  note: "Cyan (structural)" },
          { dot: "#a855f7", label: "Iris circles",                       note: "Purple (structural)" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 text-[9px] font-mono">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: item.dot, boxShadow: `0 0 6px ${item.dot}` }}
            />
            <span className="text-slate-400 flex-1">{item.label}</span>
            <span className="text-slate-700">{item.note}</span>
          </div>
        ))}
      </div>

      <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest text-center pb-12">
        Route: /test-lab/neheh-circuit-preview
      </p>
    </div>
  );
}
