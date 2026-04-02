// A sub-task has its own text and completion status
export type Subtask = {
  text: string;
  completed: boolean;
};

export const CATEGORY_LABELS = {
  GENERAL: "Khet",
  RITUAL: "Daily Rituals",
  DUTY: "Sacred Duties",
  MISSION: "Special Missions",
  EXPEDITION: "Grand Expeditions"
} as const;

export type TaskCategory = typeof CATEGORY_LABELS[keyof typeof CATEGORY_LABELS] | string;

export type TaskImportance = "low" | "medium" | "high";

// 🏺 The Flame Record
export type StreakData = {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  history10: number[];
  lastUpdated: string;
};

// 🏛️ The Master Blueprint
export type Task = {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  importance: TaskImportance;
  dueDate: Date; 
  createdAt?: Date; 
  estimatedTime: number;
  completed: boolean;
  details?: string; 
  subtasks?: Subtask[];
  isEncrypted?: boolean;      
  iv?: string;               
  encryptedSubtasks?: string;
  encryptedDetails?: string;
  encryptedTitle?: string;
  
  
  // --- RITUAL DNA ---
  isRitual?: boolean; 
  originRitualId?: string | null;

  // --- THE PROPHECY ADDITION ---
  // Added here so 'useTasks' can safely map it
  streakData?: StreakData | null; 
};

export const INITIAL_STREAK_DATA: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  totalCompletions: 0,
  history10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // The "Gray Pips"
  lastUpdated: "" // YYYY-MM-DD
};

export type FilterCategory = "All" | TaskCategory;

// ─────────────────────────────────────────────────────────────
// 🏺 THE OSTRACA — Ephemeral Scratchpad
// ─────────────────────────────────────────────────────────────

export type OstracaTileColor = 'amber' | 'cyan' | 'rose' | 'emerald' | 'purple';

export type OstracaCollection = {
  id: string;
  userId: string;
  name: string;
  isVault: boolean;
  color: OstracaTileColor;
  createdAt: string;
};

export type OstracaTile = {
  id: string;
  userId: string;
  collectionId: string;
  title: string;
  isVault: boolean;
  isEncrypted: boolean;
  iv?: string;               // base64 — shared IV for this tile
  encryptedContent?: string; // base64 — encrypted with masterKey
  createdAt: string;
  updatedAt: string;
};