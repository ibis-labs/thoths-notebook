"use client";

import { useEffect, useState } from "react";
import { useBannerPriority } from "@/components/global-banners";
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import type { PendingPromotion } from "@/lib/neheh-circuit";
import { TIER_COLORS } from "@/lib/neheh-circuit";
import { Star, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatMissionDetails(p: PendingPromotion): string {
  const dateStr = new Date(p.achievedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return [
    `NEHEH-CIRCUIT PROMOTION`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `RANK ACHIEVED: ${p.title}`,
    `CIRCUIT DAY: ${p.day} of 360`,
    `DATE SEALED: ${dateStr}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    p.description,
    ``,
    `━━ MISSION ━━`,
    p.missionDetails,
  ].join('\n').trim();
}

export function PromotionNotification() {
  const { user } = useAuth();
  const [promotion, setPromotion] = useState<PendingPromotion | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const { setPromotionActive } = useBannerPriority();

  // Listen to the user doc for a pendingPromotion field
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pending = data?.pendingPromotion ?? null;
        setPromotion(pending);
        // Tell GlobalBanners whether to suppress PtahManager
        setPromotionActive(!!pending);
      }
    });
    return () => {
      unsub();
      setPromotionActive(false);
    };
  }, [user, setPromotionActive]);

  if (!user || !promotion) return null;

  const colors = TIER_COLORS[promotion.tier];

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      // Create the Special Mission task
      await addDoc(collection(db, "tasks"), {
        userId: user.uid,
        title: `NEHEH-CIRCUIT: ${promotion.title}`,
        details: formatMissionDetails(promotion),
        category: "Special Missions",
        importance: "high",
        estimatedTime: 30,
        completed: false,
        createdAt: serverTimestamp(),
        dueDate: new Date(),
        tags: ["Neheh-Circuit", "Promotion", promotion.tier],
        accentColor: colors.ring,
      });

      // Clear the pending promotion from the user doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { pendingPromotion: deleteField() });

    } catch (err) {
      console.error("Promotion acceptance failed:", err);
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full z-[110] animate-in slide-in-from-top duration-700">
      <div
        className={cn(
          "border-b-2 p-6 shadow-[0_0_60px_rgba(34,211,238,0.5)] backdrop-blur-md",
          "flex flex-col items-center justify-center gap-3 text-center",
          "bg-black/95",
        )}
        style={{
          borderColor: colors.ring,
          boxShadow: `0 0 60px ${colors.glow}, inset 0 0 60px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Silver border accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, #c0c0c0, ${colors.ring}, #c0c0c0, transparent)` }}
        />

        {/* Icon Row */}
        <div className="flex items-center gap-3" style={{ color: colors.ring }}>
          <Star className="w-5 h-5 animate-pulse" />
          <ChevronUp className="w-6 h-6" />
          <h3
            className="text-lg font-display font-bold tracking-[0.25em] uppercase"
            style={{ color: colors.ring }}
          >
            Neheh-Circuit — Rank Achieved
          </h3>
          <ChevronUp className="w-6 h-6" />
          <Star className="w-5 h-5 animate-pulse" />
        </div>

        {/* Rank title */}
        <p
          className="text-2xl font-headline font-bold tracking-widest uppercase"
          style={{
            color: colors.ring,
            textShadow: `0 0 20px ${colors.glow}`,
          }}
        >
          {promotion.title}
        </p>

        {/* Description */}
        <p className="text-slate-300 font-mono text-xs max-w-sm leading-relaxed">
          {promotion.description}
        </p>

        {/* Day badge */}
        <p
          className="text-[9px] font-mono tracking-[0.3em] uppercase border px-3 py-1 rounded-full"
          style={{ borderColor: colors.ring, color: colors.ring }}
        >
          Day {promotion.day} of the Neheh-Circuit
        </p>

        {/* Accept button */}
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="mt-1 px-8 py-5 font-bold font-display tracking-widest uppercase text-black hover:scale-105 transition-all"
          style={{
            background: `linear-gradient(135deg, ${colors.ring}, #c0c0c0)`,
            boxShadow: `0 0 20px ${colors.glow}`,
          }}
        >
          {isAccepting ? "Inscribing Mission..." : "Accept Promotion"}
        </Button>

        <div className="space-y-1.5 text-center pt-1">
          <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">
            Accepting inscribes a Special Mission with your rank instructions
          </p>
          <p className="text-[8px] font-mono leading-relaxed max-w-xs mx-auto" style={{ color: colors.ring, opacity: 0.7 }}>
            ✦ Check your Special Missions task list for your promotion scroll
          </p>
          <p className="text-[8px] text-slate-600 font-mono leading-relaxed max-w-xs mx-auto">
            Track your Neheh-Circuit progress in the{" "}
            <span className="text-cyan-500">Scribe&apos;s Dossier</span>
            {" "}— tap your avatar in the sidebar
          </p>
        </div>
      </div>
    </div>
  );
}
