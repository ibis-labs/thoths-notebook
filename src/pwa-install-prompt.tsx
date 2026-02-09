"use client";

import Image from "next/image";
import { X, Share, PlusSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePWA } from "@/hooks/use-PWA";
import { useAuth } from "@/components/auth-provider";

/**
 * 🏛️ THE GATEKEEPER COMPONENT
 * This component's only job is to decide IF the Herald should even exist.
 * If a ritual is active, it returns null, effectively killing the hook's timers.
 */
export function PwaInstallPrompt() {
  const { ritualInProgress, user, onboardingComplete } = useAuth();

  console.log("🏛️ PWA Gatekeeper: ritualInProgress=", ritualInProgress, "user=", !!user, "onboardingComplete=", onboardingComplete);

  // 🛡️ THE HARD GATE: If ritual is active, user is not logged in, or onboarding is incomplete,
  // we silence the Herald. The user must have completed the Istanbul Protocol (set PIN + saved stash)
  // before the PWA install prompt appears.
  if (ritualInProgress || !user || !onboardingComplete) {
    console.log("🛡️ PWA Gatekeeper: Gate closed. Returning null.");
    return null;
  }

  console.log("✅ PWA Gatekeeper: Gate open! Rendering PwaPromptVessel.");
  return <PwaPromptVessel />;
}

/**
 * 🏺 THE PROMPT VESSEL
 * This contains your full, original UI and logic. 
 * It only mounts when the Gatekeeper above allows it.
 */
function PwaPromptVessel() {
  // We pass 'false' because we know the ritual is over if this component is mounted
  const { showPrompt, setShowPrompt, isIOS, installChip } = usePWA(false);

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-8 flex justify-center"
        >
          <div className="w-full max-w-2xl bg-black/95 border-t-4 border-x-4 border-cyan-500/40 rounded-t-[2.5rem] p-8 md:p-12 shadow-[0_-20px_50px_rgba(34,211,238,0.15)] backdrop-blur-2xl relative overflow-hidden">
            
            <div className="flex flex-col items-center gap-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-4xl text-cyan-100 font-headline tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  Accept the Thoth Chip
                </h3>
                <p className="text-slate-400 text-sm md:text-base font-mono tracking-widest uppercase opacity-70">
                  Universal System Integration Required
                </p>
              </div>

              {isIOS ? (
                <div className="w-full max-w-md text-sm text-amber-400/90 font-mono bg-amber-950/20 p-6 rounded-2xl border border-amber-900/40 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-2 rounded-lg"><Share className="w-5 h-5" /></div>
                    <span>1. TAP <strong>SHARE</strong> ON THE BROWSER BAR</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-2 rounded-lg"><PlusSquare className="w-5 h-5" /></div>
                    <span>2. SELECT <strong>ADD TO HOME SCREEN</strong></span>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={installChip}
                  className="w-full max-w-md h-auto py-12 md:py-16 bg-black/80 border-2 border-cyan-500/30 text-cyan-400 
                             hover:bg-slate-950 hover:border-cyan-400 hover:text-cyan-200 transition-all duration-500 
                             flex flex-col items-center justify-center gap-6 rounded-3xl shadow-2xl group overflow-hidden"
                >
                  <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 transition-transform duration-700 group-hover:scale-110">
                    <Image
                      src="/icons/thoth-icon.svg"
                      alt="Thoth Chip"
                      fill
                      className="object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-3 px-4">
                    <span className="text-lg md:text-2xl tracking-[0.2em] font-headline uppercase whitespace-normal text-center leading-tight">
                      Initialize <br className="md:hidden" /> Installation
                    </span>
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                      <span className="text-[10px] font-mono tracking-widest uppercase">System Sync</span>
                    </div>
                  </div>
                </Button>
              )}

              <button
                onClick={() => setShowPrompt(false)}
                className="text-slate-600 font-headline tracking-[0.2em] hover:text-cyan-800 text-xs uppercase transition-colors"
              >
                Continue as Guest Scribe
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}