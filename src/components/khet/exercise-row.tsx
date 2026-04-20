"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Plus, Minus, ChevronDown, ChevronUp, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useKhetSession } from './khet-context';
import { GhostLog } from './ghost-log';
import { SubstitutionEngine } from './substitution-engine';
import { useKhet } from '@/hooks/use-khet';
import type { WorkoutSession, ProgramExercise, DeloadStrategy } from '@/lib/khet-types';

interface ExerciseRowProps {
  exerciseIdx: number;
  programExercise: ProgramExercise;
  ghostSessions: WorkoutSession[];
  isDeloading?: boolean;
  deloadStrategy?: DeloadStrategy;
}

export function ExerciseRow({
  exerciseIdx,
  programExercise,
  ghostSessions,
  isDeloading = false,
  deloadStrategy = 'reduce-volume',
}: ExerciseRowProps) {
  const { state, dispatch } = useKhetSession();
  const { weightUnit } = useKhet();
  const log = state.exerciseLogs[exerciseIdx];
  const [notesOpen, setNotesOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);

  const allSetsComplete =
    log.sets.length > 0 && log.sets.every((s) => s.completed);

  // ── Deload engine ─────────────────────────────────────────────
  // Set Floor: 1-4 original sets → 1 deload set; 5+ → 2 deload sets
  const programSets = programExercise.sets;
  const totalSets = log.sets.length;
  const deloadBaseActiveSets =
    isDeloading && deloadStrategy === 'reduce-volume'
      ? programSets >= 5 ? 2 : 1
      : totalSets;

  // Tracks extra sets the user manually adds during a deload week
  const [deloadExtraSets, setDeloadExtraSets] = useState(0);
  const deloadActiveSets = deloadBaseActiveSets + deloadExtraSets;

  // Pre-adjust weight (×0.6) or reps (÷2) once on mount when deloading
  const deloadApplied = useRef(false);
  useEffect(() => {
    if (!isDeloading || deloadApplied.current) return;
    if (deloadStrategy !== 'reduce-intensity' && deloadStrategy !== 'reduce-reps') return;
    deloadApplied.current = true;
    log.sets.forEach((s, setIdx) => {
      if (deloadStrategy === 'reduce-intensity' && s.weight) {
        dispatch({
          type: 'UPDATE_SET',
          exerciseIdx,
          setIdx,
          updates: { weight: Math.round(s.weight * 0.6) },
        });
      }
      if (deloadStrategy === 'reduce-reps' && s.reps) {
        dispatch({
          type: 'UPDATE_SET',
          exerciseIdx,
          setIdx,
          updates: { reps: Math.max(1, Math.ceil(s.reps / 2)) },
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deloadBannerSuffix =
    deloadStrategy === 'reduce-volume'
      ? `${deloadActiveSets} of ${totalSets} sets today`
      : deloadStrategy === 'reduce-intensity'
      ? 'Weight at 60% — all sets & reps'
      : 'Half reps — all sets & weight';

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300 p-3',
        isDeloading
          ? 'border-blue-500/30 bg-blue-950/5'
          : allSetsComplete
          ? 'border-amber-500/50 bg-amber-950/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'border-zinc-800 bg-zinc-950/30',
      )}
    >
      {/* ── Deload Week banner ── */}
      {isDeloading && (
        <div className="flex items-center gap-1.5 mb-2 px-1.5 py-1 rounded bg-blue-950/30 border border-blue-500/20">
          <Snowflake className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-[9px] font-headline uppercase tracking-widest text-blue-300">Deload Week</span>
          <span className="text-[9px] text-blue-400/70 ml-auto">{deloadBannerSuffix}</span>
        </div>
      )}
      {/* ── Header ── */}
      <div className="mb-3">
        {/* Row 1: Exercise name + notes toggle */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-headline text-cyan-300 leading-snug">{log.name}</h4>
            {log.originalName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-zinc-500 italic">Originally: {log.originalName}</span>
                <span className="text-[9px] font-headline uppercase tracking-widest text-amber-400 border border-amber-600/40 rounded-full px-1.5 py-0.5 bg-amber-950/30">
                  Today Only
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-cyan-400 flex-shrink-0"
            onClick={() => setNotesOpen((v) => !v)}
            title="Notes"
          >
            {notesOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        {/* Row 2: Target + Alternative button */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-headline text-zinc-200">{programExercise.sets} sets</p>
            <p className="text-sm font-headline text-zinc-200">Rep Range: {programExercise.goalReps}</p>
          </div>
          <button
            onClick={() => setSwapOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-600 bg-zinc-900 hover:border-amber-500 hover:bg-amber-950/30 hover:text-amber-300 text-zinc-400 transition-all text-[10px] font-headline uppercase tracking-wider flex-shrink-0"
            title="Use a different exercise today only"
          >
            <ArrowLeftRight className="w-3 h-3" />
            Alternate
          </button>
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 mb-1">
        <div className="text-sm text-zinc-200 uppercase text-center font-headline">Set</div>
        <div className="text-sm text-zinc-200 uppercase text-center font-headline">{weightUnit}</div>
        <div className="text-sm text-zinc-200 uppercase text-center font-headline">Reps</div>
        <div className="text-sm text-zinc-200 uppercase text-center font-headline">RPE</div>
        <div className="text-sm text-zinc-200 uppercase text-center font-headline">✓</div>
      </div>

      {/* ── Set Rows ── */}
      <div className="space-y-1.5">
        {log.sets.map((s, setIdx) => {
          // During deload, don't render sets beyond the deload active count
          if (isDeloading && setIdx >= deloadActiveSets) return null;
          return (
          <div
            key={setIdx}
            className={cn(
              'grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center rounded transition-colors',
              s.completed ? 'bg-amber-950/20' : '',
            )}
          >
            <span
              className={cn(
                'text-sm font-headline text-center',
                s.completed ? 'text-amber-400' : 'text-zinc-400',
              )}
            >
              {setIdx + 1}
            </span>
            <Input
              type="number"
              value={s.weight || ''}
              placeholder="0"
              min={0}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SET',
                  exerciseIdx,
                  setIdx,
                  updates: { weight: parseFloat(e.target.value) || 0 },
                })
              }
              className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-cyan-500 text-white placeholder:text-zinc-700"
            />
            <Input
              type="number"
              value={s.reps || ''}
              placeholder="0"
              min={0}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SET',
                  exerciseIdx,
                  setIdx,
                  updates: { reps: parseInt(e.target.value) || 0 },
                })
              }
              className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-cyan-500 text-white placeholder:text-zinc-700"
            />
            <Input
              type="number"
              value={s.rpe ?? ''}
              placeholder="—"
              min={1}
              max={10}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SET',
                  exerciseIdx,
                  setIdx,
                  updates: {
                    rpe: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-cyan-500 text-white placeholder:text-zinc-700"
            />
            <div className="flex justify-center">
              <Checkbox
                checked={s.completed}
                onCheckedChange={(v) =>
                  dispatch({
                    type: 'UPDATE_SET',
                    exerciseIdx,
                    setIdx,
                    updates: { completed: !!v },
                  })
                }
                className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
            </div>
          </div>
          );
        })}
      </div>

      {/* ── Add / Remove Set ── */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => {
            dispatch({ type: 'ADD_SET', exerciseIdx });
            if (isDeloading && deloadStrategy === 'reduce-volume') {
              setDeloadExtraSets((n) => n + 1);
            }
          }}
          className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-300 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Set
        </button>
        {(isDeloading && deloadStrategy === 'reduce-volume'
          ? deloadExtraSets > 0
          : log.sets.length > 1) && (
          <button
            onClick={() => {
              dispatch({ type: 'REMOVE_SET', exerciseIdx });
              if (isDeloading && deloadStrategy === 'reduce-volume') {
                setDeloadExtraSets((n) => Math.max(0, n - 1));
              }
            }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <Minus className="w-3 h-3" /> Remove
          </button>
        )}
      </div>

      {/* ── Ghost Log (last 3 sessions — always uses original exercise id) ── */}
      <GhostLog sessions={ghostSessions} exerciseId={log.originalExerciseId ?? log.exerciseId} />

      {/* ── Notes (collapsible) ── */}
      {notesOpen && (
        <div className="mt-2">
          <Textarea
            placeholder="Technical cues, injury notes, equipment settings…"
            value={log.notes ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_EXERCISE_NOTES',
                exerciseIdx,
                notes: e.target.value,
              })
            }
            className="text-xs bg-black border-zinc-700 resize-none text-zinc-300 placeholder:text-zinc-700 min-h-[60px]"
          />
        </div>
      )}

      {/* ── Substitution Modal ── */}
      <SubstitutionEngine
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        currentExerciseId={log.exerciseId}
        currentExerciseName={log.name}
        onSwap={(newEx) => {
          dispatch({ type: 'SWAP_EXERCISE', exerciseIdx, newExercise: newEx });
          setSwapOpen(false);
        }}
      />
    </div>
  );
}
