import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const SEBAYT_ENTRIES = [
  {
    id: 'security',
    title: 'Security & Sovereignty: The 24 Words',
    content: `Your journey in the Ptah Network begins with absolute sovereignty. Upon initiation, you were granted the 24 Words of Heka (Magic). This seed phrase is the ultimate key to your digital Ba (soul). 
    
WARNING: The Midnight Scribe cannot recover lost words. You must write these 24 words down on physical papyrus or stone and guard them with your life. Do not store them in the digital ether. Without them, your connection to Thoth's Notebook is severed permanently.`
  },
  {
    id: 'task-creation',
    title: 'The Paths of Action: Task Creation',
    content: `In Thoth's Notebook, thoughts are rendered into reality through Task Creation. You are the architect of your day. While you can create standard tasks for fleeting thoughts, the true power of the Ptah Network lies in categorization. You must define your tasks carefully, separating the mundane from the divine, to maintain order in your personal cosmos.`
  },
  {
    id: 'daily-rituals',
    title: 'Daily Rituals & The Midnight Scribe',
    content: `Daily Rituals are the cornerstone of a disciplined mind. Unlike fleeting tasks, Daily Rituals are intended to help you forge unbreakable habits. 

At the stroke of 12:00 AM, the automated Midnight Scribe runs through the network, dutifully copying your active Daily Rituals and presenting you with a fresh slate for the new day. 

Ostraca Integration: You can link your Daily Rituals to your Ostraca (digital shards of notes and knowledge) so that the necessary instructions, incantations, or references are always attached to the ritual when it regenerates.`
  },
  {
    id: 'khet-special-missions',
    title: 'Khet & Special Missions',
    content: `Beyond standard routines, the Ptah Network offers open-ended classifications for your actions.

Khet (The Physical Body): In the ancient tongue, Khet represents the physical form. Use this category for tasks that require physical exertion, material gathering, or real-world manifestation.

Special Missions & Other Categories: What constitutes a "Special Mission"? That is entirely up to your perception. The Ptah Network leaves these classifications intentionally fluid. A Special Mission is exactly what you believe it to be—a high-priority quest, a sudden burst of inspiration, or an anomaly in your daily cycle.`
  },
  {
    id: 'maat-nun',
    title: 'The Scales of Balance: Ma\'at and Nun',
    content: `Your actions in Thoth's Notebook are weighed on the cosmic scales. 

Ma'at: Represents truth, balance, and cosmic order. Completing your tasks and honoring your commitments brings your digital ecosystem into a state of Ma'at.

Nun: The primordial abyss of chaos and unformed potential. When tasks are abandoned and rituals are ignored, your interface begins to slip into Nun. The void consumes disorder. Do not let your tasks drown in the abyss.`
  },
  {
    id: 'oath-streaks',
    title: 'The Oath of Commitment & Streaks',
    content: `To uphold Ma'at, you must take the Oath of Commitment. This is a pledge to consistency. As you complete your Daily Rituals, the Ptah Network tracks your Streaks—a glowing, numerical testament to your unwavering discipline. Breaking the Oath resets your Streak, forcing you to rebuild your temple from the foundation up.`
  },
  {
    id: 'evening-chronicle',
    title: 'The Evening Chronicle',
    content: `As Ra's solar barque descends into the underworld, it is time for reflection. The Evening Chronicle is your nightly space to log your triumphs, record your failures, and synthesize the events of your waking hours. Managing your Daily Rituals culminates here, ensuring your mind is clear before the Midnight Scribe arrives.`
  },
  {
    id: 'gifts-of-ptah',
    title: 'Gifts of Ptah',
    content: `Ptah is the creator god, the master architect, and the patron of craftsmen. A Gift of Ptah is a special reward bestowed upon you by the network for exceptional dedication, monumental streaks, or discovering hidden truths within the Notebook. These artifacts enhance your interface and serve as badges of your ascension.`
  },
  {
    id: 'seshat-interface',
    title: 'The Seshat Interface: Cosmic Arithmetics',
    content: `The Seshat Interface is Thoth's Notebook's advanced calculation chamber, presided over by Seshat — goddess of counting, writing, and the measurement of time. Access it from the Main Hall.

The Controller Bar sits above the display and contains two keys: the mode button, which cycles through the three calculator modes, and the 𓂀 glyph, which opens the Esoterica panel.

Three Core Modes (tap the mode button to cycle):

SIMPLE — A clean four-function calculator with parentheses and a random-number generator (RND). Ideal for everyday arithmetic.

SCIENTIFIC — Full scientific calculator with trigonometric functions (sin, cos, tan), logarithms (log, ln), square root (√), powers (x^y), and reciprocal (1/x). Function keys insert proper notation directly into the expression; tap = to evaluate.

EGYPTIAN — Transforms numeric results into Egyptian unit fractions. The ancient Egyptians expressed no general fraction a/b — every fractional value was written as a sum of distinct unit fractions (e.g. 2/3 = 1/2 + 1/6). The result display rewrites your answer in this ancient arithmetic notation.

The Esoterica System:
Tap the 𓂀 glyph in the Controller to open the Esoterica panel. Three hidden chambers of deeper mathematical knowledge appear: EUCLID (a complete reader of Euclid's Elements), CALCULUS (a graphing calculator with numeric derivative and integral), and HARMONIA (a Pythagorean tuning and sound synthesiser).`
  },
  {
    id: 'harmonia-mode',
    title: 'Harmonia: The Music of the Spheres',
    content: `Pythagoras discovered that the harmonious intervals of music are governed by simple integer ratios: 2:1 for the octave, 3:2 for the perfect fifth, 4:3 for the perfect fourth. He called this the Music of the Spheres — the cosmos itself vibrates in these proportions.

Harmonia is a Pythagorean monochord calculator that computes these ratios and lets you hear them directly through your device's speaker.

HOW TO USE HARMONIA:

Root Note — Select the chromatic note you want as your starting pitch. All twelve notes of the chromatic scale are available. The base frequency updates automatically (A4 = 440 Hz is standard concert pitch; you can override this).

Base (Hz) — Type a custom frequency. Useful for historical tuning: A4 = 432 Hz (Verdi pitch), A4 = 415 Hz (Baroque standard), or any other system.

Waveform — The timbre of the synthesiser:
• Sine: pure, mathematically clean — the tone Pythagoras envisioned on the monochord
• Triangle: warm, resembling a wooden flute or soft organ pipe
• Sawtooth: bright and rich in harmonics; consonance and dissonance become most vivid here

Pythagorean Interval — Select any of the 13 intervals from the Pythagorean chromatic scale. These use the exact integer ratios derived from dividing a string by whole number lengths — the same method Pythagoras used on his monochord instrument.

The Mini Keyboard — Displays two octaves of the chromatic scale. Your root note is highlighted in violet; the interval note in amber. When both share the same pitch class (Unison 1:1, Octave 2:1), they glow fused magenta. The note names appear on highlighted keys.

Play Buttons:
• ▶ Root — sounds the base note alone, sustaining for 2 seconds
• ▶ Interval — sounds the second note of the interval alone
• ▶ Together — plays both simultaneously as a Pythagorean dyad for 3.5 seconds. Consonant ratios (Perfect 5th 3:2, Perfect 4th 4:3) ring pure and stable. Dissonant ones (Tritone 729:512, Minor 2nd 256:243) vibrate with audible tension.

Auto Mode — When enabled, selecting any interval in the list immediately plays the dyad, letting you scan the entire scale to hear each interval's character in sequence.

The Three Readouts:
• Result (Hz) — the exact frequency of the interval note
• Cents — the interval in cents. 100 cents equals one equal-tempered semitone (modern piano). Pythagorean intervals deviate slightly from equal temperament, which is precisely why they sound more resonant on pure intervals and more tense on complex ones.
• String ℓ — the monochord string length ratio: the fraction of string length that Pythagoras would have stopped to produce this interval. The reciprocal of the frequency ratio.`
  },
  {
    id: 'esoterica-euclid-calculus',
    title: 'Esoterica: Euclid & Calculus Modes',
    content: `The Esoterica panel (opened with the 𓂀 button in the Seshat Controller) contains three hidden mathematical chambers. The EUCLID and CALCULUS modes are described here.

EUCLID — Elements Reader

A complete reading environment for Euclid's Elements (circa 300 BCE) — the most influential mathematical text in history, in continuous use for over two thousand years.

All thirteen Books are available, from the foundations of plane geometry (Book I: parallel lines, triangles, the Pythagorean theorem) through geometric algebra (Book II), circle theorems (Books III–IV), the theory of proportions (Books V–VI), elementary number theory (Books VII–IX), incommensurable magnitudes and irrationals (Book X), solid geometry (Book XI), and the construction of the five Platonic solids (Book XIII).

Use the ‹ › arrows to navigate between Books and Propositions. The left arrows move between books; the smaller arrows move between propositions within a book.

Tap Work a Problem to receive a numeric challenge drawn from the proposition. Write your solution in the scratch field below — the full Seshat calculator display remains active above the Esoterica panel so you can verify your arithmetic. Tap Reveal Hint if you are stuck.

CALCULUS — Graphing Calculator

A live SVG graphing calculator supporting nine functions: sin(x), cos(x), tan(x), x², x³, eˣ, ln(x), 1/x, and √x.

Select a function using the chip buttons along the top. The graph updates immediately. Use the + and − zoom buttons to examine different regions of the function, and Reset to return to the default view.

Enter an x value in the input field and tap Compute to receive two numerical results:
• f′(x) — the derivative at that point, computed via the symmetric difference quotient: (f(x+h) − f(x−h)) / 2h. This is a numerical approximation with h = 0.0001.
• ∫₀ˣ f dt — the definite integral from 0 to x, computed via Simpson's rule with 200 intervals. This gives a highly accurate numerical approximation of the area under the curve from zero to your chosen point.

The graph and the numbers speak the same language. This is the calculus of Newton and Leibniz made tactile.`
  }
];

