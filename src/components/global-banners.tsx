"use client";

/**
 * GlobalBanners — single mount point for all fixed top-of-screen banners.
 *
 * Priority contract (highest wins):
 *   1. PromotionNotification  (z-110)  — "an earned rank awaits"
 *   2. PtahManager            (z-100)  — "a gift of Ptah awaits"
 *
 * When a high-priority banner is active the lower-priority one defers silently.
 * This eliminates the visual stack-collision and any timing race between them.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Link from "next/link";
import { PtahManager } from "@/components/ptah-manager";
import { PromotionNotification } from "@/components/promotion-notification";
import { useAuth } from "@/components/auth-provider";

// ── Priority context ──────────────────────────────────────────────────────

interface BannerPriorityContextValue {
  promotionActive: boolean;
  setPromotionActive: (v: boolean) => void;
}

export const BannerPriorityContext = createContext<BannerPriorityContextValue>({
  promotionActive: false,
  setPromotionActive: () => {},
});

export function useBannerPriority() {
  return useContext(BannerPriorityContext);
}

// ── Provider + banner mount ───────────────────────────────────────────────
/**
 * Grace-period migration banner — visible until the scribe performs the Final Seal.
 * Renders at z-[90], below PromotionNotification (z-110) and PtahManager (z-100).
 */
function NeedsFinalSealBanner() {
  const { needsFinalSeal } = useAuth();
  if (!needsFinalSeal) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[90] animate-in slide-in-from-top duration-700">
      <div className="bg-amber-950/95 border-b-2 border-amber-500 px-4 py-3 shadow-[0_0_30px_rgba(251,191,36,0.4)] backdrop-blur-md flex items-center justify-center">
        <p className="text-amber-100/90 font-mono text-xs leading-relaxed text-center max-w-2xl">
          📜{" "}
          <span className="text-amber-400 font-bold">A MESSAGE FROM THE ARCHIVIST:</span>
          {" "}Remember those 24 words you were supposed to write down? Well, you need them now
          to upgrade our security. You have one final chance to fetch them before the Old Vault
          is retired forever.{" "}
          <Link
            href="/scribe-dossier"
            className="text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors font-bold"
          >
            Navigate to your Scribe&apos;s Dossier
          </Link>
          {" "}to finalize the seal.
        </p>
      </div>
    </div>
  );
}
export function GlobalBanners() {
  const [promotionActive, setPromotionActiveState] = useState(false);

  const setPromotionActive = useCallback((v: boolean) => {
    setPromotionActiveState(v);
  }, []);

  return (
    <BannerPriorityContext.Provider value={{ promotionActive, setPromotionActive }}>
      {/* PromotionNotification is always mounted — it owns its own Firestore listener
          and calls setPromotionActive(true/false) as the pendingPromotion field appears. */}
      <PromotionNotification />

      {/* PtahManager defers while a promotion banner is visible */}
      {!promotionActive && <PtahManager />}

      {/* NeedsFinalSealBanner — grace-period migration to 600k PBKDF2 */}
      {!promotionActive && <NeedsFinalSealBanner />}
    </BannerPriorityContext.Provider>
  );
}
