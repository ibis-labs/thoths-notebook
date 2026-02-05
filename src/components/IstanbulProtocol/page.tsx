"use client";

import IstanbulRitual from "@/components/IstanbulProtocol/IstanbulRitual";
import { useRouter } from "next/navigation";

export default function IstanbulProtocolPage() {
  const router = useRouter();

  // This function is triggered when handleEncryptAndSave finishes
  const handleRitualComplete = () => {
    // 🏺 After the stash is sealed, send them to the Main Hall
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <IstanbulRitual onRitualComplete={handleRitualComplete} />
    </main>
  );
}