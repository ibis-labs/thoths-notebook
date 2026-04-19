"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { X, Activity, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import type { CardioType } from '@/lib/khet-types';

const CARDIO_TYPES: CardioType[] = ['Stairs', 'Treadmill', 'Row', 'Elliptical', 'Cycling', 'Other'];

interface StandaloneCardioPanelProps {
  onClose: () => void;
}

export function StandaloneCardioPanel({ onClose }: StandaloneCardioPanelProps) {
  const { saveSession } = useKhet();
  const { user } = useAuth();
  const { toast } = useToast();

  const [type, setType] = useState<CardioType>('Treadmill');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = !!duration && parseFloat(duration) > 0;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      await saveSession({
        userId: user.uid,
        programId: 'standalone',
        programName: 'Standalone',
        dayIndex: 0,
        dayLabel: 'Cardio',
        date: format(new Date(), 'yyyy-MM-dd'),
        exerciseLogs: [],
        cardioLog: {
          type,
          duration: parseFloat(duration) || 0,
          distance: parseFloat(distance) || undefined,
          calories: parseFloat(calories) || undefined,
        },
        completed: true,
        totalVolume: 0,
        linkedTaskId: null,
        linkedRitualId: null,
      });
      toast({ title: 'Cardio logged', description: `${duration} min ${type}` });
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
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="font-headline text-cyan-300 text-lg uppercase tracking-widest">Log Cardio</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as CardioType)}>
              <SelectTrigger className="h-10 bg-black border-zinc-700 text-sm text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-zinc-800">
                {CARDIO_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-cyan-300 focus:bg-cyan-950/30">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">Duration (min) *</label>
            <Input type="number" min={0} value={duration} placeholder="0"
              onChange={(e) => setDuration(e.target.value)}
              className="h-10 bg-black border-zinc-700 text-sm text-white placeholder:text-zinc-700" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">Distance (km)</label>
            <Input type="number" min={0} step={0.1} value={distance} placeholder="0"
              onChange={(e) => setDistance(e.target.value)}
              className="h-10 bg-black border-zinc-700 text-sm text-white placeholder:text-zinc-700" />
          </div>
          <div>
            <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">Calories (kcal)</label>
            <Input type="number" min={0} value={calories} placeholder="0"
              onChange={(e) => setCalories(e.target.value)}
              className="h-10 bg-black border-zinc-700 text-sm text-white placeholder:text-zinc-700" />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full h-12 rounded font-headline uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-700 hover:bg-cyan-600 text-white flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Saving…' : 'Log Session'}
        </button>
      </div>
    </div>
  );
}
