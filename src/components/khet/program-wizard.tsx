"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Dumbbell, Link2, GripVertical, Info } from 'lucide-react';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useKhet } from '@/hooks/use-khet';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/components/auth-provider';
import type {
  WorkoutSplit,
  WorkoutFrequency,
  WorkoutDay,
  ProgramExercise,
  Exercise,
  WorkoutProgram,
  DeloadStrategy,
  ProgramGoal,
  ProgramTimeSlot,
  ProgramEquipment,
} from '@/lib/khet-types';
import { cn, localDateStr } from '@/lib/utils';
import { BanishmentPortal } from '@/components/banishment-portal';
import { SubstitutionEngine } from './substitution-engine';

// ─────────────────────────────────────────────────────────────
// Day label generators
// ─────────────────────────────────────────────────────────────

function generateDayLabels(split: WorkoutSplit, freq: WorkoutFrequency): string[] {
  if (split === 'PPL') {
    const base = ['Push', 'Pull', 'Legs'];
    return Array.from({ length: freq }, (_, i) => {
      const cycle = Math.floor(i / 3) + 1;
      return freq <= 3 ? base[i % 3] : `${base[i % 3]} ${cycle > 1 ? String.fromCharCode(64 + cycle) : 'A'}`;
    });
  }
  if (split === 'UpperLower') {
    const base = ['Upper', 'Lower'];
    return Array.from({ length: freq }, (_, i) => {
      const cycle = Math.floor(i / 2) + 1;
      return freq <= 2 ? base[i % 2] : `${base[i % 2]} ${String.fromCharCode(64 + cycle)}`;
    });
  }
  // FullBody
  return Array.from({ length: freq }, (_, i) =>
    `Full Body ${String.fromCharCode(65 + i)}`,
  );
}

// ─────────────────────────────────────────────────────────────
// Hypertrophy Engine — Strategic Periodization Model
// ─────────────────────────────────────────────────────────────

/**
 * Patterns considered "Push" variants for pattern-overlap prevention.
 * A-days use "Horizontal Push"; B-days must use "Incline Push" or "Vertical Push".
 */
const PUSH_PATTERN_ROTATION: Record<number, string[]> = {
  0: ['Horizontal Push', 'Incline Push', 'Vertical Push'],
  1: ['Incline Push', 'Vertical Push'],
};

/** Map day type (base label) to exercise categories/patterns to pull from */
type DayProfile = {
  label: string;
  /** Categories relevant for this day */
  categories: string[];
  /** Tier 1 anchor pattern groups to pick from */
  tier1Patterns: string[];
};

const DAY_PROFILES: Record<string, DayProfile> = {
  Push: {
    label: 'Push',
    categories: ['Chest', 'Shoulders'],
    tier1Patterns: ['Horizontal Push', 'Incline Push', 'Vertical Push'],
  },
  Pull: {
    label: 'Pull',
    categories: ['Back'],
    tier1Patterns: ['Horizontal Pull', 'Vertical Pull'],
  },
  Legs: {
    label: 'Legs',
    categories: ['Legs'],
    tier1Patterns: ['Quad Dominant', 'Hinge/Posterior'],
  },
  Upper: {
    label: 'Upper',
    categories: ['Chest', 'Back', 'Shoulders'],
    tier1Patterns: ['Horizontal Push', 'Horizontal Pull', 'Vertical Push'],
  },
  Lower: {
    label: 'Lower',
    categories: ['Legs'],
    tier1Patterns: ['Quad Dominant', 'Hinge/Posterior'],
  },
  'Full Body': {
    label: 'Full Body',
    categories: ['Legs', 'Chest', 'Back', 'Shoulders'],
    tier1Patterns: ['Quad Dominant', 'Horizontal Push', 'Horizontal Pull'],
  },
};

/** Rep ranges per tier — standard hypertrophy science */
const TIER_REPS: Record<number, string> = {
  1: '6–8',
  2: '10–12',
  3: '15–20',
};

/** Set counts per tier */
const TIER_SETS: Record<number, number> = {
  1: 4,
  2: 3,
  3: 3,
};

/**
 * Returns goal-adjusted tier ratio for exercise selection.
 * Returns [tier1Count, tier2Count, tier3Count] per session.
 */
function getTierRatio(
  goal: ProgramGoal,
  timeSlot: ProgramTimeSlot,
): [number, number, number] {
  if (timeSlot === '45m') {
    // Executive — 5 exercises total, antagonistic supersets implied
    if (goal === 'Strength') return [2, 2, 1];
    if (goal === 'Aesthetics') return [1, 2, 2];
    return [1, 2, 2]; // Conditioning
  }
  if (timeSlot === '90m') {
    // Mass Displacement Special — bonus sets
    if (goal === 'Strength') return [3, 2, 2];
    if (goal === 'Aesthetics') return [1, 3, 3];
    return [1, 2, 4]; // Conditioning
  }
  // 60m Standard
  if (goal === 'Strength') return [2, 2, 2];
  if (goal === 'Aesthetics') return [1, 2, 3];
  return [1, 2, 3]; // Conditioning
}

