"use client";

import { ChevronDown, Activity } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKhetSession } from './khet-context';
import type { CardioType } from '@/lib/khet-types';

const CARDIO_TYPES: CardioType[] = [
  'Stairs',
  'Treadmill',
  'Row',
  'Elliptical',
  'Cycling',
  'Other',
];

export function CardioTracker() {
  const { state, dispatch } = useKhetSession();
  const { cardioEnabled, cardioLog } = state;

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_CARDIO' })}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950/50 hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-headline text-cyan-300 uppercase tracking-widest">
            Log Cardio
          </span>
          {cardioEnabled && (
            <span className="text-[9px] text-cyan-500 border border-cyan-800 rounded px-1">
              ACTIVE
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
            cardioEnabled ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Form */}
      {cardioEnabled && (
        <div className="p-4 space-y-3 bg-black/30">
          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                Type
              </label>
              <Select
                value={cardioLog.type}
                onValueChange={(v) =>
                  dispatch({ type: 'SET_CARDIO', log: { type: v as CardioType } })
                }
              >
                <SelectTrigger className="h-8 bg-black border-zinc-700 text-sm text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-zinc-800">
                  {CARDIO_TYPES.map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      className="text-cyan-300 focus:bg-cyan-950/30"
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                Duration (min)
              </label>
              <Input
                type="number"
                min={0}
                value={cardioLog.duration || ''}
                placeholder="0"
                onChange={(e) =>
                  dispatch({
                    type: 'SET_CARDIO',
                    log: { duration: parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-8 bg-black border-zinc-700 text-sm text-white placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Distance */}
            <div>
              <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                Distance (km)
              </label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={cardioLog.distance || ''}
                placeholder="0"
                onChange={(e) =>
                  dispatch({
                    type: 'SET_CARDIO',
                    log: { distance: parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-8 bg-black border-zinc-700 text-sm text-white placeholder:text-zinc-700"
              />
            </div>

            {/* Calories */}
            <div>
              <label className="text-[10px] font-headline uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                Calories (kcal)
              </label>
              <Input
                type="number"
                min={0}
                value={cardioLog.calories || ''}
                placeholder="0"
                onChange={(e) =>
                  dispatch({
                    type: 'SET_CARDIO',
                    log: { calories: parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-8 bg-black border-zinc-700 text-sm text-white placeholder:text-zinc-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
