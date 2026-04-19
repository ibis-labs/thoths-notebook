"use client";

import { ChevronDown, FlameKindling, Plus, Minus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useKhetSession } from './khet-context';
import { useKhet } from '@/hooks/use-khet';
import { cn } from '@/lib/utils';

const ABS_EXERCISES = [
  { exerciseId: 'crunch',            name: 'Crunch' },
  { exerciseId: 'decline-sit-up',    name: 'Decline Sit-Up' },
  { exerciseId: 'leg-raise',         name: 'Leg Raise' },
  { exerciseId: 'hanging-knee-raise',name: 'Hanging Knee Raise' },
  { exerciseId: 'cable-crunch',      name: 'Cable Crunch' },
  { exerciseId: 'russian-twist',     name: 'Russian Twist' },
  { exerciseId: 'ab-wheel-rollout',  name: 'Ab Wheel Rollout' },
  { exerciseId: 'toes-to-bar',       name: 'Toes-to-Bar' },
];

export function AbsTracker() {
  const { state, dispatch } = useKhetSession();
  const { weightUnit } = useKhet();
  const { absEnabled, absLogs } = state;

  const addedIds = new Set(absLogs.map((l) => l.exerciseId));
  const available = ABS_EXERCISES.filter((e) => !addedIds.has(e.exerciseId));

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_ABS' })}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950/50 hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlameKindling className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-headline text-amber-300 uppercase tracking-widest">
            Log Abs
          </span>
          {absEnabled && (
            <span className="text-[9px] text-amber-500 border border-amber-800 rounded px-1">
              ACTIVE
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-zinc-500 transition-transform duration-200',
            absEnabled && 'rotate-180',
          )}
        />
      </button>

      {/* Expanded body */}
      {absEnabled && (
        <div className="p-4 space-y-4 bg-black/30">
          {/* Add exercise row */}
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {available.map((ex) => (
                <button
                  key={ex.exerciseId}
                  onClick={() => dispatch({ type: 'ADD_ABS_EXERCISE', exercise: ex })}
                  className="flex items-center gap-1 text-[10px] font-headline uppercase tracking-wider px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-300 hover:bg-amber-950/20 transition-all"
                >
                  <Plus className="w-2.5 h-2.5" />
                  {ex.name}
                </button>
              ))}
            </div>
          )}

          {absLogs.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-2">
              Tap an exercise above to start logging.
            </p>
          )}

          {/* Logged exercises */}
          {absLogs.map((log, absIdx) => (
            <div key={absIdx} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-headline text-amber-300">{log.name}</span>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_ABS_EXERCISE', absIdx })}
                  className="text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2">
                <div className="text-xs text-zinc-400 uppercase text-center font-headline">Set</div>
                <div className="text-xs text-zinc-400 uppercase text-center font-headline">{weightUnit}</div>
                <div className="text-xs text-zinc-400 uppercase text-center font-headline">Reps</div>
                <div className="text-xs text-zinc-400 uppercase text-center font-headline">✓</div>
              </div>

              {/* Set rows */}
              {log.sets.map((s, setIdx) => (
                <div key={setIdx} className={cn(
                  'grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center rounded transition-colors',
                  s.completed ? 'bg-amber-950/20' : '',
                )}>
                  <span className={cn(
                    'text-sm font-headline text-center',
                    s.completed ? 'text-amber-400' : 'text-zinc-400',
                  )}>
                    {setIdx + 1}
                  </span>
                  <Input
                    type="number"
                    value={s.weight || ''}
                    placeholder="0"
                    min={0}
                    onChange={(e) =>
                      dispatch({ type: 'UPDATE_ABS_SET', absIdx, setIdx, updates: { weight: parseFloat(e.target.value) || 0 } })
                    }
                    className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-amber-500 text-white placeholder:text-zinc-700"
                  />
                  <Input
                    type="number"
                    value={s.reps || ''}
                    placeholder="0"
                    min={0}
                    onChange={(e) =>
                      dispatch({ type: 'UPDATE_ABS_SET', absIdx, setIdx, updates: { reps: parseInt(e.target.value) || 0 } })
                    }
                    className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-amber-500 text-white placeholder:text-zinc-700"
                  />
                  <div className="flex justify-center">
                    <Checkbox
                      checked={s.completed}
                      onCheckedChange={(v) =>
                        dispatch({ type: 'UPDATE_ABS_SET', absIdx, setIdx, updates: { completed: !!v } })
                      }
                      className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add / remove set */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => dispatch({ type: 'ADD_ABS_SET', absIdx })}
                  className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Set
                </button>
                {log.sets.length > 1 && (
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ABS_SET', absIdx })}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Minus className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