/** Shuffle helper (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick exercises for one day using the Hypertrophy Engine.
 * Implements:
 * - Tier ordering (Tier 1 anchors first, CNS priority)
 * - Pattern Overlap prevention on B days
 * - Unilateral integration every other day
 * - Goal & time-slot tier ratios
 * - Ma'at review (avoid stale IDs present in prevIds; use equivalents)
 */
function buildDayExercises(
  dayLabel: string,
  exercises: Exercise[],
  goal: ProgramGoal,
  timeSlot: ProgramTimeSlot,
  cycleIndex: number,         // 0 = A day, 1 = B day in same split
  prevIds: Set<string>,        // IDs used in prior program for Ma'at rotation
  usedThisProgram: Set<string>, // Ids already picked in this program build
): ProgramExercise[] {
  const baseLabel = Object.keys(DAY_PROFILES).find((k) => dayLabel.startsWith(k)) ?? 'Full Body';
  const profile = DAY_PROFILES[baseLabel] ?? DAY_PROFILES['Full Body'];
  const [t1Count, t2Count, t3Count] = getTierRatio(goal, timeSlot);
  const result: ProgramExercise[] = [];

  // Exercises excluded from wizard auto-selection (user may add manually)
  const WIZARD_EXCLUDED_IDS = new Set(['z-press']);

  /** Filter candidates by category + tier, applying Ma'at rotation */
  function pool(tier: number, patternFilter?: string[]): Exercise[] {
    return exercises.filter((e) => {
      if (WIZARD_EXCLUDED_IDS.has(e.id)) return false;
      if (!profile.categories.includes(e.category)) return false;
      if (e.tier !== tier) return false;
      if (patternFilter && patternFilter.length > 0 && !patternFilter.includes(e.pattern ?? '')) return false;
      return true;
    });
  }

  /** Pick one from pool, preferring fresh IDs. If stale, swap to equivalent. */
  function pick(candidates: Exercise[], forceUnilateral = false): Exercise | null {
    let filtered = forceUnilateral
      ? candidates.filter((e) => (e.pattern ?? '').toLowerCase().includes('unilateral'))
      : candidates;
    if (filtered.length === 0) filtered = candidates;
    if (filtered.length === 0) return null;

    // Fresh candidates = not in prevIds (8-week Ma'at rotation)
    const fresh = filtered.filter((e) => !prevIds.has(e.id) && !usedThisProgram.has(e.id));
    const stale = filtered.filter((e) => prevIds.has(e.id) && !usedThisProgram.has(e.id));
    const any = filtered.filter((e) => !usedThisProgram.has(e.id));

    const from = fresh.length > 0 ? fresh : stale.length > 0 ? stale : any;
    if (from.length === 0) return null;

    const chosen = shuffle(from)[0];
    usedThisProgram.add(chosen.id);
    return chosen;
  }

  /** Convert Exercise to ProgramExercise with tier-based defaults */
  function toProgEx(e: Exercise): ProgramExercise {
    const tier = e.tier ?? 2;
    return {
      exerciseId: e.id,
      name: e.name,
      sets: TIER_SETS[tier] ?? 3,
      goalReps: TIER_REPS[tier] ?? '10–12',
    };
  }

  // ── Tier 1 Anchors ──
  // B-days of Push: avoid Horizontal Push to prevent pattern overlap
  let t1PatternFilter: string[] = profile.tier1Patterns;
  if (baseLabel === 'Push' && cycleIndex > 0) {
    t1PatternFilter = PUSH_PATTERN_ROTATION[1];
  }

  const t1Pool = pool(1, t1PatternFilter);
  for (let i = 0; i < t1Count; i++) {
    const ex = pick(t1Pool);
    if (ex) result.push(toProgEx(ex));
  }

  // ── Tier 2 Structural Sculpt ──
  const t2Pool = pool(2);
  for (let i = 0; i < t2Count; i++) {
    const ex = pick(t2Pool);
    if (ex) result.push(toProgEx(ex));
  }

  // ── Tier 3 Detail / Metabolic ──
  // Ensure at least one unilateral on B days (anti-imbalance protocol)
  const t3Pool = pool(3);
  const needsUnilateral = cycleIndex > 0 && !result.some((r) => {
    const orig = exercises.find((e) => e.id === r.exerciseId);
    return (orig?.pattern ?? '').toLowerCase().includes('unilateral');
  });

  for (let i = 0; i < t3Count; i++) {
    const forceUni = needsUnilateral && i === 0;
    const ex = pick(t3Pool, forceUni);
    if (ex) result.push(toProgEx(ex));
  }

  // ── Arms supplement for Push/Pull/Upper days ──
  if (['Push', 'Upper'].includes(baseLabel) && result.length < t1Count + t2Count + t3Count) {
    const tricepPool = exercises.filter((e) => e.primaryMuscles.includes('Triceps') && !usedThisProgram.has(e.id));
    const ex = pick(tricepPool);
    if (ex) result.push(toProgEx(ex));
  }
  if (['Pull', 'Upper'].includes(baseLabel) && result.length < t1Count + t2Count + t3Count) {
    const bicepPool = exercises.filter((e) => e.primaryMuscles.includes('Biceps') && !usedThisProgram.has(e.id));
    const ex = pick(bicepPool);
    if (ex) result.push(toProgEx(ex));
  }

  return result;
}

