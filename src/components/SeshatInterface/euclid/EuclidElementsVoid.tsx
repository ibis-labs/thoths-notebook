"use client";

import React, {
  useCallback, useEffect, useMemo, useReducer,
  useRef, useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, RotateCcw, X } from "lucide-react";
import { DecryptionHeader } from "./DecryptionHeader";
import { snapToNearest, circleCircleIntersections } from "./useEuclideanTools";
import type { Point, Line, Circle } from "./useEuclideanTools";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal geometry state
// ─────────────────────────────────────────────────────────────────────────────
type Tool = "line" | "circle";

interface GeoState {
  points: Point[];
  lines: Line[];
  circles: Circle[];
  nextId: number;
  pending: Point | null; // start of in-progress line or circle
}

const initGeo: GeoState = {
  points: [], lines: [], circles: [], nextId: 1, pending: null,
};

type GeoAction =
  | { type: "TAP"; x: number; y: number; tool: Tool }
  | { type: "RESET" };

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay);
}

function geoReducer(state: GeoState, action: GeoAction): GeoState {
  if (action.type === "RESET") return { ...initGeo };

  const { x, y, tool } = action;
  const id = state.nextId;
  const pt: Point = { id, x, y };

  // Snapped point or new
  const snap = snapToNearest(x, y, allSnappableFrom(state));
  const resolved: Point = snap ?? pt;

  if (!state.pending) {
    // First tap: plant the seed point and set pending
    const newPts = snap ? state.points : [...state.points, { ...resolved, id }];
    return {
      ...state,
      points: newPts,
      nextId: snap ? id : id + 1,
      pending: resolved,
    };
  }

  // Second tap: complete line or circle
  const start = state.pending;
  // Exclude the start point from snap candidates so a tap near it still draws a line
  const candidatesForEnd = allSnappableFrom(state).filter(
    p => p.x !== start.x || p.y !== start.y
  );
  const endSnap = snapToNearest(x, y, candidatesForEnd);
  const endPt = endSnap ?? { ...pt };
  const newPts = endSnap ? state.points : [...state.points, { ...endPt, id }];

  if (tool === "line") {
    return {
      ...state,
      points: newPts,
      lines: [...state.lines, { id: id + 1, a: start, b: endPt }],
      nextId: id + 2,
      pending: null,
    };
  } else {
    const r = dist(start.x, start.y, endPt.x, endPt.y);
    return {
      ...state,
      points: newPts,
      circles: [...state.circles, { id: id + 1, cx: start.x, cy: start.y, r }],
      nextId: id + 2,
      pending: null,
    };
  }
}

