"use client";

import IstanbulRitual from "@/components/IstanbulProtocol/IstanbulRitual";
import { useRouter } from "next/navigation";

export default function IstanbulProtocolPage() {
  const router = useRouter();

  // This handles the exit after the Scribe seals their PIN/Stash
  const handleRitualComplete = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <IstanbulRitual onRitualComplete={handleRitualComplete} />
    </main>
  );
}