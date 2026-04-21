"use client";

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  X, Trophy, Flame, Clock, Zap, BarChart2, TrendingUp,
  Dumbbell, CheckCircle2, Weight, Pencil, Trash2, Plus, Calendar,
} from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { cn, localDateStr } from '@/lib/utils';
import type { GlobalStats, FoundationalPR, KhetUserSettings, WeekStats } from '@/lib/khet-types';
import { FOUNDATIONAL_MOVEMENTS } from '@/lib/khet-types';
import type { WeightUnit } from '@/lib/khet-types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 0) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

// ─────────────────────────────────────────────────────────────
// 90-day GitHub-style heatmap
// ─────────────────────────────────────────────────────────────
function Heatmap({ days }: { days: GlobalStats['heatmap'] }) {
  // Group into 13 columns (weeks) × 7 rows
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-1">
      <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">
        90-Day Training Heat Map
      </p>
      <div className="flex gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                className={cn(
                  'w-3 h-3 rounded-sm transition-colors',
                  day.count === 0 && 'bg-zinc-800',
                  day.count === 1 && 'bg-amber-600',
                  day.count >= 2 && 'bg-amber-400',
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 pt-0.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800" />
        <span className="text-[9px] text-zinc-600">None</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-600 ml-2" />
        <span className="text-[9px] text-zinc-600">1</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 ml-2" />
        <span className="text-[9px] text-zinc-600">2+</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hall of PRs card
// ─────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<FoundationalPR['category'], string> = {
  big3: 'The Big 3',
  ohp: 'Overhead',
  row: 'Back',
  calisthenics: 'Calisthenics',
};

