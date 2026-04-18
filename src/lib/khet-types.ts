// ─────────────────────────────────────────────────────────────
// 🏋️ KHET-STATION — Workout System Type Definitions
// ─────────────────────────────────────────────────────────────

export type WorkoutSplit = 'PPL' | 'UpperLower' | 'FullBody';
export type WorkoutFrequency = 3 | 4 | 5 | 6;
export type CardioType = 'Stairs' | 'Treadmill' | 'Row' | 'Elliptical' | 'Cycling' | 'Other';

/** A single set within an exercise log */
export interface SetLog {
  weight: number;      // kg
  reps: number;
  rpe?: number;        // Rate of Perceived Exertion 1–10
  completed: boolean;
}

/** All sets logged for one exercise in a session */
export interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: SetLog[];
  notes?: string;
  /** Set when the user uses a Today-Only alternative. Preserves original for ghost log lookup. */
  originalExerciseId?: string;
  originalName?: string;
}

/** Cardio component of a session */
export interface CardioLog {
  type: CardioType;
  duration: number;    // minutes
  distance?: number;   // km
  calories?: number;
}

/** A completed or in-progress workout session stored in Firestore */
export interface WorkoutSession {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  dayIndex: number;
  dayLabel: string;
  date: string;        // ISO date string (YYYY-MM-DD)
  exerciseLogs: ExerciseLog[];
  cardioLog?: CardioLog;
  notes?: string;
  completed: boolean;
  totalVolume: number; // sum of weight × reps across all completed sets
  durationMinutes?: number; // how long the session lasted
  linkedTaskId?: string | null;
  linkedRitualId?: string | null;
}

/** An exercise slot inside a program day */
export interface ProgramExercise {
  exerciseId: string;
  name: string;
  sets: number;        // suggested set count
  goalReps: string;    // e.g. "8–12" or "5"
  notes?: string;
}

/** One training day within a program (e.g. "Push A") */
export interface WorkoutDay {
  label: string;
  exercises: ProgramExercise[];
}

export type DeloadStrategy =
  | 'reduce-volume'
  | 'reduce-intensity'
  | 'reduce-reps'
  | 'reduce-frequency';

/** A full workout program (mesocycle) stored in Firestore */
export interface WorkoutProgram {
  id: string;
  userId: string;
  name: string;
  split: WorkoutSplit;
  frequency: WorkoutFrequency;
  days: WorkoutDay[];
  linkedTaskId?: string | null;
  linkedRitualId?: string | null;
  mesocycleStart?: string | null;  // ISO date — triggers 42-day adaptation alert
  createdAt: string;               // ISO date
  lastSessionDate?: string | null;
  lastSessionDayIndex?: number | null;
  lifetimeVolume: number;          // cumulative kg displaced across all sessions
  durationWeeks?: number;          // planned program length (8–12 weeks, default 8)
  deloadStrategy?: DeloadStrategy; // preferred deload method
  lastDeloadStart?: string | null; // ISO date deload week began
  lastDeloadEnd?: string | null;   // ISO date deload week ended
  isDeloading?: boolean;           // true while a deload week is active
}

/**
 * Per-exercise personal record — USER-SCOPED (lifetime, all programs).
 * Computed client-side by scanning all khetSessions for the user.
 */
export interface ExercisePR {
  exerciseId: string;
  name: string;
  /** Best single-set weight ever lifted (any rep count) */
  bestWeight: number;
  /** Reps performed at that best weight */
  bestRepsAtBestWeight: number;
  /** Estimated 1-rep max using the Brzycki formula: w / (1.0278 − 0.0278 × r) */
  best1RM: number;
  /** ISO date the best weight was set */
  bestWeightDate: string;
  /** Which program was running when the PR was set */
  bestWeightProgram: string;
  /** Best total exercise volume in a single session (Σ weight × reps) */
  bestSessionVolume: number;
  /** ISO date of the best-volume session */
  bestVolumeDate: string;
  /** Total lifetime volume for this exercise across all sessions */
  lifetimeVolume: number;
  /** Number of sessions this exercise has appeared in */
  sessionCount: number;
  /** Volume per session for sparkline: [{date, volume}] — last 20 sessions */
  history: { date: string; volume: number; maxWeight: number }[];
}

/**
 * Per-program progress summary — PROGRAM-SCOPED.
 * PRs are NOT included here; use the global ExercisePR[] for that.
 */
export interface ProgramProgress {
  programId: string;
  programName: string;
  totalSessions: number;
  totalVolume: number;
  firstSessionDate: string;
  lastSessionDate: string;
  /** Volume per session: [{date, volume}] */
  volumeHistory: { date: string; volume: number }[];
}

// ─────────────────────────────────────────────────────────────
// Gainz — Global Statistics
// ─────────────────────────────────────────────────────────────

