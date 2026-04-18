"use client";

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { X, TrendingUp, Trophy, Dumbbell, BarChart2, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { cn } from '@/lib/utils';
import type { ProgramProgress, ExercisePR, WorkoutProgram } from '@/lib/khet-types';

// ─────────────────────────────────────────────────────────────
// Mini sparkline — pure SVG, no dependencies
// ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#f59e0b' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Program Summary tab
// ─────────────────────────────────────────────────────────────
function ProgramSummaryTab({ program }: { program: WorkoutProgram }) {
  const { getProgramProgress } = useKhet();
  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProgramProgress(program.id, program.name)
      .then(setProgress)
      .finally(() => setLoading(false));
  }, [program.id, program.name, getProgramProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
          Reading the Akashic Record…
        </p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <Dumbbell className="w-8 h-8 text-zinc-700" />
        <p className="text-zinc-600 text-sm">No sessions recorded yet for this program.</p>
      </div>
    );
  }

  const avgVolume = progress.totalSessions > 0
    ? Math.round(progress.totalVolume / progress.totalSessions)
    : 0;

  const volumeNums = progress.volumeHistory.map((v) => v.volume);
  const trend = volumeNums.length >= 2
    ? volumeNums[volumeNums.length - 1] > volumeNums[0]
    : null;

  return (
    <div className="space-y-4">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Sessions', value: progress.totalSessions },
          { label: 'Avg Volume', value: `${avgVolume.toLocaleString()} kg` },
          { label: 'Total Volume', value: `${Math.round(progress.totalVolume).toLocaleString()} kg` },
          { label: 'Active Since', value: format(parseISO(progress.firstSessionDate), 'MMM d, yyyy') },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">{label}</p>
            <p className="text-sm font-headline text-amber-300 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Volume trend */}
      {progress.volumeHistory.length >= 2 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">
              Volume per Session
            </p>
            {trend !== null && (
              <span className={cn(
                'flex items-center gap-1 text-[9px] font-headline uppercase tracking-wider',
                trend ? 'text-emerald-400' : 'text-rose-400',
              )}>
                <TrendingUp className={cn('w-3 h-3', !trend && 'rotate-180')} />
                {trend ? 'Progressing' : 'Regressing'}
              </span>
            )}
          </div>

          {/* Bar sparkline */}
          <div className="flex items-end gap-0.5 h-12">
            {volumeNums.map((v, i) => {
              const maxV = Math.max(...volumeNums);
              const pct = maxV > 0 ? (v / maxV) * 100 : 0;
              const isLast = i === volumeNums.length - 1;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-t transition-all duration-300',
                    isLast ? 'bg-amber-500' : 'bg-zinc-700',
                  )}
                  style={{ height: `${Math.max(4, pct)}%` }}
                  title={`${progress.volumeHistory[i].date}: ${v.toLocaleString()} kg`}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-zinc-700">
              {format(parseISO(progress.firstSessionDate), 'MMM d')}
            </span>
            <span className="text-[9px] text-zinc-700">
              {format(parseISO(progress.lastSessionDate), 'MMM d')}
            </span>
          </div>
        </div>
      )}

      {/* Program meta */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500 space-y-0.5">
        <p><span className="text-zinc-400">Split:</span> {program.split} · {program.frequency}×/wk</p>
        <p><span className="text-zinc-400">Duration:</span> {program.durationWeeks ?? 8} weeks planned</p>
        {program.deloadStrategy && (
          <p><span className="text-zinc-400">Deload:</span> {program.deloadStrategy.replace('-', ' ')}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lifetime PRs tab
// ─────────────────────────────────────────────────────────────
function LifetimePRsTab() {
  const { getLifetimePRs } = useKhet();
  const [prs, setPrs] = useState<ExercisePR[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getLifetimePRs()
      .then(setPrs)
      .finally(() => setLoading(false));
  }, [getLifetimePRs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
          Computing Lifetime Records…
        </p>
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <Trophy className="w-8 h-8 text-zinc-700" />
        <p className="text-zinc-600 text-sm">Complete sessions to start tracking PRs.</p>
      </div>
    );
  }

  const filtered = prs.filter((pr) =>
    pr.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Search exercise…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
      />

      {/* PR cards */}
      {filtered.map((pr) => {
        const isExpanded = expandedId === pr.exerciseId;
        const sparkData = pr.history.map((h) => h.volume);
        const weightData = pr.history.map((h) => h.maxWeight);

        return (
          <div
            key={pr.exerciseId}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 overflow-hidden"
          >
            {/* Header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : pr.exerciseId)}
              className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-headline text-cyan-300 truncate">{pr.name}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {pr.sessionCount} session{pr.sessionCount !== 1 ? 's' : ''} ·{' '}
                  {pr.lifetimeVolume.toLocaleString()} kg total
                </p>
              </div>

              {/* Best weight pill */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="text-right">
                  <p className="text-base font-headline text-amber-300 leading-none">
                    {pr.bestWeight} kg
                  </p>
                  <p className="text-[9px] text-zinc-600">
                    {pr.bestRepsAtBestWeight} rep{pr.bestRepsAtBestWeight !== 1 ? 's' : ''}
                  </p>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                  : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                }
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-zinc-800 px-3 py-3 space-y-3">
                {/* Key stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Est. 1RM', value: `${pr.best1RM} kg` },
                    { label: 'Best Vol / Session', value: `${pr.bestSessionVolume.toLocaleString()} kg` },
                    { label: 'PR Set On', value: format(parseISO(pr.bestWeightDate), 'MMM d, yy') },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded border border-zinc-800/60 bg-black px-2 py-1.5">
                      <p className="text-[9px] font-headline uppercase tracking-wider text-zinc-600">{label}</p>
                      <p className="text-xs font-headline text-amber-200 mt-0.5 leading-tight">{value}</p>
                    </div>
                  ))}
                </div>

                {/* PR set in program */}
                <p className="text-[10px] text-zinc-600">
                  PR set during <span className="text-zinc-400">{pr.bestWeightProgram}</span>
                </p>

                {/* Sparklines side by side */}
                {pr.history.length >= 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-headline uppercase tracking-wider text-zinc-600 mb-1">
                        Volume / Session
                      </p>
                      <Sparkline data={sparkData} color="#f59e0b" />
                    </div>
                    <div>
                      <p className="text-[9px] font-headline uppercase tracking-wider text-zinc-600 mb-1">
                        Max Weight
                      </p>
                      <Sparkline data={weightData} color="#22d3ee" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main panel — slide-in drawer from bottom
// ─────────────────────────────────────────────────────────────
interface ProgressPanelProps {
  program: WorkoutProgram;
  onClose: () => void;
}

export function ProgressPanel({ program, onClose }: ProgressPanelProps) {
  const [tab, setTab] = useState<'summary' | 'prs'>('summary');

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mt-auto w-full max-h-[92dvh] bg-[#07080f] border-t border-zinc-800 rounded-t-2xl flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-headline text-amber-300 text-base uppercase tracking-widest">
              {program.name}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Progress Chronicle</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3 flex-shrink-0">
          {([
            { id: 'summary', label: 'Program', icon: BarChart2 },
            { id: 'prs', label: 'Lifetime PRs', icon: Trophy },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-headline uppercase tracking-wider transition-all',
                tab === id
                  ? 'border-amber-500/60 bg-amber-950/20 text-amber-300'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300',
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {tab === 'summary' && <ProgramSummaryTab program={program} />}
          {tab === 'prs' && <LifetimePRsTab />}
        </div>
      </div>
    </div>
  );
}
