"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OstraconIconLarge } from "@/components/icons/ostracon-icon-large";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { IphtyLinkDuckIcon } from "@/components/icons/IphtyLinkDuckIcon";
import { 
  BookOpen
} from "lucide-react";
import SebaytConsole from "./sebayt-console";

export default function LibraryPage() {
  const router = useRouter();
  const [showSebayt, setShowSebayt] = useState(false);

  return (
    <main className="min-h-screen bg-black text-rose-100 font-sans selection:bg-rose-500/30 overflow-y-auto pb-20 custom-scrollbar">
      
      {/* 🏛️ HEADER */}
      <div className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-rose-500/30 px-6 py-8 flex items-center justify-between shadow-[0_4px_30px_rgba(244,63,94,0.1)]">
        <button
          onClick={() => router.push("/")}
          className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-rose-400 bg-rose-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] min-w-[110px]"
        >
          <FirstPylonIcon size={60} className="text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
          <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-rose-300 mt-1">
            To Main Hall
          </span>
        </button>

        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={() => router.push('/ostraca')}
            className="flex flex-col items-center justify-center p-0.5 rounded-2xl border-2 border-emerald-400 bg-emerald-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] min-w-[110px]"
          >
            <OstraconIconLarge className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-emerald-300 mt-0.5">OSTRACA</span>
          </button>
          <button
            onClick={() => router.push('/iphty-link')}
            className="flex flex-col items-center justify-center p-0.5 rounded-2xl border-2 border-violet-400 bg-violet-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(167,139,250,0.4)] min-w-[110px]"
          >
            <IphtyLinkDuckIcon size={90} className="text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
            <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-violet-300 mt-0.5">IPHTY LINK</span>
          </button>
        </div>
      </div>

      {/* 🏛️ PAGE TITLE */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-2 text-center">
        <h1 className="font-display font-bold text-2xl text-rose-400 tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]">
          Grand Library
        </h1>
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent mt-2 mx-auto" />
      </div>

      <div className="max-w-4xl mx-auto p-6 pt-6 flex flex-col items-center text-center space-y-12">
        
        {/* THE GOLDEN GRID */}
        <div className="w-full max-w-4xl text-left">
          {/* Sebayt Console Portal */}
          <button 
            onClick={() => setShowSebayt(true)}
            className="w-full p-6 rounded-xl border-2 border-amber-400 ring-1 ring-amber-500/40 ring-offset-1 ring-offset-black bg-gradient-to-r from-amber-950/20 via-slate-950/60 to-[#0a0f1e] shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-[transform,filter] duration-75 text-left active:scale-[0.98] active:brightness-125 group flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="text-amber-400 w-6 h-6" />
                <span className="font-headline text-lg text-amber-400 tracking-[0.2em] uppercase">Sebayt Console (User Guide)</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono text-amber-600 uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                  open ›
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
              A technical manual for navigating Thoth's Notebook and the Ptah Network.
            </div>
          </button>
        </div>

        {/* 🏺 FOOTER INSCRIPTION */}
        <div className="mt-20 text-center space-y-2 opacity-40">
           <p className="text-[10px] uppercase tracking-[0.5em] font-display">The House of Life</p>
           <p className="text-[9px] italic font-body">"Knowledge is the light that Ra carries into the night."</p>
        </div>

      </div>

      {/* SEBAYT CONSOLE OVERLAY */}
      {showSebayt && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-6xl h-full">
            <SebaytConsole onClose={() => setShowSebayt(false)} />
          </div>
        </div>
      )}
    </main>
  );
}