"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from "@/lib/crypto";

// --- THE NEW MODULAR COMPONENTS ---
import { ChronicleThreshold } from "./components/chronicle-threshold";
import { MaatAttestation } from "./components/maat-attestation";
import { GratitudeBreath } from "./components/gratitude-breath";
import { ChronicleSealingForm } from "./components/chronicle-sealing-form";
import { StreakCelebration } from "./components/streak-celebration";

interface Task {
  id: string;
  title: string;
  category?: string;
  isRitual?: boolean;
  completed: boolean;
  dueDate?: string;
  originRitualId?: string;
  isEncrypted?: boolean;
  iv?: string;
}

export default function EveningChroniclePage() {
  const router = useRouter();
  const { masterKey } = useAuth();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [decryptedTasks, setDecryptedTasks] = useState<Task[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0); // 🏺 Moved inside component
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sealResult, setSealResult] = useState<{
    overallStreak: number;
    history10Day: number[];
    ritualSummaries: Array<{
      id: string;
      title: string;
      currentStreak: number;
      totalCompletions: number;
      history10: number[];
      isWin: boolean;
    }>;
    completedCount: number;
  } | null>(null);

  const [formState, setFormState] = useState({
  winsNote: "",       // 🏺 Changed from 'wins'
  shadowWorkNote: "", // 🏺 Changed from 'shadowWork'
  tomorrowQuest: ""   // 🏺 Keep this as is, as the Archive already uses it
});

  // 📜 AUTH & DATA FETCHING
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/login"); return; }
      setUser(currentUser);

      // Fetch Tasks
      const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setAllTasks(tasksData);

      // Fetch User Stats (Streak)
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setCurrentStreak(userSnap.data().stats?.currentStreak || 0);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Decrypt task titles when tasks or masterKey change
  useEffect(() => {
    if (!allTasks.length) { setDecryptedTasks([]); return; }
    if (!masterKey) { setDecryptedTasks(allTasks); return; }
    const run = async () => {
      const results = await Promise.all(allTasks.map(async (task) => {
        if (!task.isEncrypted || !task.iv) return task;
        try {
          const ivUint8 = new Uint8Array(base64ToBuffer(task.iv));
          const title = await decryptData(masterKey, base64ToBuffer(task.title), ivUint8);
          return { ...task, title };
        } catch { return task; }
      }));
      setDecryptedTasks(results);
    };
    run();
  }, [allTasks, masterKey]);

  // ⚡ THE MANUAL SEAL RITUAL
  const handleSealChronicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);

      // 🏺 INTERNAL SCRYING FOR THE ARCHIVE
      const completedTasks = decryptedTasks.filter(t => t.completed);
      // Logic for Nun: rituals or overdue items
      const now = new Date();
      const scribeDate = (now.getHours() < 2 || (now.getHours() === 2 && now.getMinutes() < 30))
        ? new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0]
        : now.toISOString().split('T')[0];

      const incompleteRituals = decryptedTasks.filter(t => 
        !t.completed && (t.category === "Daily Ritual" || t.isRitual || (t.dueDate && t.dueDate <= scribeDate))
      );

      // 1. STREAK CALCULATION
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      let newStreak = (userData?.stats?.currentStreak || 0) + 1;
      let history = userData?.stats?.history10Day || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      history.push(1);
      history = history.slice(-10);

      // 2. CREATE ARCHIVE
      const archiveRef = doc(collection(db, "chronicles"));
      const victoriesLog = completedTasks.map(t => t.title);
      const retainedNunLog = incompleteRituals.map(t => t.title);
      let chronicleDoc: Record<string, unknown> = {
        userId: user.uid,
        createdAt: serverTimestamp(),
        date: scribeDate,
        victoriesLog,
        retainedNunLog,
        winsNote: formState.winsNote,
        shadowWorkNote: formState.shadowWorkNote,
        tomorrowQuest: formState.tomorrowQuest,
        streakAtSeal: newStreak,
        type: "evening-seal",
        isEncrypted: false,
      };
      if (masterKey) {
        const { ciphertext: winsC, iv } = await encryptData(masterKey, formState.winsNote || "");
        const { ciphertext: shadowC } = await encryptData(masterKey, formState.shadowWorkNote || "", iv);
        const { ciphertext: questC } = await encryptData(masterKey, formState.tomorrowQuest || "", iv);
        const { ciphertext: victoriesC } = await encryptData(masterKey, JSON.stringify(victoriesLog), iv);
        const { ciphertext: retainedC } = await encryptData(masterKey, JSON.stringify(retainedNunLog), iv);
        chronicleDoc = {
          ...chronicleDoc,
          winsNote: bufferToBase64(winsC),
          shadowWorkNote: bufferToBase64(shadowC),
          tomorrowQuest: bufferToBase64(questC),
          victoriesLog: bufferToBase64(victoriesC),
          retainedNunLog: bufferToBase64(retainedC),
          iv: bufferToBase64(iv.buffer as ArrayBuffer),
          isEncrypted: true,
        };
      }
      batch.set(archiveRef, chronicleDoc);

      // 3. UPDATE USER STATS
      batch.update(userRef, {
        "stats.currentStreak": newStreak,
        "stats.maxStreak": Math.max(newStreak, userData?.stats?.maxStreak || 0),
        "stats.history10Day": history,
        "stats.lastRitualDate": scribeDate
      });

  // 🏺 3.5 UPDATE INDIVIDUAL RITUAL STREAKS
      const completedRitualIds = completedTasks
        .filter(t => (t.isRitual || t.category === "Daily Ritual") && t.originRitualId)
        .map(t => t.originRitualId);

      console.log("🏺 Ritual IDs identified for gold pips:", completedRitualIds);

      const ritualsRef = collection(db, "dailyRituals");
      const ritualsQuery = query(ritualsRef, where("userId", "==", user.uid));
      const ritualsSnap = await getDocs(ritualsQuery);

      if (ritualsSnap.empty) {
        console.log("📭 No ritual templates found to update.");
      }

      ritualsSnap.forEach((ritualDoc) => {
        const rData = ritualDoc.data();
        // Ensure s is never undefined
        const s = rData.streakData || {
          currentStreak: 0,
          bestStreak: 0,
          totalCompletions: 0,
          history10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        const isWin = completedRitualIds.includes(ritualDoc.id);
        
        const newHistory = [...(s.history10 || [0,0,0,0,0,0,0,0,0,0]).slice(1), isWin ? 1 : 0];
        const newStreak = isWin ? (s.currentStreak || 0) + 1 : 0;

        batch.update(ritualDoc.ref, {
          "streakData.currentStreak": newStreak,
          "streakData.bestStreak": Math.max(newStreak, s.bestStreak || 0),
          "streakData.totalCompletions": (s.totalCompletions || 0) + (isWin ? 1 : 0),
          "streakData.history10": newHistory,
          "streakData.lastUpdated": scribeDate
        });
      });
      // 4. PURGE DEEDS (Delete only what was sealed/retained)
      // 🏺 RECTIFIED STEP 4: Protect the Khet
// 1. Always delete completed tasks (they are now in the Archive)
completedTasks.forEach(t => batch.delete(doc(db, "tasks", t.id)));

// 2. ONLY delete incomplete tasks if they are RITUALS
// This allows regular "Khet" to roll over to tomorrow!
const ritualsToPurge = incompleteRituals.filter(t => t.isRitual || t.category === "Daily Ritual");
ritualsToPurge.forEach(t => batch.delete(doc(db, "tasks", t.id)));
      await batch.commit();

      // Build celebration data from what we just wrote
      const ritualsRef2 = collection(db, "dailyRituals");
      const ritualsQuery2 = query(ritualsRef2, where("userId", "==", user.uid));
      const ritualsSnap2 = await getDocs(ritualsQuery2);
      const completedRitualIdSet = new Set(
        completedTasks.filter(t => t.originRitualId).map(t => t.originRitualId!)
      );
      const ritualSummaries = await Promise.all(ritualsSnap2.docs.map(async d => {
        const rData = d.data();
        const s = rData.streakData || { currentStreak: 0, totalCompletions: 0, history10: [0,0,0,0,0,0,0,0,0,0] };
        const isWin = completedRitualIdSet.has(d.id);
        // Decrypt title if encrypted
        let title = rData.title || "Ritual";
        if (rData.isEncrypted && rData.iv && masterKey) {
          try {
            const { decryptData: dec, base64ToBuffer: b64 } = await import("@/lib/crypto");
            const ivUint8 = new Uint8Array(b64(rData.iv));
            title = await dec(masterKey, b64(rData.title), ivUint8);
          } catch { /* leave ciphertext as fallback */ }
        }
        return {
          id: d.id,
          title,
          currentStreak: isWin ? (s.currentStreak || 0) + 1 : (s.currentStreak || 0),
          totalCompletions: (s.totalCompletions || 0) + (isWin ? 1 : 0),
          history10: [...(s.history10 || [0,0,0,0,0,0,0,0,0,0]).slice(1), isWin ? 1 : 0],
          isWin,
        };
      }));

      setSealResult({
        overallStreak: newStreak,
        history10Day: history,
        ritualSummaries,
        completedCount: completedTasks.length,
      });
      setStep(5);
    } catch (err) {
      console.error("Seal broken:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-black relative">
      {step === 1 && (
        <ChronicleThreshold onNext={() => setStep(2)} onMainHall={() => router.push("/")} />
      )}
      {step === 2 && (
        <MaatAttestation allTasks={decryptedTasks} onNext={() => setStep(3)} onBack={() => setStep(1)} onMainHall={() => router.push("/")} />
      )}
      {step === 3 && (
        <GratitudeBreath onNext={() => setStep(4)} onBack={() => setStep(2)} onMainHall={() => router.push("/")} />
      )}
      {step === 4 && (
        <ChronicleSealingForm
          completedTasks={decryptedTasks.filter(t => t.completed)}
          formState={formState}
          setFormState={setFormState}
          onSeal={handleSealChronicle}
          isSubmitting={isSubmitting}
          onBack={() => setStep(3)}
          onMainHall={() => router.push("/")}
          displayStreak={currentStreak + 1}
        />
      )}
      {step === 5 && sealResult && (
        <StreakCelebration
          overallStreak={sealResult.overallStreak}
          history10Day={sealResult.history10Day}
          ritualSummaries={sealResult.ritualSummaries}
          completedCount={sealResult.completedCount}
        />
      )}
    </main>
  );
}