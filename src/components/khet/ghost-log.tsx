"use client";

import { format, parseISO } from 'date-fns';
import { History } from 'lucide-react';
import type { WorkoutSession } from '@/lib/khet-types';
import { cn } from '@/lib/utils';

interface GhostLogProps {
  sessions: WorkoutSession[];
  exerciseId: string; // Show ghost data for this specific exercise
}

/**
 * Renders the last 3 logged set entries for a given exercise
 * as ghost/reference data to guide progressive overload.
 */
export function GhostLog({ sessions, exerciseId }: GhostLogProps) {
  if (sessions.length === 0) return null;

  const relevant = sessions
    .map((s) => ({
      date: s.date,
      log: s.exerciseLogs.find((e) => e.exerciseId === exerciseId),
    }))
    .filter((x) => x.log && x.log.sets.some((s) => s.completed));

  if (relevant.length === 0) return null;

  return (
    <div className="mt-1 space-y-1">
      {relevant.map(({ date, log }, idx) => (
        <div
          key={idx}
          className={cn(
            'text-[10px] font-body tracking-wide',
            idx === 0 ? 'text-amber-400/70' : 'text-zinc-600',
          )}
        >
          <span className="mr-2 text-zinc-500">{format(parseISO(date), 'MMM d')}</span>
          {log!.sets
            .filter((s) => s.completed)
            .map((s, si) => (
              <span key={si} className="mr-2">
                {s.weight}×{s.reps}
                {s.rpe !== undefined ? (
                  <span className="text-zinc-600 ml-0.5">@{s.rpe}</span>
                ) : null}
              </span>
            ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Full-day ghost log panel for above the session
// ─────────────────────────────────────────────────────────────

interface GhostLogPanelProps {
  sessions: WorkoutSession[];
}

export function GhostLogPanel({ sessions }: GhostLogPanelProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-headline uppercase tracking-[0.3em] text-zinc-500">
          Akashic Record — Last {sessions.length} Session{sessions.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="border-l-2 border-zinc-700 pl-3">
            <div className="text-[10px] text-zinc-400 font-headline mb-1">
              {format(parseISO(s.date), 'EEE, MMM d')}
              <span className="ml-2 text-amber-500/60">
                {s.totalVolume.toLocaleString()} kg
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {s.exerciseLogs.map((exLog) => {
                const completedSets = exLog.sets.filter((set) => set.completed);
                if (completedSets.length === 0) return null;
                return (
                  <div key={exLog.exerciseId} className="text-[9px] text-zinc-600">
                    <span className="text-zinc-500 mr-1">{exLog.name}:</span>
                    {completedSets.map((s, i) => (
                      <span key={i} className="mr-1.5">
                        {s.weight}×{s.reps}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