/**
 * Build all days for a program using the Hypertrophy Engine.
 * Implements Volume Wave: Day A = Compound-heavy (T1 first), Day B = Volume/Isolation emphasis.
 * Also performs Ma'at Legacy Review against prevExerciseIds.
 */
function buildAllDays(
  split: WorkoutSplit,
  freq: WorkoutFrequency,
  exercises: Exercise[],
  goal: ProgramGoal,
  timeSlot: ProgramTimeSlot,
  prevExerciseIds: Set<string>,
): WorkoutDay[] {
  const labels = generateDayLabels(split, freq);
  const usedThisProgram = new Set<string>();
  const cycleIndexMap: Record<string, number> = {};

  return labels.map((label): WorkoutDay => {
    const baseLabel = Object.keys(DAY_PROFILES).find((k) => label.startsWith(k)) ?? 'Full Body';
    const ci = cycleIndexMap[baseLabel] ?? 0;
    cycleIndexMap[baseLabel] = ci + 1;

    const exList = buildDayExercises(label, exercises, goal, timeSlot, ci, prevExerciseIds, usedThisProgram);
    return { label, exercises: exList };
  });
}


// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ProgramWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (programId: string) => void;
  /** When provided, the wizard operates in edit mode */
  editProgram?: WorkoutProgram;
}

