"use client";

import { Zap, TrendingUp } from 'lucide-react';
import { useKhetSession } from './khet-context';

interface VolumeDashboardProps {
  lifetimeVolume: number;
}

export function VolumeDashboard({ lifetimeVolume }: VolumeDashboardProps) {
  const { totalVolume } = useKhetSession();

  const sessionTonnage = (totalVolume / 1000).toFixed(2);
  const lifetimeTonnage = ((lifetimeVolume + totalVolume) / 1000).toFixed(1);

  return (
    <div className="border border-amber-900/30 rounded-lg p-3 bg-amber-950/5 grid grid-cols-2 gap-4">
      {/* Session Volume */}
      <div className="flex items-start gap-2">
        <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[9px] font-headline uppercase tracking-[0.25em] text-amber-600 mb-0.5">
            Session Tonnage
          </div>
          <div className="text-xl font-headline font-bold text-amber-400">
            {Number(sessionTonnage).toLocaleString()}
            <span className="text-sm ml-1 text-amber-600">t</span>
          </div>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            {totalVolume.toLocaleString()} kg displaced
          </div>
        </div>
      </div>

      {/* Lifetime Volume */}
      <div className="flex items-start gap-2">
        <TrendingUp className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[9px] font-headline uppercase tracking-[0.25em] text-cyan-700 mb-0.5">
            Lifetime Volume
          </div>
          <div className="text-xl font-headline font-bold text-cyan-400">
            {Number(lifetimeTonnage).toLocaleString()}
            <span className="text-sm ml-1 text-cyan-600">t</span>
          </div>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            Cumulative mass displaced
          </div>
        </div>
      </div>
    </div>
  );
}
