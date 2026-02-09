"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

export function usePWA(isRitualActive: boolean = false) {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log("📱 usePWA: Hook mounted. isRitualActive=", isRitualActive, "user=", !!user);
    // 🏛️ DETECTING THE VESSEL (Calculate once on mount/user change)
    const ua = window.navigator.userAgent;
    const iosCheck = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches;

    setIsIOS(iosCheck);
    setIsInstalled(standaloneCheck);

    // 📜 STEP 1: The Android/Chrome Ritual (beforeinstallprompt)
    const handler = (e: any) => {
      console.log("🎪 usePWA: beforeinstallprompt event fired!");
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if the user is authenticated AND the ritual has concluded
      if (user && !isRitualActive) {
        console.log("✅ usePWA: Conditions met (user && !isRitualActive), showing prompt after 1.5s");
        setTimeout(() => setShowPrompt(true), 1500);
      } else {
        console.log("❌ usePWA: Conditions NOT met. user=", !!user, "isRitualActive=", isRitualActive);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    console.log("📱 usePWA: Added beforeinstallprompt listener");

    // 📜 STEP 2: The iOS Manual Ritual
    // If it's iOS, logged in, not installed, and the ritual is SILENT...
    if (iosCheck && user && !standaloneCheck && !isRitualActive) {
      console.log("📱 usePWA: iOS detected, showing manual prompt after 2.5s");
      setTimeout(() => setShowPrompt(true), 2500);
    }

    return () => {
      console.log("📱 usePWA: Cleaning up beforeinstallprompt listener");
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [user, isRitualActive]); 

  const installChip = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return {
    showPrompt,
    setShowPrompt,
    isIOS,
    isInstalled,
    installChip,
    canInstall: !!deferredPrompt || (isIOS && !isInstalled)
  };
}