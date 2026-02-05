"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import { Task } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { cn } from '@/lib/utils';


const StreakPips = ({ history }: { history: number[] }) => {
  return (
    <div className="flex gap-1 mt-1">
      {history.map((didComplete, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-all duration-500",
            didComplete 
              ? "bg-[#39FF14] shadow-[0_0_5px_#39FF14]" // Neon Gold/Lime for success
              : "bg-zinc-800" // Void for missing
          )}
        />
      ))}
    </div>
  );
};

interface RitualCardProps { 
  ritual: Task; 
  masterKey: any; 
  onEdit: (r: Task) => void; 
  onDelete: (r: Task) => void; 
}

export function RitualCard({ 
  ritual, 
  masterKey, 
  onEdit, 
  onDelete 
}: { 
  ritual: Task; 
  masterKey: any; 
  onEdit: (r: Task) => void; 
  onDelete: (r: Task) => void; 
}) {
    const [displayTitle, setDisplayTitle] = useState(ritual.title);

    useEffect(() => {
        const revealTitle = async () => {
            if (ritual.isEncrypted && masterKey && ritual.iv) {
                try {
                    const { decryptData, base64ToBuffer } = await import('@/lib/crypto');
                    const ivUint8 = new Uint8Array(base64ToBuffer(ritual.iv));
                    const decrypted = await decryptData(masterKey, base64ToBuffer(ritual.title), ivUint8);
                    setDisplayTitle(decrypted);
                } catch (e) {
                    console.error("Failed to unseal blueprint title:", e);
                    setDisplayTitle("[ENCRYPTED_BLUEPRINT]");
                }
            } else {
                setDisplayTitle(ritual.title);
            }
        };
        revealTitle();
    }, [ritual, masterKey]);

    return (
        <Card className="bg-card border-border flex items-center justify-between p-2 sm:p-3 hover:border-accent transition-colors group overflow-hidden">
            <div className="flex-1 min-w-0 pr-2">
                <CardTitle className="font-body font-bold text-base sm:text-lg text-foreground truncate flex items-center gap-2">
                    {displayTitle}
                    {ritual.streakData && ritual.streakData.currentStreak > 0 && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/30 flex items-center gap-1">
                            🔥 {ritual.streakData.currentStreak}
                        </span>
                    )}
                </CardTitle>
                
                <div className="mt-1">
                    {ritual.streakData ? (
                        <div className="space-y-1">
                            {/* Note: Ensure StreakPips is accessible here */}
                            <StreakPips history={ritual.streakData.history10} />
                            <p className="text-[9px] uppercase tracking-tighter text-muted-foreground">
                                Consecutive: {ritual.streakData.currentStreak} | Total: {ritual.streakData.totalCompletions}
                            </p>
                        </div>
                    ) : (
                        <p className="text-[10px] italic text-slate-500">
                            Awaiting first completion to begin streak...
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div
                    role="button"
                    onClick={() => onEdit(ritual)}
                    className="group/stylus cursor-pointer flex items-center justify-center p-1 rounded-lg transition-all active:scale-95 border-2 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black"
                >
                    <CyberStylus className="w-14 h-14 sm:w-20 sm:h-20 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                </div>

                <div
                    role="button"
                    onClick={() => onDelete(ritual)}
                    className="group/modal-jar cursor-pointer flex items-center justify-center p-1 rounded-lg transition-all active:scale-95 border-2 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-black"
                >
                    <DuamatefJar className="w-14 h-14 sm:w-20 sm:h-20 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                </div>
            </div>
        </Card>
    );
}