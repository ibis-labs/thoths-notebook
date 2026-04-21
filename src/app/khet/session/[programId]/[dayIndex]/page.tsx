"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ChevronLeft,
  CheckCircle2,
  StickyNote,
  ChevronRight,
  Snowflake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth-provider';
import { useKhet } from '@/hooks/use-khet';
import { KhetSessionProvider, useKhetSession } from '@/components/khet/khet-context';
import { ExerciseRow } from '@/components/khet/exercise-row';
import { CardioTracker } from '@/components/khet/cardio-tracker';
import { AbsTracker } from '@/components/khet/abs-tracker';
import { VolumeDashboard } from '@/components/khet/volume-dashboard';
import { GhostLogPanel } from '@/components/khet/ghost-log';
import { AppSidebar } from '@/components/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import type { WorkoutSession, WorkoutProgram, Exercise } from '@/lib/khet-types';
import { cn, localDateStr } from '@/lib/utils';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// Outer page shell — fetches program & ghost logs, inits context
// ─────────────────────────────────────────────────────────────

export default function SessionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ programId: string; dayIndex: string }>();
  const { programs, loading: programsLoading, getGhostLogs } = useKhet();
  const [ghostSessions, setGhostSessions] = useState<WorkoutSession[]>([]);
  const [ghostLoading, setGhostLoading] = useState(true);

  const programId = params.programId;
  const dayIndex = parseInt(params.dayIndex ?? '0', 10);

  const program = programs.find((p) => p.id === programId);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Fetch ghost logs for this day
  useEffect(() => {
    if (!program || !user) return;
    setGhostLoading(true);
    getGhostLogs(programId, dayIndex)
      .then(setGhostSessions)
      .finally(() => setGhostLoading(false));
  }, [program, programId, dayIndex, user, getGhostLogs]);

  if (authLoading || programsLoading || !user) return null;

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Program not found.</p>
          <Link href="/khet/dashboard" className="text-cyan-400 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!program.days[dayIndex]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-zinc-500">Day not found.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar activeCategory="" setActiveCategory={() => {}} />
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 bg-background min-h-screen overflow-y-auto">
        <main className="flex-1">
          {ghostLoading ? (
            // Wait for ghost logs before mounting the provider so initial
            // weights can be seeded from the most recent session
            <div className="flex items-center justify-center h-48">
              <div className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
                Loading Akashic Record…
              </div>
            </div>
          ) : (
            <KhetSessionProvider
              program={program}
              dayIndex={dayIndex}
              ghostSessions={ghostSessions}
            >
              <SessionInner
                program={program}
                dayIndex={dayIndex}
                ghostSessions={ghostSessions}
                ghostLoading={ghostLoading}
              />
            </KhetSessionProvider>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Inner session UI — accesses context via useKhetSession
// ─────────────────────────────────────────────────────────────

interface SessionInnerProps {
  program: WorkoutProgram;
  dayIndex: number;
  ghostSessions: WorkoutSession[];
  ghostLoading: boolean;
}

function SessionInner({ program, dayIndex, ghostSessions, ghostLoading }: SessionInnerProps) {
  const { user } = useAuth();
  const { state, dispatch, totalVolume, anySetCompleted } = useKhetSession();
  const { completeSessionAndSync } = useKhet();
  const { toast } = useToast();
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [ghostOpen, setGhostOpen] = useState(false);
  const [exerciseDb, setExerciseDb] = useState<Exercise[]>([]);

  // Load exercise database for cues lookup
  useEffect(() => {
    fetch('/docs/full_expanded_exercises.json')
      .then((r) => r.json())
      .then((data: Exercise[]) => setExerciseDb(data))
      .catch(() => {});
  }, []);

  const day = program.days[dayIndex];
  const today = format(new Date(), 'EEEE, MMMM d · yyyy');

  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const sessionData: Omit<WorkoutSession, 'id'> = {
        userId: user.uid,
        programId: program.id,
        programName: program.name,
        dayIndex,
        dayLabel: day.label,
        date: localDateStr(),
        exerciseLogs: state.exerciseLogs,
        cardioLog: state.cardioEnabled ? state.cardioLog : undefined,
        absLogs: state.absEnabled && state.absLogs.length > 0 ? state.absLogs : undefined,
        notes: state.notes,
        completed: true,
        totalVolume,
        durationMinutes: Math.round(
          (Date.now() - new Date(state.startDate).getTime()) / 60000,
        ),
        linkedTaskId: program.linkedTaskId ?? null,
        linkedRitualId: program.linkedRitualId ?? null,
      };
      await completeSessionAndSync(sessionData);

      // If this session completes the final day of a deload week, show the recharge message
      const today = localDateStr();
      const isLastDeloadSession =
        program.isDeloading &&
        program.lastDeloadEnd &&
        today >= program.lastDeloadEnd;

      if (isLastDeloadSession) {
        toast({
          title: '⚡ System Recharge Complete',
          description:
            'Your CNS is fresh, your joints are recovered, and your muscle fibers are primed for growth. The Ritual of Preservation is over. It\'s time to push the numbers — let\'s set a new baseline!',
          duration: 10000,
        });
        setTimeout(() => router.push('/khet/dashboard'), 4000);
      } else {
        router.push('/khet/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error saving session', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
      {/* Top nav */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-zinc-500 hover:text-cyan-400 transition-colors" />
        <Link
          href="/khet/dashboard"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="font-headline text-amber-400 text-2xl uppercase tracking-widest">
            {day.label}
          </h1>
          <span className="text-sm text-zinc-300 font-body">{today}</span>
        </div>
        <p className="text-base text-zinc-100 mt-1 font-headline">{program.name}</p>

        {/* Deload Week session-level banner */}
        {program.isDeloading && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-500/25">
            <Snowflake className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-headline uppercase tracking-widest text-blue-300">Deload Week Active</p>
              <p className="text-[10px] text-blue-400/60 mt-0.5">
                {program.deloadStrategy === 'reduce-volume' && 'Volume reduced to ~40% — fewer sets, owned intensity'}
                {program.deloadStrategy === 'reduce-intensity' && 'Use 50–70% of working weight — full sets and reps'}
                {program.deloadStrategy === 'reduce-reps' && 'Cut reps in half — maintain weight and sets'}
                {program.deloadStrategy === 'reduce-frequency' && 'Take fewer sessions this week — stay active, stay light'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Day navigation tabs */}
      <div className="flex gap-1 flex-wrap">
        {program.days.map((d, i) => (
          <Link
            key={i}
            href={`/khet/session/${program.id}/${i}`}
            className={cn(
              'text-[10px] font-headline uppercase tracking-wider px-2.5 py-1.5 rounded border transition-all',
              i === dayIndex
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300',
            )}
          >
            {d.label}
          </Link>
        ))}
      </div>

      {/* Ghost log toggle */}
      {!ghostLoading && ghostSessions.length > 0 && (
        <div>
          <button
            onClick={() => setGhostOpen((v) => !v)}
            className="flex items-center gap-2 text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <span>{ghostOpen ? '▾' : '▸'}</span>
            Akashic Record{' '}
            <span className="text-zinc-700">({ghostSessions.length} session{ghostSessions.length > 1 ? 's' : ''})</span>
          </button>
          {ghostOpen && <GhostLogPanel sessions={ghostSessions} />}
        </div>
      )}

      {/* Exercise rows */}
      <div className="space-y-3">
        {day.exercises.map((programEx, exIdx) => (
          <ExerciseRow
            key={`${programEx.exerciseId}-${exIdx}`}
            exerciseIdx={exIdx}
            programExercise={programEx}
            ghostSessions={ghostSessions}
            isDeloading={!!program.isDeloading}
            deloadStrategy={program.deloadStrategy}
            cues={exerciseDb.find((e) => e.id === programEx.exerciseId)?.cues}
          />
        ))}
      </div>

      {/* Volume dashboard */}
      <VolumeDashboard lifetimeVolume={program.lifetimeVolume} />

      {/* Cardio section */}
      <CardioTracker />

      {/* Abs section */}
      <AbsTracker />

      {/* Session notes */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] font-headline uppercase tracking-[0.25em] text-zinc-500 mb-1.5">
          <StickyNote className="w-3 h-3" />
          Session Notes
        </label>
        <Textarea
          value={state.notes}
          onChange={(e) => dispatch({ type: 'SET_NOTES', notes: e.target.value })}
          placeholder="Technical cues, how you felt, equipment settings…"
          className="bg-black border-zinc-700 resize-none text-sm text-zinc-300 placeholder:text-zinc-700 min-h-[80px]"
        />
      </div>

      {/* Complete session button */}
      <div className="pb-8">
        <Button
          onClick={handleComplete}
          disabled={!anySetCompleted || completing}
          className={cn(
            'w-full h-12 font-headline uppercase tracking-[0.3em] text-sm transition-all duration-500',
            anySetCompleted
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]'
              : 'bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed',
          )}
        >
          {completing ? (
            'Sealing the Record…'
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Workout Complete — Gold State
            </>
          )}
        </Button>
        {!anySetCompleted && (
          <p className="text-center text-[10px] text-zinc-700 mt-2">
            Complete at least one set to seal the session.
          </p>
        )}
      </div>
    </div>
  );
}
