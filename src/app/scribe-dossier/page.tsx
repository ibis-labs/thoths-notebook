"use client";

import Image from "next/image";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import IstanbulRitual from "@/components/IstanbulProtocol/IstanbulRitual";import { RecoveryPhrasePanel } from '@/components/recovery-phrase-panel';
import { NehehCircuit } from "@/components/neheh-circuit";
export default function ScribeDossierPage() {
  const { user, needsFinalSeal } = useAuth();
  const { installChip, isInstalled, canInstall } = usePWA();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  
  // Ritual State
  const [showKeypad, setShowKeypad] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const saveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    try {
      await updateProfile(user, { displayName: newName.trim() });
      await updateDoc(doc(db, "users", user.uid), { displayName: newName.trim() });
      setIsEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save display name:", err);
    }
  };

  const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };

  const navigateToKeypad = () => {
    setShowKeypad(true);
  };

  const isDjehuty = user?.uid === "YOUR_SORCERER_UID";

const [ritualState, setRitualState] = useState<'dossier' | 'ritual' | 'recovery'>('dossier');
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
            {isEditingName ? (
              <form onSubmit={saveDisplayName} className="flex flex-col items-center gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your Scribe Name"
                  autoFocus
                  className="px-4 py-2 bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none text-center font-headline tracking-wider uppercase"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-cyan-400 text-black rounded-lg hover:bg-cyan-300 transition-colors uppercase tracking-widest">Save</button>
                  <button type="button" onClick={() => setIsEditingName(false)} className="px-4 py-1.5 text-xs font-bold border border-slate-700 text-slate-400 rounded-lg hover:text-slate-200 transition-colors uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-2xl font-headline tracking-[0.15em] uppercase text-cyan-100">
                  {user?.displayName || <span className="text-slate-600 italic normal-case text-base">No name set</span>}
                </h1>
                {nameSaved && <p className="text-[10px] text-lime-400 mt-1">✓ Name updated</p>}
                <button
                  onClick={() => { setNewName(user?.displayName || ''); setIsEditingName(true); }}
                  className="mt-1 text-[10px] text-slate-600 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                >
                  ✎ Edit Name
                </button>
              </>
            )}
            <p className="mt-2 text-cyan-400 font-mono text-[9px] tracking-[0.2em] uppercase border border-cyan-900/30 px-3 py-1 rounded-full inline-block">
              {isDjehuty ? "Sorcerer of Cyber Glyphs" : "Neheh-Circuit Active ↓"}
            </p>
          </div>
        </div>

        {/* 🏺 THE NEHEH-CIRCUIT */}
        <NehehCircuit />

        {/* 🗿 THE RITUAL COURT (The Obelisk) */}
       <div className="w-full max-w-md space-y-4 relative z-10 flex flex-col items-center">

  {/* 🏛️ THE AMBER TRIGGER BUTTON */}
  {ritualState === 'dossier' && (
    <>
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

      {/* 🔑 RECOVERY PHRASE BUTTON */}
      <button
        onClick={() => setRitualState('recovery')}
        className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 active:scale-95 transition-all w-full max-w-xs group ${
          needsFinalSeal
            ? "border-amber-500/70 bg-amber-950/20 shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
            : "border-cyan-900/60 bg-cyan-950/10 shadow-[0_0_12px_rgba(34,211,238,0.08)] hover:border-cyan-700/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
        }`}
      >
        <div className="relative mb-4">
          <div className={`absolute -inset-2 rounded-full blur-md transition-all ${
            needsFinalSeal
              ? "bg-amber-500/20 group-hover:bg-amber-500/35 animate-pulse"
              : "bg-cyan-500/10 group-hover:bg-cyan-500/20"
          }`} />
          <ShieldCheck className={`w-10 h-10 relative transition-colors ${
            needsFinalSeal ? "text-amber-400" : "text-cyan-600 group-hover:text-cyan-400"
          }`} />
          {needsFinalSeal && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
        </div>
        <span className={`font-headline font-bold text-[10px] tracking-[0.3em] uppercase transition-colors ${
          needsFinalSeal ? "text-amber-400" : "text-cyan-600 group-hover:text-cyan-400"
        }`}>
          Sacred Recovery Phrase
        </span>
        <p className={`mt-2 text-[8px] font-mono tracking-widest uppercase ${
          needsFinalSeal ? "text-amber-600/80" : "text-cyan-900/80"
        }`}>
          {needsFinalSeal ? "Final Seal Required" : "View your 24-word master key"}
        </p>
      </button>
    </>
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

  {/* 🔑 RECOVERY PHRASE OVERLAY */}
  {ritualState === 'recovery' && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md bg-slate-950 border border-amber-500/30 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.1)] p-6 my-auto">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[9px] font-mono text-amber-700 tracking-widest uppercase">
            Scribe's Dossier / Recovery
          </span>
          <button
            onClick={() => setRitualState('dossier')}
            className="text-slate-600 hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <RecoveryPhrasePanel onClose={() => setRitualState('dossier')} />
      </div>
    </motion.div>
  )}
</AnimatePresence>
      </div>
    </div>
  );
}