export default function SebaytConsole({ onClose }: { onClose?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEntry, setActiveEntry] = useState(SEBAYT_ENTRIES[0]);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [blinkingId, setBlinkingId] = useState<string | null>(null);

  // Filter entries based on the search query
  const filteredEntries = SEBAYT_ENTRIES.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEntry = (entry: typeof SEBAYT_ENTRIES[0]) => {
    setActiveEntry(entry);
    setBlinkingId(entry.id);
    setTimeout(() => {
      setBlinkingId(null);
      setMobileView('detail');
    }, 700);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-900 text-cyan-400 font-mono border-0 md:border-4 border-amber-600 md:rounded-lg shadow-[0_0_20px_rgba(217,119,6,0.4)] overflow-hidden">

      {/* ── SIDEBAR / SCROLL OF TOPICS ─────────────────────────── */}
      <div className={`
        w-full md:w-1/3 shrink-0
        border-b-2 md:border-b-0 md:border-r-2 border-amber-600
        bg-gray-950 flex flex-col
        ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-4 md:p-6 border-b-2 border-amber-600">
          {/* Title row with mobile close button */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-amber-500 uppercase tracking-widest drop-shadow-md">
              Sebayt Console
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-cyan-600 hover:text-amber-500 transition-colors p-2 -mr-1"
                aria-label="Close Sebayt Console"
              >
                <X size={22} />
              </button>
            )}
          </div>
          <p className="text-xs text-cyan-600 mb-4 uppercase tracking-widest">
            Instructions of the Ptah Network
          </p>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900 border border-cyan-700 text-cyan-300 px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-cyan-800 text-sm"
              placeholder="Search the sacred texts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-3 text-cyan-700">
              ☥
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length > 0 ? (
            <ul className="divide-y divide-cyan-900/30">
              {filteredEntries.map((entry) => (
                <li key={entry.id}>
                  <motion.button
                    onClick={() => handleSelectEntry(entry)}
                    animate={blinkingId === entry.id
                      ? { opacity: [1, 0.1, 1, 0.1, 1, 0.1, 1] }
                      : { opacity: 1 }
                    }
                    transition={{ duration: 0.65, ease: 'linear' }}
                    className={`w-full text-left px-5 py-4 hover:bg-cyan-900/20 active:bg-cyan-900/40 transition-colors uppercase text-sm tracking-wider min-h-[56px] ${
                      activeEntry.id === entry.id
                        ? 'bg-cyan-900/40 text-amber-400 border-l-4 border-amber-500'
                        : 'text-cyan-500'
                    }`}
                  >
                    {entry.title}
                  </motion.button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-cyan-700 text-sm">
              The archives yield no results for your query. The void of Nun returns nothing.
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT / READING PANE ────────────────────────── */}
      <div className={`
        w-full md:w-2/3 flex flex-col overflow-hidden bg-gray-900
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Mobile nav bar — back + close */}
        <div className="md:hidden shrink-0 flex items-center gap-2 px-3 py-3 border-b-2 border-amber-600 bg-gray-950">
          <button
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1 text-cyan-500 hover:text-amber-400 active:text-amber-300 transition-colors py-1 pr-2"
            aria-label="Back to topics"
          >
            <ChevronLeft size={20} />
            <span className="text-xs uppercase tracking-wider">Topics</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-cyan-600 hover:text-amber-500 transition-colors p-1.5"
              aria-label="Close Sebayt Console"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-10 relative">
          {/* Desktop close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="hidden md:block absolute top-4 right-4 text-cyan-600 hover:text-amber-500 transition-colors p-2"
              aria-label="Close Sebayt Console"
            >
              <X size={28} />
            </button>
          )}

          {activeEntry ? (
            <div className="max-w-2xl mx-auto md:mt-4">
              {/* Eye of Horus / Aesthetic Header */}
              <div className="flex items-start gap-3 mb-6 border-b border-amber-600/50 pb-4">
                <span className="text-3xl md:text-4xl text-amber-500 shrink-0 leading-none mt-1">𓂀</span>
                <h2 className="text-xl md:text-3xl text-amber-400 font-bold uppercase tracking-widest leading-snug">
                  {activeEntry.title}
                </h2>
              </div>

              <div className="prose prose-invert prose-cyan max-w-none">
                {activeEntry.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-5 leading-relaxed text-cyan-100 text-base md:text-lg drop-shadow-md">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-cyan-800 flex-col">
              <span className="text-6xl mb-4">𓋹</span>
              <p className="uppercase tracking-widest">Awaiting your query, Initiate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
