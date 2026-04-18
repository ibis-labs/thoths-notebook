"use client";

import { useState, useEffect } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Exercise, ProgramExercise } from '@/lib/khet-types';

interface SubstitutionEngineProps {
  open: boolean;
  onClose: () => void;
  currentExerciseId: string;
  currentExerciseName: string;
  onSwap: (newExercise: ProgramExercise) => void;
}

export function SubstitutionEngine({
  open,
  onClose,
  currentExerciseId,
  currentExerciseName,
  onSwap,
}: SubstitutionEngineProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Load exercise database
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/docs/exercises.json')
      .then((r) => r.json())
      .then((data: Exercise[]) => {
        setExercises(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  // Get the current exercise to find its equivalents
  const currentEx = exercises.find((e) => e.id === currentExerciseId);
  const equivalentIds = currentEx?.equivalents ?? [];

  // Build candidate list: equivalents first, then all others (minus itself)
  const equivalents = exercises.filter((e) => equivalentIds.includes(e.id));
  const allOthers = exercises.filter(
    (e) => e.id !== currentExerciseId && !equivalentIds.includes(e.id),
  );

  const filterEx = (arr: Exercise[]) =>
    arr.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.primaryMuscles.some((m) => m.toLowerCase().includes(search.toLowerCase())),
    );

  const filteredEquivalents = filterEx(equivalents);
  const filteredOthers = filterEx(allOthers);

  const handleSelect = (ex: Exercise) => {
    onSwap({
      exerciseId: ex.id,
      name: ex.name,
      sets: 3,
      goalReps: '8–12',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-black border-zinc-800 max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-amber-400 text-sm tracking-wider uppercase">
            Equivalent Movement Engine
          </DialogTitle>
          <DialogDescription className="text-[11px] text-zinc-500 mt-1">
            Swap: <span className="text-zinc-300">{currentExerciseName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, muscle, or category…"
            className="pl-8 bg-zinc-950 border-zinc-700 text-sm text-white placeholder:text-zinc-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="text-center text-zinc-600 text-xs py-4">
              Loading exercise database…
            </div>
          )}

          {/* Equivalents */}
          {filteredEquivalents.length > 0 && (
            <div>
              <div className="text-[9px] font-headline uppercase tracking-[0.3em] text-amber-500/70 mb-1.5 px-1">
                Biomechanical Equivalents
              </div>
              <div className="space-y-1">
                {filteredEquivalents.map((ex) => (
                  <ExerciseOption key={ex.id} exercise={ex} onSelect={handleSelect} highlight />
                ))}
              </div>
            </div>
          )}

          {/* All others */}
          {filteredOthers.length > 0 && (
            <div>
              <div className="text-[9px] font-headline uppercase tracking-[0.3em] text-zinc-600 mb-1.5 px-1">
                All Movements
              </div>
              <div className="space-y-1">
                {filteredOthers.map((ex) => (
                  <ExerciseOption key={ex.id} exercise={ex} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          )}

          {!loading && filteredEquivalents.length === 0 && filteredOthers.length === 0 && (
            <div className="text-center text-zinc-600 text-xs py-4">
              No movements match "{search}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────

interface ExerciseOptionProps {
  exercise: Exercise;
  onSelect: (ex: Exercise) => void;
  highlight?: boolean;
}

function ExerciseOption({ exercise, onSelect, highlight }: ExerciseOptionProps) {
  return (
    <button
      onClick={() => onSelect(exercise)}
      className={cn(
        'w-full text-left rounded px-3 py-2 border transition-all duration-200 group',
        highlight
          ? 'border-amber-800/40 hover:border-amber-500/60 hover:bg-amber-950/20'
          : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-sm font-body truncate',
              highlight
                ? 'text-amber-300 group-hover:text-amber-200'
                : 'text-zinc-300 group-hover:text-white',
            )}
          >
            {exercise.name}
          </div>
          <div className="text-[10px] text-zinc-600 mt-0.5">
            {exercise.primaryMuscles.slice(0, 3).join(' · ')}
          </div>
        </div>
        <div className="flex flex-wrap gap-0.5 justify-end flex-shrink-0">
          {exercise.equipment.slice(0, 2).map((eq) => (
            <span
              key={eq}
              className="text-[9px] px-1 py-0 rounded border border-zinc-700 text-zinc-500"
            >
              {eq}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
