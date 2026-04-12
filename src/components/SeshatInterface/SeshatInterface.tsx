"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sunrise, Stars, ChevronLeft, ChevronRight, Music2, BookOpen, TrendingUp } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// EUCLID DATA — Books I–XIII with representative propositions + problems
// ─────────────────────────────────────────────────────────────────────────────
const EUCLID_BOOKS = [
  {
    book: "I", title: "Plane Geometry",
    summary: "Foundations of geometry: triangles, parallels, the Pythagorean theorem.",
    propositions: [
      { num: "I.1",  text: "To construct an equilateral triangle on a given finite straight line.", problem: "Construct an equilateral triangle on a segment of length 5." },
      { num: "I.5",  text: "In isosceles triangles the angles at the base equal one another.", problem: "Given an isosceles triangle with equal sides 7, verify the base angles are equal." },
      { num: "I.32", text: "In any triangle the exterior angle equals the sum of the two interior and opposite angles; and the sum of the three interior angles equals two right angles.", problem: "A triangle has angles 40° and 65°. Find the third angle." },
      { num: "I.47", text: "In right-angled triangles the square on the side opposite the right angle equals the sum of the squares on the sides containing the right angle.", problem: "A right triangle has legs 3 and 4. Find the hypotenuse." },
    ],
  },
  {
    book: "II", title: "Geometric Algebra",
    summary: "Areas of rectangles and squares transformed into algebraic identities.",
    propositions: [
      { num: "II.4",  text: "If a straight line is cut at random, the square on the whole equals the squares on the segments plus twice the rectangle contained by the segments.", problem: "Cut segment 10 into parts 3 and 7. Verify (3+7)² = 3² + 7² + 2·3·7." },
      { num: "II.11", text: "To cut a given straight line so that the rectangle contained by the whole and one of the segments equals the square on the remaining segment.", problem: "Find the golden ratio cut of a segment of length 10." },
    ],
  },
  {
    book: "III", title: "Circles",
    summary: "Properties of circles: chords, tangents, arcs, and inscribed angles.",
    propositions: [
      { num: "III.3",  text: "If in a circle a diameter bisects a chord, it cuts it at right angles.", problem: "A chord of length 8 is 3 units from the center. Find the radius." },
      { num: "III.20", text: "In a circle the angle at the center is double the angle at the circumference when both subtend the same arc.", problem: "An inscribed angle is 35°. What is the central angle on the same arc?" },
      { num: "III.31", text: "In a circle the angle in the semicircle is right.", problem: "Confirm that any angle inscribed in a semicircle of radius 5 is 90°." },
    ],
  },
  {
    book: "IV", title: "Inscribed & Circumscribed Figures",
    summary: "Constructing polygons inscribed in or circumscribed about circles.",
    propositions: [
      { num: "IV.5",  text: "About a given triangle to circumscribe a circle.", problem: "Find the circumradius of a triangle with sides 5, 12, 13." },
      { num: "IV.10", text: "To construct an isosceles triangle having each of the base angles double the remaining one.", problem: "Construct the triangle related to the regular pentagon. What are its angles?" },
      { num: "IV.15", text: "To inscribe an equilateral and equiangular hexagon in a given circle.", problem: "A circle has radius 6. Find the side length of the inscribed regular hexagon." },
    ],
  },
  {
    book: "V", title: "Theory of Proportions",
    summary: "Eudoxus's rigorous theory of ratios applicable to magnitudes of any kind.",
    propositions: [
      { num: "V.7",  text: "Equal magnitudes have the same ratio to the same magnitude.", problem: "If a:b = 3:5, and c = b, what is a:c?" },
      { num: "V.16", text: "If four magnitudes are proportional, they are also proportional alternately.", problem: "If 4:6 = 8:12, verify 4:8 = 6:12." },
    ],
  },
  {
    book: "VI", title: "Similar Figures",
    summary: "Similarity of plane figures and proportional properties.",
    propositions: [
      { num: "VI.1",  text: "Triangles and parallelograms which are under the same height are to one another as their bases.", problem: "Two triangles share height 6; bases are 4 and 9. What is their area ratio?" },
      { num: "VI.19", text: "Similar triangles are to one another in the ratio duplicate of that of the corresponding sides.", problem: "Two similar triangles have corresponding sides 3 and 5. What is their area ratio?" },
      { num: "VI.31", text: "In right-angled triangles the figure on the side opposite the right angle equals the similar figures on the other two sides.", problem: "Generalize the Pythagorean theorem to any similar figure shape." },
    ],
  },
  {
    book: "VII", title: "Elementary Number Theory",
    summary: "Divisibility, prime numbers, and the Euclidean algorithm.",
    propositions: [
      { num: "VII.1", text: "Two unequal numbers being set out, and the less being continually subtracted from the greater, if the remainder never measures the one before it, then the numbers are prime to one another.", problem: "Use the Euclidean algorithm to find GCD(48, 18)." },
      { num: "VII.20", text: "The least numbers of those which have the same ratio with them measure any others which have the same ratio the same number of times.", problem: "Find the LCM of 12 and 18 using their GCD." },
    ],
  },
  {
    book: "VIII", title: "Continued Proportions",
    summary: "Sequences in continued proportion and their powers.",
    propositions: [
      { num: "VIII.8", text: "If between two numbers there fall numbers in continued proportion with them, how many fall between each pair of adjacent numbers in continued proportion.", problem: "Insert two geometric means between 2 and 54." },
    ],
  },
  {
    book: "IX", title: "Number Theory Continued",
    summary: "Perfect numbers, odd and even numbers, and infinite primes.",
    propositions: [
      { num: "IX.20", text: "Prime numbers are more than any assigned multitude of prime numbers.", problem: "Reconstruct Euclid's proof that infinitely many primes exist." },
      { num: "IX.36", text: "If as many numbers as we please beginning from a unit be set out continuously in double proportion, until the sum of all becomes prime, then the product of that sum and the last term is perfect.", problem: "Verify that 2³−1=7 is prime and 2²·(2³−1)=28 is a perfect number." },
    ],
  },
  {
    book: "X", title: "Irrational Magnitudes",
    summary: "Classification of irrationals; incommensurable magnitudes.",
    propositions: [
      { num: "X.1",  text: "Two unequal magnitudes being set out, if from the greater there be subtracted a magnitude greater than its half, and from the remainder a magnitude greater than its half, and so on, there will be left some magnitude which will be less than the lesser set out.", problem: "Starting from 100, repeatedly subtract more than half. How many steps to get below 1?" },
      { num: "X.9",  text: "The sides of squares are incommensurable unless the squares have a ratio of a square number to a square number.", problem: "Is √2 commensurable with 1? Justify using X.9." },
    ],
  },
  {
    book: "XI", title: "Solid Geometry",
    summary: "Planes, lines in three dimensions, parallelepipeds.",
    propositions: [
      { num: "XI.4",  text: "If a straight line be set up at right angles to two straight lines which cut one another, it will also be at right angles to the plane through them.", problem: "Describe how you'd verify a vertical pole is perpendicular to a flat ground plane." },
      { num: "XI.21", text: "The plane angles which form a solid angle at a vertex are together less than four right angles.", problem: "Verify this for the corner of a cube (three 90° angles: 90+90+90 < 360)." },
    ],
  },
  {
    book: "XII", title: "Measurement of Figures",
    summary: "Areas of circles, volumes of pyramids and cones by the method of exhaustion.",
    propositions: [
      { num: "XII.2", text: "Circles are to one another as the squares on their diameters.", problem: "A circle has diameter 4 and another has diameter 6. What is the ratio of their areas?" },
      { num: "XII.10", text: "Any cone is a third part of the cylinder which has the same base with it and an equal height.", problem: "A cylinder has radius 3 and height 8. What is the volume of a cone of equal base and height?" },
    ],
  },
  {
    book: "XIII", title: "The Five Regular Solids",
    summary: "Construction of the tetrahedron, cube, octahedron, dodecahedron, and icosahedron.",
    propositions: [
      { num: "XIII.13", text: "To construct a pyramid, to comprehend it in a given sphere, and to prove that the square of the diameter is one and a half times the square of the edge of the pyramid.", problem: "A sphere has radius 1. Find the edge length of the inscribed tetrahedron." },
      { num: "XIII.15", text: "To construct a cube and comprehend it in a sphere.", problem: "A sphere has radius 1. Find the edge length of the inscribed cube." },
      { num: "XIII.18", text: "To set out the sides of the five figures and to compare them with one another.", problem: "For a sphere of radius 1, compare the edge lengths of all five Platonic solids." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HARMONIA DATA — Pythagorean ratios + note frequencies
// ─────────────────────────────────────────────────────────────────────────────
const NOTE_NAMES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const PYTHAGOREAN_INTERVALS = [
  { name: "Unison",        ratio: "1:1",    cents: 0    },
  { name: "Minor 2nd",     ratio: "256:243",cents: 90   },
  { name: "Major 2nd",     ratio: "9:8",    cents: 204  },
  { name: "Minor 3rd",     ratio: "32:27",  cents: 294  },
  { name: "Major 3rd",     ratio: "81:64",  cents: 408  },
  { name: "Perfect 4th",   ratio: "4:3",    cents: 498  },
  { name: "Tritone",       ratio: "729:512",cents: 612  },
  { name: "Perfect 5th",   ratio: "3:2",    cents: 702  },
  { name: "Minor 6th",     ratio: "128:81", cents: 792  },
  { name: "Major 6th",     ratio: "27:16",  cents: 906  },
  { name: "Minor 7th",     ratio: "16:9",   cents: 996  },
  { name: "Major 7th",     ratio: "243:128",cents: 1110 },
  { name: "Octave",        ratio: "2:1",    cents: 1200 },
];

const SESHAT_BUDS = [
  'path71', 'ellipse71', 'ellipse72', 'ellipse73', 'ellipse74', 'ellipse75',
  'ellipse76', 'ellipse77', 'ellipse78', 'ellipse79', 'ellipse80', 'ellipse81',
  'ellipse82', 'ellipse83', 'ellipse84', 'ellipse85', 'ellipse86', 'ellipse88',
  'ellipse87', 'ellipse89', 'ellipse90', 'ellipse91', 'ellipse92', 'ellipse93',
  'ellipse129','ellipse94', 'ellipse95', 'ellipse96', 'ellipse97', 'ellipse98',
  'ellipse99', 'ellipse100','ellipse101','ellipse102','ellipse103','ellipse104',
  'ellipse105','ellipse106','ellipse107','ellipse108','ellipse109','ellipse110',
  'ellipse111','ellipse112','ellipse113','ellipse114','ellipse115','ellipse116',
  'ellipse117','ellipse118','ellipse119','ellipse120','ellipse121','ellipse122',
  'ellipse123','ellipse124','ellipse125','ellipse126','ellipse127',
];

function CalcButton({ label, display, onClick, variant = "default", className = "" }: { label: string, display?: string, onClick: (val: string) => void, variant?: "default" | "op" | "eq", className?: string }) {
  let colorStyles = "border-fuchsia-500/20 bg-fuchsia-950/10 text-fuchsia-400 hover:bg-fuchsia-500/5 hover:border-fuchsia-400/50";
  if (variant === "op") {
    colorStyles = "border-cyan-500/20 bg-cyan-950/10 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-400/50";
  } else if (variant === "eq") {
    colorStyles = "border-fuchsia-500/50 bg-fuchsia-600/20 text-fuchsia-100 hover:bg-fuchsia-500/30 hover:border-fuchsia-400 shadow-[0_0_15px_rgba(185,21,204,0.4)]";
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92, y: 2 }}
      onClick={() => onClick(label)}
      className={`h-14 flex items-center justify-center rounded-2xl border transition-all shadow-inner font-display text-base ${colorStyles} ${className}`}
    >
      {display ?? label}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EUCLID MODE PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EuclidMode() {
  const [bookIdx, setBookIdx] = useState(0);
  const [propIdx, setPropIdx] = useState(0);
  const [showProblem, setShowProblem] = useState(false);
  const [workInput, setWorkInput] = useState("");
  const [revealed, setRevealed] = useState(false);

  const book = EUCLID_BOOKS[bookIdx];
  const prop = book.propositions[propIdx];

  const goBook = (dir: number) => {
    const next = (bookIdx + dir + EUCLID_BOOKS.length) % EUCLID_BOOKS.length;
    setBookIdx(next);
    setPropIdx(0);
    setShowProblem(false);
    setWorkInput("");
    setRevealed(false);
  };
  const goProp = (dir: number) => {
    const next = (propIdx + dir + book.propositions.length) % book.propositions.length;
    setPropIdx(next);
    setShowProblem(false);
    setWorkInput("");
    setRevealed(false);
  };

  return (
    <div className="flex flex-col gap-3 text-left">
      {/* Book navigator */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => goBook(-1)} className="p-1.5 rounded-lg border border-amber-700/40 text-amber-500 hover:bg-amber-900/20 active:scale-95">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-amber-400 font-display font-bold text-xs uppercase tracking-widest">Book {book.book}</div>
          <div className="text-amber-300/70 text-[10px] uppercase tracking-wider">{book.title}</div>
        </div>
        <button onClick={() => goBook(1)} className="p-1.5 rounded-lg border border-amber-700/40 text-amber-500 hover:bg-amber-900/20 active:scale-95">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Book summary */}
      <p className="text-cyan-700/80 text-[10px] font-mono leading-snug border-l-2 border-amber-700/30 pl-2">{book.summary}</p>

      {/* Proposition navigator */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <button onClick={() => goProp(-1)} className="p-1 rounded-lg border border-fuchsia-800/30 text-fuchsia-600 hover:bg-fuchsia-900/20 active:scale-95">
          <ChevronLeft size={13} />
        </button>
        <span className="text-fuchsia-500/70 text-[10px] font-mono uppercase tracking-widest">{prop.num}</span>
        <button onClick={() => goProp(1)} className="p-1 rounded-lg border border-fuchsia-800/30 text-fuchsia-600 hover:bg-fuchsia-900/20 active:scale-95">
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Proposition text */}
      <div className="bg-black/40 rounded-xl border border-fuchsia-900/30 p-3">
        <p className="text-fuchsia-100/90 text-xs font-mono leading-relaxed">{prop.text}</p>
      </div>

      {/* Problem toggle */}
      {!showProblem ? (
        <button
          onClick={() => setShowProblem(true)}
          className="w-full py-2 rounded-xl border border-amber-700/40 text-amber-500/80 text-xs font-display uppercase tracking-widest hover:bg-amber-900/20 active:scale-95"
        >
          Work a Problem ›
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-amber-300/90 text-xs font-mono leading-relaxed border border-amber-800/30 rounded-xl p-3 bg-black/30">
            {prop.problem}
          </p>
          <textarea
            value={workInput}
            onChange={(e) => setWorkInput(e.target.value)}
            placeholder="Work your solution here…"
            rows={3}
            className="w-full bg-gray-900/80 border border-cyan-800/40 rounded-xl text-cyan-200 text-xs font-mono p-3 resize-none focus:outline-none focus:border-fuchsia-500/60 placeholder-cyan-900"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setRevealed(true)}
              className="flex-1 py-2 rounded-xl border border-fuchsia-700/40 text-fuchsia-400/80 text-xs font-display uppercase tracking-widest hover:bg-fuchsia-900/20 active:scale-95"
            >
              Reveal Hint
            </button>
            <button
              onClick={() => { setShowProblem(false); setWorkInput(""); setRevealed(false); }}
              className="px-3 py-2 rounded-xl border border-cyan-800/30 text-cyan-700 text-xs hover:bg-cyan-900/10 active:scale-95"
            >
              ✕
            </button>
          </div>
          {revealed && (
            <div className="text-[10px] font-mono text-cyan-600/80 border border-cyan-900/30 rounded-xl p-2 bg-black/20 leading-relaxed">
              💡 Use the calculator above to test numeric values, then verify with the proposition's statement.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULUS MODE PANEL
// ─────────────────────────────────────────────────────────────────────────────
const CALC_FUNCTIONS: Record<string, (x: number) => number> = {
  "sin(x)":   (x) => Math.sin(x),
  "cos(x)":   (x) => Math.cos(x),
  "tan(x)":   (x) => Math.tan(x),
  "x²":       (x) => x * x,
  "x³":       (x) => x * x * x,
  "eˣ":       (x) => Math.exp(x),
  "ln(x)":    (x) => Math.log(x),
  "1/x":      (x) => 1 / x,
  "√x":       (x) => Math.sqrt(x),
};

function CalculusMode() {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [fnKey, setFnKey] = useState("sin(x)");
  const [xMin, setXMin] = useState(-6.3);
  const [xMax, setXMax] = useState(6.3);
  const [derivVal, setDerivVal] = useState("");
  const [integVal, setIntegVal] = useState("");
  const [xPoint, setXPoint] = useState("1");

  const W = 300, H = 140;

  const fn = CALC_FUNCTIONS[fnKey];

  // Compute path
  const buildPath = () => {
    const steps = 200;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = fn(x);
      if (!isFinite(y)) continue;
      const px = (i / steps) * W;
      const yRange = 4;
      const py = H / 2 - (y / yRange) * (H / 2);
      pts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${Math.max(0, Math.min(H, py)).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const handleCompute = () => {
    const x0 = parseFloat(xPoint);
    if (isNaN(x0)) return;
    const h = 0.0001;
    const deriv = (fn(x0 + h) - fn(x0 - h)) / (2 * h);
    setDerivVal(isFinite(deriv) ? deriv.toFixed(6) : "undefined");

    // Numerical integral from 0 to x0 (Simpson's rule, n=200)
    const a = 0, b = x0, n = 200;
    if (Math.abs(b - a) < 1e-10) { setIntegVal("0"); return; }
    const step = (b - a) / n;
    let s = fn(a) + fn(b);
    for (let i = 1; i < n; i++) {
      s += (i % 2 === 0 ? 2 : 4) * fn(a + i * step);
    }
    const integ = (step / 3) * s;
    setIntegVal(isFinite(integ) ? integ.toFixed(6) : "undefined");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Function selector */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(CALC_FUNCTIONS).map((k) => (
          <button
            key={k}
            onClick={() => { setFnKey(k); setDerivVal(""); setIntegVal(""); }}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono transition-all active:scale-95 ${
              fnKey === k
                ? "border-fuchsia-500/60 bg-fuchsia-700/20 text-fuchsia-300"
                : "border-cyan-800/30 text-cyan-600 hover:border-cyan-600/50"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* SVG Graph */}
      <div className="rounded-xl overflow-hidden border border-fuchsia-900/30 bg-black/50">
        <svg ref={canvasRef} viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
          {/* Grid lines */}
          <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(185,21,204,0.2)" strokeWidth="1" />
          <line x1={W/2} y1="0" x2={W/2} y2={H} stroke="rgba(185,21,204,0.2)" strokeWidth="1" />
          {[-3,-2,-1,1,2,3].map((v) => {
            const px = ((v - xMin) / (xMax - xMin)) * W;
            return <line key={v} x1={px} y1="0" x2={px} y2={H} stroke="rgba(100,100,150,0.15)" strokeWidth="0.5" strokeDasharray="2,2" />;
          })}
          {/* Curve */}
          <path d={buildPath()} fill="none" stroke="#d946ef" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Labels */}
          <text x={W - 4} y={H/2 - 3} textAnchor="end" fill="rgba(217,70,239,0.5)" fontSize="8">x</text>
          <text x={W/2 + 3} y={9} fill="rgba(217,70,239,0.5)" fontSize="8">y</text>
        </svg>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-cyan-800 font-mono uppercase tracking-widest">Zoom</span>
        <button onClick={() => { setXMin(xMin * 0.7); setXMax(xMax * 0.7); }} className="px-2 py-1 rounded-lg border border-cyan-800/30 text-cyan-600 text-xs hover:bg-cyan-900/10 active:scale-95">+</button>
        <button onClick={() => { setXMin(xMin * 1.4); setXMax(xMax * 1.4); }} className="px-2 py-1 rounded-lg border border-cyan-800/30 text-cyan-600 text-xs hover:bg-cyan-900/10 active:scale-95">−</button>
        <button onClick={() => { setXMin(-6.3); setXMax(6.3); }} className="px-2 py-1 rounded-lg border border-cyan-800/30 text-cyan-700/60 text-[9px] hover:bg-cyan-900/10 active:scale-95 font-mono">reset</button>
      </div>

      {/* Numeric analysis */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[9px] text-fuchsia-700 font-mono uppercase tracking-widest block mb-1">x =</label>
          <input
            type="number"
            value={xPoint}
            onChange={(e) => setXPoint(e.target.value)}
            className="w-full bg-gray-900/80 border border-fuchsia-800/30 rounded-lg text-fuchsia-300 text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-fuchsia-500/60"
          />
        </div>
        <button
          onClick={handleCompute}
          className="px-3 py-1.5 rounded-lg border border-fuchsia-600/40 bg-fuchsia-800/20 text-fuchsia-300 text-xs font-display uppercase tracking-widest hover:bg-fuchsia-700/30 active:scale-95"
        >
          Compute
        </button>
      </div>

      {(derivVal || integVal) && (
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="bg-black/40 rounded-xl border border-cyan-900/30 p-2">
            <div className="text-cyan-700 uppercase tracking-widest mb-0.5 text-[9px]">f′(x)</div>
            <div className="text-cyan-300 break-all">{derivVal}</div>
          </div>
          <div className="bg-black/40 rounded-xl border border-amber-900/30 p-2">
            <div className="text-amber-700 uppercase tracking-widest mb-0.5 text-[9px]">∫₀ˣ f dt</div>
            <div className="text-amber-300 break-all">{integVal}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI KEYBOARD — visualises root + interval pitch classes
// ─────────────────────────────────────────────────────────────────────────────
function freqToPitchClass(f: number): number {
  if (f <= 0 || !isFinite(f)) return -1;
  const midi = Math.round(69 + 12 * Math.log2(f / 440));
  return ((midi % 12) + 12) % 12;
}

// Pitch classes for white keys in octave order: C D E F G A B
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
// Black key positions as fractional white-key offsets + their pitch classes
const BLACK_KEYS = [
  { wi: 0.68, pc: 1  },
  { wi: 1.68, pc: 3  },
  { wi: 3.68, pc: 6  },
  { wi: 4.68, pc: 8  },
  { wi: 5.68, pc: 10 },
];

function MiniKeyboard({ rootPc, resultPc }: { rootPc: number; resultPc: number }) {
  const WW = 14, WH = 52, BW = 9, BH = 32;
  const OCTAVES = 2;
  const totalW = OCTAVES * 7 * WW;

  const keyColor = (pc: number, isBlack: boolean) => {
    const isRoot   = pc === rootPc;
    const isResult = pc === resultPc;
    if (isRoot && isResult) return "#c026d3"; // unison/octave — fused magenta
    if (isRoot)   return "#a855f7"; // violet
    if (isResult) return "#f59e0b"; // amber
    return isBlack ? "#1a0828" : "#0e0118";
  };

  return (
    <div className="rounded-xl overflow-hidden border border-fuchsia-900/30 bg-black/40 p-1">
      <svg viewBox={`0 0 ${totalW} ${WH}`} className="w-full block">
        {/* White keys */}
        {Array.from({ length: OCTAVES }, (_, o) =>
          WHITE_PC.map((pc, wi) => (
            <rect
              key={`w-${o}-${wi}`}
              x={((o * 7 + wi) * WW) + 0.5}
              y={0.5}
              width={WW - 1}
              height={WH - 1}
              rx={2}
              fill={keyColor(pc, false)}
              stroke="rgba(139,92,246,0.25)"
              strokeWidth={0.5}
            />
          ))
        )}
        {/* Black keys */}
        {Array.from({ length: OCTAVES }, (_, o) =>
          BLACK_KEYS.map(({ wi, pc }, bi) => (
            <rect
              key={`b-${o}-${bi}`}
              x={((o * 7 + wi) * WW) + 0.5}
              y={0.5}
              width={BW - 1}
              height={BH - 1}
              rx={1.5}
              fill={keyColor(pc, true)}
              stroke="rgba(139,92,246,0.4)"
              strokeWidth={0.5}
            />
          ))
        )}
        {/* Note name labels on highlighted white keys */}
        {Array.from({ length: OCTAVES }, (_, o) =>
          WHITE_PC.map((pc, wi) => {
            if (pc !== rootPc && pc !== resultPc) return null;
            const x = (o * 7 + wi) * WW + WW / 2;
            return (
              <text
                key={`lbl-${o}-${wi}`}
                x={x}
                y={WH - 5}
                textAnchor="middle"
                fontSize={6}
                fill={pc === rootPc && pc === resultPc ? "#f0abfc" : pc === rootPc ? "#d8b4fe" : "#fcd34d"}
                fontFamily="monospace"
              >
                {NOTE_NAMES[pc]}
              </text>
            );
          })
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HARMONIA MODE — Pythagorean tuning & frequency calculator
// ─────────────────────────────────────────────────────────────────────────────
function HarmoniaMode() {
  const [baseFreq, setBaseFreq] = useState("440");
  const [intervalIdx, setIntervalIdx] = useState(7); // Perfect 5th default
  const [rootNote, setRootNote] = useState(9); // A
  const [waveform, setWaveform] = useState<OscillatorType>("sine");
  const [autoPlay, setAutoPlay] = useState(false);
  const [playing, setPlaying] = useState<"root" | "result" | "dyad" | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<() => void>(() => {});

  // Lazy-init AudioContext on first user gesture (required on iOS)
  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      stopRef.current();
      audioCtxRef.current?.close();
    };
  }, []);

  const base = parseFloat(baseFreq) || 440;
  const interval = PYTHAGOREAN_INTERVALS[intervalIdx];
  const [num, den] = interval.ratio.split(":").map(Number);
  const ratioDecimal = num / den;
  const resultFreq = (base * ratioDecimal).toFixed(3);
  const stringLength = (1 / ratioDecimal).toFixed(4);

  // Core tone synthesiser — sine-wave oscillator with ADSR envelope
  const synthTone = useCallback(
    (ctx: AudioContext, freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = waveform;
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack 30ms → sustain → release 600ms
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.03);
      gainNode.gain.setValueAtTime(gain, startTime + duration - 0.6);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
      return osc;
    },
    [waveform]
  );

  const stop = () => {
    stopRef.current();
    setPlaying(null);
  };

  const play = useCallback(
    (mode: "root" | "result" | "dyad", overrideBase?: number, overrideResult?: number) => {
      stop();
      const ctx = getCtx();
      const now = ctx.currentTime;
      const dur = mode === "dyad" ? 3.5 : 2.2;
      const g = mode === "dyad" ? 0.26 : 0.32;
      const f1 = overrideBase  ?? base;
      const f2 = overrideResult ?? parseFloat(resultFreq);

      const oscs: OscillatorNode[] = [];
      if (mode === "root" || mode === "dyad") {
        oscs.push(synthTone(ctx, f1, now, dur, g));
      }
      if (mode === "result" || mode === "dyad") {
        oscs.push(synthTone(ctx, f2, now, dur, g));
      }

      setPlaying(mode);
      const tid = setTimeout(() => setPlaying(null), dur * 1000);
      stopRef.current = () => {
        clearTimeout(tid);
        const t = ctx.currentTime + 0.05;
        oscs.forEach((o) => { try { o.stop(t); } catch { /* already stopped */ } });
        setPlaying(null);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, resultFreq, synthTone, getCtx]
  );

  const handleIntervalSelect = (i: number) => {
    setIntervalIdx(i);
    if (autoPlay) {
      // Compute frequencies directly from the new index — never read from state
      // which may not have re-rendered yet, causing the race that made the same
      // interval sound different on successive taps.
      const inv = PYTHAGOREAN_INTERVALS[i];
      const [n, d] = inv.ratio.split(":").map(Number);
      const newResult = base * (n / d);
      play("dyad", base, newResult);
    }
  };

  const WAVEFORMS: { type: OscillatorType; label: string; desc: string }[] = [
    { type: "sine",     label: "Sine",     desc: "Pure / Pythagorean" },
    { type: "triangle", label: "Triangle", desc: "Warm / Organ"       },
    { type: "sawtooth", label: "Saw",      desc: "Bright / Strings"   },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Header inscription */}
      <div className="text-[9px] text-amber-700/60 font-mono uppercase tracking-[0.3em] text-center border-b border-amber-900/20 pb-2">
        𓏞 · As Above in Number, So Below in Sound · 𓏞
      </div>

      {/* Root note selector */}
      <div>
        <div className="text-[9px] text-fuchsia-700 font-mono uppercase tracking-widest mb-1.5">Root Note</div>
        <div className="flex flex-wrap gap-1">
          {NOTE_NAMES.map((n, i) => (
            <button
              key={n}
              onClick={() => {
                setRootNote(i);
                setBaseFreq((440 * Math.pow(2, (i - 9) / 12)).toFixed(2));
              }}
              className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono transition-all active:scale-95 ${
                rootNote === i
                  ? "border-fuchsia-500/60 bg-fuchsia-800/30 text-fuchsia-200"
                  : "border-fuchsia-900/20 text-fuchsia-700 hover:border-fuchsia-600/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Base Hz override */}
      <div className="flex items-center gap-2">
        <label className="text-[9px] text-cyan-700 font-mono uppercase tracking-widest shrink-0">Base (Hz)</label>
        <input
          type="number"
          value={baseFreq}
          onChange={(e) => setBaseFreq(e.target.value)}
          className="flex-1 bg-gray-900/80 border border-cyan-800/30 rounded-lg text-cyan-300 text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-fuchsia-500/60"
        />
      </div>

      {/* Waveform + auto-play controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {WAVEFORMS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setWaveform(type)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono transition-all active:scale-95 ${
              waveform === type
                ? "border-fuchsia-500/50 bg-fuchsia-800/20 text-fuchsia-300"
                : "border-fuchsia-900/20 text-fuchsia-700 hover:border-fuchsia-600/40"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setAutoPlay((a) => !a)}
          className={`ml-auto px-2 py-1 rounded-lg border text-[10px] font-mono transition-all active:scale-95 ${
            autoPlay
              ? "border-amber-500/50 bg-amber-900/20 text-amber-300"
              : "border-amber-900/20 text-amber-700/60 hover:border-amber-700/40"
          }`}
        >
          {autoPlay ? "Auto ✓" : "Auto"}
        </button>
      </div>

      {/* Interval selector */}
      <div>
        <div className="text-[9px] text-fuchsia-700 font-mono uppercase tracking-widest mb-1.5">Pythagorean Interval</div>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
          {PYTHAGOREAN_INTERVALS.map((inv, i) => (
            <button
              key={inv.name}
              onClick={() => handleIntervalSelect(i)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all active:scale-95 text-left ${
                intervalIdx === i
                  ? "border-amber-500/50 bg-amber-900/20 text-amber-200"
                  : "border-amber-900/20 text-amber-700 hover:border-amber-700/40"
              }`}
            >
              <span>{inv.name}</span>
              <span className="text-fuchsia-600/70">{inv.ratio}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini keyboard */}
      <MiniKeyboard rootPc={freqToPitchClass(base)} resultPc={freqToPitchClass(parseFloat(resultFreq))} />

      {/* Result readout */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-black/40 rounded-xl border border-fuchsia-900/30 p-2">
          <div className="text-[8px] text-fuchsia-700 uppercase tracking-widest mb-0.5">Result (Hz)</div>
          <div className="text-fuchsia-300 text-xs font-mono">{resultFreq}</div>
        </div>
        <div className="bg-black/40 rounded-xl border border-amber-900/30 p-2">
          <div className="text-[8px] text-amber-700 uppercase tracking-widest mb-0.5">Cents</div>
          <div className="text-amber-300 text-xs font-mono">{interval.cents}</div>
        </div>
        <div className="bg-black/40 rounded-xl border border-cyan-900/30 p-2">
          <div className="text-[8px] text-cyan-700 uppercase tracking-widest mb-0.5">String ℓ</div>
          <div className="text-cyan-300 text-xs font-mono">{stringLength}</div>
        </div>
      </div>

      {/* Play buttons */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { mode: "root",   label: "▶ Root",     color: "fuchsia" },
          { mode: "result", label: "▶ Interval",  color: "amber"   },
          { mode: "dyad",   label: "▶ Together",  color: "cyan"    },
        ] as { mode: "root" | "result" | "dyad"; label: string; color: string }[]).map(({ mode, label, color }) => (
          <motion.button
            key={mode}
            whileTap={{ scale: 0.93 }}
            onClick={() => playing === mode ? stop() : play(mode)}
            className={`py-2 rounded-xl border text-[10px] font-display uppercase tracking-widest transition-all active:scale-95
              ${playing === mode
                ? `border-${color}-400/60 bg-${color}-700/30 text-${color}-200 shadow-[0_0_12px_rgba(185,21,204,0.3)]`
                : `border-${color}-900/30 text-${color}-700 hover:border-${color}-700/40 hover:bg-${color}-950/20`
              }`}
          >
            {playing === mode ? "■ Stop" : label}
          </motion.button>
        ))}
      </div>

      {/* Footer lore */}
      <div className="text-[9px] text-fuchsia-900/60 font-mono text-center">
        Pythagoras: the cosmos is number made audible
      </div>
    </div>
  );
}

function toEgyptian(valStr: string): string {
  const val = parseFloat(valStr);
  if (isNaN(val) || !isFinite(val)) return valStr;
  if (Number.isInteger(val)) return val.toString();

  let v = Math.abs(val);
  let result = [];
  let intPart = Math.floor(v);
  if (intPart > 0) {
    result.push(intPart.toString());
    v -= intPart;
  }

  let maxIterations = 10;
  while (v > 0.000001 && maxIterations > 0) {
    let dr = Math.ceil(1 / v);
    result.push(`1/${dr}`);
    v -= 1 / dr;
    maxIterations--;
  }
  
  let finalStr = result.length > 0 ? result.join(" + ") : "0";
  return val < 0 ? `-(${finalStr})` : finalStr;
}

type CalcMode = 'SIMPLE' | 'SCIENTIFIC' | 'EGYPTIAN';
type EsotericaMode = 'EUCLID' | 'CALCULUS' | 'HARMONIA' | null;

export function SeshatInterface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isRippleLocked, setIsRippleLocked] = useState(false);
  const rippleLockRef = useRef(false);

  const [mode, setMode] = useState<CalcMode>('SIMPLE');
  const [calcInput, setCalcInput] = useState("0");
  const [calcMemory, setCalcMemory] = useState("");
  const [esoterica, setEsoterica] = useState<EsotericaMode>(null);

  // Load the SVG
  useEffect(() => {
    fetch("/images/SeshatAnimation.svg")
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
      })
      .catch((err) => console.error("Failed to load Seshat SVG:", err));
  }, []);

  // Setup Clock and Ripple effects
  useEffect(() => {
    if (!svgContent) return;

    const tick = () => {
      if (!containerRef.current) return;
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const isQtr = now.getMinutes() % 15 === 0;
      const pastHalf = now.getMinutes() >= 30;
      const n = SESHAT_BUDS.length - 1;

      const mainIdx = Math.round((mins / 1440) * n);
      const halfMins = now.getHours() * 60 + 30;
      const halfIdx = Math.round((halfMins / 1440) * n);

      const getBud = (id: string) => containerRef.current?.querySelector(`#${id}`) as HTMLElement | null;

      SESHAT_BUDS.forEach((id) => {
        const el = getBud(id);
        if (el) {
          el.classList.remove("seshat-bud-on", "seshat-bud-dim");
        }
      });

      const mainEl = getBud(SESHAT_BUDS[mainIdx]);
      if (mainEl) mainEl.classList.add("seshat-bud-on");

      if (pastHalf && halfIdx !== mainIdx) {
        const halfEl = getBud(SESHAT_BUDS[halfIdx]);
        if (halfEl) halfEl.classList.add("seshat-bud-dim");
      }

      if (isQtr && !rippleLockRef.current) {
        rippleLockRef.current = true;
        setIsRippleLocked(true);
        SESHAT_BUDS.forEach((id, i) => {
          const el = getBud(id);
          if (el) {
            el.style.animation = `seshat-ripple 0.8s ${(i * 0.025).toFixed(3)}s ease-out forwards`;
          }
        });

        setTimeout(() => {
          SESHAT_BUDS.forEach((id) => {
            const el = getBud(id);
            if (el) {
              el.style.animation = "";
            }
          });
          rippleLockRef.current = false;
          setIsRippleLocked(false);
        }, 2600);
      } else if (!isQtr) {
        rippleLockRef.current = false;
        setIsRippleLocked(false);
      }
    };

    tick();
    const intervalId = setInterval(tick, 60_000);

    return () => clearInterval(intervalId);
  }, [svgContent]);

  const toggleMode = () => {
    if (mode === 'SIMPLE') setMode('SCIENTIFIC');
    else if (mode === 'SCIENTIFIC') setMode('EGYPTIAN');
    else setMode('SIMPLE');
  };

  const handleCalcClick = (val: string) => {
    if (window.navigator.vibrate) window.navigator.vibrate(40);
    if (val === "C") {
      setCalcInput("0");
      setCalcMemory("");
      return;
    }
    if (val === "RND") {
      const rand = Math.random().toString().slice(0, 7); // e.g., 0.1234
      if (calcInput === "0" || calcInput === "Error") {
        setCalcInput(rand);
      } else {
        setCalcInput(calcInput + rand);
      }
      return;
    }
    if (val === "=") {
      try {
        let evalStr = calcInput
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/sqrt\(/g, "Math.sqrt(")
          .replace(/\^/g, "**")
          .replace(/π/g, "Math.PI")
          .replace(/I\?/g, "Math.PI")
          .replace(/e/g, "Math.E");

        const result = new Function(`return ${evalStr}`)();
        setCalcMemory(calcInput);
        setCalcInput(String(result));
      } catch (e) {
        setCalcInput("Error");
      }
      return;
    }

    if (val === "1/x") {
      const cur = calcInput === "0" || calcInput === "Error" ? "0" : calcInput;
      setCalcMemory(calcInput);
      setCalcInput(`1/(${cur})`);
      return;
    }

    if (calcInput === "0" || calcInput === "Error") {
      setCalcInput(val);
    } else {
      setCalcInput(calcInput + val);
    }
  };

  const getDisplayText = () => {
    if (mode === 'EGYPTIAN') {
      const parsed = Number(calcInput);
      if (!isNaN(parsed) && calcInput !== "Error" && calcInput !== "") {
         return toEgyptian(calcInput);
      }
    }
    return calcInput;
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center p-4 md:p-6 gap-6 md:gap-10">
      {/* BACKGROUND ANIMATION / SVG CONTAINER */}
      <div
        id="seshat-button"
        className="w-full max-w-2xl h-auto drop-shadow-[0_0_25px_rgba(185,21,204,0.3)] animate-pulse-purple text-[#B915CC]"
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* RIGHT COLUMN: CONTROLLER + DISPLAY + KEYPAD */}
      <div className="relative z-10 w-full max-w-md flex flex-col gap-3">

        {/* ── CONTROLLER ── */}
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-fuchsia-500/20 bg-black/60 backdrop-blur-md ring-2 ring-fuchsia-900/60 ring-offset-2 ring-offset-black">
          <div className="flex items-center gap-3">
            <Stars className="w-4 h-4 text-fuchsia-500/50 animate-pulse shrink-0" />
            <div>
              <h2 className="font-headline text-fuchsia-400 uppercase tracking-widest text-sm leading-tight">Seshat Interface</h2>
              <p className="text-fuchsia-300/50 text-[9px] uppercase tracking-widest">Cosmic Arithmetics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Esoterica button */}
            <button
              onClick={() => setEsoterica(esoterica ? null : 'EUCLID')}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-display font-bold uppercase tracking-widest transition-colors active:scale-95 ${
                esoterica
                  ? "border-amber-500/60 bg-amber-800/30 text-amber-300"
                  : "border-amber-700/30 bg-amber-950/20 text-amber-600 hover:bg-amber-900/20"
              }`}
            >
              𓂀
            </button>
            {/* Calc mode button — hidden while esoterica is open */}
            {!esoterica && (
              <button
                onClick={toggleMode}
                className="px-3 py-2 bg-fuchsia-500/20 rounded-xl hover:bg-fuchsia-500/40 transition-colors border border-fuchsia-500/30 active:scale-95"
              >
                <span className="font-display text-fuchsia-400 text-xs font-bold tracking-widest">{mode}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── DISPLAY ── */}
        <div className="w-full bg-black/80 rounded-[2rem] border border-fuchsia-500/30 px-6 py-4 shadow-2xl text-right backdrop-blur-md ring-2 ring-fuchsia-900/60 ring-offset-2 ring-offset-black">
          <div className="min-h-[20px] text-fuchsia-500/50 font-mono text-xs mb-1 break-all">{calcMemory}</div>
          <div className="text-2xl md:text-3xl font-display text-fuchsia-300 tracking-wider break-all">{getDisplayText()}</div>
        </div>

        {/* ── KEYPAD ── */}
        <div className="w-full rounded-[2.5rem] border border-fuchsia-500/30 bg-black/60 backdrop-blur-md shadow-2xl p-4 md:p-5 ring-2 ring-fuchsia-900/60 ring-offset-2 ring-offset-black">

          <AnimatePresence mode="wait">
            {esoterica ? (
              <motion.div
                key="esoterica"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Esoterica sub-mode tab bar */}
                <div className="flex gap-1.5 mb-3">
                  {([
                    { id: 'EUCLID',   icon: <BookOpen size={11} />,   label: 'Euclid'   },
                    { id: 'CALCULUS', icon: <TrendingUp size={11} />, label: 'Calculus' },
                    { id: 'HARMONIA', icon: <Music2 size={11} />,     label: 'Harmonia' },
                  ] as { id: EsotericaMode; icon: React.ReactNode; label: string }[]).map(({ id, icon, label }) => (
                    <button
                      key={id as string}
                      onClick={() => setEsoterica(id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border text-[10px] font-display uppercase tracking-widest transition-all active:scale-95 ${
                        esoterica === id
                          ? "border-amber-500/50 bg-amber-900/20 text-amber-300"
                          : "border-amber-900/20 text-amber-700/60 hover:border-amber-700/40"
                      }`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-fuchsia-500/10 pt-3">
                  {esoterica === 'EUCLID'   && <EuclidMode />}
                  {esoterica === 'CALCULUS' && <CalculusMode />}
                  {esoterica === 'HARMONIA' && <HarmoniaMode />}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="calculator"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {mode === 'SCIENTIFIC' ? (
                  <div className="flex flex-col gap-2">
                    {/* Main numpad — 4 cols */}
                    <div className="grid grid-cols-4 gap-2">
                      {["C", "(", ")", "/"].map((btn) => (
                        <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant="op" />
                      ))}
                      {["7", "8", "9", "*"].map((btn) => (
                        <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*","/","+","-"].includes(btn) ? "op" : "default"} />
                      ))}
                      {["4", "5", "6", "-"].map((btn) => (
                        <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*","/","+","-"].includes(btn) ? "op" : "default"} />
                      ))}
                      {["1", "2", "3", "+"].map((btn) => (
                        <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*","/","+","-"].includes(btn) ? "op" : "default"} />
                      ))}
                      {["0", ".", "π", "="].map((btn) => (
                        <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={btn === "=" ? "eq" : "default"} />
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-fuchsia-500/20 my-0.5" />

                    {/* Function keys — 4 cols */}
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { label: "sin(", display: "sin()" },
                        { label: "cos(", display: "cos()" },
                        { label: "tan(", display: "tan()" },
                        { label: "^",    display: "xʸ"    },
                      ] as { label: string; display: string }[]).map(({ label, display }) => (
                        <CalcButton key={label} label={label} display={display} onClick={handleCalcClick} variant="op" className="text-sm" />
                      ))}
                      {([
                        { label: "log(",  display: "log()" },
                        { label: "ln(",   display: "ln()"  },
                        { label: "sqrt(", display: "√()"   },
                        { label: "1/x",   display: "1/x"   },
                      ] as { label: string; display: string }[]).map(({ label, display }) => (
                        <CalcButton key={label} label={label} display={display} onClick={handleCalcClick} variant="op" className="text-sm" />
                      ))}
                      <CalcButton label="RND" onClick={handleCalcClick} className="col-span-4 text-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {["C", "(", ")", "/"].map((btn) => (
                      <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant="op" />
                    ))}
                    {["7", "8", "9", "*"].map((btn) => (
                      <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*","/","+","-"].includes(btn) ? "op" : "default"} />
                    ))}
                    {["4", "5", "6", "-"].map((btn) => (
                      <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*","/","+","-"].includes(btn) ? "op" : "default"} />
                    ))}
                    {["1", "2", "3", "+"].map((btn) => (
                      <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*","/","+","-"].includes(btn) ? "op" : "default"} />
                    ))}
                    {["0", ".", "RND", "="].map((btn) => (
                      <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={btn === "=" ? "eq" : "default"} className={btn === "RND" ? "text-sm" : ""} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-purple {
            0%, 100% {
                filter: drop-shadow(0 0 10px #B915CC);
            }
            50% {
                filter: drop-shadow(0 0 30px #B915CC);
            }
        }
        .animate-pulse-purple {
            animation: pulse-purple 6s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
