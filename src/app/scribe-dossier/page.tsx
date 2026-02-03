"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { usePWA } from "@/hooks/use-PWA";
import { Download, ShieldCheck, Trophy, Scroll, Fingerprint, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThothChipAltar } from "@/components/thoth-chip-altar";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { IstanbulDial } from "@/components/IstanbulDial"; 
import { ObeliskGuardian } from "@/components/IstanbulProtocol/ObeliskGuardian";
import IstanbulRitual from "@/components/IstanbulProtocol/IstanbulRitual";

export default function ScribeDossierPage() {
  const { user } = useAuth();
  const { installChip, isInstalled, canInstall } = usePWA();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  
  // Ritual State
  const [showKeypad, setShowKeypad] = useState(false);

  const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };

  const navigateToKeypad = () => {
    setShowKeypad(true);
  };

  const isDjehuty = user?.uid === "YOUR_SORCERER_UID";
  const rank = isDjehuty ? "Sorcerer of Cyber Glyphs" : "Initiate Scribe of the First Hour";
const [ritualState, setRitualState] = useState('dossier');
  return (
    <div className="min-h-screen bg-black text-cyan-50 flex flex-col items-center pb-20 px-4 overflow-x-hidden">
      {/* 🌌 CELESTIAL BACKGROUND */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(8,47,73,0.4),transparent)] pointer-events-none" />

      {/* 🔙 RETURN NAVIGATION */}
      <div className="w-full max-w-md pt-6 flex justify-start z-20">
        <button
          onClick={handleReturn}
          className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-cyan-400 bg-cyan-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] min-w-[110px]"
        >
          <FirstPylonIcon size={60} className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
          <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-cyan-300 mt-1">
            To Main Hall
          </span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-10 relative z-10 flex flex-col items-center">
        
        {/* 🏛️ HEADER */}
        <div className="pt-10 flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-black border-2 border-cyan-500/50 flex items-center justify-center relative overflow-hidden">
            <Fingerprint className="w-12 h-12 text-cyan-900 absolute opacity-40" />
            <div className="w-full h-full bg-gradient-to-b from-cyan-900/20 to-black flex items-center justify-center">
              <span className="text-3xl font-headline text-pink-500">{user?.displayName?.[0] || "S"}</span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-headline tracking-[0.15em] uppercase text-cyan-100">
              {user?.displayName || "Scribe of Light"}
            </h1>
            <p className="mt-2 text-cyan-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-cyan-900/30 px-3 py-1 rounded-full inline-block">
              Rank: {rank}
            </p>
          </div>
        </div>

        {/* 🗿 THE RITUAL COURT (The Obelisk) */}
       <div className="w-full max-w-md space-y-6 relative z-10 flex flex-col items-center">

  {/* 🏛️ THE AMBER TRIGGER BUTTON */}
  {ritualState === 'dossier' && (
    <button
      onClick={() => setRitualState('ritual')}
      className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-amber-500/50 bg-amber-950/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] w-full max-w-xs group"
    >
      <div className="relative mb-4">
        <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-md group-hover:bg-amber-500/40 transition-all" />
        <Scroll className="w-10 h-10 text-amber-500 relative" />
      </div>
      <span className="font-headline font-bold text-[10px] tracking-[0.3em] uppercase text-amber-400">
        Initiate Obelisk Ritual
      </span>
      <p className="mt-2 text-[8px] text-amber-600/60 font-mono tracking-widest uppercase">
        Tap to Awaken the Monolith
      </p>
    </button>
  )}
        </div>

        {/* COURT II: THE THOTH CHIP */}
        <ThothChipAltar
          isInstalled={isInstalled}
          canInstall={canInstall}
          installChip={installChip}
        />

        {/* COURT III: RITUAL MASTERY */}
{/* 🌌 FULL SCREEN RITUAL OVERLAY */}
<AnimatePresence>
  {ritualState === 'ritual' && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      <button 
        onClick={() => setRitualState('dossier')}
        className="absolute top-10 right-10 text-cyan-500/50 hover:text-cyan-400 z-[110]"
      >
        <X size={32} />
      </button>

      {/* This component now holds EVERYTHING: 
         The Obelisk, the Knocks, the Zoom, and the Keypad 
      */}
      <IstanbulRitual />
    </motion.div>
  )}
</AnimatePresence>
      </div>
    </div>
  );
}