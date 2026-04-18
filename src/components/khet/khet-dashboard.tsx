"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  Dumbbell,
  Plus,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Calendar,
  Trash2,
  Pencil,
  Zap,
  BatteryLow,
  BarChart2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useKhet } from '@/hooks/use-khet';
import { ProgramWizard } from './program-wizard';
import { ProgressPanel } from './progress-panel';
import { GainzPanel } from './gainz-panel';
import { UserStatsPanel } from './user-stats-panel';
import { FirstPylonIcon } from '@/components/icons/FirstPylonIcon';
import type { WorkoutProgram, DeloadStrategy } from '@/lib/khet-types';
import { cn } from '@/lib/utils';

export function KhetDashboard() {
  const { programs, loading, deleteProgram } = useKhet();
  const { toast } = useToast();
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [gainzOpen, setGainzOpen] = useState(false);
  const [userStatsOpen, setUserStatsOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      // Require second click to confirm
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    try {
      await deleteProgram(id);
      setDeletingId(null);
      toast({ title: 'Program removed' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-zinc-800 bg-zinc-950/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Hall pylon button */}
      <div>
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-amber-400 bg-amber-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] min-w-[110px]"
        >
          <FirstPylonIcon size={60} className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
          <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-amber-300 mt-1">
            To Main Hall
          </span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-amber-400 text-xl uppercase tracking-widest">
            Khet-Station
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Mass Displacement Engine</p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Program
        </Button>
      </div>

      {/* Action row: Gainz + Athlete Profile */}
      <div className="flex gap-2">
        <button
          onClick={() => setGainzOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:border-amber-600/40 hover:bg-amber-950/10 transition-all text-xs font-headline uppercase tracking-[0.2em] text-zinc-500 hover:text-amber-300"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Gainz
        </button>
        <button
          onClick={() => setUserStatsOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:border-cyan-600/40 hover:bg-cyan-950/10 transition-all text-xs font-headline uppercase tracking-[0.2em] text-zinc-500 hover:text-cyan-300"
        >
          <User className="w-3.5 h-3.5" />
          Athlete Profile
        </button>
      </div>

      {/* Empty state */}
      {programs.length === 0 && (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-body text-sm">No programs forged yet.</p>
          <p className="text-zinc-700 text-xs mt-1">
            Create your first program to begin tracking.
          </p>
          <Button
            onClick={() => setWizardOpen(true)}
            className="mt-4 bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-xs"
          >
            Forge a Program
          </Button>
        </div>
      )}

      {/* Program cards */}
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          onEdit={() => setEditingProgram(program)}
          onDelete={() => handleDelete(program.id)}
          deleteConfirming={deletingId === program.id}
        />
      ))}

      {/* Program Wizard — create */}
      <ProgramWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
      {/* Program Wizard — edit */}
      <ProgramWizard
        open={!!editingProgram}
        editProgram={editingProgram ?? undefined}
        onClose={() => setEditingProgram(null)}
      />
      {/* Gainz panel */}
      {gainzOpen && <GainzPanel onClose={() => setGainzOpen(false)} />}
      {/* Athlete Profile / User Stats */}
      {userStatsOpen && <UserStatsPanel onClose={() => setUserStatsOpen(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

interface ProgramCardProps {
  program: WorkoutProgram;
  onEdit: () => void;
  onDelete: () => void;
  deleteConfirming: boolean;
}

function ProgramCard({ program, onEdit, onDelete, deleteConfirming }: ProgramCardProps) {
  const { updateProgram } = useKhet();
  const { toast } = useToast();
  const [deloadOpen, setDeloadOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [confirmDeloadStrategy, setConfirmDeloadStrategy] = useState<DeloadStrategy>(
    program.deloadStrategy ?? 'reduce-volume',
  );

  const mesocycleDays = program.mesocycleStart
    ? differenceInDays(new Date(), parseISO(program.mesocycleStart))
    : 0;
  const durationDays = (program.durationWeeks ?? 8) * 7;
  const progressPct = Math.min(100, Math.round((mesocycleDays / durationDays) * 100));
  const mesocycleWeeks = Math.floor(mesocycleDays / 7);
  const adaptationAlert = mesocycleDays >= 42;
  // Recommend deload every 6 weeks if not currently deloading
  const weeksSinceDeload = program.lastDeloadEnd
    ? Math.floor(differenceInDays(new Date(), parseISO(program.lastDeloadEnd)) / 7)
    : mesocycleWeeks;
  const deloadRecommended = !program.isDeloading && weeksSinceDeload >= 6;

  const splitLabel: Record<string, string> = {
    PPL: 'Push / Pull / Legs',
    UpperLower: 'Upper / Lower',
    FullBody: 'Full Body',
  };

  const deloadLabel: Record<DeloadStrategy, string> = {
    'reduce-volume': 'Reduce Volume (Best)',
    'reduce-intensity': 'Reduce Intensity (Joint Relief)',
    'reduce-reps': 'Reduce Reps (Quick Session)',
    'reduce-frequency': 'Reduce Frequency (Easy Week)',
  };

  const handleStartDeload = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    try {
      await updateProgram(program.id, {
        isDeloading: true,
        deloadStrategy: confirmDeloadStrategy,
        lastDeloadStart: today,
        lastDeloadEnd: endDate.toISOString().slice(0, 10),
      });
      toast({ title: 'Deload Week Started', description: `${deloadLabel[confirmDeloadStrategy]} — ends ${format(endDate, 'MMM d')}.` });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeloadOpen(false);
  };

  const handleEndDeload = async () => {
    try {
      await updateProgram(program.id, { isDeloading: false });
      toast({ title: 'Deload Week Complete', description: 'Back to full training. Forge on.' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-gradient-to-br from-zinc-950 via-[#0a0f1e] to-[#0f0a00] p-4 space-y-4 overflow-hidden',
        adaptationAlert ? 'border-amber-600/50' : 'border-zinc-800',
      )}
    >
      {/* Program header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-headline text-amber-300 text-base">{program.name}</h3>
            {program.isDeloading && (
              <span className="flex items-center gap-1 text-[9px] font-headline uppercase tracking-wider text-blue-400 border border-blue-500/40 rounded px-1.5 py-0.5 bg-blue-950/20 flex-shrink-0">
                <BatteryLow className="w-2.5 h-2.5" />
                Deload
              </span>
            )}
            {adaptationAlert && !program.isDeloading && (
              <span className="flex items-center gap-1 text-[9px] font-headline uppercase tracking-wider text-amber-500 border border-amber-600/50 rounded px-1.5 py-0.5 bg-amber-950/20 flex-shrink-0">
                <AlertTriangle className="w-2.5 h-2.5" />
                Adapt
              </span>
            )}
          </div>

          {/* Stacked meta lines */}
          <div className="mt-1.5 space-y-0.5">
            <div className="text-sm text-zinc-300">{splitLabel[program.split]}</div>
            <div className="text-sm text-zinc-300">{program.frequency}× per week</div>
            {program.mesocycleStart && (
              <div className="text-sm text-zinc-300">
                Week {mesocycleWeeks + 1} of {program.durationWeeks ?? 8}
                <span className="text-zinc-500 ml-2">(Day {mesocycleDays})</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {program.mesocycleStart && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-zinc-600 mb-0.5">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progressPct >= 100 ? 'bg-amber-400' : 'bg-cyan-600',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Volume stat */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-sm text-cyan-400 font-headline">
                {(program.lifetimeVolume / 1000).toFixed(1)}t
              </span>
            </div>
            <div className="text-xs text-zinc-400">lifetime</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProgressOpen(true)}
              className="p-1.5 rounded transition-colors text-zinc-600 hover:text-amber-400"
              title="Progress & PRs"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded transition-colors text-zinc-600 hover:text-cyan-400"
              title="Edit program"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className={cn(
                'p-1.5 rounded transition-colors',
                deleteConfirming
                  ? 'text-red-400 bg-red-950/30'
                  : 'text-zinc-700 hover:text-red-500',
              )}
              title={deleteConfirming ? 'Click again to confirm' : 'Delete program'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Last session */}
      {program.lastSessionDate && (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Calendar className="w-3.5 h-3.5" />
          Last: {format(parseISO(program.lastSessionDate), 'EEE, MMM d')}
          {program.lastSessionDayIndex !== null && program.lastSessionDayIndex !== undefined && (
            <span className="text-zinc-400">
              — {program.days[program.lastSessionDayIndex]?.label}
            </span>
          )}
        </div>
      )}

      {/* Deload info row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-zinc-500">
          {program.isDeloading && program.lastDeloadStart && program.lastDeloadEnd ? (
            <span className="text-blue-400">
              Deload: {format(parseISO(program.lastDeloadStart), 'MMM d')} – {format(parseISO(program.lastDeloadEnd), 'MMM d')}
              {' '}— {deloadLabel[program.deloadStrategy ?? 'reduce-volume']}
            </span>
          ) : program.lastDeloadEnd ? (
            <span>Last deload: {format(parseISO(program.lastDeloadEnd), 'MMM d, yyyy')}</span>
          ) : (
            <span className="text-zinc-700">No deload logged yet</span>
          )}
        </div>

        {program.isDeloading ? (
          <button
            onClick={handleEndDeload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/40 bg-blue-950/20 text-blue-300 hover:bg-blue-950/40 transition-all text-xs font-headline uppercase tracking-wider"
          >
            <Zap className="w-3 h-3" />
            End Deload
          </button>
        ) : (
          <button
            onClick={() => setDeloadOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs font-headline uppercase tracking-wider',
              deloadRecommended
                ? 'border-amber-500/60 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
            )}
          >
            <BatteryLow className="w-3 h-3" />
            {deloadRecommended ? 'Deload Now' : 'Start Deload'}
          </button>
        )}
      </div>

      {/* Deload confirm panel */}
      {deloadOpen && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/10 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-headline uppercase tracking-widest text-blue-300">Choose Deload Strategy</p>
            <button onClick={() => setDeloadOpen(false)} className="text-zinc-600 hover:text-zinc-400">×</button>
          </div>

          <Select
            value={confirmDeloadStrategy}
            onValueChange={(v) => setConfirmDeloadStrategy(v as DeloadStrategy)}
          >
            <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-zinc-800">
              <SelectItem value="reduce-volume" className="text-amber-300 focus:bg-amber-950/30">
                Reduce Volume (Best) — 1–2 sets, same weight &amp; reps
              </SelectItem>
              <SelectItem value="reduce-intensity" className="text-amber-300 focus:bg-amber-950/30">
                Reduce Intensity (Joint Relief) — 60% weight, same sets &amp; reps
              </SelectItem>
              <SelectItem value="reduce-reps" className="text-amber-300 focus:bg-amber-950/30">
                Reduce Reps (Quick Session) — half reps, same sets &amp; weight
              </SelectItem>
            </SelectContent>
          </Select>

          <p className="text-[10px] text-zinc-500">
            {confirmDeloadStrategy === 'reduce-volume' && 'Sets cut to 1 (or 2 if 5+ sets) — same weight, same reps.'}
            {confirmDeloadStrategy === 'reduce-intensity' && 'Weight at 60% of your working load — full sets and reps.'}
            {confirmDeloadStrategy === 'reduce-reps' && 'Reps cut in half — same sets, same weight.'}
          </p>

          <button
            onClick={handleStartDeload}
            className="w-full py-1.5 rounded border border-blue-500/50 bg-blue-950/30 text-blue-300 hover:bg-blue-950/50 transition-all text-xs font-headline uppercase tracking-widest"
          >
            Begin Deload Week
          </button>
        </div>
      )}

      {/* Adaptation alert banner */}
      {adaptationAlert && !program.isDeloading && (
        <div className="rounded border border-amber-700/40 bg-amber-950/10 p-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            <strong>42-Day Adaptation Alert</strong> — Your CNS has fully mapped this stimulus. 
            Rotate exercise selection to prevent plateau.
          </p>
        </div>
      )}

      {/* Day tabs */}
      <div className="flex flex-wrap gap-1">
        {(program.days ?? []).map((day, idx) => (
          <Link
            key={idx}
            href={`/khet/session/${program.id}/${idx}`}
            className={cn(
              'group flex items-center justify-between px-3 py-2 rounded border text-xs font-headline uppercase tracking-wider transition-all duration-200 whitespace-nowrap',
              program.lastSessionDayIndex === idx
                ? 'border-amber-600/40 text-amber-400 bg-amber-950/10'
                : 'border-zinc-800 text-zinc-400 hover:border-amber-600/40 hover:text-amber-300 hover:bg-amber-950/5',
            )}
          >
            <span>{day.label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
          </Link>
        ))}
      </div>

      {/* Progress Panel drawer */}
      {progressOpen && (
        <ProgressPanel program={program} onClose={() => setProgressOpen(false)} />
      )}
    </div>
  );
}
