import React, { useState } from 'react';
import { X } from 'lucide-react';

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
  }
];

export default function SebaytConsole({ onClose }: { onClose?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEntry, setActiveEntry] = useState(SEBAYT_ENTRIES[0]);

  // Filter entries based on the search query
  const filteredEntries = SEBAYT_ENTRIES.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-900 text-cyan-400 font-mono border-4 border-amber-600 rounded-lg shadow-[0_0_20px_rgba(217,119,6,0.4)] overflow-hidden relative">
      
      {/* Sidebar / Scroll of Topics */}
      <div className="w-1/3 border-r-2 border-amber-600 bg-gray-950 flex flex-col">
        <div className="p-6 border-b-2 border-amber-600">
          <h1 className="text-3xl font-bold text-amber-500 uppercase tracking-widest mb-2 shadow-amber-500/50 drop-shadow-md">
            Sebayt Console
          </h1>
          <p className="text-xs text-cyan-600 mb-4 uppercase tracking-widest">
            Instructions of the Ptah Network
          </p>
          
          {/* Holographic Search Bar */}
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900 border border-cyan-700 text-cyan-300 px-4 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-cyan-800"
              placeholder="Search the sacred texts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-2.5 text-cyan-700">
              ☥
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredEntries.length > 0 ? (
            <ul className="divide-y border-cyan-900/30 divide-cyan-900/30">
              {filteredEntries.map((entry) => (
                <li key={entry.id}>
                  <button
                    onClick={() => setActiveEntry(entry)}
                    className={`w-full text-left px-6 py-4 hover:bg-cyan-900/20 transition-colors uppercase text-sm tracking-wider ${
                      activeEntry.id === entry.id
                        ? 'bg-cyan-900/40 text-amber-400 border-l-4 border-amber-500'
                        : 'text-cyan-500'
                    }`}
                  >
                    {entry.title}
                  </button>
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

      {/* Main Content Area / Reading Pane */}
      <div className="w-2/3 p-10 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-gray-900 relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-cyan-600 hover:text-amber-500 transition-colors p-2"
            aria-label="Close Sebayt Console"
          >
            <X size={28} />
          </button>
        )}
        
        {activeEntry ? (
          <div className="max-w-2xl mx-auto mt-4">
            {/* Eye of Horus / Aesthetic Header */}
            <div className="flex items-center mb-8 border-b border-amber-600/50 pb-4">
              <span className="text-4xl text-amber-500 mr-4">𓂀</span>
              <h2 className="text-3xl text-amber-400 font-bold uppercase tracking-widest">
                {activeEntry.title}
              </h2>
            </div>
            
            <div className="prose prose-invert prose-cyan max-w-none">
              {activeEntry.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-6 leading-relaxed text-cyan-100 text-lg shadow-black drop-shadow-md">
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
  );
}