/** A foundational movement PR tracked in the Hall of PRs */
export interface FoundationalPR {
  movement: string;           // display name, e.g. "Bench Press"
  matchTerms: string[];       // lowercase substrings to match exercise names
  category: 'big3' | 'ohp' | 'row' | 'calisthenics';
  /** For weighted: best weight in kg */
  bestWeight: number;
  /** For calisthenics: best reps in one set (or seconds for plank) */
  bestReps: number;
  /** Estimated 1RM (Brzycki). 0 for bodyweight movements. */
  best1RM: number;
  bestDate: string;
  bestProgramName: string;
  /** True when this PR came from a manual entry rather than a logged session */
  isManual?: boolean;
  manualNotes?: string;
}

/** Definition used to match exercise names to foundational movements */
export type FoundationalPRDef = Omit<FoundationalPR, 'bestWeight' | 'bestReps' | 'best1RM' | 'bestDate' | 'bestProgramName' | 'isManual' | 'manualNotes'>;

/** Canonical list of tracked foundational movements — shared between hook and UI */
export const FOUNDATIONAL_MOVEMENTS: FoundationalPRDef[] = [
  { movement: 'Bench Press',         matchTerms: ['bench press', 'bench'],                                        category: 'big3' },
  { movement: 'Back Squat',          matchTerms: ['squat'],                                                       category: 'big3' },
  { movement: 'Deadlift',            matchTerms: ['deadlift'],                                                    category: 'big3' },
  { movement: 'Overhead Press',      matchTerms: ['overhead press', 'ohp', 'shoulder press', 'military press'],  category: 'ohp' },
  { movement: 'Barbell Row',         matchTerms: ['barbell row', 'bent over row', 'bb row', 'pendlay'],          category: 'row' },
  { movement: 'Pull-ups / Chin-ups', matchTerms: ['pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up'], category: 'calisthenics' },
  { movement: 'Dips',                matchTerms: ['dip'],                                                         category: 'calisthenics' },
  { movement: 'Push-ups',            matchTerms: ['push-up', 'pushup', 'push up'],                               category: 'calisthenics' },
  { movement: 'Plank',               matchTerms: ['plank'],                                                       category: 'calisthenics' },
];

/** Per-day heatmap bucket */
export interface HeatmapDay {
  date: string;   // ISO date
  count: number;  // sessions that day (0, 1, 2+)
}

/** Master global-stats object computed from all sessions */
export interface GlobalStats {
  /** First ever session date */
  trainingStartDate: string;
  /** Days since trainingStartDate */
  totalDaysTraining: number;
  totalSessions: number;
  /** Sum of all session totalVolume */
  totalVolumeKg: number;
  /** Sum of every completed rep across all sessions */
  totalReps: number;
  /** Sum of durationMinutes across sessions that have it */
  totalMinutes: number;
  /** Sum of cardioLog.calories across all sessions */
  totalCardioCals: number;
  /** Current consecutive weeks hitting ≥1 session */
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  /** Last 90 calendar days, one entry per day */
  heatmap: HeatmapDay[];
  /** The Hall of PRs */
  foundationalPRs: FoundationalPR[];
}

/** Weight unit preference — 'lbs' is the default */
export type WeightUnit = 'lbs' | 'kg';

/** User profile / settings stored in khetSettings/{docId} */
export interface KhetUserSettings {
  userId: string;
  /** Preferred weight unit — defaults to 'lbs' when not set */
  weightUnit?: WeightUnit;
  /** Body weight in the user's chosen weightUnit */
  bodyWeight?: number;
  /** Daily maintenance calorie target */
  maintenanceCalories?: number;
  /** Gym name / training location */
  gymName?: string;
}

/** A manually entered personal record stored in khetManualPRs */
export interface KhetManualPR {
  id: string;
  userId: string;
  /** Must match a movement name from FOUNDATIONAL_MOVEMENTS */
  movement: string;
  bestWeight: number;
  bestReps: number;
  best1RM: number;
  date: string;  // ISO date
  notes?: string;
  isEncrypted?: boolean;
  iv?: string;
  encryptedPayload?: string;
}

/** An exercise entry from the data-agnostic exercise database */
export interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  equipment: string[];
  equivalents: string[]; // array of exercise IDs with biomechanical similarity
}

// ─────────────────────────────────────────────────────────────
// Session Reducer Types (used by the active session page)
// ─────────────────────────────────────────────────────────────

export interface ActiveSessionState {
  exerciseLogs: ExerciseLog[];
  cardioEnabled: boolean;
  cardioLog: CardioLog;
  notes: string;
  startDate: string;
}

export type SessionAction =
  | { type: 'UPDATE_SET'; exerciseIdx: number; setIdx: number; updates: Partial<SetLog> }
  | { type: 'ADD_SET'; exerciseIdx: number }
  | { type: 'REMOVE_SET'; exerciseIdx: number }
  | { type: 'SWAP_EXERCISE'; exerciseIdx: number; newExercise: ProgramExercise }
  | { type: 'TOGGLE_CARDIO' }
  | { type: 'SET_CARDIO'; log: Partial<CardioLog> }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_EXERCISE_NOTES'; exerciseIdx: number; notes: string };