function allSnappableFrom(s: GeoState): Point[] {
  const pts = [...s.points];
  for (let i = 0; i < s.circles.length; i++)
    for (let j = i + 1; j < s.circles.length; j++) {
      const ix = circleCircleIntersections(s.circles[i], s.circles[j]);
      if (ix) pts.push(...ix);
    }
  return pts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Postulate definitions (Book I)
// ─────────────────────────────────────────────────────────────────────────────
const POSTULATES = [
  {
    num: "Postulate I",
    prompt: "Manifest a straight line between any two coordinates.",
    instruction: "Tap once to plant a point. Tap again to draw the line.",
    validate: (s: GeoState) => s.lines.length >= 1,
  },
  {
    num: "Postulate II",
    prompt: "Produce a finite straight line continuously in a straight line.",
    instruction: "Draw at least two connected lines end-to-end.",
    validate: (s: GeoState) => {
      if (s.lines.length < 2) return false;
      const ends = s.lines.flatMap(l => [l.a, l.b]);
      return ends.some(p =>
        ends.filter(q => dist(q.x, q.y, p.x, p.y) < 3).length >= 2
      );
    },
  },
  {
    num: "Postulate III",
    prompt: "Describe a circle with any centre and radius.",
    instruction: "Tap a centre point, then tap to set the radius.",
    validate: (s: GeoState) => s.circles.length >= 1,
  },
  {
    num: "Proposition I.1",
    prompt: "Construct an equilateral triangle on a given straight line.",
    instruction: "Draw the base line, then draw two circles of equal radius from each endpoint. Tap the intersection to complete the triangle.",
    validate: (s: GeoState) => s.lines.length >= 3 && s.circles.length >= 2,
  },
  {
    num: "Proposition I.47",
    prompt: "In right-angled triangles the square on the hypotenuse equals the squares on the two legs.",
    instruction: "Construct a right triangle by drawing three lines. The law of Pythagoras applies.",
    validate: (s: GeoState) => s.lines.length >= 3,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG Canvas
// ─────────────────────────────────────────────────────────────────────────────
const SNAP_R = 22;
const NEON = "#bc13fe";
const GOLD = "#d4af37";
const CYAN = "#00e5ff";

function GeometricCanvas({
  geo, tool, cursorPos, snapTarget, successLine,
  width, height,
}: {
  geo: GeoState;
  tool: Tool;
  cursorPos: { x: number; y: number } | null;
  snapTarget: Point | null;
  successLine: number | null;
  width: number;
  height: number;
}) {
  const allSnap = useMemo(() => allSnappableFrom(geo), [geo]);

  return (
    <svg
      width={width}
      height={height}
      style={{ touchAction: "none", userSelect: "none" }}
      className="absolute inset-0"
    >
      <defs>
        <filter id="glow-neon">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-gold">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-soft">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid — very subtle */}
      {Array.from({ length: Math.ceil(height / 40) }, (_, i) => (
        <line key={`gh${i}`} x1={0} y1={i * 40} x2={width} y2={i * 40}
          stroke="rgba(188,19,254,0.04)" strokeWidth={0.5} />
      ))}
      {Array.from({ length: Math.ceil(width / 40) }, (_, i) => (
        <line key={`gv${i}`} x1={i * 40} y1={0} x2={i * 40} y2={height}
          stroke="rgba(188,19,254,0.04)" strokeWidth={0.5} />
      ))}

      {/* Circles */}
      {geo.circles.map(c => (
        <circle key={c.id}
          cx={c.cx} cy={c.cy} r={c.r}
          fill="none" stroke={NEON} strokeWidth={1.2} opacity={0.6}
          filter="url(#glow-soft)"
        />
      ))}

      {/* Lines */}
      {geo.lines.map(l => {
        const isSuccess = l.id === successLine;
        return (
          <line key={l.id}
            x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y}
            stroke={isSuccess ? GOLD : NEON}
            strokeWidth={isSuccess ? 2.5 : 1.5}
            opacity={isSuccess ? 1 : 0.75}
            filter={isSuccess ? "url(#glow-gold)" : "url(#glow-neon)"}
            strokeLinecap="round"
          />
        );
      })}

      {/* In-progress line from pending to cursor */}
      {geo.pending && cursorPos && tool === "line" && (
        <line
          x1={geo.pending.x} y1={geo.pending.y}
          x2={snapTarget?.x ?? cursorPos.x}
          y2={snapTarget?.y ?? cursorPos.y}
          stroke={NEON} strokeWidth={1} opacity={0.35}
          strokeDasharray="6 4" strokeLinecap="round"
        />
      )}

      {/* In-progress circle */}
      {geo.pending && cursorPos && tool === "circle" && (() => {
        const r = dist(geo.pending.x, geo.pending.y, snapTarget?.x ?? cursorPos.x, snapTarget?.y ?? cursorPos.y);
        return (
          <circle cx={geo.pending.x} cy={geo.pending.y} r={r}
            fill="none" stroke={CYAN} strokeWidth={1} opacity={0.3}
            strokeDasharray="5 4"
          />
        );
      })()}

      {/* Points — dot only, no halo */}
      {geo.points.map(p => (
        <g key={p.id} filter="url(#glow-soft)">
          <circle cx={p.x} cy={p.y} r={4} fill={NEON} opacity={0.9} />
        </g>
      ))}

      {/* Snap indicator — throb ring around nearest point */}
      {snapTarget && (
        <circle cx={snapTarget.x} cy={snapTarget.y} r={14}
          fill="none" stroke={GOLD} strokeWidth={1.5} opacity={0.9}
          filter="url(#glow-gold)"
        >
          <animate attributeName="r" values="12;18;12" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Cursor ghost */}
      {cursorPos && !snapTarget && (
        <circle cx={cursorPos.x} cy={cursorPos.y} r={5}
          fill="none" stroke={NEON} strokeWidth={1} opacity={0.4}
        />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main full-screen overlay
// ─────────────────────────────────────────────────────────────────────────────
type VoidPhase = "gate" | "decrypting" | "intro" | "ready";

export interface EuclidElementsVoidProps {
  onClose: () => void;
  /** The user's Scribe Name (displayName from Firebase) */
  scribesName?: string;
  /** Name of the last postulate the user completed, if any */
  lastPostulateName?: string;
  /** Index of the postulate to resume at */
  resumeIdx?: number;
  /** Callback fired each time a new postulate is mastered */
  onProgress?: (postIdx: number, postNum: string) => void;
}

export function EuclidElementsVoid({
  onClose,
  scribesName,
  lastPostulateName,
  resumeIdx = 0,
  onProgress,
}: EuclidElementsVoidProps) {
  const hasProgress = lastPostulateName !== undefined;
  // Animation plays first; gate welcome screen comes after
  const [phase, setPhase] = useState<VoidPhase>("decrypting");
  const [tool, setTool] = useState<Tool>("line");
  const [postIdx, setPostIdx] = useState(resumeIdx);
  const [geo, dispatchGeo] = useReducer(geoReducer, initGeo);
  const [successLine, setSuccessLine] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [p1Lines, setP1Lines] = useState(0);       // lines drawn while on Postulate I
  const [p1Satisfied, setP1Satisfied] = useState(false); // true after 3 lines drawn
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [showNav, setShowNav] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 390, h: 500 });

  // Measure canvas area
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [phase]);

  const post = POSTULATES[postIdx];
  const allSnap = useMemo(() => allSnappableFrom(geo), [geo]);

  // Derive snap target from cursor
  const snapTarget = cursorPos
    ? snapToNearest(cursorPos.x, cursorPos.y, allSnap, SNAP_R)
    : null;

  // Get SVG-relative coords from a touch/mouse event
  const getSVGCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const el = containerRef.current;
    if (!el) return { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  // Touch handlers
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    setCursorPos(getSVGCoords(t.clientX, t.clientY));
  }, [getSVGCoords]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    setCursorPos(getSVGCoords(t.clientX, t.clientY));
  }, [getSVGCoords]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const { x, y } = getSVGCoords(t.clientX, t.clientY);
    const snap = snapToNearest(x, y, allSnap, SNAP_R);
    const fx = snap?.x ?? x;
    const fy = snap?.y ?? y;

    if (window.navigator.vibrate) window.navigator.vibrate(30);
    dispatchGeo({ type: "TAP", x: fx, y: fy, tool });
  }, [getSVGCoords, allSnap, tool]);

  // Mouse fallback (desktop dev)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setCursorPos(getSVGCoords(e.clientX, e.clientY));
  }, [getSVGCoords]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getSVGCoords(e.clientX, e.clientY);
    const snap = snapToNearest(x, y, allSnap, SNAP_R);
    dispatchGeo({ type: "TAP", x: snap?.x ?? x, y: snap?.y ?? y, tool });
  }, [getSVGCoords, allSnap, tool]);

  // Check validation after each geo update
  useEffect(() => {
    if (successMsg) return;
    if (post.validate(geo)) {
      if (window.navigator.vibrate) window.navigator.vibrate([40, 40, 120]);
      const lastLine = geo.lines[geo.lines.length - 1];
      if (lastLine) setSuccessLine(lastLine.id);
      setSuccessMsg(`${post.num}: Verified`);
    }
  }, [geo, post, successMsg]);

  // Track extra lines for Postulate I
  useEffect(() => {
    if (postIdx !== 0) return;
    const n = geo.lines.length;
    setP1Lines(n);
    if (n >= 3) setP1Satisfied(true);
  }, [geo.lines.length, postIdx]);

  const goTo = (i: number) => {
    setPostIdx(i);
    dispatchGeo({ type: "RESET" });
    setSuccessLine(null);
    setSuccessMsg(null);
    setShowNav(false);
    setP1Lines(0);
    setP1Satisfied(false);
  };

  const advance = () => {
    if (postIdx < POSTULATES.length - 1) {
      const next = postIdx + 1;
      onProgress?.(next, POSTULATES[next].num);
      goTo(next);
    }
  };

  const reset = () => {
    dispatchGeo({ type: "RESET" });
    setSuccessLine(null);
    setSuccessMsg(null);
    if (postIdx === 0) { setP1Lines(0); setP1Satisfied(false); }
  };

  const borderGlow = "0 0 0 1px #bc13fe, 0 0 8px 1px #9400d3";

  // ── Gate screen ─────────────────────────────────────────────────────────
  if (phase === "gate") {
    const title = scribesName ? `Greetings, ${scribesName}.` : "Welcome, Scribe.";
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center px-8"
        style={{ boxShadow: "inset 0 0 0 1px #bc13fe4d" }}
      >
        <div className="pointer-events-none absolute inset-[1px]" style={{ boxShadow: borderGlow }} />

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl border border-fuchsia-900/40 text-fuchsia-700 hover:text-fuchsia-400 active:scale-95">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          {/* Ornament */}
          <div className="text-4xl" style={{ textShadow: "0 0 20px #d4af37" }}>⟐</div>

          {/* Greeting */}
          <div>
            <p className="text-amber-300 font-display font-bold text-xl tracking-[0.15em] uppercase"
              style={{ textShadow: "0 0 8px #d4af37" }}>{title}</p>
            {hasProgress ? (
              <>
                <p className="text-fuchsia-400/70 font-mono text-xs mt-3 leading-relaxed">
                  You last mastered
                </p>
                <p className="text-amber-400 font-display font-bold text-base tracking-[0.1em] uppercase mt-1"
                  style={{ textShadow: "0 0 6px #d4af37" }}>
                  {lastPostulateName}
                </p>
                <p className="text-fuchsia-500/50 font-mono text-[11px] mt-3 leading-relaxed">
                  Shall we continue from where the line was left?<br />
                  Or choose a postulate from the navigation menu.
                </p>
              </>
            ) : (
              <p className="text-fuchsia-400/60 font-mono text-xs mt-3 leading-relaxed">
                You stand at the threshold of Euclid&apos;s Elements.<br />
                Five postulates. Eternal truths. Begin with a single line.
              </p>
            )}
          </div>

          {/* Enter button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase(hasProgress ? "ready" : "intro")}
            className="mt-2 px-8 py-3 rounded-2xl border border-amber-600/50 bg-amber-950/20 text-amber-300 font-display text-xs uppercase tracking-[0.3em] transition-all"
            style={{ boxShadow: "0 0 15px rgba(212,175,55,0.2)" }}
          >
            {hasProgress ? "Continue" : "Proceed to Introduction"}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── Introduction screen ─────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col"
        style={{ boxShadow: "inset 0 0 0 1px #bc13fe4d" }}
      >
        <div className="pointer-events-none absolute inset-[1px]" style={{ boxShadow: borderGlow }} />

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl border border-fuchsia-900/40 text-fuchsia-700 hover:text-fuchsia-400 active:scale-95 z-20">
          <X size={18} />
        </button>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-10 space-y-6">

          {/* Title */}
          <div className="text-center pt-4">
            <div className="text-4xl mb-4" style={{ textShadow: "0 0 20px #d4af37" }}>⟐</div>
            <h1 className="text-amber-300 font-display font-bold text-base tracking-[0.2em] uppercase"
              style={{ textShadow: "0 0 10px #d4af37" }}>
              Welcome to Euclid&apos;s Elements
            </h1>
          </div>

          {/* Opening */}
          <p className="text-fuchsia-300/75 font-mono text-xs leading-relaxed">
            Ancient wisdom, truly. Consider that the Great Pyramid had reached its full height well over
            2,000 years before Euclid was even born. Now, for over two millennia, we have studied the
            Great Geometer&apos;s work. You stand at the threshold, an inheritor of this wisdom—if you
            work for it. We do not merely &ldquo;draw shapes&rdquo;—we decode the architecture of reality.
          </p>

          {/* Section: The Call */}
          <div>
            <h2 className="text-amber-400/90 font-display font-bold text-xs uppercase tracking-[0.25em] mb-2"
              style={{ textShadow: "0 0 6px #d4af37" }}>
              The Call to the Sandbox
            </h2>
            <p className="text-fuchsia-300/70 font-mono text-xs leading-relaxed">
              Before you can build monuments or calculate the curvature of the stars, you must master
              the fundamental strokes. We begin with the Postulates: five divine permissions that allow
              us to move from a blank void to a complex universe.
            </p>
            <p className="text-fuchsia-300/70 font-mono text-xs leading-relaxed mt-2">
              Why does this matter? Because every grand construction—from the screen you touch to the
              orbit of the moon—is built upon these simple, unshakeable truths. By mastering this
              interactive course, you are training your mind to see the invisible logic that holds
              the world together.
            </p>
          </div>

          {/* Section: The Wonders */}
          <div>
            <h2 className="text-amber-400/90 font-display font-bold text-xs uppercase tracking-[0.25em] mb-3"
              style={{ textShadow: "0 0 6px #d4af37" }}>
              The Wonders Ahead
            </h2>
            <p className="text-fuchsia-400/60 font-mono text-[10px] mb-2 italic">
              As you progress through the{" "}
              <span className="text-amber-300/80 not-italic" style={{ textShadow: "0 0 4px #d4af3780" }}>Elements</span>,
              {" "}you will unlock:
            </p>
            <ul className="space-y-3">
              {[
                ["The Art of Equilibrium", "Learning to build perfect triangles and squares from nothing but circles."],
                ["The Secret of the Ratio", "Understanding how small parts relate to the infinite whole."],
                ["The Logic of the Infinite", "Discovering why some lines never meet, no matter how far they are extended into the digital abyss."],
                ["The Path of Proof", "Learning how to use these simple results to prove much, much more."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <span className="text-amber-500/60 mt-0.5 shrink-0">◈</span>
                  <div>
                    <span className="text-amber-300/85 font-display font-bold text-[10px] uppercase tracking-wider">{title}: </span>
                    <span className="text-fuchsia-300/65 font-mono text-[10px] leading-relaxed">{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Section: The Commitment */}
          <div className="border border-amber-700/25 rounded-2xl bg-amber-950/10 p-4">
            <h2 className="text-amber-400/90 font-display font-bold text-xs uppercase tracking-[0.25em] mb-2"
              style={{ textShadow: "0 0 6px #d4af37" }}>
              The Commitment
            </h2>
            <p className="text-fuchsia-300/70 font-mono text-xs leading-relaxed">
              To proceed, you must pledge to trust the logic over your eyes. In this virtual sandbox,
              &ldquo;close enough&rdquo; does not exist—only the mathematical Truth verified by your toolkit.
            </p>
            <p className="text-amber-300/70 font-mono text-xs leading-relaxed mt-2 italic">
              Do you swear to follow the path of the Straightedge and the Compass, seeking the
              precision of the Great Geometer?
            </p>
          </div>

          {/* Oath button */}
          <div className="flex justify-center pt-2 pb-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { goTo(0); setPhase("ready"); }}
              className="px-10 py-4 rounded-2xl border border-amber-500/60 bg-amber-950/25 text-amber-200 font-display font-bold text-sm uppercase tracking-[0.35em] transition-all"
              style={{ boxShadow: "0 0 20px rgba(212,175,55,0.25), inset 0 0 20px rgba(212,175,55,0.05)" }}
            >
              I swear it.
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      style={{ boxShadow: "inset 0 0 0 1px #bc13fe4d" }}
    >
      {/* ── RITUAL FRAME BORDER ── */}
      <div className="pointer-events-none absolute inset-[1px] rounded-none"
        style={{ boxShadow: borderGlow, zIndex: 1 }} />

      {/* ── FULL-SCREEN SKIP OVERLAY (decrypting only) ── */}
      {phase === "decrypting" && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={() => setPhase("gate")}
          onTouchEnd={e => { e.preventDefault(); setPhase("gate"); }}
        >
          <p className="absolute bottom-8 left-0 right-0 text-center text-xs font-mono select-none pointer-events-none"
            style={{ color: "#bc13fe99", textShadow: "0 0 10px #bc13fe66" }}>
            tap anywhere to skip
          </p>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2 z-10">
        {phase === "decrypting" ? (
          <div className="flex-1 relative">
            <DecryptionHeader onComplete={() => setPhase("gate")} />
          </div>
        ) : (
          <div className="flex-1 text-center">
            <div className="text-amber-400 font-display font-bold text-lg tracking-[0.25em] uppercase"
              style={{ textShadow: "0 0 8px #d4af37" }}>
              EUCLID&apos;S Elements
            </div>
            <div className="text-fuchsia-500/50 text-[9px] font-mono uppercase tracking-[0.4em]">
              {post.num}
            </div>
          </div>
        )}

        {/* Nav menu trigger */}
        {phase === "ready" && (
          <button
            onClick={() => setShowNav(v => !v)}
            className="ml-2 p-2 rounded-xl border border-fuchsia-900/40 text-fuchsia-500/60 hover:text-fuchsia-300 active:scale-95"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* ── DROP-DOWN NAV MENU ── */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-16 right-4 z-30 bg-black/95 border border-fuchsia-700/30 rounded-2xl p-2 min-w-[200px]"
            style={{ boxShadow: borderGlow }}
          >
            {/* Introduction entry */}
            <button onClick={() => { setShowNav(false); setPhase("intro"); }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-mono transition-all min-h-[44px] text-fuchsia-500/60 hover:bg-fuchsia-900/20 hover:text-fuchsia-300"
            >
              <div className="font-bold uppercase tracking-wider text-[10px]">Introduction</div>
              <div className="text-[9px] opacity-70 mt-0.5">The oath. The architecture of reality.</div>
            </button>
            <div className="border-t border-fuchsia-900/20 my-1" />
            {POSTULATES.map((p, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-mono transition-all min-h-[44px] ${
                  postIdx === i
                    ? "bg-amber-900/30 text-amber-300 border border-amber-700/30"
                    : "text-fuchsia-500/60 hover:bg-fuchsia-900/20 hover:text-fuchsia-300"
                }`}
              >
                <div className="font-bold uppercase tracking-wider text-[10px]">{p.num}</div>
                <div className="text-[9px] opacity-70 mt-0.5 line-clamp-1">{p.prompt}</div>
              </button>
            ))}
            <div className="border-t border-fuchsia-900/30 mt-1 pt-1">
              <button onClick={onClose}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-mono text-red-500/60 hover:bg-red-900/10 hover:text-red-400 min-h-[44px]">
                ✕ Exit the Void
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POSTULATE PROMPT ── */}
      {phase === "ready" && (
        <div className="shrink-0 px-5 pb-2 z-10">
          <div className="rounded-xl border border-amber-700/20 bg-amber-950/10 p-3">
            <p className="text-amber-300/90 text-xs font-mono leading-relaxed">{post.prompt}</p>
            <p className="text-fuchsia-600/60 text-[10px] font-mono mt-1 italic">{post.instruction}</p>
          </div>
        </div>
      )}

      {/* ── CANVAS ── */}
      {phase === "ready" && (
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{ touchAction: "none" }}
        >
          <GeometricCanvas
            geo={geo}
            tool={tool}
            cursorPos={cursorPos}
            snapTarget={snapTarget}
            successLine={successLine}
            width={canvasSize.w}
            height={canvasSize.h}
          />

          {/* Success overlay */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-4 bottom-24 pointer-events-none"
              >
                <div className="text-center px-6 py-4 rounded-2xl border border-amber-600/50 bg-black/80 backdrop-blur-sm"
                  style={{ boxShadow: "0 0 20px rgba(212,175,55,0.3)" }}>
                  <div className="text-amber-400 font-display font-bold text-base tracking-[0.2em] uppercase"
                    style={{ textShadow: "0 0 10px #d4af37" }}>
                    {successMsg}
                  </div>
                  <div className="text-fuchsia-400/60 text-[10px] font-mono mt-1 uppercase tracking-widest">
                    The construction holds.
                  </div>
                  {postIdx === 0 && !p1Satisfied && (
                    <div className="text-amber-400/55 text-[9px] font-mono mt-1">
                      {3 - p1Lines} more line{3 - p1Lines !== 1 ? "s" : ""} to seal the truth.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Postulate I: satisfaction ambient text */}
          <AnimatePresence>
            {postIdx === 0 && p1Satisfied && (
              <motion.p
                key="p1-satisfied"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-x-8 bottom-3 text-center text-[10px] font-mono italic pointer-events-none select-none"
                style={{ color: "#d4af37", textShadow: "0 0 14px rgba(212,175,55,0.55)" }}
              >
                When you are satisfied that a line can connect any two points, move along.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── POSTULATE I CONTEXT PANEL ── */}
      <AnimatePresence>
        {phase === "ready" && postIdx === 0 && !!successMsg && (
          <motion.div
            key="p1-context"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="shrink-0 overflow-hidden border-t border-amber-900/20"
          >
            <div className="overflow-y-auto max-h-52 px-5 py-3 space-y-3">
              <p className="text-amber-400/60 font-display font-bold text-[10px] uppercase tracking-[0.2em]">
                Clarifications for the Student
              </p>

              <div>
                <p className="text-amber-300/75 font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                  The Point (The &ldquo;Plant&rdquo;):
                </p>
                <p className="text-fuchsia-300/65 font-mono text-[10px] leading-relaxed">
                  A point is a location without magnitude—pure position. That means it doesn&apos;t take
                  up any space. At all. None. No height, no width, no depth. No nothing. Just a point
                  in space. Smaller than a pea. Smaller than a grain of sand. Smaller than a hydrogen
                  atom. In this exercise, it is a coordinate{" "}
                  <em className="text-amber-300/80 not-italic">(x, y)</em>; in the cosmos, a location.
                  Nothing more.
                </p>
              </div>

              <div>
                <p className="text-amber-300/75 font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                  The Line (The &ldquo;Manifestation&rdquo;):
                </p>
                <p className="text-fuchsia-300/65 font-mono text-[10px] leading-relaxed">
                  This has &ldquo;length&rdquo; but no &ldquo;width.&rdquo; It&apos;s skinnier than a snake, than a piece of
                  spaghetti, thinner in fact than anything. Not even an atom wide. A line is the
                  shortest path between two points. By drawing it, you prove that your digital void is
                  continuous and that no distance is too vast for logic to bridge. Try it again. Try to
                  imagine a shorter distance between the two points. Like, how?
                </p>
              </div>

              {p1Lines < 3 && (
                <p className="text-amber-400/50 font-mono text-[9px] italic">
                  Draw {3 - p1Lines} more line{3 - p1Lines !== 1 ? "s" : ""} to confirm the truth of this postulate.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM TOOLBAR ── */}
      {phase === "ready" && (
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 z-10 border-t border-fuchsia-900/20">
          {/* Tool selector */}
          <div className="flex gap-2">
            {([
              { t: "line"   as Tool, label: "—", title: "Line"   },
              { t: "circle" as Tool, label: "○", title: "Circle" },
            ]).map(({ t, label, title }) => (
              <button key={t} onClick={() => setTool(t)} title={title}
                className={`w-12 h-12 rounded-xl border font-display text-sm transition-all active:scale-95 ${
                  tool === t
                    ? "border-fuchsia-500/60 bg-fuchsia-800/30 text-fuchsia-200"
                    : "border-fuchsia-900/30 text-fuchsia-700 hover:border-fuchsia-600/40"
                }`}
                style={tool === t ? { boxShadow: "0 0 10px #bc13fe55" } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Prev / Reset / Next */}
          <div className="flex items-center gap-2">
            <button onClick={() => goTo(Math.max(0, postIdx - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-fuchsia-900/30 text-fuchsia-700 hover:text-fuchsia-400 active:scale-95">
              <ChevronLeft size={16} />
            </button>
            <button onClick={reset}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-fuchsia-900/30 text-fuchsia-700 hover:text-fuchsia-400 active:scale-95">
              <RotateCcw size={14} />
            </button>
            {(() => {
              const canAdvance = !!successMsg && (postIdx !== 0 || p1Satisfied);
              return (
                <motion.button
                  onClick={canAdvance ? advance : undefined}
                  animate={p1Satisfied && postIdx === 0 ? {
                    boxShadow: [
                      "0 0 4px rgba(212,175,55,0.15)",
                      "0 0 16px rgba(212,175,55,0.55)",
                      "0 0 4px rgba(212,175,55,0.15)",
                    ],
                  } : {}}
                  transition={p1Satisfied && postIdx === 0
                    ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                    : {}}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors active:scale-95 ${
                    canAdvance
                      ? "border-amber-500/50 text-amber-400 hover:bg-amber-900/20"
                      : "border-fuchsia-900/20 text-fuchsia-900/40 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight size={16} />
                </motion.button>
              );
            })()}
          </div>

          {/* Step counter */}
          <div className="text-[10px] font-mono text-fuchsia-800/60 tabular-nums w-12 text-right">
            {postIdx + 1}/{POSTULATES.length}
          </div>
        </div>
      )}
    </motion.div>
  );
}