function PRCard({ pr, bodyWeight, weightUnit = 'lbs', onEdit }: { pr: FoundationalPR; bodyWeight?: number; weightUnit?: WeightUnit; onEdit?: (pr: FoundationalPR) => void }) {
  const isCali = pr.category === 'calisthenics';
  const isPlank = pr.movement.toLowerCase().includes('plank');

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-headline text-cyan-300 truncate">{pr.movement}</p>
          {pr.isManual && (
            <span className="flex-shrink-0 text-[8px] font-headline uppercase tracking-wider text-violet-400 border border-violet-700/50 rounded px-1 py-0.5">
              Manual
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[9px] font-headline uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
            {CATEGORY_LABELS[pr.category]}
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(pr)}
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-cyan-300 hover:bg-zinc-800 transition-colors"
              title="Edit / Override PR"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-3 flex-wrap">
        {isCali ? (
          <div>
            <span className="text-xl font-headline text-amber-300">
              {pr.bestReps}
            </span>
            <span className="text-xs text-zinc-500 ml-1">
              {isPlank ? 'sec' : 'reps'}
            </span>
          </div>
        ) : (
          <>
            <div>
              <span className="text-xl font-headline text-amber-300">{pr.bestWeight}</span>
              <span className="text-xs text-zinc-500 ml-1">{weightUnit} × {pr.bestReps}</span>
            </div>
            <div className="text-xs text-zinc-400">
              E1RM <span className="text-emerald-400 font-headline">{pr.best1RM} {weightUnit}</span>
            </div>
          </>
        )}
      </div>

      {/* Power-to-weight for Big 3 when body weight known */}
      {!isCali && bodyWeight && bodyWeight > 0 && (
        <div className="text-[10px] text-zinc-600">
          {(pr.bestWeight / bodyWeight).toFixed(2)}× bodyweight
        </div>
      )}

      <div className="text-[9px] text-zinc-700">
        {pr.bestDate ? format(parseISO(pr.bestDate), 'MMM d, yyyy') : '—'}
        {pr.bestProgramName && <> · <span className="text-zinc-600">{pr.bestProgramName}</span></>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Manual PR form (overlay)
// ─────────────────────────────────────────────────────────────
interface ManualPRFormProps {
  initial: FoundationalPR | null;
  onSave: (data: { movement: string; bestWeight: number; bestReps: number; date: string; notes: string }) => Promise<void>;
  onDelete: (movement: string) => Promise<void>;
  onClose: () => void;
}

function ManualPRForm({ initial, onSave, onDelete, onClose }: ManualPRFormProps) {
  const [movement, setMovement] = useState(initial?.movement ?? FOUNDATIONAL_MOVEMENTS[0].movement);
  const [weight, setWeight]   = useState(initial?.isManual && initial.bestWeight ? String(initial.bestWeight) : '');
  const [reps, setReps]       = useState(initial?.isManual && initial.bestReps ? String(initial.bestReps) : '');
  const [date, setDate]       = useState(initial?.isManual && initial.bestDate ? initial.bestDate : localDateStr());
  const [notes, setNotes]     = useState(initial?.manualNotes ?? '');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isNew = !initial?.isManual;

  const handleSave = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!movement || isNaN(w) || w <= 0 || isNaN(r) || r <= 0 || !date) return;
    setSaving(true);
    await onSave({ movement, bestWeight: w, bestReps: r, date, notes });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(movement);
    setDeleting(false);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-10 bg-black/80 flex items-end rounded-t-2xl">
      <div className="w-full bg-[#0c0e1a] border-t border-zinc-800 rounded-t-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-headline uppercase tracking-widest text-amber-300">
            {isNew ? 'Log Manual PR' : `Override PR · ${initial!.movement}`}
          </p>
          <button onClick={onClose} className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Movement selector (only for truly new) */}
        {isNew && (
          <div>
            <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 mb-1 block">Movement</label>
            <select
              value={movement}
              onChange={(e) => setMovement(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500"
            >
              {FOUNDATIONAL_MOVEMENTS.map((m) => (
                <option key={m.movement} value={m.movement}>{m.movement}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 mb-1 block">Weight (kg)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 mb-1 block">Reps</label>
            <input
              type="number"
              min="1"
              step="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="e.g. 5"
              className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 mb-1 block">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Competition, old gym, estimated…"
            className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded border border-cyan-600/50 bg-cyan-950/20 text-cyan-300 text-xs font-headline uppercase tracking-wider hover:bg-cyan-950/40 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save PR'}
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 rounded border border-red-900/50 bg-red-950/20 text-red-400 text-xs font-headline uppercase tracking-wider hover:bg-red-950/40 transition-all disabled:opacity-50"
            >
              {deleting ? '…' : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Big 3 combined power-to-weight meter
// ─────────────────────────────────────────────────────────────
function PowerToWeight({ prs, bodyWeight, weightUnit = 'lbs' }: { prs: FoundationalPR[]; bodyWeight: number; weightUnit?: WeightUnit }) {
  const big3 = prs.filter((p) => p.category === 'big3');
  const totalBig3 = big3.reduce((sum, p) => sum + p.best1RM, 0);
  const ratio = bodyWeight > 0 ? totalBig3 / bodyWeight : 0;

  if (big3.length < 3 || ratio === 0) return null;

  // Tier labels
  const tier =
    ratio >= 6 ? { label: 'Elite', color: 'text-amber-300' } :
    ratio >= 4.5 ? { label: 'Advanced', color: 'text-cyan-300' } :
    ratio >= 3 ? { label: 'Intermediate', color: 'text-emerald-400' } :
    { label: 'Beginner', color: 'text-zinc-400' };

  return (
    <div className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-950 to-[#0a0f1e] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">
          Big 3 Power-to-Weight
        </p>
        <span className={cn('text-xs font-headline uppercase tracking-wider', tier.color)}>
          {tier.label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-headline text-amber-300">{ratio.toFixed(2)}</span>
        <span className="text-sm text-zinc-500">× bodyweight</span>
      </div>
      <p className="text-[10px] text-zinc-600">
        E1RM Total: {fmt(totalBig3, 1)} {weightUnit} ÷ {bodyWeight} {weightUnit} BW
      </p>
      {/* Progress bar toward next tier */}
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${Math.min(100, (ratio / 6) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────
interface GainzPanelProps {
  onClose: () => void;
}

export function GainzPanel({ onClose }: GainzPanelProps) {
  const { getGlobalStats, getUserSettings, setManualPR, deleteManualPR } = useKhet();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [settings, setSettings] = useState<KhetUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'power' | 'hall'>('power');
  const [editingPR, setEditingPR] = useState<FoundationalPR | null>(null);
  const [addingPR, setAddingPR] = useState(false);

  const weightUnit = settings?.weightUnit ?? 'lbs';
  const bodyWeight = settings?.bodyWeight;

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([getGlobalStats(), getUserSettings()]).then(([s, cfg]) => {
      setStats(s);
      setSettings(cfg);
      setLoading(false);
    });
  }, [getGlobalStats, getUserSettings]);

  useEffect(() => { reload(); }, [reload]);

  const handleSaveManualPR = async (data: { movement: string; bestWeight: number; bestReps: number; date: string; notes: string }) => {
    const r = data.bestReps;
    const best1RM = r <= 1 ? data.bestWeight : Math.round((data.bestWeight / (1.0278 - 0.0278 * r)) * 10) / 10;
    await setManualPR({ movement: data.movement, bestWeight: data.bestWeight, bestReps: data.bestReps, best1RM, date: data.date, notes: data.notes || undefined });
    reload();
  };

  const handleDeleteManualPR = async (movement: string) => {
    await deleteManualPR(movement);
    reload();
  };

  const editingPRTarget: FoundationalPR | null = addingPR ? null : editingPR;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mt-auto w-full max-h-[94dvh] bg-[#060810] border-t border-zinc-800 rounded-t-2xl flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-headline text-amber-300 text-base uppercase tracking-[0.2em]">
              ⚡ Gainz
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Lifetime Training Statistics</p>
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
            { id: 'power', label: 'Power Dashboard', icon: BarChart2 },
            { id: 'hall',  label: 'Hall of PRs',     icon: Trophy },
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
        <div className="flex-1 overflow-y-auto px-4 pb-10">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
                Scanning the Akashic Record…
              </p>
            </div>
          ) : !stats ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Dumbbell className="w-10 h-10 text-zinc-700" />
              <p className="text-zinc-500 text-sm text-center">
                Complete your first session to unlock the Gainz Chronicle.
              </p>
            </div>
          ) : tab === 'power' ? (
            <PowerDashboard stats={stats} />
          ) : (
            <HallOfPRs
              stats={stats}
              bodyWeight={bodyWeight}
              weightUnit={weightUnit}
              onEditPR={(pr) => { setEditingPR(pr); setAddingPR(false); }}
              onAddPR={() => { setEditingPR(null); setAddingPR(true); }}
            />
          )}
        </div>

        {/* Manual PR form overlay */}
        {(editingPR || addingPR) && (
          <ManualPRForm
            initial={editingPRTarget}
            onSave={handleSaveManualPR}
            onDelete={handleDeleteManualPR}
            onClose={() => { setEditingPR(null); setAddingPR(false); }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Power Dashboard tab
// ─────────────────────────────────────────────────────────────
function PowerDashboard({ stats }: { stats: GlobalStats }) {
  const [mode, setMode] = useState<'alltime' | 'week'>('week');

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {([
          { id: 'week',    label: 'This Week' },
          { id: 'alltime', label: 'All Time'  },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={cn(
              'flex-1 py-2 rounded-lg border text-xs font-headline uppercase tracking-widest transition-all',
              mode === id
                ? 'border-amber-500/60 bg-amber-950/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'alltime' ? (
        <AllTimeStats stats={stats} />
      ) : (
        <ThisWeekStats week={stats.weekStats} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// All-time view
// ─────────────────────────────────────────────────────────────
function AllTimeStats({ stats }: { stats: GlobalStats }) {
  const years   = Math.floor(stats.totalDaysTraining / 365);
  const months  = Math.floor((stats.totalDaysTraining % 365) / 30);
  const days    = stats.totalDaysTraining % 30;
  const durationLabel = [
    years > 0  && `${years}y`,
    months > 0 && `${months}mo`,
    days > 0   && `${days}d`,
  ].filter(Boolean).join(' ') || '< 1 day';

  const hours   = Math.floor(stats.totalMinutes / 60);
  const minutes = stats.totalMinutes % 60;
  const timeLabel = stats.totalMinutes > 0
    ? `${hours > 0 ? `${hours}h ` : ''}${minutes}m`
    : 'N/A';

  const PRIMARY_STATS = [
    { label: 'Training Since',   value: stats.trainingStartDate ? format(parseISO(stats.trainingStartDate), 'MMM d, yyyy') : '—', icon: Zap },
    { label: 'Lifetime',          value: durationLabel,  icon: Clock },
    { label: 'Total Sessions',    value: fmt(stats.totalSessions), icon: CheckCircle2 },
    { label: 'Total Volume',      value: `${fmt(Math.round(stats.totalVolumeKg / 1000), 1)}t`, icon: Weight },
    { label: 'Total Reps',        value: fmt(stats.totalReps), icon: TrendingUp },
    { label: 'Time in the Gym',   value: timeLabel,         icon: Clock },
    { label: 'Cardio Cals Burned',value: fmt(stats.totalCardioCals), icon: Flame },
    { label: 'Current Streak',    value: `${stats.currentStreakWeeks}w`, icon: Zap },
    { label: 'Longest Streak',    value: `${stats.longestStreakWeeks}w`, icon: Trophy },
  ];

  return (
    <div className="space-y-5">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {PRIMARY_STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 flex items-start gap-2"
          >
            <Icon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 leading-tight">{label}</p>
              <p className="text-sm font-headline text-amber-200 mt-0.5 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
        <Heatmap days={stats.heatmap} />
      </div>

      {/* Streak callout */}
      {stats.currentStreakWeeks >= 4 && (
        <div className="rounded-lg border border-amber-600/40 bg-amber-950/10 p-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>{stats.currentStreakWeeks}-week streak</strong> — The ritual holds. The stone reshapes.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// This-week view
// ─────────────────────────────────────────────────────────────
function ThisWeekStats({ week }: { week: WeekStats }) {
  const hours   = Math.floor(week.minutes / 60);
  const minutes = week.minutes % 60;
  const timeLabel = week.minutes > 0
    ? `${hours > 0 ? `${hours}h ` : ''}${minutes}m`
    : '—';

  const WEEK_STATS = [
    { label: 'Sessions',     value: String(week.sessions),                                icon: CheckCircle2 },
    { label: 'Volume',       value: week.volumeKg > 0 ? `${fmt(Math.round(week.volumeKg / 1000), 1)}t` : '—', icon: Weight },
    { label: 'Total Reps',   value: week.reps > 0 ? fmt(week.reps) : '—',                icon: TrendingUp },
    { label: 'Time',         value: timeLabel,                                             icon: Clock },
    { label: 'Cardio Cals',  value: week.cardioCals > 0 ? fmt(week.cardioCals) : '—',    icon: Flame },
  ];

  const weekRangeLabel = `${format(parseISO(week.weekStart), 'MMM d')} – ${format(parseISO(week.weekEnd), 'MMM d')}`;

  return (
    <div className="space-y-4">
      {/* Week range label */}
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-400 font-headline uppercase tracking-widest">{weekRangeLabel}</span>
      </div>

      {/* Day-of-week indicator */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
        <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 mb-2">Days Trained This Week</p>
        <div className="flex gap-1.5 justify-between">
          {week.days.map((d) => {
            const isToday = d.date === format(new Date(), 'yyyy-MM-dd');
            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-headline transition-all',
                  d.sessions > 0
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : isToday
                    ? 'border border-zinc-600 text-zinc-300 bg-zinc-800/50'
                    : 'border border-zinc-800 text-zinc-600',
                )}>
                  {d.sessions > 0 ? '✓' : d.label[0]}
                </div>
                <span className={cn(
                  'text-[9px] font-headline',
                  isToday ? 'text-zinc-300' : 'text-zinc-600',
                )}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {WEEK_STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 flex items-start gap-2"
          >
            <Icon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 leading-tight">{label}</p>
              <p className="text-sm font-headline text-amber-200 mt-0.5 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {week.sessions === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-center">
          <p className="text-zinc-500 text-xs">No sessions logged yet this week.</p>
          <p className="text-zinc-700 text-[10px] mt-1">Week resets every Monday.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hall of PRs tab
// ─────────────────────────────────────────────────────────────
interface HallOfPRsProps {
  stats: GlobalStats;
  bodyWeight?: number;
  weightUnit: WeightUnit;
  onEditPR: (pr: FoundationalPR) => void;
  onAddPR: () => void;
}

function HallOfPRs({ stats, bodyWeight, weightUnit, onEditPR, onAddPR }: HallOfPRsProps) {
  const grouped = {
    big3: stats.foundationalPRs.filter((p) => p.category === 'big3'),
    ohp:  stats.foundationalPRs.filter((p) => p.category === 'ohp'),
    row:  stats.foundationalPRs.filter((p) => p.category === 'row'),
    calisthenics: stats.foundationalPRs.filter((p) => p.category === 'calisthenics'),
  };

  return (
    <div className="space-y-5">
      {/* Power-to-weight meter */}
      {bodyWeight && <PowerToWeight prs={stats.foundationalPRs} bodyWeight={bodyWeight} weightUnit={weightUnit} />}

      {/* PR sections */}
      {(Object.entries(grouped) as [FoundationalPR['category'], FoundationalPR[]][]).map(([cat, prs]) => {
        if (prs.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <p className="text-[9px] font-headline uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-500" />
              {CATEGORY_LABELS[cat]}
            </p>
            {prs.map((pr) => (
              <PRCard key={pr.movement} pr={pr} bodyWeight={bodyWeight} weightUnit={weightUnit} onEdit={onEditPR} />
            ))}
          </div>
        );
      })}

      {stats.foundationalPRs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <Trophy className="w-8 h-8 text-zinc-700" />
          <p className="text-zinc-600 text-sm text-center">
            Log sessions with Bench Press, Squat, Deadlift, and others to populate your Hall of PRs.
          </p>
        </div>
      )}

      {/* Add manual PR */}
      <button
        onClick={onAddPR}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 text-xs font-headline uppercase tracking-wider hover:border-cyan-700 hover:text-cyan-400 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Log Manual PR
      </button>
    </div>
  );
}
