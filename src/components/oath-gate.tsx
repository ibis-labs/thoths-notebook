"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, sub } from "date-fns";
import { CyberAnkh } from "./icons/cyber-ankh";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";

export function OathGate() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  

// --- THE 3:05 AM RULE ---
  // We calculate the "Effective Date" by subtracting 3 hours and 5 minutes.
  // This means the "New Day" doesn't technically start until 03:05 AM.
  const getEffectiveDate = () => {
    const now = new Date();
    // Shift time back. 
    // Ex: 2:00 AM becomes 10:55 PM previous day.
    // Ex: 3:06 AM becomes 00:01 AM current day.
    const virtualTime = sub(now, { hours: 3, minutes: 5 });
    return format(virtualTime, "yyyy-MM-dd");
  }

useEffect(() => {
    if (!user) return;

    const checkInitiationAndOath = async () => {
      // 1. Fetch the user's scroll from Firestore
      const { doc, getDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 🏺 THE PROTECTIVE RULE:
        // If they haven't finished the signup/obelisk ritual, 
        // DO NOT show the Morning Gate.
        if (userData.isInitiated === false) {
          setIsVisible(false);
          return;
        }
      }

      // 2. If they ARE initiated, perform the standard Daily Check
      const lastOathString = localStorage.getItem(`thoth_oath_${user.uid}_date`);
      const effectiveToday = getEffectiveDate();

      if (lastOathString !== effectiveToday) {
        setIsVisible(true);
      }
    };

    checkInitiationAndOath();
  }, [user]);

  // 2. THE RITUAL OF COMMITMENT
  const handleCommit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // A. Scribe the Oath into the Archives
      await addDoc(collection(db, "tasks"), {
        userId: user.uid,
        title: "Oath of Commitment",
        category: "Sacred Duties",
        details: "I have taken up the Ankh to churn chaos into order.",
        estimatedTime: 0,
        importance: "low",
        completed: true, // Born complete!
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        dueDate: new Date(),
        tags: ["Foundation", "Oath"],
      });


      // B. Seal the Gate for the day
     // 👇 UPDATED: Seal the Gate using the EFFECTIVE date
      const effectiveToday = getEffectiveDate();
      localStorage.setItem(`thoth_oath_${user.uid}_date`, effectiveToday);

      // C. Vanish
      setIsVisible(false);

      // 👇 4. THE TARGET LOCK SCROLL
      // Wait 600ms for the gate to fade and the database to render the new card
      setTimeout(() => {
        const maatSection = document.getElementById("maat-sanctuary");

        if (maatSection) {
          console.log("Found Ma'at. Scrolling...");

          // This tells the browser: "Smoothly scroll until this element is in the center/start"
          maatSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        } else {
          // Backup: If it can't find Ma'at, try scrolling the main window
          console.log("Ma'at section not found, forcing window scroll.");
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 600);

    } catch (error) {
      console.error("The Oath faltered:", error);
      setIsSubmitting(false);
    }
  };

  // If we aren't visible, render nothing so we don't block interactions
  if (!user) return null;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.8 }}
          // Z-Index 60 ensures it sits ON TOP of everything (Dialogs are usually 50)
          className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-6 text-center"
        >
          {/* Background Ambient Pulse */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 pointer-events-none" />

          {/* The Symbol (Breathing Animation) */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
              textShadow: ["0 0 20px #fbbf24", "0 0 50px #fbbf24", "0 0 20px #fbbf24"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-12 relative"
          >
            {/* 👇 THE NEW ICON */}
            <CyberAnkh className="w-32 h-32 text-amber-500" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-headline tracking-widest text-amber-100 mb-6 uppercase drop-shadow-md">
            The Morning Gate
          </h2>

          {/* 👇 SHARPENED TEXT: Lighter color, full opacity, medium weight */}
          <p className="max-w-md text-amber-50 font-mono text-lg mb-12 leading-relaxed font-medium drop-shadow-sm">
            Take 8 breaths. Set your intention. <br />
            <br />
            Do you commit to churning <span className="text-cyan-400 font-bold">Nun</span> (Chaos) into <span className="text-amber-400 font-bold">Ma'at</span> (Order) this day?
          </p>

          <Button
            size="lg"
            onClick={handleCommit}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold tracking-[0.2em] px-12 py-8 text-xl rounded-none border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] transition-all duration-500 uppercase scale-100 hover:scale-105 active:scale-95"
          >
            {isSubmitting ? "Scribing..." : "I Commit"}
          </Button>

          <p className="mt-8 text-xs text-slate-600 font-mono uppercase tracking-widest opacity-50">
            "To speak it is to make it so."
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}