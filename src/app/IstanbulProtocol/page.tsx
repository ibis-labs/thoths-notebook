"use client";

import { useEffect } from "react";
import IstanbulRitual from "@/components/IstanbulProtocol/IstanbulRitual";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider"; // 🏺 Import the ritual power

export default function IstanbulProtocolPage() {
  const router = useRouter();
  const { setRitualInProgress } = useAuth(); // 🏺 Summon the command

  useEffect(() => {
    // 📜 On mount: Silence the Temple
    setRitualInProgress(true);

    // 📜 On unmount: Return the voice (safety cleanup)
    return () => setRitualInProgress(false);
  }, [setRitualInProgress]);

  // This handles the exit after the Scribe seals their PIN/Stash
  const handleRitualComplete = () => {
    setRitualInProgress(false); // 🏺 Ritual complete, release the gates
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <IstanbulRitual onRitualComplete={handleRitualComplete} />
    </main>
  );
}