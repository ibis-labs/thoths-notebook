"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useSidebar } from "@/components/ui/sidebar";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Scroll, ChevronDown, ChevronUp, ArrowLeft, Star, Moon, Sparkles } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { decryptData, base64ToBuffer } from "@/lib/crypto";
// 🏺 Manifesting the Pylon
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { OstraconIconLarge } from "@/components/icons/ostracon-icon-large";

export default function ArchivesPage() {
  const router = useRouter();
  const { masterKey } = useAuth();
  const { setOpenMobile } = useSidebar();
  const [chronicles, setChronicles] = useState<any[]>([]);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, any>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "chronicles"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChronicles(docs);
        setLoading(false);

        if (docs.length > 0 && !expandedId) {
          setExpandedId(docs[0].id);
        }
      }, (error) => {
        console.error("The Hall of Records is sealed:", error);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // Decrypt chronicle entries whenever chronicles load or masterKey becomes available
  useEffect(() => {
    if (!chronicles.length) return;
    const decryptAll = async () => {
      const newMap: Record<string, any> = {};
      for (const entry of chronicles) {
        if (!entry.isEncrypted || !entry.iv) {
          newMap[entry.id] = entry;
          continue;
        }
        if (!masterKey) {
          newMap[entry.id] = { ...entry, winsNote: '🔒 Unlock vault to read', shadowWorkNote: '🔒 Unlock vault to read', tomorrowQuest: '🔒 Sealed', victoriesLog: [], retainedNunLog: [] };
          continue;
        }
        try {
          const ivUint8 = new Uint8Array(base64ToBuffer(entry.iv));
          const winsNote = await decryptData(masterKey, base64ToBuffer(entry.winsNote), ivUint8);
          const shadowWorkNote = await decryptData(masterKey, base64ToBuffer(entry.shadowWorkNote), ivUint8);
          const tomorrowQuest = await decryptData(masterKey, base64ToBuffer(entry.tomorrowQuest), ivUint8);
          const victoriesLog = JSON.parse(await decryptData(masterKey, base64ToBuffer(entry.victoriesLog), ivUint8));
          const retainedNunLog = entry.retainedNunLog
            ? JSON.parse(await decryptData(masterKey, base64ToBuffer(entry.retainedNunLog), ivUint8))
            : [];
          newMap[entry.id] = { ...entry, winsNote, shadowWorkNote, tomorrowQuest, victoriesLog, retainedNunLog };
        } catch {
          newMap[entry.id] = { ...entry, winsNote: '🔒 Sealed — Key Mismatch', shadowWorkNote: '🔒 Sealed — Key Mismatch', tomorrowQuest: '🔒 Sealed', victoriesLog: [], retainedNunLog: [] };
        }
      }
      setDecryptedMap(newMap);
    };
    decryptAll();
  }, [chronicles, masterKey]);

  const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };

  return (
    <main className="min-h-[100dvh] w-full bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar">

      {/* 🏛️ THE LUMINOUS HEADER: Re-aligned and Sanctified */}
 <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b-2 border-cyan-500/40 px-2 py-2 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
  
  {/* 🏺 LEFT: The High-Contrast Pylon Button */}
{/* 🏺 THE VACUUM-SEALED GATEWAY: Minimum padding, Maximum presence */}
<button
  onClick={handleReturn}
  className="flex flex-col items-center justify-center p-0.1 rounded-2xl border-2 border-cyan-400 bg-cyan-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] min-w-[110px]"
>
  {/* The Pylon: Expanded to the very edge of the stone */}
  <FirstPylonIcon 
    size={80} 
    className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" 
  />

  {/* The Text: Tightly integrated foundation */}
  <span className="font-headline font-bold text-[8px] tracking-[0.em] uppercase text-cyan-300 mt-[-4px] mb-1">
    To Main Hall
  </span>
</button>

  {/* 🏛️ CENTER: The Spaced Title */}
  <div className="flex-1 flex flex-col items-center ml-2">
    <h1 className="font-headline font-bold text-xl text-center text-cyan-400 tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,1)] leading-none">
      The <br/> Archives
    </h1>
    {/* A horizontal grounding line to separate Title from Content */}
    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent mt-2" />
  </div>

  {/* 🕯️ RIGHT: The Ostraca Button */}
  <button
    onClick={() => router.push('/ostraca')}
    className="flex flex-col items-center justify-center p-0.1 rounded-2xl border-2 border-emerald-400 bg-emerald-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] min-w-[115px]"
  >
    <OstraconIconLarge className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
    <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-emerald-300 mt-1">OSTRACA</span>
  </button>
</div>

      {/* Hall Content */}
      <div className="max-w-3xl mx-auto p-4 space-y-4 pt-8">
        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse font-headline tracking-widest">
            DECRYPTING ANCIENT SCROLLS...
          </div>
        ) : chronicles.map((entry) => {
          const isExpanded = expandedId === entry.id;          const displayEntry = (entry.isEncrypted ? decryptedMap[entry.id] : null) || entry;          return (
            <div
              key={entry.id}
              className={`group border rounded-2xl transition-all duration-500 ${isExpanded
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(34,211,238,0.2)] scale-[1.02]'
                  : 'border-cyan-500/20 bg-black/40 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full p-5 flex justify-between items-center text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${isExpanded
                      ? 'border-lime-400 bg-lime-400/20 shadow-[0_0_15px_rgba(163,230,53,0.6)]'
                      : 'border-lime-500/30 bg-lime-950/10'
                    }`}>
                    <Scroll size={22} className="text-lime-400" />
                  </div>

                  <div>
                    <h3 className={`font-headline font-bold tracking-widest uppercase transition-all duration-500 ${isExpanded ? 'text-2xl text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-sm text-cyan-500/70'
                      }`}>
                      {entry.date}
                    </h3>
                    {!isExpanded && (
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 italic">
                        {displayEntry.tomorrowQuest || "Quest Sealed"}
                      </p>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={24} className="text-cyan-400" /> : <ChevronDown size={20} className="text-cyan-900" />}
              </button>

              {isExpanded && (
                <div className="px-6 pb-8 space-y-8 animate-in zoom-in-95 fade-in duration-500">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/5">
                      <h4 className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <Star size={12} /> Achievements
                      </h4>
                      <p className="text-sm text-amber-100/90 italic font-serif leading-relaxed">"{displayEntry.winsNote}"</p>
                    </div>

                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/5">
                      <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <Moon size={12} /> Shadow Reflection
                      </h4>
                      <p className="text-sm text-indigo-100/80 leading-relaxed font-sans">"{displayEntry.shadowWorkNote}"</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-lime-500/30 bg-lime-950/5 shadow-[inset_0_0_15px_rgba(163,230,53,0.05)]">
                    <h4 className="text-[10px] text-lime-400 font-bold uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                      <Sparkles size={12} /> Tomorrow&apos;s Prophecy
                    </h4>
                    <p className="text-md text-lime-100/90 font-headline tracking-wide italic">
                      {displayEntry.tomorrowQuest || "No prophecy was recorded."}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-cyan-500/20">
                    <div className="flex flex-wrap justify-center gap-2">
                      {Array.isArray(displayEntry.victoriesLog) && displayEntry.victoriesLog.map((task: string, i: number) => (
                        <span key={i} className="text-[10px] px-3 py-1.5 bg-black border border-cyan-400/30 rounded-lg text-cyan-300 font-headline tracking-widest shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]">
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}