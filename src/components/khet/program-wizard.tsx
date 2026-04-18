"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Search, ChevronLeft, ChevronRight, Dumbbell, Link2, GripVertical, Pencil } from 'lucide-react';
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
import { useAuth } from '@/components/auth-provider';
import type {
  WorkoutSplit,
  WorkoutFrequency,
  WorkoutDay,
  ProgramExercise,
  Exercise,
  WorkoutProgram,
  DeloadStrategy,
} from '@/lib/khet-types';
import { cn } from '@/lib/utils';

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

// Default exercise templates per day type (exercise IDs)
const DAY_TEMPLATES: Record<string, string[]> = {
  Push: ['barbell-bench-press', 'incline-dumbbell-press', 'cable-fly', 'barbell-ohp', 'lateral-raise', 'tricep-pushdown'],
  Pull: ['barbell-row', 'pull-up', 'cable-row', 'face-pull', 'barbell-curl', 'hammer-curl'],
  Legs: ['barbell-back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'leg-extension', 'calf-raise'],
  Upper: ['barbell-bench-press', 'barbell-row', 'barbell-ohp', 'pull-up', 'lateral-raise', 'barbell-curl', 'tricep-pushdown'],
  Lower: ['barbell-back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'],
  'Full Body': ['barbell-back-squat', 'barbell-bench-press', 'barbell-row', 'barbell-ohp', 'romanian-deadlift', 'barbell-curl'],
};

function getTemplateForLabel(label: string): string[] {
  const base = Object.keys(DAY_TEMPLATES).find((k) => label.startsWith(k));
  return base ? DAY_TEMPLATES[base] : [];
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

type WizardStep = 'foundation' | 'architect' | 'link';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ProgramWizard({ open, onClose, onCreated, editProgram }: ProgramWizardProps) {
  const { user } = useAuth();
  const { addProgram, updateProgram } = useKhet();
  const { toast } = useToast();
  const isEditing = !!editProgram;

  const [step, setStep] = useState<WizardStep>('foundation');
  const [name, setName] = useState('');
  const [split, setSplit] = useState<WorkoutSplit>('PPL');
  const [freq, setFreq] = useState<WorkoutFrequency>(4);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [exSearch, setExSearch] = useState('');
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [linkedRitualId] = useState<string | null>(null);
  const [durationWeeks, setDurationWeeks] = useState<number>(8);
  const [deloadStrategy, setDeloadStrategy] = useState<DeloadStrategy>('reduce-volume');

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

  // Load exercise database once
  useEffect(() => {
    if (!open) return;
    fetch('/docs/exercises.json')
      .then((r) => r.json())
      .then((data: Exercise[]) => setExercises(data))
      .catch(() => {});
  }, [open]);

  // Build days when split/freq changes on step change
  const buildDays = useCallback(() => {
    const labels = generateDayLabels(split, freq);
    return labels.map((label): WorkoutDay => {
      const templateIds = getTemplateForLabel(label);
      const exList = templateIds
        .map((id): ProgramExercise | null => {
          const ex = exercises.find((e) => e.id === id);
          if (!ex) return null;
          return { exerciseId: ex.id, name: ex.name, sets: 3, goalReps: '8–12' };
        })
        .filter(Boolean) as ProgramExercise[];
      return { label, exercises: exList };
    });
  }, [split, freq, exercises]);

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
        next[dayIdx] = {
          ...next[dayIdx],
          exercises: [
            ...next[dayIdx].exercises,
            { exerciseId: ex.id, name: ex.name, sets: 3, goalReps: '8–12' },
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
        const today = new Date().toISOString().slice(0, 10);
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
    setStep('foundation');
    setName('');
    setSplit('PPL');
    setFreq(4);
    setDays([]);
    setExSearch('');
    setReplacingIdx(null);
    setDurationWeeks(8);
    setDeloadStrategy('reduce-volume');
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-black border-zinc-800 max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-headline text-amber-400 tracking-wider uppercase text-base">
            <Dumbbell className="inline w-4 h-4 mr-2 mb-0.5" />
            {isEditing ? 'Edit Program' : 'Workout Creation Engine'}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {(['foundation', 'architect', 'link'] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    step === s ? 'bg-amber-400' : 'bg-zinc-700',
                  )}
                />
                {i < 2 && <div className="w-8 h-px bg-zinc-800" />}
              </div>
            ))}
            <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-widest">
              {step === 'foundation' ? 'Foundation' : step === 'architect' ? 'Architect' : 'Ma\'at Link'}
            </span>          <DialogDescription className="sr-only">
            {step === 'foundation'
              ? 'Configure the program name, split, and frequency.'
              : step === 'architect'
              ? 'Add and configure exercises for each training day.'
              : 'Optionally link this program to a Daily Ritual for Ma\u2019at Sync.'}
          </DialogDescription>          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── STEP 1: Foundation ── */}
          {step === 'foundation' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-400 block mb-1.5">
                  Program Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Forge Protocol"
                  className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-400 block mb-1.5">
                    Split
                  </label>
                  <Select value={split} onValueChange={(v) => setSplit(v as WorkoutSplit)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
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
                  <label className="text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-400 block mb-1.5">
                    Days / Week
                  </label>
                  <Select value={String(freq)} onValueChange={(v) => setFreq(parseInt(v) as WorkoutFrequency)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
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
                <label className="text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-500 block mb-1.5">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-400 block mb-1.5">
                    Program Duration
                  </label>
                  <Select value={String(durationWeeks)} onValueChange={(v) => setDurationWeeks(parseInt(v))}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
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
                  <label className="text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-400 block mb-1.5">
                    Deload Strategy
                  </label>
                  <Select value={deloadStrategy} onValueChange={(v) => setDeloadStrategy(v as DeloadStrategy)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
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

          {/* ── STEP 2: Architect ── */}
          {step === 'architect' && activeDay && (
            <div className="space-y-3">
              {/* Day Tabs */}
              <div className="flex gap-1 flex-wrap">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDayIdx(i)}
                    className={cn(
                      'text-[10px] font-headline uppercase tracking-wider px-2 py-1 rounded border transition-all',
                      i === activeDayIdx
                        ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500',
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
                      'flex items-center gap-2 p-2 rounded border bg-zinc-950/30 transition-all cursor-grab active:cursor-grabbing',
                      dragOver === exIdx ? 'border-amber-500/60 bg-amber-950/10' : 'border-zinc-800',
                      replacingIdx === exIdx ? 'border-cyan-500/60 bg-cyan-950/10' : '',
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-200 truncate">{ex.name}</div>
                    </div>
                    <Input
                      type="number"
                      value={ex.sets}
                      min={1}
                      max={10}
                      onChange={(e) =>
                        updateExercise(activeDayIdx, exIdx, { sets: parseInt(e.target.value) || 3 })
                      }
                      className="w-14 h-7 text-xs text-center bg-black border-zinc-700 text-white"
                      title="Sets"
                    />
                    <Input
                      value={ex.goalReps}
                      onChange={(e) =>
                        updateExercise(activeDayIdx, exIdx, { goalReps: e.target.value })
                      }
                      className="w-20 h-7 text-xs text-center bg-black border-zinc-700 text-white"
                      placeholder="Reps"
                      title="Goal Reps"
                    />
                    <button
                      onClick={() => {
                        setReplacingIdx(replacingIdx === exIdx ? null : exIdx);
                        setExSearch('');
                      }}
                      className={cn(
                        'text-zinc-600 hover:text-cyan-400 transition-colors flex-shrink-0',
                        replacingIdx === exIdx && 'text-cyan-400',
                      )}
                      title="Replace exercise"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeExercise(activeDayIdx, exIdx)}
                      className="text-zinc-600 hover:text-rose-400 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Search hints */}
              {replacingIdx !== null && (
                <p className="text-[10px] text-cyan-400 font-headline uppercase tracking-widest">
                  Replacing: {activeDay.exercises[replacingIdx]?.name} — search below
                </p>
              )}

              {/* Add / replace exercise search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <Input
                  value={exSearch}
                  onChange={(e) => setExSearch(e.target.value)}
                  placeholder={replacingIdx !== null ? 'Search replacement…' : 'Add exercise…'}
                  className="pl-8 bg-zinc-950 border-zinc-700 text-sm text-white placeholder:text-zinc-600"
                />
              </div>
              {exSearch && (
                <div className="border border-zinc-800 rounded overflow-hidden max-h-40 overflow-y-auto">
                  {filteredExercises.slice(0, 8).map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(activeDayIdx, ex)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>{ex.name}</span>
                      <span className="text-[10px] text-zinc-600">{ex.category}</span>
                    </button>
                  ))}
                  {filteredExercises.length === 0 && (
                    <div className="px-3 py-2 text-xs text-zinc-600">No results</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Ma'at Link ── */}
          {step === 'link' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Link2 className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">
                  Link this program to a Daily Ritual so completing a session
                  automatically marks the ritual complete.
                </p>
                <p className="text-xs text-zinc-600 mt-2">
                  (Optional — you can link at any time from the program settings)
                </p>
              </div>
              <div className="text-center">
                <button
                  onClick={handleSave}
                  className="text-sm text-zinc-500 underline hover:text-zinc-300"
                >
                  Skip and create program
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={step === 'foundation' ? handleClose : () => setStep(step === 'architect' ? 'foundation' : 'architect')}
            className="text-zinc-500 hover:text-zinc-300"
          >
            {step === 'foundation' ? 'Cancel' : (
              <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>
            )}
          </Button>

          {step === 'foundation' && (
            <Button
              onClick={handleGoToArchitect}
              className="bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-sm"
            >
              Architect Days <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 'architect' && (
            <Button
              onClick={() => isEditing ? handleSave() : setStep('link')}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-sm"
            >
              {isEditing
                ? (saving ? 'Saving…' : 'Save Changes')
                : (<>Ma'at Link <ChevronRight className="w-4 h-4 ml-1" /></>)
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
      </DialogContent>
    </Dialog>
  );
}
