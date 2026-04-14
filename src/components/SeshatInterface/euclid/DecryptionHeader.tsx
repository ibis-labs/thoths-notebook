"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Data — all three phases share the same 9 + 8 cell grid
//   Line 1: ΕΥΚΛΕΙΔΗΣ (Eukleides) — 9 cells
//   Line 2: ΣΤΟΙΧΕΙΑ  (Stoikheia) — 8 cells
// ─────────────────────────────────────────────────────────────────────────────
const HIEROGLYPH_POOL = [
  "𓄿","𓅀","𓅁","𓅂","𓅃","𓅆","𓅇","𓅈","𓆑","𓆓","𓆦","𓇋","𓇌","𓇍",
  "𓈖","𓈘","𓉔","𓉡","𓊃","𓊆","𓊇","𓊪","𓋀","𓋁","𓌀","𓌁","𓌃","𓍿",
  "𓎛","𓎜","𓏏","𓏑","𓂀","𓂋","𓂌","𓃭","𓃮","𓄂","𓄃","𓁹","𓁺",
];

// Line 1 — 9 hieroglyphs (phonetic approximation of Ε-Υ-Κ-Λ-Ε-Ι-Δ-Η-Σ)
const EGYPT_LINE1 = ["𓇋","𓅱","𓎡","𓃭","𓇋","𓇋","𓂧","𓇋","𓊃"];
// Line 2 — 8 hieroglyphs (phonetic approximation of Σ-Τ-Ο-Ι-Χ-Ε-Ι-Α)
const EGYPT_LINE2 = ["𓊃","𓏏","𓂋","𓇋","𓎛","𓄿","𓇋","𓄿"];

// Greek — ΕΥΚΛΕΙΔΗΣ (9)
const GREEK_1 = ["Ε","Υ","Κ","Λ","Ε","Ι","Δ","Η","Σ"];
// Greek — ΣΤΟΙΧΕΙΑ (8)
const GREEK_2 = ["Σ","Τ","Ο","Ι","Χ","Ε","Ι","Α"];

// English transliterations — same 9 + 8 grid
const ENGLISH_1 = ["E","U","K","L","E","I","D","E","S"];
const ENGLISH_2 = ["E","L","E","M","E","N","T","S"];

// Morph map — Line 1 (ΕΥΚΛΕΙΔΗΣ → EUCLID):
//   positions 0-3 survive (Ε→E, Υ→U, Κ→C, Λ→L)
//   position 4 excess (Ε), positions 5-6 survive (Ι→I, Δ→D)
//   positions 7-8 excess (Η, Σ)  — null = fades out & width collapses
const LINE1_MORPH: (string | null)[] = ["E","U","C","L",null,"I","D",null,null];
// Morph map — Line 2 (ΣΤΟΙΧΕΙΑ → ELEMENTS): all 8 positions survive
const LINE2_MORPH: string[] = ["E","L","E","M","E","N","T","S"];
// Survivor indices for stagger delay calculation
const SURVIVORS_1 = [0,1,2,3,5,6];

const TOTAL_POSITIONS = EGYPT_LINE1.length + EGYPT_LINE2.length; // 17

function randGlyph() {
  return HIEROGLYPH_POOL[Math.floor(Math.random() * HIEROGLYPH_POOL.length)];
}

/**
 * Builds a per-position lock schedule (ms after ramp peak).
 * Line 1 (9 letters): geometric decay — each gap = prev × 0.8,
 *   starting from line1LockStart (the gap between letter 0 and letter 1).
 *   Letter 0 itself snaps after line1LockStart ms.
 * Line 2 (8 letters): uniform lockRate between each letter.
 */
