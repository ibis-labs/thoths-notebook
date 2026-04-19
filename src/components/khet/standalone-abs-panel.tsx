"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { X, FlameKindling, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ExerciseLog, SetLog } from '@/lib/khet-types';

const ABS_EXERCISES = [
  { exerciseId: 'crunch',             name: 'Crunch' },
  { exerciseId: 'decline-sit-up',     name: 'Decline Sit-Up' },
  { exerciseId: 'leg-raise',          name: 'Leg Raise' },
  { exerciseId: 'hanging-knee-raise', name: 'Hanging Knee Raise' },
  { exerciseId: 'cable-crunch',       name: 'Cable Crunch' },
  { exerciseId: 'russian-twist',      name: 'Russian Twist' },
  { exerciseId: 'ab-wheel-rollout',   name: 'Ab Wheel Rollout' },
  { exerciseId: 'toes-to-bar',        name: 'Toes-to-Bar' },
];

const BLANK_SET: SetLog = { weight: 0, reps: 0, completed: false };

interface StandaloneAbsPanelProps {
  onClose: () => void;
}

export function StandaloneAbsPanel({ onClose }: StandaloneAbsPanelProps) {
  const { saveSession, weightUnit } = useKhet();
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [saving, setSaving] = useState(false);

  const addedIds = new Set(logs.map((l) => l.exerciseId));
  const available = ABS_EXERCISES.filter((e) => !addedIds.has(e.exerciseId));

  const addExercise = (ex: typeof ABS_EXERCISES[0]) => {
    setLogs((prev) => [...prev, { exerciseId: ex.exerciseId, name: ex.name, sets: [{ ...BLANK_SET }] }]);
  };

  const removeExercise = (idx: number) =>
    setLogs((prev) => prev.filter((_, i) => i !== idx));

  const updateSet = (exIdx: number, setIdx: number, updates: Partial<SetLog>) =>
    setLogs((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...updates };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });

  const addSet = (exIdx: number) =>
    setLogs((prev) => {
      const next = [...prev];
      const sets = next[exIdx].sets;
      next[exIdx] = { ...next[exIdx], sets: [...sets, { weight: sets[sets.length - 1]?.weight ?? 0, reps: 0, completed: false }] };
      return next;
    });

  const removeSet = (exIdx: number) =>
    setLogs((prev) => {
      const next = [...prev];
      if (next[exIdx].sets.length <= 1) return prev;
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.slice(0, -1) };
      return next;
    });

  const anyCompleted = logs.some((l) => l.sets.some((s) => s.completed));

  const handleSave = async () => {
    if (!user || !anyCompleted) return;
    setSaving(true);
    const totalVolume = logs.reduce((t, l) =>
      t + l.sets.reduce((st, s) => s.completed ? st + s.weight * s.reps : st, 0), 0);
    try {
      await saveSession({
        userId: user.uid,
        programId: 'standalone',
        programName: 'Standalone',
        dayIndex: 0,
        dayLabel: 'Abs',
        date: format(new Date(), 'yyyy-MM-dd'),
        exerciseLogs: logs,
        completed: true,
        totalVolume,
        linkedTaskId: null,
        linkedRitualId: null,
      });
      toast({ title: 'Abs logged', description: `${logs.length} exercise${logs.length !== 1 ? 's' : ''}` });
      onClose();
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FlameKindling className="w-5 h-5 text-amber-500" />
          <h2 className="font-headline text-amber-300 text-lg uppercase tracking-widest">Log Abs</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add exercise pills */}
        {available.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {available.map((ex) => (
              <button
                key={ex.exerciseId}
                onClick={() => addExercise(ex)}
                className="flex items-center gap-1 text-[10px] font-headline uppercase tracking-wider px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-300 hover:bg-amber-950/20 transition-all"
              >
                <Plus className="w-2.5 h-2.5" />
                {ex.name}
              </button>
            ))}
          </div>
        )}

        {logs.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">Tap an exercise above to start logging.</p>
        )}

        {logs.map((log, exIdx) => (
          <div key={exIdx} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-headline text-amber-300">{log.name}</span>
              <button onClick={() => removeExercise(exIdx)} className="text-zinc-600 hover:text-rose-400 transition-colors">
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

            {log.sets.map((s, setIdx) => (
              <div key={setIdx} className={cn(
                'grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center rounded transition-colors',
                s.completed ? 'bg-amber-950/20' : '',
              )}>
                <span className={cn('text-sm font-headline text-center', s.completed ? 'text-amber-400' : 'text-zinc-400')}>
                  {setIdx + 1}
                </span>
                <Input type="number" value={s.weight || ''} placeholder="0" min={0}
                  onChange={(e) => updateSet(exIdx, setIdx, { weight: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-amber-500 text-white placeholder:text-zinc-700" />
                <Input type="number" value={s.reps || ''} placeholder="0" min={0}
                  onChange={(e) => updateSet(exIdx, setIdx, { reps: parseInt(e.target.value) || 0 })}
                  className="h-7 text-sm text-center bg-black border-zinc-700 focus:border-amber-500 text-white placeholder:text-zinc-700" />
                <div className="flex justify-center">
                  <Checkbox
                    checked={s.completed}
                    onCheckedChange={(v) => updateSet(exIdx, setIdx, { completed: !!v })}
                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => addSet(exIdx)} className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 transition-colors">
                <Plus className="w-3 h-3" /> Add Set
              </button>
              {log.sets.length > 1 && (
                <button onClick={() => removeSet(exIdx)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-400 transition-colors">
                  <Minus className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleSave}
          disabled={!anyCompleted || saving}
          className="w-full h-12 rounded font-headline uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-500 text-black flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Saving…' : 'Log Session'}
        </button>
        {!anyCompleted && logs.length > 0 && (
          <p className="text-center text-[10px] text-zinc-600 mt-1.5">Complete at least one set to save.</p>
        )}
      </div>
    </div>
  );
}
