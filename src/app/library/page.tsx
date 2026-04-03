"use client";

import { useRouter } from "next/navigation";
import { OstraconIconLarge } from "@/components/icons/ostracon-icon-large";
import { Button } from "@/components/ui/button";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { 
  Sparkles, 
  Hammer,
  Construction
} from "lucide-react";

/* SACRED ARCHIVES UNDER RESTORATION
  The portals below are commented out until the Grand Library 
  is ready for the High Architects.
*/

/*
const libraryPortals = [
  ... (Keep your existing array here, just commented out)
];
*/

export default function LibraryPage() {
  const router = useRouter();

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
        
        <h1 className="font-display font-bold text-2xl text-rose-400 tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]">
          Grand Library
        </h1>

        <div className="w-10 flex justify-end">
          <button
            onClick={() => router.push('/ostraca')}
            className="flex flex-col items-center justify-center p-0.1 rounded-2xl border-2 border-emerald-400 bg-emerald-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] min-w-[115px]"
          >
            <OstraconIconLarge className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-emerald-300 mt-1">OSTRACA</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pt-24 flex flex-col items-center text-center space-y-12">
        
        {/* 🛠️ RESTORATION ALTAR */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative p-12 rounded-[3rem] border-2 border-dashed border-rose-500/30 bg-rose-950/5 backdrop-blur-sm">
            <Construction className="w-20 h-20 text-rose-500/40 mx-auto mb-6" />
            <h2 className="text-3xl font-display font-bold text-rose-100 uppercase tracking-[0.25em] mb-4">
              Restoration in Progress
            </h2>
            <p className="text-zinc-400 font-body max-w-md mx-auto leading-relaxed uppercase text-xs tracking-widest">
              The Divine Architects are currently transcribing the sacred scrolls. 
              The Chamber of Knowledge will open when the ink of Thoth is dry.
            </p>
          </div>
        </div>

        {/* 🏺 FOOTER INSCRIPTION */}
        <div className="mt-20 text-center space-y-2 opacity-40">
           <p className="text-[10px] uppercase tracking-[0.5em] font-display">The House of Life</p>
           <p className="text-[9px] italic font-body">"Knowledge is the light that Ra carries into the night."</p>
        </div>

      </div>
    </main>
  );
}