function buildLockSchedule(lockRate: number, line1LockStart: number): number[] {
  const schedule: number[] = [];
  let t = 0;
  for (let i = 0; i < EGYPT_LINE1.length; i++) {
    t += Math.round(line1LockStart * Math.pow(0.8, i));
    schedule.push(t);
  }
  for (let i = 0; i < EGYPT_LINE2.length; i++) {
    t += lockRate;
    schedule.push(t);
  }
  return schedule;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
export interface DecryptionHeaderProps {
  onComplete: () => void;
  onPhaseChange?: (phase: string) => void;
  /** ms between each glyph on line 1 (default 130) */
  line1Speed?: number;
  /** ms between each glyph on line 2 (default 60) */
  line2Speed?: number;
  /** ms cursor blinks after both lines typed before scramble begins (default 900) */
  teletypeHold?: number;
  /** ms before the first glyph appears (default 500) */
  initialDelay?: number;
  /** ms pause (cursor visible on line 2) before line 2 begins typing; ≈ 1300 = 2 blinks (default 1300) */
  interLineDelay?: number;
  /** ms to ramp from slow scramble (180ms ticks) to peak (25ms ticks) (default 1800) */
  scrambleRamp?: number;
  /** ms per Greek letter reveal once peak speed is reached (default 120) */
  lockRate?: number;
  /** ms gap between the 1st and 2nd Line-1 letter locking in; each subsequent gap is 80% of the previous (default 480) */
  line1LockStart?: number;
  /** ms Greek is shown before morphing to English (default 1200) */
  greekHold?: number;
  /** ms each English character takes to cross-fade (default 300) */
  morphDuration?: number;
  /** ms stagger between each character morph (default 60) */
  morphStagger?: number;
  /** ms English is held before onComplete fires (default 800) */
  englishHold?: number;
  /** ms per tick at peak-slow scramble speed — higher = glyphs change more lazily at start (default 450) */
  scrambleSlowTick?: number;
}

type Phase = "teletype" | "scramble" | "greek" | "morph" | "english";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function DecryptionHeader({
  onComplete,
  onPhaseChange,
  line1Speed    = 130,
  line2Speed    = 60,
  teletypeHold  = 900,
  initialDelay    = 1950,  // ≈ 3 blink cycles (3 × 650 ms) before first glyph
  interLineDelay  = 1300,  // ≈ 2 blink cycles on line 2 before typing starts
  scrambleRamp    = 1800,
  lockRate        = 120,
  line1LockStart  = 480,
  greekHold     = 1200,
  morphDuration = 2200,  // sand-dissolve crossfade; also drives morph timers
  morphStagger  = 60,
  englishHold   = 800,
  scrambleSlowTick = 450,
}: DecryptionHeaderProps) {
  const [phase, setPhase]             = useState<Phase>("teletype");
  const [line1Count, setLine1Count]   = useState(0);
  const [line2Count, setLine2Count]   = useState(0);

  const [display1, setDisplay1]       = useState<string[]>([...EGYPT_LINE1]);
  const [display2, setDisplay2]       = useState<string[]>([...EGYPT_LINE2]);
  const [lockedCount, setLockedCount] = useState(0);

  // morph-phase state
  const [excessGone,     setExcessGone]     = useState(false);
  const [lettersSwapped, setLettersSwapped] = useState(false);

  const frameRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const changePhase = (p: Phase) => {
    setPhase(p);
    onPhaseChange?.(p);
  };

  // ── Phase 1: teletype ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "teletype") return;
    let c1 = 0, c2 = 0;

    const typeLine2 = () => {
      c2++;
      setLine2Count(c2);
      if (c2 < EGYPT_LINE2.length) {
        frameRef.current = setTimeout(typeLine2, line2Speed);
      } else {
        frameRef.current = setTimeout(() => changePhase("scramble"), teletypeHold);
      }
    };

    const typeLine1 = () => {
      c1++;
      setLine1Count(c1);
      if (c1 < EGYPT_LINE1.length) {
        frameRef.current = setTimeout(typeLine1, line1Speed);
      } else {
        frameRef.current = setTimeout(typeLine2, interLineDelay);
      }
    };

    frameRef.current = setTimeout(typeLine1, initialDelay);
    return () => { if (frameRef.current) clearTimeout(frameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Phase 2: scramble → lock ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "scramble") return;

    const TICK_SLOW = scrambleSlowTick;
    const TICK_FAST = 25;

    const startTime = Date.now();
    let locked = 0;
    const schedule = buildLockSchedule(lockRate, line1LockStart);

    setDisplay1([...EGYPT_LINE1]);
    setDisplay2([...EGYPT_LINE2]);
    setLockedCount(0);

    const tick = () => {
      const elapsed  = Date.now() - startTime;
      const rampPct  = Math.min(1, elapsed / scrambleRamp);
      const interval = Math.round(TICK_SLOW + (TICK_FAST - TICK_SLOW) * rampPct);

      let newLocked = locked;
      if (rampPct >= 1) {
        const timeSinceRamp = elapsed - scrambleRamp;
        while (newLocked < TOTAL_POSITIONS && schedule[newLocked] <= timeSinceRamp) {
          newLocked++;
        }
      }

      if (newLocked > locked) {
        locked = newLocked;
        setLockedCount(newLocked);
      }

      setDisplay1(EGYPT_LINE1.map((_, i) => (i < locked ? GREEK_1[i] : randGlyph())));
      setDisplay2(EGYPT_LINE2.map((_, i) => {
        const pos = EGYPT_LINE1.length + i;
        return pos < locked ? GREEK_2[i] : randGlyph();
      }));

      if (locked >= TOTAL_POSITIONS) {
        changePhase("greek");
        return;
      }

      frameRef.current = setTimeout(tick, interval);
    };

    frameRef.current = setTimeout(tick, scrambleSlowTick);
    return () => { if (frameRef.current) clearTimeout(frameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Phase 3: Greek hold → Morph ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== "greek") return;
    const t = setTimeout(() => changePhase("morph"), greekHold);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, greekHold]);

  // ── Phase 3b: Morph — excess collapse → tighten → letter-swap ───────────
  useEffect(() => {
    if (phase !== "morph") return;
    setExcessGone(false);
    setLettersSwapped(false);
    const COLLAPSE_MS = 900;
    // t1: start excess-cell collapse immediately
    const t1 = setTimeout(() => setExcessGone(true), 50);
    // t2: after collapse + buffer, begin sand-dissolve crossfade
    const t2 = setTimeout(() => setLettersSwapped(true), 50 + COLLAPSE_MS + 300);
    // t3: after full crossfade completes, advance to english hold
    const t3 = setTimeout(() => changePhase("english"), 50 + COLLAPSE_MS + 300 + morphDuration + 300);
    return () => { [t1, t2, t3].forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Phase 4: English hold → onComplete ───────────────────────────────────
  useEffect(() => {
    if (phase !== "english") return;
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, englishHold);
    return () => clearTimeout(t);
  }, [phase, onComplete, englishHold]);

  const glowFuchsia = { textShadow: "0 0 8px #bc13fe, 0 0 20px #bc13fe, 0 0 40px #9400d3" };
  const glowGold    = { textShadow: "0 0 6px #d4af37, 0 0 16px #d4af37" };

  const line1Done = line1Count >= EGYPT_LINE1.length;
  const line2Done = line2Count >= EGYPT_LINE2.length;

  // ── Shared cell grid — pixel-identical across all phases ─────────────────
  const renderGrid = (
    chars1: (string | null)[],
    chars2: (string | null)[],
    opts?: {
      opacity1?: (i: number) => number;
      style1?:   (i: number) => React.CSSProperties;
      opacity2?: (i: number) => number;
      style2?:   (i: number) => React.CSSProperties;
      cursor1?: number;
      cursor2?: number;
    }
  ) => {
    const o1 = opts?.opacity1 ?? (() => 1);
    const o2 = opts?.opacity2 ?? (() => 1);
    const s1 = opts?.style1   ?? (() => glowFuchsia);
    const s2 = opts?.style2   ?? (() => glowFuchsia);
    const c1 = opts?.cursor1  ?? -1;
    const c2 = opts?.cursor2  ?? -1;
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-center">
          {chars1.map((ch, i) => (
            <span key={i} className="relative inline-flex items-center justify-center w-10 h-10 text-2xl font-mono">
              <span style={{ ...s1(i), opacity: o1(i) }}>{ch ?? ""}</span>
              {i === c1 && (
                <span
                  className="glyph-cursor absolute inset-0 flex items-center justify-center text-2xl font-mono leading-none"
                  style={{ color: "#bc13fe", textShadow: "0 0 8px #bc13fe, 0 0 20px #bc13fe", transform: "scaleX(3)", transformOrigin: "center" }}
                >▌</span>
              )}
            </span>
          ))}
        </div>
        <div className="flex justify-center">
          {chars2.map((ch, i) => (
            <span key={i} className="relative inline-flex items-center justify-center w-10 h-10 text-2xl font-mono">
              <span style={{ ...s2(i), opacity: o2(i) }}>{ch ?? ""}</span>
              {i === c2 && (
                <span
                  className="glyph-cursor absolute inset-0 flex items-center justify-center text-2xl font-mono leading-none"
                  style={{ color: "#bc13fe", textShadow: "0 0 8px #bc13fe, 0 0 20px #bc13fe", transform: "scaleX(3)", transformOrigin: "center" }}
                >▌</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 select-none">
      <style>{`
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .glyph-cursor { animation: cursor-blink 0.65s step-end infinite; }
      `}</style>

      <AnimatePresence mode="wait">

        {/* ── TELETYPE ── */}
        {phase === "teletype" && (
          <motion.div key="teletype" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}>
            {renderGrid(
              EGYPT_LINE1,
              EGYPT_LINE2,
              {
                opacity1: i => i < line1Count ? 1 : 0,
                opacity2: i => !line1Done ? 0 : i < line2Count ? 0.9 : 0,
                cursor1:  !line1Done ? line1Count : -1,
                cursor2:  line1Done && !line2Done ? line2Count : -1,
              }
            )}
          </motion.div>
        )}

        {/* ── SCRAMBLE → LOCK ── */}
        {phase === "scramble" && (
          <motion.div key="scramble" initial={{ opacity: 1 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}>
            {renderGrid(
              display1,
              display2,
              {
                style1: i => ({
                  ...(i < lockedCount ? glowGold : glowFuchsia),
                  ...(i < lockedCount ? { fontFamily: 'var(--font-jura)', fontWeight: 700 } : {}),
                }),
                style2: i => ({
                  ...((EGYPT_LINE1.length + i) < lockedCount ? glowGold : glowFuchsia),
                  ...((EGYPT_LINE1.length + i) < lockedCount ? { fontFamily: 'var(--font-jura)', fontWeight: 700 } : {}),
                }),
                opacity2: i => (EGYPT_LINE1.length + i) < lockedCount ? 1 : 0.75,
              }
            )}
          </motion.div>
        )}

        {/* ── GREEK / MORPH / ENGLISH ─────────────────────────────────────────
             Single outer panel (same key = no remount across all three phases).
             Greek:   full 9+8 fuchsia grid.
             Morph:   excess cells collapse, survivors tighten, then letter-swap.
             English: final gold word held until onComplete.                   ── */}
        {(phase === "greek" || phase === "morph" || phase === "english") && (
          <motion.div key="greek-morph-english" initial={{ opacity: 1 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <div className="flex flex-col items-center gap-2">

              {/* Line 1: ΕΥΚΛΕΙΔΗΣ (9) → EUCLID (6) — 3 excess cells collapse */}
              <div className="flex justify-center items-center">
                <AnimatePresence initial={false}>
                  {GREEK_1.map((gChar, i) => {
                    const eLetter = LINE1_MORPH[i];
                    const isExcess = eLetter === null;
                    // Remove excess cells from DOM once collapse starts
                    if (phase !== "greek" && excessGone && isExcess) return null;
                    return (
                      <motion.span
                        key={i}
                        layout
                        className="relative inline-flex items-center justify-center h-10 text-2xl font-mono overflow-hidden"
                        style={{ width: "2.5rem" }}
                        exit={{ width: 0, opacity: 0, transition: { duration: 0.9, ease: "easeInOut" } }}
                        transition={{ layout: { type: "spring", stiffness: 100, damping: 18 } }}
                      >
                        <AnimatePresence mode="sync">
                          {phase === "greek" || !lettersSwapped ? (
                            <motion.span
                              key="g"
                              className="absolute"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, transition: { duration: morphDuration / 1000 } }}
                              style={{ ...glowGold, fontFamily: 'var(--font-jura)', fontWeight: 700 }}
                            >{gChar}</motion.span>
                          ) : (
                            <motion.span
                              key="e"
                              className="absolute"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: morphDuration / 1000, delay: 0 }}
                              style={{ ...glowGold, fontFamily: 'var(--font-orbitron)', fontWeight: 700 }}
                            >{eLetter}</motion.span>
                          )}
                        </AnimatePresence>
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Line 2: ΣΤΟΙΧΕΙΑ (8) → ELEMENTS (8) — all survive, crossfade only */}
              <div className="flex justify-center items-center">
                {GREEK_2.map((gChar, i) => (
                  <span key={i} className="relative inline-flex items-center justify-center w-10 h-10 text-2xl font-mono">
                    <AnimatePresence mode="sync">
                      {phase === "greek" || !lettersSwapped ? (
                        <motion.span
                          key="g"
                          className="absolute"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: morphDuration / 1000 } }}
                          style={{ ...glowGold, fontFamily: 'var(--font-jura)', fontWeight: 700 }}
                        >{gChar}</motion.span>
                      ) : (
                        <motion.span
                          key="e"
                          className="absolute"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: morphDuration / 1000, delay: 0 }}
                          style={{ ...glowGold, fontFamily: 'var(--font-orbitron)', fontWeight: 700 }}
                        >{LINE2_MORPH[i]}</motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                ))}
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
