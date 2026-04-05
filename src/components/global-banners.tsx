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
import { PtahManager } from "@/components/ptah-manager";
import { PromotionNotification } from "@/components/promotion-notification";

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
    </BannerPriorityContext.Provider>
  );
}
