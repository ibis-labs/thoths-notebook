"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Hieroglyph scramble pool ────────────────────────────────────────────────
const GLYPH_POOL = [
  "𓄿","𓅀","𓅃","𓆑","𓆓","𓆦","𓇋","𓇌","𓈖","𓈘",
  "𓉔","𓉡","𓊃","𓊪","𓋀","𓌀","𓌁","𓍿","𓎛","𓏏",
  "𓏑","𓂀","𓂋","𓃭","𓁹","𓄂","𓁺","𓅆","𓋁","𓂌",
];

function randGlyph() {
  return GLYPH_POOL[Math.floor(Math.random() * GLYPH_POOL.length)];
}

// ─── The secret message ──────────────────────────────────────────────────────
const LINE1 = "Pete & Jermz".split("");
const LINE2 = "Forever".split("");
const MESSAGE = [...LINE1, ...LINE2];
const LEN = MESSAGE.length;
const LINE1_LEN = LINE1.length;

type Phase = "scramble" | "resolve" | "hold" | "out";

interface JermzLovePulseProps {
  onClose: () => void;
}

export function JermzLovePulse({ onClose }: JermzLovePulseProps) {
  const [phase, setPhase] = useState<Phase>("scramble");
  const [glyphs, setGlyphs]   = useState<string[]>(() => Array.from({ length: LEN }, randGlyph));
  const [locked, setLocked]   = useState<boolean[]>(Array(LEN).fill(false));
  const tickRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>("scramble");

  const setPhaseSync = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  // ── Phase 1: fast glyph scramble ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== "scramble") return;
    let rampStart = Date.now();
    const SLOW = 80, FAST = 22, RAMP = 900;

    const tick = () => {
      if (phaseRef.current !== "scramble") return;
      const elapsed = Date.now() - rampStart;
      const pct = Math.min(1, elapsed / RAMP);
      const interval = Math.round(SLOW + (FAST - SLOW) * pct);

      setGlyphs(g => g.map(() => randGlyph()));

      if (pct >= 1) {
        setPhaseSync("resolve");
      } else {
        tickRef.current = setTimeout(tick, interval);
      }
    };

    tickRef.current = setTimeout(tick, SLOW);
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Phase 2: lock in characters left → right ──────────────────────────────
  useEffect(() => {
    if (phase !== "resolve") return;
    let idx = 0;

    const lockNext = () => {
      if (idx >= LEN) {
        setPhaseSync("hold");
        return;
      }
      // keep scrambling unlocked ones while locking current
      setGlyphs(g => g.map((ch, i) => (i <= idx ? MESSAGE[i] : randGlyph())));
      setLocked(l => l.map((v, i) => (i <= idx ? true : v)));
      idx++;
      tickRef.current = setTimeout(lockNext, 70);
    };

    // brief hold in fast-scramble before locking starts
    tickRef.current = setTimeout(lockNext, 200);
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Phase 3: hold → fade out ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "hold") return;
    tickRef.current = setTimeout(() => setPhaseSync("out"), 3200);
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Phase 4: done ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "out") return;
    const t = setTimeout(onClose, 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "out" && (
        <motion.div
          key="love-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => setPhaseSync("out")}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, rgba(8,2,40,0.97) 0%, rgba(0,0,0,0.99) 100%)",
          }}
        >
          {/* Scan-line overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.4) 2px, rgba(34,211,238,0.4) 3px)",
            }}
          />

          {/* Corner glyphs - decorative */}
          {["𓂀","𓁹","𓆑","𓇋"].map((g, i) => (
            <span
              key={i}
              className="absolute text-cyan-900/40 text-4xl pointer-events-none select-none"
              style={{
                top:    i < 2 ? "12%" : undefined,
                bottom: i >= 2 ? "12%" : undefined,
                left:   i % 2 === 0 ? "8%" : undefined,
                right:  i % 2 === 1 ? "8%" : undefined,
              }}
            >
              {g}
            </span>
          ))}

          {/* Top label */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: phase === "hold" ? 1 : 0, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-[28%] font-mono text-[9px] tracking-[0.35em] uppercase text-cyan-600/70"
          >
            ✦ transmission decoded ✦
          </motion.p>

          {/* ── Main glyph display — two lines ── */}
          <div className="flex flex-col items-center gap-3">
            {[LINE1, LINE2].map((line, lineIdx) => {
              const offset = lineIdx === 0 ? 0 : LINE1_LEN;
              return (
                <div key={lineIdx} className="flex items-center justify-center gap-x-[2px]">
                  {line.map((_, col) => {
                    const i = offset + col;
                    const isLocked = locked[i];
                    const isAmp   = MESSAGE[i] === "&";
                    const isSpace = MESSAGE[i] === " ";
                    const ch = glyphs[i];
                    return (
                      <motion.span
                        key={i}
                        animate={
                          isLocked
                            ? {
                                opacity: 1,
                                scale: isAmp ? [1, 1.35, 1] : 1,
                                textShadow: isAmp
                                  ? "0 0 18px rgba(244,114,182,0.9)"
                                  : "0 0 10px rgba(34,211,238,0.7)",
                              }
                            : { opacity: 0.45, scale: 1, textShadow: "none" }
                        }
                        transition={{ duration: isAmp ? 0.5 : 0.25 }}
                        className={[
                          "font-mono select-none",
                          isSpace ? "w-3" : "",
                          isLocked && isAmp  ? "text-2xl text-pink-400" : "",
                          isLocked && !isAmp ? "text-xl text-cyan-200"  : "",
                          !isLocked          ? "text-lg text-cyan-700"  : "",
                        ].join(" ")}
                        style={{
                          fontFamily: isLocked ? "'Courier New', monospace" : undefined,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {isSpace ? "\u00A0" : ch}
                      </motion.span>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Glow bar under text */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              phase === "hold"
                ? { scaleX: 1, opacity: 1 }
                : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-6 h-px w-56 bg-gradient-to-r from-transparent via-pink-400/70 to-transparent origin-center"
          />

          {/* Bottom label */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase === "hold" ? 1 : 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute bottom-[28%] font-mono text-[9px] tracking-[0.35em] uppercase text-pink-700/50"
          >
            ♡ tap to seal ♡
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
