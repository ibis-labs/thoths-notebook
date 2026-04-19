"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, BookOpen, ChevronDown, ChevronUp, StickyNote, Dumbbell } from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { cn } from '@/lib/utils';
import type { WorkoutSession } from '@/lib/khet-types';

interface WorkoutDiaryProps {
  onClose: () => void;
}

export function WorkoutDiary({ onClose }: WorkoutDiaryProps) {
  const { getDiaryEntries, weightUnit } = useKhet();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDiaryEntries(60).then((s) => {
      setSessions(s);
      setLoading(false);
    });
  }, [getDiaryEntries]);

  const hasAnyNotes = (s: WorkoutSession) =>
    !!s.notes?.trim() || s.exerciseLogs.some((e) => !!e.notes?.trim());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 className="font-headline text-amber-400 text-lg uppercase tracking-widest">Workout Diary</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <p className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
              Reading the Akashic Record…
            </p>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Dumbbell className="w-8 h-8 text-zinc-700" />
            <p className="text-zinc-500 text-sm">No completed sessions yet.</p>
          </div>
        )}

        {!loading && sessions.map((session) => {
          const isOpen = expandedId === session.id;
          const noteCount = session.exerciseLogs.filter((e) => !!e.notes?.trim()).length;
          const hasSessionNote = !!session.notes?.trim();

          return (
            <div
              key={session.id}
              className={cn(
                'rounded-xl border bg-zinc-950/60 overflow-hidden transition-all',
                isOpen ? 'border-amber-600/40' : 'border-zinc-800',
              )}
            >
              {/* Session summary row */}
              <button
                onClick={() => setExpandedId(isOpen ? null : session.id)}
                className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline text-amber-300 text-sm uppercase tracking-wider">
                      {session.dayLabel}
                    </span>
                    <span className="text-zinc-500 text-xs">·</span>
                    <span className="text-zinc-400 text-xs">{session.programName}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-zinc-300 text-xs">
                      {format(parseISO(session.date), 'EEE, MMM d yyyy')}
                    </span>
                    {session.durationMinutes && (
                      <span className="text-zinc-500 text-xs">{session.durationMinutes} min</span>
                    )}
                    <span className="text-cyan-400 text-xs">
                      {(session.totalVolume / 1000).toFixed(1)}t
                    </span>
                    {/* Note indicators */}
                    {(hasSessionNote || noteCount > 0) && (
                      <span className="flex items-center gap-1 text-[10px] font-headline uppercase tracking-wider text-amber-400 border border-amber-600/30 rounded-full px-1.5 py-0.5 bg-amber-950/20">
                        <StickyNote className="w-2.5 h-2.5" />
                        {hasSessionNote && noteCount > 0
                          ? `Session + ${noteCount} exercise note${noteCount > 1 ? 's' : ''}`
                          : hasSessionNote
                          ? 'Session note'
                          : `${noteCount} exercise note${noteCount > 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-zinc-500 mt-0.5">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-zinc-800 px-4 py-3 space-y-4">
                  {/* Session-level note */}
                  {hasSessionNote && (
                    <div className="rounded-lg border border-amber-600/20 bg-amber-950/10 px-3 py-2.5">
                      <p className="text-[10px] font-headline uppercase tracking-widest text-amber-400 mb-1">Session Notes</p>
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{session.notes}</p>
                    </div>
                  )}

                  {/* Exercise list */}
                  <div className="space-y-2">
                    {session.exerciseLogs.map((exLog, idx) => {
                      const completedSets = exLog.sets.filter((s) => s.completed);
                      const bestWeight = completedSets.length > 0
                        ? Math.max(...completedSets.map((s) => s.weight ?? 0))
                        : null;

                      return (
                        <div key={idx} className={cn(
                          'rounded-lg border px-3 py-2.5',
                          exLog.notes?.trim() ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800/50 bg-zinc-950/30',
                        )}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-headline text-cyan-300">{exLog.name}</p>
                              {exLog.originalName && (
                                <p className="text-[10px] text-zinc-600 italic mt-0.5">
                                  Sub for: {exLog.originalName}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-zinc-300">
                                {completedSets.length} set{completedSets.length !== 1 ? 's' : ''}
                              </p>
                              {bestWeight !== null && bestWeight > 0 && (
                                <p className="text-[10px] text-zinc-500">
                                  Top: {bestWeight}{weightUnit}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Per-set breakdown */}
                          {completedSets.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {completedSets.map((s, si) => (
                                <span key={si} className="text-[10px] font-body text-zinc-400 bg-zinc-800/60 rounded px-1.5 py-0.5">
                                  {s.weight ?? 0}{weightUnit} × {s.reps ?? 0}
                                  {s.rpe ? ` @${s.rpe}` : ''}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Exercise note */}
                          {exLog.notes?.trim() && (
                            <div className="mt-2 pt-2 border-t border-zinc-700/50">
                              <p className="text-[10px] font-headline uppercase tracking-widest text-zinc-500 mb-0.5">Note</p>
                              <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{exLog.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
