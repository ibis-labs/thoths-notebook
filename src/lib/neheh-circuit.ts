// 🏺 THE NEHEH-CIRCUIT: The Path of Eternal Renewal
// Defines the Scribe's rank progression system based on the Oath of Commitment streak.

export type PromotionTier =
  | 'hour'
  | 'nightwatch'
  | 'hidden'
  | 'seasonal'
  | 'longcount'
  | 'transcendent';

export interface RankInfo {
  title: string;
  isMajor: boolean;   // true = triggers promotion notification & Special Mission
  tier: PromotionTier;
  description: string;
  missionDetails: string;
}

export interface PendingPromotion {
  title: string;
  tier: PromotionTier;
  day: number;
  description: string;
  missionDetails: string;
  achievedAt: string; // ISO timestamp string
}

// ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

function toRoman(n: number): string {
  if (n <= 0 || n > 3999) return String(n);
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

const HOUR_ORDINALS = ['','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

// ─── HOUR MISSION TEXTS ───────────────────────────────────────────────────────

const HOUR_MISSIONS: Record<number, string> = {
  1:  "The 2nd Hour opens. Your first full day of the Oath is inscribed. Mission: Explore the Task Cards on the Main Hall. Observe the Ma'at section at the bottom of the page where your Oath of Commitment appears each morning. Acknowledge the rhythm you have begun.",
  2:  "The 3rd Hour. The crossing deepens. Mission: Navigate to the Evening Chronicle for the first time. Walk through the steps of Ma'at's Attestation and witness the ritual. You do not need to seal tonight — simply bear witness.",
  3:  "The 4th Hour: the descent into the labours of night. Mission: Navigate to Manage Rituals and create your first Daily Ritual template. Name it after a practice you intend to hold sacred every day. The 4th Hour demands that commitment become concrete.",
  4:  "The 5th Hour: the midpoint of the Night Watch. Mission: Navigate to the Scribe's Dossier and set your Scribe Name if you have not yet done so. Your name is your identity in the Temple Record.",
  5:  "The 6th Hour: the Hour of Completion. Mission: Tonight, seal an Evening Chronicle with at least one ritual completed. Your first Chronicle entry will stand in the Archives forever. The 6th Hour demands that the work be witnessed.",
  6:  "The 7th Hour: the Hour of Testing. Mission: Review your Daily Rituals in Manage Rituals. Remove any that no longer serve your purpose, and add one you have been resisting. The 7th Hour tests your honesty about your own discipline.",
  7:  "The 8th Hour: the deepest descent into the Duat. Mission: Navigate to the Ostraca. Create your first collection and inscribe a tile within it — a plan, a fragment of thought, or a record of something important. The Ostraca does not judge what is inscribed.",
  8:  "The 9th Hour: the solar boat's lowest arc. Mission: Open a task and use the AI Prioritize feature on your task list. Let the intelligence of Thoth speak to your scheduling. Record one thing it suggested that surprised you in this task's details.",
  9:  "The 10th Hour: dawn approaches. Mission: Complete every active Daily Ritual today without exception, then seal the Evening Chronicle. A perfect day is the 10th Hour's only reward.",
  10: "The 11th Hour: the sacred penultimate watch. Mission: Create an Ostraca tile titled 'Ten Day Reflection'. Inscribe what has shifted in you since Day One of the Oath. The 11th Hour demands honest accounting before the final watch.",
  11: "The 12th Hour: all twelve hours of Night are now yours. Mission: Seal tonight's Evening Chronicle with a meaningful Wins note — describe specifically what the Twelve Hours of the Night have built in you. Your first twelve days stand in Eternal Record.",
};

// ─── RANK RESOLUTION ─────────────────────────────────────────────────────────

export function getRankInfo(effectiveDay: number): RankInfo {
  const d = Math.max(0, Math.min(360, Math.floor(effectiveDay)));

  if (d === 0) return {
    title: 'Scribe of the First Hour',
    isMajor: false, tier: 'hour',
    description: 'The journey has not yet begun. The Ankh awaits your first morning.',
    missionDetails: '',
  };

  if (d >= 1 && d <= 11) return {
    title: `Scribe of the ${HOUR_ORDINALS[d]} Hour`,
    isMajor: true, tier: 'hour',
    description: `The ${HOUR_ORDINALS[d]} Hour of the Night stands open. Another watch is inscribed in the Eternal Record.`,
    missionDetails: HOUR_MISSIONS[d] ?? '',
  };

  if (d === 12) return {
    title: 'Overseer of the Night Watch',
    isMajor: true, tier: 'nightwatch',
    description: 'You have walked the full twelve hours of the night. Now you preside over them.',
    missionDetails: "You have earned command of the Night Watch. Your first mission as Overseer: In the Ostraca, create a collection called \"Night Watch Scrolls\" and inscribe one tile for each of your first twelve days. What did you accomplish in each? The Overseer must know what was protected on their watch. Record the tile collection name in this task's details when complete.",
  };

  if (d >= 13 && d <= 29) {
    const n = d - 12;
    return { title: `Senior Overseer ${toRoman(n)}`, isMajor: false, tier: 'nightwatch', description: '', missionDetails: '' };
  }

  if (d === 30) return {
    title: 'Keeper of the Lunar Ledger',
    isMajor: true, tier: 'nightwatch',
    description: 'Thirty days. One full lunar cycle of the Morning Oath. You are now inscribed in the Lunar Ledger.',
    missionDetails: "The Lunar Ledger demands an accounting. You have completed one full moon cycle of the Morning Oath. Your mission: Navigate to the Chronicles Archive. Find your very first sealed Evening Chronicle — the oldest entry. Record its date here and write three things that have changed in your life since Day One. The Keeper of the Lunar Ledger must know the full span of their watch.",
  };

  if (d >= 31 && d <= 41) {
    const n = d - 30;
    return { title: `Scribe of the Hidden Chamber ${toRoman(n)}`, isMajor: false, tier: 'hidden', description: '', missionDetails: '' };
  }

  if (d === 42) return {
    title: 'Scribe of the Assessors',
    isMajor: true, tier: 'hidden',
    description: 'You stand before the Forty-Two Assessors. You have kept the Oath forty-two times — once for each divine judge of the Duat.',
    missionDetails: "The Forty-Two Assessors demand a reckoning. You have taken the Oath forty-two times — once for each divine judge who weighs the heart. Your mission: Seal an Evening Chronicle with at least five completed tasks and three completed Daily Rituals. In the Wins field before sealing, write the phrase: \"I HAVE NOT BEEN WEIGHED AND FOUND WANTING.\" The Assessors are watching, and they are satisfied only by proof. Record the Chronicle's date in this task's details.",
  };

  if (d >= 43 && d <= 69) {
    const n = d - 42;
    return { title: `Vizier's Deputy ${toRoman(n)}`, isMajor: false, tier: 'hidden', description: '', missionDetails: '' };
  }

  if (d === 70) return {
    title: 'Chancellor of the Sacred Records',
    isMajor: true, tier: 'seasonal',
    description: 'Seventy days. You are no longer a student of the Temple — you are its Chancellor.',
    missionDetails: "The Chancellor commands the record of all things. Your mission: Ensure your Scribe Name is set in the Dossier. Then navigate to Manage Rituals — you should have at least five active Daily Ritual templates. If fewer than five, create them now. The Chancellor's Temple cannot function without the proper rites being observed. Record your five ritual titles in this task's details.",
  };

  if (d >= 71 && d <= 119) {
    const n = d - 70;
    return { title: `Vizier of the Per-ankh ${toRoman(n)}`, isMajor: false, tier: 'seasonal', description: '', missionDetails: '' };
  }

  if (d === 120) return {
    title: 'High Vizier of the Serekh',
    isMajor: true, tier: 'seasonal',
    description: 'Four months of the unbroken Oath. The Serekh — the palace façade — is yours. You have reached the Stone Tablet Floor: your rank can never decay below Chancellor.',
    missionDetails: "You have reached the Stone Tablet Floor. No absence can ever erase what you have built to this point — your rank will never fall below Chancellor of the Sacred Records. Your mission: Navigate to the Scribe's Dossier and initiate the Obelisk Ritual. During the ritual sequence, observe carefully what is revealed at the culmination. Note or screenshot the hidden inscription you encounter. Record it in this task's details. You have earned the right to see what few ever reach.",
  };

  if (d >= 121 && d <= 180) return {
    title: 'Architect of the Two Lands',
    isMajor: d === 121, tier: 'longcount',
    description: 'You shape the record of both Upper and Lower civilization. The blueprint of the dual kingdom is yours to draft.',
    missionDetails: "As Architect, you are charged with the design of your own system. Your mission: Identify one routine or discipline that is NOT yet a Ritual in your Temple — something you have been meaning to systematize. Add it as a new Daily Ritual. Run it for seven consecutive sealed Evening Chronicles. When the seventh Chronicle is sealed with this ritual completed, record the ritual's name and what has changed in your approach to it.",
  };

  if (d >= 181 && d <= 240) return {
    title: 'Steward of the Solar Boat',
    isMajor: d === 181, tier: 'longcount',
    description: "You have taken the helm of Ra's Bark. The solar cycle bends to your stewardship.",
    missionDetails: "The Solar Boat requires a steady hand on the tiller. Ra does not stop for faltering. Your mission: Complete every active Daily Ritual for three consecutive days without missing a single one. Seal the Evening Chronicle each night. When you have achieved three consecutive perfect nights, record the dates here. Ra's Bark has crossed the sky without incident.",
  };

  if (d >= 241 && d <= 300) return {
    title: 'High Priest of the Ptah Network',
    isMajor: d === 241, tier: 'longcount',
    description: 'Ptah speaks through your actions now. Eight months of the Oath — the creative principle is yours to wield.',
    missionDetails: "Ptah, the divine craftsman, demands a creation. Your mission: Use the Ostraca to plan a creation you intend to bring into being in the next 30 days — a project, a practice, or a system. Seal this plan in a Vault collection. Name the Vault in the format: \"PTAH: [Your Creation Name]\". Record the Vault's name and a single sentence describing your creation in this task's details. The High Priest does not only observe — they create.",
  };

  if (d >= 301 && d <= 359) return {
    title: 'Keeper of the Eternal Inundation',
    isMajor: d === 301, tier: 'longcount',
    description: 'As the Nile always returns, so does your Oath. Three hundred days witnessed and sealed by Thoth.',
    missionDetails: "The Inundation is as eternal as the Nile itself — it always returns. You have kept the Oath three hundred times. Your mission: Open the Evening Chronicle Archives. Find your very first Chronicle entry. Then find your most recent. Write the date of your first Chronicle, the date of your most recent, and one specific practice that has transformed between those two dates. Record all three in this task's details. The Keeper must know the full span of the waters.",
  };

  if (d === 360) return {
    title: 'The Akh — Effective Spirit of Eternity',
    isMajor: true, tier: 'transcendent',
    description: 'Three hundred and sixty days. The full solar circuit is complete. You have transcended the title of Scribe. You are the Akh.',
    missionDetails: "The Neheh-Circuit is complete. You have orbited the full solar year of the Morning Oath. The Akh is the luminous, effective spirit — the force that endures beyond death into eternity. Your mission: Send an email to rites@unclepetelaboratories.net with the subject line exactly: \"THE AKH HAS ARRIVED — [Your Scribe Name]\". In the body, include the date you sealed your first Chronicle and describe in one paragraph how this Temple has shaped your mind. What you receive in response will not be like anything else here. The Temple does not forget those who complete the Circuit.",
  };

  // Beyond 360 — sustained eternity
  return {
    title: 'The Akh — Effective Spirit of Eternity',
    isMajor: false, tier: 'transcendent',
    description: 'The circuit is complete. Eternity sustained.',
    missionDetails: '',
  };
}

// ─── MAJOR RANK BOUNDARIES ───────────────────────────────────────────────────
// Ordered list of day values that are either major rank thresholds or
// are needed as "landing points" for the decay algorithm.
// Days 1-11 (hours) are major individual ranks.
// Days 13-29, 31-41, 43-69, 71-119 are minor roman numeral steps (excluded).
export const MAJOR_RANK_BOUNDARIES: number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  12, 30, 42, 70, 120, 121, 181, 241, 301, 360,
];

// ─── DECAY RULE ───────────────────────────────────────────────────────────────
// Every 10 days of inactivity = descend one major rank boundary.
// Once Day 120 is ever reached, rank can never fall below Day 70 (Stone Tablet Floor).
export function applyDecay(rankDay: number, daysMissed: number, hasReached120: boolean): number {
  const decaySteps = Math.floor(daysMissed / 10);
  if (decaySteps === 0 || rankDay === 0) return rankDay;

  // Find current boundary index (last boundary <= rankDay)
  let boundaryIdx = MAJOR_RANK_BOUNDARIES.length - 1;
  while (boundaryIdx > 0 && MAJOR_RANK_BOUNDARIES[boundaryIdx] > rankDay) boundaryIdx--;

  boundaryIdx = Math.max(0, boundaryIdx - decaySteps);
  let newDay = MAJOR_RANK_BOUNDARIES[boundaryIdx];

  // Stone Tablet Floor
  if (hasReached120) newDay = Math.max(newDay, 70);

  return newDay;
}

// ─── NEXT MILESTONE HELPER ────────────────────────────────────────────────────
export function getNextMilestone(rankDay: number): { title: string; daysAway: number } | null {
  for (const b of MAJOR_RANK_BOUNDARIES) {
    if (b > rankDay) return { title: getRankInfo(b).title, daysAway: b - rankDay };
  }
  return null; // Already at max (360+)
}

// ─── TIER COLOR TOKENS ────────────────────────────────────────────────────────
export const TIER_COLORS = {
  hour:        { ring: '#f59e0b', glow: 'rgba(245,158,11,0.55)',  textClass: 'text-amber-400',  borderClass: 'border-amber-500/40'  },
  nightwatch:  { ring: '#fb923c', glow: 'rgba(251,146,60,0.55)',  textClass: 'text-orange-400', borderClass: 'border-orange-500/40' },
  hidden:      { ring: '#f97316', glow: 'rgba(249,115,22,0.55)',  textClass: 'text-orange-500', borderClass: 'border-orange-600/40' },
  seasonal:    { ring: '#a855f7', glow: 'rgba(168,85,247,0.55)',  textClass: 'text-purple-400', borderClass: 'border-purple-500/40' },
  longcount:   { ring: '#22d3ee', glow: 'rgba(34,211,238,0.55)',  textClass: 'text-cyan-400',   borderClass: 'border-cyan-500/40'   },
  transcendent:{ ring: '#ffffff', glow: 'rgba(255,255,255,0.65)', textClass: 'text-white',      borderClass: 'border-white/40'      },
} as const;
