"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface RitualStreakSummary {
  id: string;
  title: string;
  currentStreak: number;
  totalCompletions: number;
  history10: number[];
  isWin: boolean;
}

interface StreakCelebrationProps {
  overallStreak: number;
  history10Day: number[];
  ritualSummaries: RitualStreakSummary[];
  completedCount: number;
}

const PipRow = ({ history, delay = 0 }: { history: number[]; delay?: number }) => (
  <div className="flex gap-1 mt-1">
    {history.map((filled, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: delay + i * 0.06, duration: 0.3, type: "spring" }}
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-all duration-500",
          filled ? "bg-[#39FF14] shadow-[0_0_5px_#39FF14]" : "bg-zinc-800"
        )}
      />
    ))}
  </div>
);

export function StreakCelebration({
  overallStreak,
  history10Day,
  ritualSummaries,
  completedCount,
}: StreakCelebrationProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay so the seal animation completes first
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-y-auto p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-2xl space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="flex justify-center"
          >
            <div className="rounded-full border-2 border-cyan-500/50 p-4 shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="font-display text-3xl font-bold text-cyan-400 tracking-widest uppercase"
          >
            Chronicle Sealed
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-muted-foreground text-sm"
          >
            {completedCount > 0
              ? `${completedCount} deed${completedCount !== 1 ? "s" : ""} committed to the eternal record.`
              : "Another night witnessed by Thoth."}
          </motion.p>
        </div>

        {/* Overall streak card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-2 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black rounded-2xl p-4 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
              Overall Streak
            </span>
            {overallStreak > 0 && (
              <span className="text-[10px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/30 flex items-center gap-1">
                🔥 {overallStreak}
              </span>
            )}
          </div>
          <PipRow history={history10Day} delay={0.55} />
          <p className="text-[9px] uppercase tracking-tighter text-muted-foreground">
            Last 10 days
          </p>
        </motion.div>

        {/* Per-ritual streaks */}
        {ritualSummaries.length > 0 && (
          <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="border-2 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black rounded-2xl p-4 space-y-3"
          >
            <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 pb-2 border-b border-cyan-900/50">
              Ritual Blueprints
            </p>
            <div className="space-y-2">
              {ritualSummaries.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.68 + i * 0.07 }}
                  className={cn(
                    "flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors overflow-hidden",
                    r.isWin
                      ? "border-[#39FF14]/30 bg-[#39FF14]/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-body font-bold text-base text-foreground truncate">
                      {r.title}
                    </p>
                    <PipRow history={r.history10} delay={0.75 + i * 0.07} />
                    <p className="text-[9px] uppercase tracking-tighter text-muted-foreground mt-0.5">
                      Consecutive: {r.currentStreak} | Total: {r.totalCompletions}
                    </p>
                  </div>
                  {r.currentStreak > 0 && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/30 flex items-center gap-1 shrink-0">
                      🔥 {r.currentStreak}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          onClick={() => router.push("/archives")}
          className="w-full py-3 font-display font-bold text-slate-900 bg-cyan-400 rounded-xl hover:bg-cyan-300 transition-colors tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(34,211,238,0.25)]"
        >
          Enter the Archives →
        </motion.button>
      </motion.div>
    </div>
  );
}
