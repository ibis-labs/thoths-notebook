"use client";

import { SeshatInterface } from "@/components/SeshatInterface/SeshatInterface";
import { useRouter } from "next/navigation";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";

export default function SeshatPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-rose-100 font-sans selection:bg-rose-500/30 overflow-y-auto pb-20 custom-scrollbar flex flex-col">
      
      {/* 🏛️ HEADER */}
      <div className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-fuchsia-500/30 px-6 py-8 flex items-center justify-between shadow-[0_4px_30px_rgba(185,21,204,0.1)]">
        <button
          onClick={() => router.push("/")}
          className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-fuchsia-400 bg-fuchsia-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(185,21,204,0.4)] min-w-[110px]"
        >
          <FirstPylonIcon size={60} className="text-fuchsia-400 drop-shadow-[0_0_12px_rgba(185,21,204,0.8)]" />
          <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-fuchsia-300 mt-1">
            To Main Hall
          </span>
        </button>

        <div className="flex flex-col gap-2 items-center text-right">
          <h1 className="font-display font-bold text-2xl text-fuchsia-400 tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(185,21,204,0.7)]">
            Seshat Interface
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5em] font-display text-fuchsia-300/50">Cosmic Arithmetics</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <SeshatInterface />
      </div>

    </main>
  );
}
