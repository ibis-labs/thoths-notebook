"use client";

import { useState, useEffect } from 'react';
import { X, User, Flame, MapPin, Save } from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { cn } from '@/lib/utils';
import type { KhetUserSettings, WeightUnit } from '@/lib/khet-types';

interface UserStatsPanelProps {
  onClose: () => void;
}

export function UserStatsPanel({ onClose }: UserStatsPanelProps) {
  const { getUserSettings, updateUserSettings } = useKhet();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weightUnit, setWeightUnitLocal] = useState<WeightUnit>('lbs');
  const [bodyWeight, setBodyWeight] = useState('');
  const [maintenanceCalories, setMaintenanceCalories] = useState('');
  const [gymName, setGymName] = useState('');

  useEffect(() => {
    getUserSettings().then((s) => {
      if (s) {
        setWeightUnitLocal(s.weightUnit ?? 'lbs');
        if (s.bodyWeight) setBodyWeight(String(s.bodyWeight));
        if (s.maintenanceCalories) setMaintenanceCalories(String(s.maintenanceCalories));
        if (s.gymName) setGymName(s.gymName);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data: Partial<KhetUserSettings> = { weightUnit };
    const bw = parseFloat(bodyWeight);
    if (!isNaN(bw) && bw > 0) data.bodyWeight = bw;
    const mc = parseInt(maintenanceCalories, 10);
    if (!isNaN(mc) && mc > 0) data.maintenanceCalories = mc;
    if (gymName.trim()) data.gymName = gymName.trim();
    await updateUserSettings(data);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mt-auto w-full max-h-[90dvh] bg-[#060810] border-t border-zinc-800 rounded-t-2xl flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-headline text-amber-300 text-base uppercase tracking-[0.2em]">
              Athlete Profile
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Body stats & training preferences</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
                Loading…
              </p>
            </div>
          ) : (
            <>
              {/* Weight Unit Toggle */}
              <div className="space-y-2">
                <label className="text-[9px] font-headline uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Weight Unit
                </label>
                <div className="flex rounded-lg overflow-hidden border border-zinc-800">
                  {(['lbs', 'kg'] as WeightUnit[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setWeightUnitLocal(unit)}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-headline uppercase tracking-widest transition-all',
                        weightUnit === unit
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300',
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-zinc-600">
                  Sets the unit label displayed during workouts. Enter all weights consistently in this unit.
                </p>
              </div>

              {/* Body Weight */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-headline uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Body Weight ({weightUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder={weightUnit === 'lbs' ? 'e.g. 185' : 'e.g. 84'}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[9px] text-zinc-600">
                  Used for power-to-weight ratio in the Gainz panel.
                </p>
              </div>

              {/* Maintenance Calories */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-headline uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
                  <Flame className="w-3 h-3" />
                  Maintenance Calories (kcal / day)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={maintenanceCalories}
                  onChange={(e) => setMaintenanceCalories(e.target.value)}
                  placeholder="e.g. 2800"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Gym Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-headline uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  Gym / Training Location
                </label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="e.g. Iron Temple, Home Gym…"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-amber-600/50 bg-amber-950/20 text-amber-300 text-xs font-headline uppercase tracking-wider hover:bg-amber-950/40 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