type WizardStep = 'discovery' | 'foundation' | 'architect' | 'link';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ProgramWizard({ open, onClose, onCreated, editProgram }: ProgramWizardProps) {
  const { user } = useAuth();
  const { addProgram, updateProgram, programs } = useKhet();
  const { toast } = useToast();
  const { rituals } = useTasks();
  const isEditing = !!editProgram;

  const [step, setStep] = useState<WizardStep>('discovery');
  const [name, setName] = useState('');
  const [split, setSplit] = useState<WorkoutSplit>('PPL');
  const [freq, setFreq] = useState<WorkoutFrequency>(4);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [exSearch, setExSearch] = useState('');
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [linkedRitualId, setLinkedRitualId] = useState<string | null>(null);
  const [durationWeeks, setDurationWeeks] = useState<number>(8);
  const [deloadStrategy, setDeloadStrategy] = useState<DeloadStrategy>('reduce-volume');
  const [approvedDays, setApprovedDays] = useState<Set<number>>(new Set());

  // User Discovery Phase
  const [goal, setGoal] = useState<ProgramGoal>('Aesthetics');
  const [timeSlot, setTimeSlot] = useState<ProgramTimeSlot>('60m');
  const [equipment, setEquipment] = useState<ProgramEquipment>('Full Gym');

  // Cues modal
  const [cuesModal, setCuesModal] = useState<{ name: string; cues: string[] } | null>(null);

  // Drag-to-reorder state
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Pre-populate state when editing
  useEffect(() => {
    if (open && editProgram) {
      setName(editProgram.name);
      setSplit(editProgram.split);
      setFreq(editProgram.frequency);
      setDays(editProgram.days.map((d) => ({ ...d, exercises: [...d.exercises] })));
      setDurationWeeks(editProgram.durationWeeks ?? 8);
      setDeloadStrategy(editProgram.deloadStrategy ?? 'reduce-volume');
      setStep('architect');
      setActiveDayIdx(0);
    }
  }, [open, editProgram]);

  // Load exercise database once — using full_expanded_exercises.json for tier/pattern/cues
  useEffect(() => {
    if (!open) return;
    fetch('/docs/full_expanded_exercises.json')
      .then((r) => r.json())
      .then((data: Exercise[]) => setExercises(data))
      .catch(() => {});
  }, [open]);

  // Build days using the Hypertrophy Engine
  const buildDays = useCallback(() => {
    // Ma'at Legacy Review — collect exercise IDs from the most recent program
    const sortedPrograms = [...programs].sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    );
    const lastProgram = sortedPrograms.find((p) => p.id !== editProgram?.id);
    const prevIds = new Set<string>(
      lastProgram?.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)) ?? [],
    );

    return buildAllDays(split, freq, exercises, goal, timeSlot, prevIds);
  }, [split, freq, exercises, goal, timeSlot, programs, editProgram]);

  const handleGoToArchitect = () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Give your program a name.', variant: 'destructive' });
      return;
    }
    const built = buildDays();
    setDays(built);
    setActiveDayIdx(0);
    setStep('architect');
  };

  const handleGoToFoundation = () => {
    setStep('foundation');
  };

  const updateExercise = (dayIdx: number, exIdx: number, updates: Partial<ProgramExercise>) => {
    setDays((prev) => {
      const next = [...prev];
      const dayExs = [...next[dayIdx].exercises];
      dayExs[exIdx] = { ...dayExs[exIdx], ...updates };
      next[dayIdx] = { ...next[dayIdx], exercises: dayExs };
      return next;
    });
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) => {
      const next = [...prev];
      next[dayIdx] = {
        ...next[dayIdx],
        exercises: next[dayIdx].exercises.filter((_, i) => i !== exIdx),
      };
      return next;
    });
  };

  const addExercise = (dayIdx: number, ex: Exercise) => {
    setDays((prev) => {
      const next = [...prev];
      if (replacingIdx !== null) {
        // Replace the exercise at replacingIdx
        const dayExs = [...next[dayIdx].exercises];
        dayExs[replacingIdx] = {
          ...dayExs[replacingIdx],
          exerciseId: ex.id,
          name: ex.name,
        };
        next[dayIdx] = { ...next[dayIdx], exercises: dayExs };
        setReplacingIdx(null);
      } else {
        // Avoid duplicates
        if (next[dayIdx].exercises.some((e) => e.exerciseId === ex.id)) return prev;
        const tier = ex.tier ?? 2;
        next[dayIdx] = {
          ...next[dayIdx],
          exercises: [
            ...next[dayIdx].exercises,
            {
              exerciseId: ex.id,
              name: ex.name,
              sets: TIER_SETS[tier] ?? 3,
              goalReps: TIER_REPS[tier] ?? '10–12',
            },
          ],
        };
      }
      return next;
    });
    setExSearch('');
  };

  const reorderExercises = (dayIdx: number, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setDays((prev) => {
      const next = [...prev];
      const exs = [...next[dayIdx].exercises];
      const [moved] = exs.splice(fromIdx, 1);
      exs.splice(toIdx, 0, moved);
      next[dayIdx] = { ...next[dayIdx], exercises: exs };
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (isEditing && editProgram) {
        await updateProgram(editProgram.id, { name: name.trim(), split, frequency: freq, days, durationWeeks, deloadStrategy });
        toast({ title: 'Program Updated', description: `"${name}" saved.` });
        handleClose();
      } else {
        const today = localDateStr();
        const programData: Omit<WorkoutProgram, 'id'> = {
          userId: user.uid,
          name: name.trim(),
          split,
          frequency: freq,
          days,
          linkedTaskId: null,
          linkedRitualId: linkedRitualId ?? null,
          mesocycleStart: today,
          createdAt: today,
          lastSessionDate: null,
          lastSessionDayIndex: null,
          lifetimeVolume: 0,
          durationWeeks,
          deloadStrategy,
          lastDeloadStart: null,
          lastDeloadEnd: null,
          isDeloading: false,
        };
        const id = await addProgram(programData);
        toast({ title: 'Program Created', description: `"${name}" is ready.` });
        onCreated?.(id);
        handleClose();
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not save program.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep('discovery');
    setName('');
    setSplit('PPL');
    setFreq(4);
    setDays([]);
    setExSearch('');
    setReplacingIdx(null);
    setDurationWeeks(8);
    setDeloadStrategy('reduce-volume');
    setApprovedDays(new Set());
    setLinkedRitualId(null);
    setGoal('Aesthetics');
    setTimeSlot('60m');
    setEquipment('Full Gym');
    setCuesModal(null);
    dragIdx.current = null;
    setDragOver(null);
    onClose();
  };

  // Filtered exercises for search
  const filteredExercises = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(exSearch.toLowerCase()),
  );

  const activeDay = days[activeDayIdx];
  const swapEx = swapTarget !== null ? days[swapTarget.dayIdx]?.exercises[swapTarget.exIdx] : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-black border-zinc-800 max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-headline text-amber-400 tracking-wider uppercase text-base">
            <Dumbbell className="inline w-4 h-4 mr-2 mb-0.5" />
            {isEditing ? 'Edit Program' : 'Hypertrophy Engine'}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {(['discovery', 'foundation', 'architect', 'link'] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    step === s ? 'bg-amber-400' : 'bg-zinc-700',
                  )}
                />
                {i < 3 && <div className="w-6 h-px bg-zinc-800" />}
              </div>
            ))}
            <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-widest">
              {step === 'discovery' ? 'Discovery' : step === 'foundation' ? 'Foundation' : step === 'architect' ? 'Review & Edit' : 'Ma\'at Link'}
            </span>
            <DialogDescription className="sr-only">
              {step === 'discovery'
                ? 'Define your training goal, time, and equipment.'
                : step === 'foundation'
                ? 'Configure the program name, split, and frequency.'
                : step === 'architect'
                ? 'Add and configure exercises for each training day.'
                : 'Optionally link this program to a Daily Ritual for Ma\u2019at Sync.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── STEP 0: User Discovery Phase ── */}
          {step === 'discovery' && (
            <div className="space-y-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-headline">
                Hypertrophy Engine — User Discovery Phase
              </p>

              {/* Goal */}
              <div>
                <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-500 block mb-2">
                  Objective
                </label>
                <div className="space-y-2">
                  {([
                    { v: 'Aesthetics', desc: 'Mirror muscles, high volume, Tier 2–3 focus' },
                    { v: 'Strength', desc: 'Anchor lifts, low reps, CNS-first ordering' },
                    { v: 'Conditioning', desc: 'Metabolic stress, cardio integration, short rest' },
                  ] as { v: ProgramGoal; desc: string }[]).map(({ v, desc }) => (
                    <button
                      key={v}
                      onClick={() => setGoal(v)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                        goal === v
                          ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600',
                      )}
                    >
                      <span className="text-sm font-headline uppercase tracking-wider">{v}</span>
                      <span className="text-[11px] text-zinc-500 text-right max-w-[55%] leading-snug">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-500 block mb-2">
                  Constraint
                </label>
                <div className="space-y-2">
                  {([
                    { v: '45m', label: '45 Min', desc: 'The Executive — 5 exercises, supersets' },
                    { v: '60m', label: '60 Min', desc: 'The Standard — 6–7 exercises' },
                    { v: '90m', label: '90 Min', desc: 'Mass Displacement — bonus Tier 3 finisher' },
                  ] as { v: ProgramTimeSlot; label: string; desc: string }[]).map(({ v, label, desc }) => (
                    <button
                      key={v}
                      onClick={() => setTimeSlot(v)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                        timeSlot === v
                          ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600',
                      )}
                    >
                      <span className="text-sm font-headline uppercase tracking-wider">{label}</span>
                      <span className="text-[11px] text-zinc-500 text-right max-w-[55%] leading-snug">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="text-xs font-headline uppercase tracking-[0.25em] text-zinc-500 block mb-2">
                  Access
                </label>
                <div className="space-y-2">
                  {([
                    { v: 'Full Gym', desc: 'Barbells, machines, cables — all available' },
                    { v: 'Home', desc: 'Bodyweight + limited free weights' },
                    { v: 'Dumbbells Only', desc: 'Dumbbells and benches' },
                  ] as { v: ProgramEquipment; desc: string }[]).map(({ v, desc }) => (
                    <button
                      key={v}
                      onClick={() => setEquipment(v)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                        equipment === v
                          ? 'border-green-500 bg-green-950/20 text-green-300'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600',
                      )}
                    >
                      <span className="text-sm font-headline uppercase tracking-wider">{v}</span>
                      <span className="text-[11px] text-zinc-500 text-right max-w-[55%] leading-snug">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary pill */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-800 text-amber-400 bg-amber-950/20 font-headline uppercase tracking-widest">
                  {goal}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-800 text-cyan-400 bg-cyan-950/20 font-headline uppercase tracking-widest">
                  {timeSlot}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-800 text-green-400 bg-green-950/20 font-headline uppercase tracking-widest">
                  {equipment}
                </span>
              </div>
            </div>
          )}

          {/* ── STEP 1: Foundation ── */}
          {step === 'foundation' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-headline uppercase tracking-[0.25em] text-zinc-300 block mb-1.5">
                  Program Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Forge Protocol"
                  className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-700 text-base h-11"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-headline uppercase tracking-[0.25em] text-zinc-300 block mb-1.5">
                    Split
                  </label>
                  <Select value={split} onValueChange={(v) => setSplit(v as WorkoutSplit)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white text-base h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-zinc-800">
                      <SelectItem value="PPL" className="text-amber-300 focus:bg-amber-950/30">Push / Pull / Legs</SelectItem>
                      <SelectItem value="UpperLower" className="text-amber-300 focus:bg-amber-950/30">Upper / Lower</SelectItem>
                      <SelectItem value="FullBody" className="text-amber-300 focus:bg-amber-950/30">Full Body</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-headline uppercase tracking-[0.25em] text-zinc-300 block mb-1.5">
                    Days / Week
                  </label>
                  <Select value={String(freq)} onValueChange={(v) => setFreq(parseInt(v) as WorkoutFrequency)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white text-base h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-zinc-800">
                      {[3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-amber-300 focus:bg-amber-950/30">
                          {n} Days
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview day labels */}
              <div>
                <label className="text-sm font-headline uppercase tracking-[0.25em] text-zinc-400 block mb-1.5">
                  Microcycle Preview
                </label>
                <div className="flex flex-wrap gap-2">
                  {generateDayLabels(split, freq).map((label, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded border border-cyan-900/50 text-cyan-400 bg-cyan-950/10"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-headline uppercase tracking-[0.25em] text-zinc-300 block mb-1.5">
                    Program Duration
                  </label>
                  <Select value={String(durationWeeks)} onValueChange={(v) => setDurationWeeks(parseInt(v))}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white text-base h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-zinc-800">
                      {[8, 9, 10, 11, 12].map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-amber-300 focus:bg-amber-950/30">
                          {n} Weeks
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-headline uppercase tracking-[0.25em] text-zinc-300 block mb-1.5">
                    Deload Strategy
                  </label>
                  <Select value={deloadStrategy} onValueChange={(v) => setDeloadStrategy(v as DeloadStrategy)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white text-base h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-zinc-800">
                      <SelectItem value="reduce-volume" className="text-amber-300 focus:bg-amber-950/30">Reduce Volume (Best) — 1–2 sets, same weight &amp; reps</SelectItem>
                      <SelectItem value="reduce-intensity" className="text-amber-300 focus:bg-amber-950/30">Reduce Intensity (Joint Relief) — 60% weight, same sets &amp; reps</SelectItem>
                      <SelectItem value="reduce-reps" className="text-amber-300 focus:bg-amber-950/30">Reduce Reps (Quick Session) — half reps, same sets &amp; weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Review & Edit ── */}
          {step === 'architect' && activeDay && (
            <div className="space-y-3">
              {/* Instructions */}
              <p className="text-sm text-zinc-400 leading-relaxed">
                Tap each Day's Workout below to review and edit the exercises. The exercises are ordered for best results, but you may reorder them by dragging them to a new position.
              </p>
              {/* Day Tabs */}
              <div className="flex gap-2 flex-wrap">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDayIdx(i)}
                    className={cn(
                      'text-sm font-headline uppercase tracking-wider px-4 py-2 rounded border transition-all',
                      i === activeDayIdx
                        ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Exercise list for active day */}
              <div className="space-y-1.5">
                {activeDay.exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    draggable
                    onDragStart={() => { dragIdx.current = exIdx; }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(exIdx); }}
                    onDragEnd={() => {
                      if (dragIdx.current !== null && dragOver !== null) {
                        reorderExercises(activeDayIdx, dragIdx.current, dragOver);
                      }
                      dragIdx.current = null;
                      setDragOver(null);
                    }}
                    className={cn(
                      'p-2.5 rounded border bg-zinc-950/30 transition-all cursor-grab active:cursor-grabbing space-y-2',
                      dragOver === exIdx ? 'border-amber-500/60 bg-amber-950/10' : 'border-zinc-800',
                      replacingIdx === exIdx ? 'border-cyan-500/60 bg-cyan-950/10' : '',
                    )}
                  >
                    {/* Row 1: grip handle + full exercise name + tier badge + cues button */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      <span className="text-base text-zinc-100 font-medium flex-1">{ex.name}</span>
                      {(() => {
                        const exData = exercises.find((e) => e.id === ex.exerciseId);
                        const tier = exData?.tier;
                        return tier ? (
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded font-headline uppercase tracking-widest flex-shrink-0',
                            tier === 1 ? 'border border-amber-700 text-amber-400 bg-amber-950/20' :
                            tier === 2 ? 'border border-cyan-800 text-cyan-400 bg-cyan-950/20' :
                            'border border-violet-800 text-violet-400 bg-violet-950/20',
                          )}>
                            T{tier}
                          </span>
                        ) : null;
                      })()}
                      {(() => {
                        const exData = exercises.find((e) => e.id === ex.exerciseId);
                        return exData?.cues && exData.cues.length > 0 ? (
                          <button
                            onClick={() => setCuesModal({ name: exData.name, cues: exData.cues! })}
                            className="text-zinc-600 hover:text-amber-400 transition-colors flex-shrink-0"
                            title="Trainer Checkpoints"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        ) : null;
                      })()}
                    </div>
                    {/* Row 2: Sets | Reps | Edit | Delete */}
                    <div className="flex items-center gap-2 ml-6">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Sets</span>
                        <Input
                          type="number"
                          value={ex.sets}
                          min={1}
                          max={10}
                          onChange={(e) =>
                            updateExercise(activeDayIdx, exIdx, { sets: parseInt(e.target.value) || 3 })
                          }
                          className="w-12 h-7 text-sm text-center bg-black border-zinc-700 text-white px-1"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Reps</span>
                        <Input
                          value={ex.goalReps}
                          onChange={(e) =>
                            updateExercise(activeDayIdx, exIdx, { goalReps: e.target.value })
                          }
                          className="w-16 h-7 text-sm text-center bg-black border-zinc-700 text-white px-1"
                          placeholder="8–12"
                        />
                      </div>
                      <button
                        onClick={() => setSwapTarget({ dayIdx: activeDayIdx, exIdx })}
                        className="text-zinc-400 hover:text-cyan-400 transition-colors flex-shrink-0"
                        title="Swap exercise"
                      >
                        <CyberStylus className="w-7 h-7" />
                      </button>
                      <BanishmentPortal onConfirm={() => removeExercise(activeDayIdx, exIdx)} ritualTitle={ex.name}>
                        <button
                          className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)] hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] transition-all flex-shrink-0"
                          title="Remove exercise"
                        >
                          <DuamatefJar className="w-7 h-7" />
                        </button>
                      </BanishmentPortal>
                    </div>
                  </div>
                ))}
              </div>

              {/* Approve Day button */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {approvedDays.has(activeDayIdx) ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-headline uppercase tracking-widest">
                    <span className="text-green-400">✓</span> {activeDay.label} Approved
                    <button
                      onClick={() => setApprovedDays((prev) => { const next = new Set(prev); next.delete(activeDayIdx); return next; })}
                      className="text-xs text-zinc-600 hover:text-zinc-400 underline ml-1 normal-case tracking-normal font-body"
                    >
                      undo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setApprovedDays((prev) => new Set([...prev, activeDayIdx]))}
                    className="flex-1 py-2.5 rounded-lg border-2 border-green-500 text-green-300 font-headline uppercase tracking-widest text-sm font-bold bg-transparent hover:bg-green-950/30 shadow-[0_0_12px_rgba(74,222,128,0.5)] hover:shadow-[0_0_20px_rgba(74,222,128,0.8)] transition-all"
                  >
                    ✓ Approve {activeDay.label}
                  </button>
                )}
              </div>

              {/* Days approval status — also act as nav */}
              <div className="flex gap-2 flex-wrap">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDayIdx(i)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded font-headline uppercase tracking-wider border transition-all',
                      i === activeDayIdx
                        ? approvedDays.has(i)
                          ? 'text-green-300 border-green-500 bg-green-950/30 shadow-[0_0_8px_rgba(74,222,128,0.3)]'
                          : 'text-amber-400 border-amber-500 bg-amber-950/20'
                        : approvedDays.has(i)
                        ? 'text-green-400 border-green-700 bg-green-950/20 hover:border-green-500'
                        : 'text-zinc-500 border-zinc-800 hover:border-zinc-600',
                    )}
                  >
                    {approvedDays.has(i) ? '✓ ' : ''}{d.label}
                  </button>
                ))}
              </div>

              {/* Add exercise search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <Input
                  value={exSearch}
                  onChange={(e) => setExSearch(e.target.value)}
                  placeholder="Search and add any exercise you like"
                  className="pl-8 bg-zinc-950 border-zinc-700 text-sm text-white placeholder:text-zinc-500"
                />
              </div>
              {/* Unapproved days warning */}
              {approvedDays.size < days.length && (
                <p className="text-xs font-headline uppercase tracking-widest text-center text-amber-300 animate-pulse">
                  ⚠ Approve Program Days
                </p>
              )}

              {exSearch && (
                <div className="border border-zinc-800 rounded overflow-hidden max-h-40 overflow-y-auto">
                  {filteredExercises.slice(0, 8).map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(activeDayIdx, ex)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>{ex.name}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        {ex.tier && (
                          <span className={cn(
                            'text-[9px] px-1 py-0.5 rounded font-headline uppercase tracking-widest',
                            ex.tier === 1 ? 'text-amber-400' : ex.tier === 2 ? 'text-cyan-400' : 'text-violet-400',
                          )}>T{ex.tier}</span>
                        )}
                        <span className="text-[10px] text-zinc-600">{ex.category}</span>
                      </span>
                    </button>
                  ))}
                  {filteredExercises.length === 0 && (
                    <div className="px-3 py-2 text-xs text-zinc-600">No results</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Ma’at Link ── */}
          {step === 'link' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-zinc-300 font-headline uppercase tracking-wider">Ma’at Sync Link</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Optionally link this program to a Daily Ritual. Completing a session will automatically mark it complete.</p>
                </div>
              </div>

              {/* Ritual picker */}
              {rituals.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-4">No Daily Rituals found. You can link one later from the program card.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {rituals.map((ritual) => (
                    <RitualPickerRow
                      key={ritual.id}
                      ritual={ritual}
                      selected={linkedRitualId === ritual.id}
                      onSelect={() => setLinkedRitualId(linkedRitualId === ritual.id ? null : ritual.id)}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full text-sm text-zinc-500 hover:text-zinc-300 underline pt-2"
              >
                Skip — create program without a link
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={step === 'discovery' ? handleClose : () => {
              if (step === 'link') { setStep('architect'); setApprovedDays(new Set()); }
              else if (step === 'architect') { setStep('foundation'); setApprovedDays(new Set()); }
              else if (step === 'foundation') setStep('discovery');
            }}
            className="border-2 border-zinc-400 text-zinc-200 font-headline uppercase tracking-widest text-sm shadow-[0_0_12px_rgba(161,161,170,0.6)] hover:shadow-[0_0_20px_rgba(161,161,170,0.9)] hover:text-white hover:border-zinc-200 transition-all"
          >
            {step === 'discovery' ? 'Escape' : (
              <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>
            )}
          </Button>

          {step === 'discovery' && (
            <Button
              onClick={() => setStep('foundation')}
              className="bg-transparent border-2 border-amber-400 text-amber-300 font-headline uppercase tracking-widest text-base font-bold hover:bg-amber-950/30 hover:text-amber-200 hover:border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.7)] hover:shadow-[0_0_28px_rgba(251,191,36,1)] animate-pulse transition-all"
            >
              PROCEED <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 'foundation' && (
            <Button
              onClick={handleGoToArchitect}
              className="bg-transparent border-2 border-green-400 text-green-300 font-headline uppercase tracking-widest text-base font-bold hover:bg-green-950/30 hover:text-green-200 hover:border-green-300 shadow-[0_0_16px_rgba(74,222,128,0.7)] hover:shadow-[0_0_28px_rgba(74,222,128,1)] animate-pulse transition-all"
            >
              INITIALIZE <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 'architect' && approvedDays.size === days.length && (
            <Button
              onClick={() => isEditing ? handleSave() : setStep('link')}
              disabled={saving}
              className="bg-transparent border-2 border-green-400 text-green-300 font-headline uppercase tracking-widest text-base font-bold hover:bg-green-950/30 hover:text-green-200 hover:border-green-300 shadow-[0_0_16px_rgba(74,222,128,0.7)] hover:shadow-[0_0_28px_rgba(74,222,128,1)] animate-pulse transition-all"
            >
              {isEditing
                ? (saving ? 'Saving…' : 'FINALIZE')
                : (<>FINALIZE <ChevronRight className="w-4 h-4 ml-1" /></>)
              }
            </Button>
          )}
          {step === 'link' && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-sm"
            >
              {saving ? 'Forging…' : 'Forge Program'}
            </Button>
          )}
        </div>

        {/* Cues Modal — Trainer Checkpoints */}
        {cuesModal && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setCuesModal(null)}
          >
            <div
              className="bg-zinc-950 border border-amber-700/50 rounded-lg p-5 max-w-sm w-full shadow-[0_0_30px_rgba(217,119,6,0.3)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-headline uppercase tracking-widest text-amber-400">
                  Trainer Checkpoints
                </span>
                <button onClick={() => setCuesModal(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
              </div>
              <p className="text-sm text-zinc-200 font-medium mb-3">{cuesModal.name}</p>
              <ul className="space-y-2">
                {cuesModal.cues.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-amber-500 flex-shrink-0 mt-0.5">▸</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Substitution Engine — nested inside DialogContent so closing it doesn't dismiss the wizard */}
        {swapTarget !== null && swapEx && (
          <SubstitutionEngine
            open
            onClose={() => setSwapTarget(null)}
            currentExerciseId={swapEx.exerciseId}
            currentExerciseName={swapEx.name}
            onSwap={(newEx) => {
              setDays((prev) => {
                const next = [...prev];
                const dayExs = [...next[swapTarget.dayIdx].exercises];
                dayExs[swapTarget.exIdx] = { ...dayExs[swapTarget.exIdx], exerciseId: newEx.exerciseId, name: newEx.name };
                next[swapTarget.dayIdx] = { ...next[swapTarget.dayIdx], exercises: dayExs };
                return next;
              });
              setSwapTarget(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// RitualPickerRow — decrypts title if needed
// ─────────────────────────────────────────────────────────────

import type { Task } from '@/lib/types';

function RitualPickerRow({
  ritual,
  selected,
  onSelect,
}: {
  ritual: Task;
  selected: boolean;
  onSelect: () => void;
}) {
  const { masterKey } = useAuth();
  const [displayTitle, setDisplayTitle] = useState(ritual.title ?? '—');

  useEffect(() => {
    const reveal = async () => {
      if (ritual.isEncrypted && masterKey && ritual.iv) {
        try {
          const { decryptData, base64ToBuffer } = await import('@/lib/crypto');
          const ivUint8 = new Uint8Array(base64ToBuffer(ritual.iv));
          const decrypted = await decryptData(masterKey, base64ToBuffer(ritual.title), ivUint8);
          setDisplayTitle(decrypted);
        } catch {
          setDisplayTitle('[Sealed Ritual]');
        }
      } else {
        setDisplayTitle(ritual.title ?? '—');
      }
    };
    reveal();
  }, [ritual, masterKey]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded border transition-all',
        selected
          ? 'border-amber-500 bg-amber-950/20 text-amber-300'
          : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-body">{displayTitle}</span>
        {selected && <span className="text-amber-400 text-xs font-headline uppercase tracking-widest flex-shrink-0">Linked ✓</span>}
      </div>
    </button>
  );
}
