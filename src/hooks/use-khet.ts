"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';
import type { WorkoutProgram, WorkoutSession, ProgramProgress, ExercisePR, GlobalStats, FoundationalPR, KhetUserSettings, KhetManualPR, WeightUnit } from '@/lib/khet-types';
import { FOUNDATIONAL_MOVEMENTS } from '@/lib/khet-types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────────────────────
interface UseKhetReturn {
  programs: WorkoutProgram[];
  loading: boolean;
  weightUnit: WeightUnit;
  addProgram: (data: Omit<WorkoutProgram, 'id'>) => Promise<string>;
  updateProgram: (id: string, data: Partial<WorkoutProgram>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  saveSession: (data: Omit<WorkoutSession, 'id'>) => Promise<string>;
  getGhostLogs: (programId: string, dayIndex: number) => Promise<WorkoutSession[]>;
  completeSessionAndSync: (data: Omit<WorkoutSession, 'id'>) => Promise<void>;
  getProgramProgress: (programId: string, programName: string) => Promise<ProgramProgress | null>;
  getLifetimePRs: () => Promise<ExercisePR[]>;
  getGlobalStats: () => Promise<GlobalStats | null>;
  getUserSettings: () => Promise<KhetUserSettings | null>;
  updateUserSettings: (data: Partial<KhetUserSettings>) => Promise<void>;
  getManualPRs: () => Promise<KhetManualPR[]>;
  setManualPR: (data: Omit<KhetManualPR, 'id' | 'userId'>) => Promise<void>;
  deleteManualPR: (movement: string) => Promise<void>;
  getDiaryEntries: (limitCount?: number) => Promise<WorkoutSession[]>;
}

// ─────────────────────────────────────────────────────────────
// Crypto helpers (module-level, pure)
// ─────────────────────────────────────────────────────────────

/** Fields kept plaintext so Firestore can query on them */
type SessionPlaintext = Pick<
  WorkoutSession,
  'userId' | 'programId' | 'programName' | 'dayIndex' | 'dayLabel' | 'date' | 'completed' | 'totalVolume' | 'linkedTaskId' | 'linkedRitualId'
>;

// ─────────────────────────────────────────────────────────────
// Program encryption helpers
// Sensitive content: name + days (exercise structure)
// Plaintext metadata: userId, createdAt, lifetimeVolume,
//   lastSessionDate, lastSessionDayIndex, isDeloading,
//   lastDeloadStart, lastDeloadEnd, deloadStrategy, split,
//   frequency, durationWeeks — needed for stats updates & display.
// ─────────────────────────────────────────────────────────────
async function buildProgramDoc(
  data: Omit<WorkoutProgram, 'id'>,
  masterKey: CryptoKey | null,
): Promise<Record<string, unknown>> {
  const { name, days, ...rest } = data;
  if (masterKey) {
    const { ciphertext: nameCipher, iv: nameIv } = await encryptData(masterKey, name);
    const { ciphertext: daysCipher, iv: daysIv } = await encryptData(masterKey, JSON.stringify(days));
    return {
      ...rest,
      encryptedName: bufferToBase64(nameCipher),
      nameIv: bufferToBase64(nameIv.buffer as ArrayBuffer),
      encryptedDays: bufferToBase64(daysCipher),
      daysIv: bufferToBase64(daysIv.buffer as ArrayBuffer),
      isEncrypted: true,
    };
  }
  return { ...data, isEncrypted: false };
}

async function decryptProgramDoc(
  raw: Record<string, unknown>,
  masterKey: CryptoKey | null,
): Promise<WorkoutProgram> {
  const base = raw as unknown as WorkoutProgram;
  // Encrypted but vault is locked — return safe shell so UI doesn't crash
  if ((raw as any).isEncrypted && !masterKey) {
    return { ...base, name: base.name ?? '🔒 Vault Locked', days: (base as any).days ?? [] };
  }
  if (!(raw as any).isEncrypted) return base;
  // masterKey is guaranteed non-null here — both null-key paths return early above
  const key = masterKey!;
  try {
    const name = (raw as any).encryptedName && (raw as any).nameIv
      ? await decryptData(key, base64ToBuffer((raw as any).encryptedName), new Uint8Array(base64ToBuffer((raw as any).nameIv)))
      : (base as any).name ?? '';
    const daysJson = (raw as any).encryptedDays && (raw as any).daysIv
      ? await decryptData(key, base64ToBuffer((raw as any).encryptedDays), new Uint8Array(base64ToBuffer((raw as any).daysIv)))
      : JSON.stringify((base as any).days ?? []);
    return { ...base, name, days: JSON.parse(daysJson) };
  } catch {
    return base;
  }
}

async function buildSessionDoc(
  session: Omit<WorkoutSession, 'id'>,
  masterKey: CryptoKey | null,
): Promise<Record<string, unknown>> {
  const plain: SessionPlaintext = {
    userId: session.userId,
    programId: session.programId,
    programName: session.programName,
    dayIndex: session.dayIndex,
    dayLabel: session.dayLabel,
    date: session.date,
    completed: session.completed,
    totalVolume: session.totalVolume,
    linkedTaskId: session.linkedTaskId ?? null,
    linkedRitualId: session.linkedRitualId ?? null,
  };
  if (masterKey) {
    const sensitive = { exerciseLogs: session.exerciseLogs, cardioLog: session.cardioLog, absLogs: session.absLogs, notes: session.notes, durationMinutes: session.durationMinutes };
    const { ciphertext, iv } = await encryptData(masterKey, JSON.stringify(sensitive));
    return { ...plain, encryptedPayload: bufferToBase64(ciphertext), iv: bufferToBase64(iv.buffer as ArrayBuffer), isEncrypted: true };
  }
  return { ...plain, exerciseLogs: session.exerciseLogs, cardioLog: session.cardioLog, absLogs: session.absLogs, notes: session.notes, durationMinutes: session.durationMinutes, isEncrypted: false };
}

async function decryptSessionDoc(
  raw: Record<string, unknown>,
  masterKey: CryptoKey | null,
): Promise<WorkoutSession> {
  const base = raw as unknown as WorkoutSession;
  if (!(raw as any).isEncrypted || !(raw as any).encryptedPayload || !masterKey) return base;
  try {
    const plain = await decryptData(masterKey, base64ToBuffer((raw as any).encryptedPayload), new Uint8Array(base64ToBuffer((raw as any).iv)));
    return { ...base, ...JSON.parse(plain) };
  } catch { return base; }
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export function useKhet(): UseKhetReturn {
  const { user, masterKey } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');

  // Load weight unit preference from settings on mount
  useEffect(() => {
    if (!user || !masterKey) return;
    const q = query(collection(db, 'khetSettings'), where('userId', '==', user.uid), limit(1));
    getDocs(q).then(async (snap) => {
      if (snap.empty) return;
      const raw = snap.docs[0].data() as any;
      let parsed: Partial<KhetUserSettings> = {};
      if (raw.isEncrypted && raw.encryptedPayload && masterKey) {
        try {
          const plain = await decryptData(masterKey, base64ToBuffer(raw.encryptedPayload), new Uint8Array(base64ToBuffer(raw.iv)));
          parsed = JSON.parse(plain);
        } catch { /* ignore */ }
      } else {
        parsed = raw;
      }
      if (parsed.weightUnit) setWeightUnit(parsed.weightUnit);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, masterKey]);

  // Real-time listener for programs
  useEffect(() => {
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'khetPrograms'),
      where('userId', '==', user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      try {
        const decrypted: WorkoutProgram[] = [];
        for (const d of snap.docs) {
          const raw = { id: d.id, ...d.data() } as Record<string, unknown>;
          decrypted.push(await decryptProgramDoc(raw, masterKey));
        }
        // Sort by createdAt descending client-side to avoid composite index requirement
        decrypted.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setPrograms(decrypted);
      } catch (err) {
        console.error('[Khet] Programs decrypt error:', err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('[Khet] Programs listener error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, masterKey]);

  // ── CRUD ──────────────────────────────────────────────────

  const addProgram = useCallback(async (data: Omit<WorkoutProgram, 'id'>): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const programDoc = await buildProgramDoc({ ...data, userId: user.uid }, masterKey);
    const ref = await addDoc(collection(db, 'khetPrograms'), programDoc);
    return ref.id;
  }, [user, masterKey]);

  const updateProgram = useCallback(async (id: string, data: Partial<WorkoutProgram>): Promise<void> => {
    const updates: Record<string, unknown> = { ...data };
    if (masterKey) {
      if (data.name !== undefined) {
        const { ciphertext, iv } = await encryptData(masterKey, data.name);
        updates.encryptedName = bufferToBase64(ciphertext);
        updates.nameIv = bufferToBase64(iv.buffer as ArrayBuffer);
        updates.isEncrypted = true;
        delete updates.name;
      }
      if (data.days !== undefined) {
        const { ciphertext, iv } = await encryptData(masterKey, JSON.stringify(data.days));
        updates.encryptedDays = bufferToBase64(ciphertext);
        updates.daysIv = bufferToBase64(iv.buffer as ArrayBuffer);
        updates.isEncrypted = true;
        delete updates.days;
      }
    }
    await updateDoc(doc(db, 'khetPrograms', id), updates);
  }, [masterKey]);

  const deleteProgram = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'khetPrograms', id));
  }, []);

  // ── SESSIONS ──────────────────────────────────────────────

  const saveSession = useCallback(async (data: Omit<WorkoutSession, 'id'>): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const doc_data = await buildSessionDoc({ ...data, userId: user.uid }, masterKey);
    const ref = await addDoc(collection(db, 'khetSessions'), doc_data);
    return ref.id;
  }, [user, masterKey]);

  /** Fetch last 3 completed sessions for a specific program day (ghost logs) */
  const getDiaryEntries = useCallback(async (
    limitCount = 50,
  ): Promise<WorkoutSession[]> => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'khetSessions'),
        where('userId', '==', user.uid),
        where('completed', '==', true),
        orderBy('date', 'desc'),
        limit(limitCount),
      );
      const snap = await getDocs(q);
      const sessions: WorkoutSession[] = [];
      for (const d of snap.docs) {
        const raw = { id: d.id, ...d.data() } as Record<string, unknown>;
        sessions.push(await decryptSessionDoc(raw, masterKey));
      }
      return sessions;
    } catch (err) {
      console.error('[Khet] getDiaryEntries error:', err);
      return [];
    }
  }, [user, masterKey]);

  const getGhostLogs = useCallback(async (
    programId: string,
    dayIndex: number,
  ): Promise<WorkoutSession[]> => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'khetSessions'),
        where('userId', '==', user.uid),
        where('programId', '==', programId),
        where('dayIndex', '==', dayIndex),
        where('completed', '==', true),
        orderBy('date', 'desc'),
        limit(3),
      );
      const snap = await getDocs(q);
      const sessions: WorkoutSession[] = [];
      for (const d of snap.docs) {
        const raw = { id: d.id, ...d.data() } as Record<string, unknown>;
        sessions.push(await decryptSessionDoc(raw, masterKey));
      }
      return sessions;
    } catch (err) {
      console.error('[Khet] getGhostLogs error:', err);
      return [];
    }
  }, [user, masterKey]);

  // ── MA'AT SYNC ────────────────────────────────────────────

  /**
   * Saves session to Firestore, updates program stats, and
   * auto-completes any linked Daily Ritual instance or Task.
   */
  const completeSessionAndSync = useCallback(async (
    data: Omit<WorkoutSession, 'id'>,
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    // 1. Save completed session (encrypted)
    const sessionDoc = await buildSessionDoc({ ...data, userId: user.uid, completed: true }, masterKey);
    await addDoc(collection(db, 'khetSessions'), sessionDoc);

    // 2. Update program stats (increment atomically — no read needed)
    await updateDoc(doc(db, 'khetPrograms', data.programId), {
      lastSessionDate: data.date,
      lastSessionDayIndex: data.dayIndex,
      lifetimeVolume: increment(data.totalVolume),
      sessionsCompleted: increment(1),
    });

    // 3. Ma'at Sync: auto-complete linked Daily Ritual instance (today's)
    if (data.linkedRitualId) {
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const ritualQ = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          where('originRitualId', '==', data.linkedRitualId),
          where('completed', '==', false),
        );
        const ritualSnap = await getDocs(ritualQ);
        for (const taskDoc of ritualSnap.docs) {
          const taskData = taskDoc.data();
          // Match today's instance by dueDate
          const dueDate = taskData.dueDate?.toDate
            ? format(taskData.dueDate.toDate(), 'yyyy-MM-dd')
            : taskData.dueDate ?? '';
          if (dueDate === today) {
            await updateDoc(taskDoc.ref, { completed: true });
          }
        }
      } catch (err) {
        console.error('[Khet] Ma\'at Sync (ritual) error:', err);
      }
    }

    // 4. Ma'at Sync: auto-complete linked one-off Task
    if (data.linkedTaskId) {
      try {
        await updateDoc(doc(db, 'tasks', data.linkedTaskId), { completed: true });
      } catch (err) {
        console.error('[Khet] Ma\'at Sync (task) error:', err);
      }
    }

    // 5. Auto-create a completed task stamping this workout on the main task page
    try {
      const workoutTitle = `${data.programName} — ${data.dayLabel}`;
      let finalTitle = workoutTitle;
      let ivString: string | null = null;
      let isEncrypted = false;

      if (masterKey) {
        const { ciphertext, iv } = await encryptData(masterKey, workoutTitle);
        finalTitle = bufferToBase64(ciphertext);
        ivString = bufferToBase64(iv.buffer as ArrayBuffer);
        isEncrypted = true;
      }

      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: finalTitle,
        iv: ivString,
        isEncrypted,
        category: 'Khet',
        importance: 'medium',
        estimatedTime: 0,
        completed: true,
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        dueDate: new Date(),
        isRitual: false,
        originRitualId: null,
        khetProgramId: data.programId,
        tags: ['Khet-Station'],
      });
    } catch (err) {
      console.error('[Khet] workout task stamp error:', err);
    }

    toast({
      title: 'SESSION COMPLETE',
      description: 'The Mass is Displaced. Khet is pleased.',
    });
  }, [user, masterKey, toast]);

  // ── PROGRAM PROGRESS ──────────────────────────────────────

  /**
   * Loads all completed sessions for one program and returns
   * a ProgramProgress summary (volume history, session count, dates).
   */
  const getProgramProgress = useCallback(async (
    programId: string,
    programName: string,
  ): Promise<ProgramProgress | null> => {
    if (!user) return null;
    try {
      const q = query(
        collection(db, 'khetSessions'),
        where('userId', '==', user.uid),
        where('programId', '==', programId),
        where('completed', '==', true),
        orderBy('date', 'asc'),
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      // totalVolume and date are stored plaintext — no decryption needed here
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutSession));
      const volumeHistory = sessions.map((s) => ({ date: s.date, volume: s.totalVolume }));
      const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
      return {
        programId,
        programName,
        totalSessions: sessions.length,
        totalVolume,
        firstSessionDate: sessions[0].date,
        lastSessionDate: sessions[sessions.length - 1].date,
        volumeHistory,
      };
    } catch (err) {
      console.error('[Khet] getProgramProgress error:', err);
      return null;
    }
  }, [user]);

  // ── LIFETIME PR ENGINE ────────────────────────────────────

  /**
   * Scans ALL completed sessions across ALL programs for this user
   * and computes per-exercise personal records.
   * Brzycki 1RM formula: weight / (1.0278 − 0.0278 × reps)
   */
  const getLifetimePRs = useCallback(async (): Promise<ExercisePR[]> => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'khetSessions'),
        where('userId', '==', user.uid),
        where('completed', '==', true),
        orderBy('date', 'asc'),
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];

      // Decrypt all sessions first, then compute PRs
      const sessions: WorkoutSession[] = [];
      for (const docSnap of snap.docs) {
        const raw = { id: docSnap.id, ...docSnap.data() } as Record<string, unknown>;
        sessions.push(await decryptSessionDoc(raw, masterKey));
      }

      // Map: exerciseId → accumulator
      const acc: Record<string, {
        name: string;
        bestWeight: number;
        bestRepsAtBestWeight: number;
        best1RM: number;
        bestWeightDate: string;
        bestWeightProgram: string;
        bestSessionVolume: number;
        bestVolumeDate: string;
        lifetimeVolume: number;
        sessionDates: Set<string>;
        history: { date: string; volume: number; maxWeight: number }[];
      }> = {};

      for (const session of sessions) {
        for (const log of session.exerciseLogs ?? []) {
          const id = log.originalExerciseId ?? log.exerciseId;
          const name = log.originalName ?? log.name;
          if (!acc[id]) {
            acc[id] = {
              name,
              bestWeight: 0,
              bestRepsAtBestWeight: 0,
              best1RM: 0,
              bestWeightDate: session.date,
              bestWeightProgram: session.programName,
              bestSessionVolume: 0,
              bestVolumeDate: session.date,
              lifetimeVolume: 0,
              sessionDates: new Set(),
              history: [],
            };
          }
          const entry = acc[id];
          entry.sessionDates.add(session.date);

          // Per-session exercise volume and max weight
          let sessionExVol = 0;
          let sessionMaxWeight = 0;
          for (const set of log.sets) {
            if (!set.completed || !set.weight || !set.reps) continue;
            sessionExVol += set.weight * set.reps;
            entry.lifetimeVolume += set.weight * set.reps;

            if (set.weight > entry.bestWeight ||
               (set.weight === entry.bestWeight && set.reps > entry.bestRepsAtBestWeight)) {
              entry.bestWeight = set.weight;
              entry.bestRepsAtBestWeight = set.reps;
              entry.bestWeightDate = session.date;
              entry.bestWeightProgram = session.programName;
            }
            const est1RM = set.reps === 1
              ? set.weight
              : set.weight / (1.0278 - 0.0278 * set.reps);
            if (est1RM > entry.best1RM) entry.best1RM = est1RM;
            if (set.weight > sessionMaxWeight) sessionMaxWeight = set.weight;
          }
          if (sessionExVol > entry.bestSessionVolume) {
            entry.bestSessionVolume = sessionExVol;
            entry.bestVolumeDate = session.date;
          }
          if (sessionExVol > 0) {
            entry.history.push({ date: session.date, volume: sessionExVol, maxWeight: sessionMaxWeight });
          }
        }
      }

      return Object.entries(acc)
        .filter(([, e]) => e.bestWeight > 0)
        .map(([exerciseId, e]) => ({
          exerciseId,
          name: e.name,
          bestWeight: e.bestWeight,
          bestRepsAtBestWeight: e.bestRepsAtBestWeight,
          best1RM: Math.round(e.best1RM * 10) / 10,
          bestWeightDate: e.bestWeightDate,
          bestWeightProgram: e.bestWeightProgram,
          bestSessionVolume: e.bestSessionVolume,
          bestVolumeDate: e.bestVolumeDate,
          lifetimeVolume: Math.round(e.lifetimeVolume),
          sessionCount: e.sessionDates.size,
          history: e.history.slice(-20),
        }))
        .sort((a, b) => b.lifetimeVolume - a.lifetimeVolume);
    } catch (err) {
      console.error('[Khet] getLifetimePRs error:', err);
      return [];
    }
  }, [user, masterKey]);

  // ── GLOBAL STATS (GAINZ DASHBOARD) ───────────────────────

  const getGlobalStats = useCallback(async (): Promise<GlobalStats | null> => {
    if (!user) return null;
    try {
      const q = query(
        collection(db, 'khetSessions'),
        where('userId', '==', user.uid),
        where('completed', '==', true),
        orderBy('date', 'asc'),
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;

      // Decrypt all sessions before scanning
      const sessions: WorkoutSession[] = [];
      for (const d of snap.docs) {
        const raw = { id: d.id, ...d.data() } as Record<string, unknown>;
        sessions.push(await decryptSessionDoc(raw, masterKey));
      }

      // ── Aggregate top-level stats ──
      let totalVolumeKg = 0;
      let totalReps = 0;
      let totalMinutes = 0;
      let totalCardioCals = 0;

      // Foundational PR accumulators
      const prAcc: Record<string, {
        bestWeight: number; bestReps: number; best1RM: number;
        bestDate: string; bestProgramName: string;
      }> = {};
      for (const m of FOUNDATIONAL_MOVEMENTS) {
        prAcc[m.movement] = { bestWeight: 0, bestReps: 0, best1RM: 0, bestDate: '', bestProgramName: '' };
      }

      // Heatmap: date → count
      const heatmapMap: Record<string, number> = {};

      for (const session of sessions) {
        totalVolumeKg += session.totalVolume;
        totalMinutes += session.durationMinutes ?? 0;
        totalCardioCals += session.cardioLog?.calories ?? 0;
        heatmapMap[session.date] = (heatmapMap[session.date] ?? 0) + 1;

        for (const log of session.exerciseLogs ?? []) {
          const exerciseNameLower = (log.originalName ?? log.name).toLowerCase();

          // Total reps
          for (const set of log.sets) {
            if (set.completed) totalReps += set.reps ?? 0;
          }

          // Foundational PR matching
          for (const m of FOUNDATIONAL_MOVEMENTS) {
            const matches = m.matchTerms.some((t) => exerciseNameLower.includes(t));
            if (!matches) continue;
            const acc = prAcc[m.movement];
            const isCali = m.category === 'calisthenics';

            for (const set of log.sets) {
              if (!set.completed) continue;
              if (isCali) {
                // Calisthenics: track best reps (or seconds for plank)
                if ((set.reps ?? 0) > acc.bestReps) {
                  acc.bestReps = set.reps ?? 0;
                  acc.bestDate = session.date;
                  acc.bestProgramName = session.programName;
                }
              } else {
                if (!set.weight || !set.reps) continue;
                const est1RM = set.reps === 1
                  ? set.weight
                  : set.weight / (1.0278 - 0.0278 * set.reps);
                if (set.weight > acc.bestWeight ||
                    (set.weight === acc.bestWeight && set.reps > acc.bestReps)) {
                  acc.bestWeight = set.weight;
                  acc.bestReps = set.reps;
                  acc.bestDate = session.date;
                  acc.bestProgramName = session.programName;
                }
                if (est1RM > acc.best1RM) acc.best1RM = Math.round(est1RM * 10) / 10;
              }
            }
          }
        }
      }

      // ── Training streak (consecutive weeks with ≥1 session) ──
      const sessionDates = new Set(sessions.map((s) => s.date));
      const msPerWeek = 7 * 24 * 3600 * 1000;
      const now = new Date();
      let currentStreakWeeks = 0;
      let longestStreakWeeks = 0;
      let runStreak = 0;
      // Walk back week by week from current week
      for (let w = 0; w < 200; w++) {
        const weekStart = new Date(now.getTime() - w * msPerWeek);
        const weekEnd   = new Date(now.getTime() - (w - 1) * msPerWeek);
        const weekHit = sessions.some((s) => {
          const d = new Date(s.date);
          return d >= weekStart && d <= weekEnd;
        });
        if (weekHit) {
          runStreak++;
          if (w === 0 || currentStreakWeeks > 0) currentStreakWeeks = runStreak;
        } else {
          if (runStreak > longestStreakWeeks) longestStreakWeeks = runStreak;
          if (w === 0) currentStreakWeeks = 0;
          runStreak = 0;
        }
      }
      if (runStreak > longestStreakWeeks) longestStreakWeeks = runStreak;

      // ── 90-day heatmap ──
      const heatmap = Array.from({ length: 90 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (89 - i));
        const iso = d.toISOString().slice(0, 10);
        return { date: iso, count: heatmapMap[iso] ?? 0 };
      });

      // ── Foundational PRs list ──
      let foundationalPRs: FoundationalPR[] = FOUNDATIONAL_MOVEMENTS
        .filter((m) => prAcc[m.movement].bestReps > 0 || prAcc[m.movement].bestWeight > 0)
        .map((m) => ({
          movement: m.movement,
          matchTerms: m.matchTerms,
          category: m.category,
          ...prAcc[m.movement],
        }));

      // ── Overlay manual PRs ──
      try {
        const manualQ = query(collection(db, 'khetManualPRs'), where('userId', '==', user.uid));
        const manualSnap = await getDocs(manualQ);
        for (const d of manualSnap.docs) {
          const raw = { id: d.id, ...d.data() } as any;
          let mpr = raw as KhetManualPR;
          if (raw.isEncrypted && raw.encryptedPayload && masterKey) {
            try {
              const plain = await decryptData(masterKey, base64ToBuffer(raw.encryptedPayload), new Uint8Array(base64ToBuffer(raw.iv)));
              mpr = { ...raw, ...JSON.parse(plain) };
            } catch { /* use raw */ }
          }
          const existing = foundationalPRs.find((p) => p.movement === mpr.movement);
          if (existing) {
            if (mpr.bestWeight > existing.bestWeight || mpr.bestReps > existing.bestReps) {
              existing.bestWeight = mpr.bestWeight;
              existing.bestReps = mpr.bestReps;
              existing.best1RM = mpr.best1RM;
              existing.bestDate = mpr.date;
              existing.bestProgramName = 'Manual Entry';
              existing.isManual = true;
              existing.manualNotes = mpr.notes;
            }
          } else if (mpr.bestWeight > 0 || mpr.bestReps > 0) {
            // Movement not seen in sessions — add from manual
            const def = FOUNDATIONAL_MOVEMENTS.find((m) => m.movement === mpr.movement);
            if (def) {
              foundationalPRs.push({
                movement: mpr.movement,
                matchTerms: def.matchTerms,
                category: def.category,
                bestWeight: mpr.bestWeight,
                bestReps: mpr.bestReps,
                best1RM: mpr.best1RM,
                bestDate: mpr.date,
                bestProgramName: 'Manual Entry',
                isManual: true,
                manualNotes: mpr.notes,
              });
            }
          }
        }
      } catch { /* manual PR overlay is best-effort */ }

      const firstSession = sessions[0];
      const trainingStartDate = firstSession.date;
      const totalDaysTraining = Math.floor(
        (Date.now() - new Date(trainingStartDate).getTime()) / (24 * 3600 * 1000),
      );

      // ── This-week stats (Mon–Sun) ──
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr   = format(weekEnd,   'yyyy-MM-dd');
      const thisWeekSessions = sessions.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr);
      const weekDayMap: Record<string, number> = {};
      for (const s of thisWeekSessions) weekDayMap[s.date] = (weekDayMap[s.date] ?? 0) + 1;
      const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekStats = {
        sessions: thisWeekSessions.length,
        volumeKg: Math.round(thisWeekSessions.reduce((t, s) => t + s.totalVolume, 0)),
        reps: thisWeekSessions.reduce((t, s) =>
          t + (s.exerciseLogs ?? []).reduce((et, el) =>
            et + el.sets.reduce((st, set) => st + (set.completed ? (set.reps ?? 0) : 0), 0), 0), 0),
        minutes: thisWeekSessions.reduce((t, s) => t + (s.durationMinutes ?? 0), 0),
        cardioCals: Math.round(thisWeekSessions.reduce((t, s) => t + (s.cardioLog?.calories ?? 0), 0)),
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        days: eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d, i) => ({
          date: format(d, 'yyyy-MM-dd'),
          label: DAY_LABELS[i],
          sessions: weekDayMap[format(d, 'yyyy-MM-dd')] ?? 0,
        })),
      };

      return {
        trainingStartDate,
        totalDaysTraining,
        totalSessions: sessions.length,
        totalVolumeKg: Math.round(totalVolumeKg),
        totalReps,
        totalMinutes,
        totalCardioCals: Math.round(totalCardioCals),
        currentStreakWeeks,
        longestStreakWeeks,
        heatmap,
        foundationalPRs,
        weekStats,
      };
    } catch (err) {
      console.error('[Khet] getGlobalStats error:', err);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, masterKey]);

  // ── USER SETTINGS ─────────────────────────────────────────

  const getUserSettings = useCallback(async (): Promise<KhetUserSettings | null> => {
    if (!user) return null;
    try {
      const q = query(collection(db, 'khetSettings'), where('userId', '==', user.uid), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return { userId: user.uid };
      const raw = snap.docs[0].data() as any;
      if (raw.isEncrypted && raw.encryptedPayload && masterKey) {
        try {
          const plain = await decryptData(masterKey, base64ToBuffer(raw.encryptedPayload), new Uint8Array(base64ToBuffer(raw.iv)));
          return { userId: user.uid, ...JSON.parse(plain) };
        } catch { /* fallback to raw */ }
      }
      return { userId: user.uid, bodyWeight: raw.bodyWeight, weightUnit: raw.weightUnit, maintenanceCalories: raw.maintenanceCalories, gymName: raw.gymName };
    } catch (err) {
      console.error('[Khet] getUserSettings error:', err);
      return null;
    }
  }, [user, masterKey]);

  const updateUserSettings = useCallback(async (data: Partial<KhetUserSettings>): Promise<void> => {
    if (!user) return;
    try {
      const q = query(collection(db, 'khetSettings'), where('userId', '==', user.uid), limit(1));
      const snap = await getDocs(q);
      let firestoreDoc: Record<string, unknown>;
      if (masterKey) {
        const { ciphertext, iv } = await encryptData(masterKey, JSON.stringify(data));
        firestoreDoc = { userId: user.uid, encryptedPayload: bufferToBase64(ciphertext), iv: bufferToBase64(iv.buffer as ArrayBuffer), isEncrypted: true };
      } else {
        firestoreDoc = { userId: user.uid, ...data, isEncrypted: false };
      }
      if (snap.empty) {
        await addDoc(collection(db, 'khetSettings'), firestoreDoc);
      } else {
        await updateDoc(snap.docs[0].ref, firestoreDoc);
      }
      // Keep reactive weightUnit in sync
      if (data.weightUnit) setWeightUnit(data.weightUnit);
    } catch (err) {
      console.error('[Khet] updateUserSettings error:', err);
    }
  }, [user, masterKey]);

  // ── MANUAL PRs ─────────────────────────────────────────────

  const getManualPRs = useCallback(async (): Promise<KhetManualPR[]> => {
    if (!user) return [];
    try {
      const q = query(collection(db, 'khetManualPRs'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const results: KhetManualPR[] = [];
      for (const d of snap.docs) {
        const raw = { id: d.id, ...d.data() } as any;
        if (raw.isEncrypted && raw.encryptedPayload && masterKey) {
          try {
            const plain = await decryptData(masterKey, base64ToBuffer(raw.encryptedPayload), new Uint8Array(base64ToBuffer(raw.iv)));
            results.push({ ...raw, ...JSON.parse(plain) });
          } catch {
            results.push(raw as KhetManualPR);
          }
        } else {
          results.push(raw as KhetManualPR);
        }
      }
      return results;
    } catch (err) {
      console.error('[Khet] getManualPRs error:', err);
      return [];
    }
  }, [user, masterKey]);

  const setManualPR = useCallback(async (data: Omit<KhetManualPR, 'id' | 'userId'>): Promise<void> => {
    if (!user) return;
    try {
      const r = data.bestReps;
      const best1RM = r <= 1
        ? data.bestWeight
        : Math.round((data.bestWeight / (1.0278 - 0.0278 * r)) * 10) / 10;
      const payload = { ...data, best1RM };

      // Check if a manual PR for this movement already exists → upsert
      const q = query(
        collection(db, 'khetManualPRs'),
        where('userId', '==', user.uid),
        where('movement', '==', data.movement),
        limit(1),
      );
      const snap = await getDocs(q);

      let firestoreDoc: Record<string, unknown>;
      if (masterKey) {
        const sensitive = { bestWeight: payload.bestWeight, bestReps: payload.bestReps, best1RM: payload.best1RM, date: payload.date, notes: payload.notes ?? null };
        const { ciphertext, iv } = await encryptData(masterKey, JSON.stringify(sensitive));
        firestoreDoc = { userId: user.uid, movement: data.movement, encryptedPayload: bufferToBase64(ciphertext), iv: bufferToBase64(iv.buffer as ArrayBuffer), isEncrypted: true };
      } else {
        firestoreDoc = { userId: user.uid, movement: data.movement, bestWeight: payload.bestWeight, bestReps: payload.bestReps, best1RM: payload.best1RM, date: payload.date, notes: payload.notes ?? null, isEncrypted: false };
      }

      if (snap.empty) {
        await addDoc(collection(db, 'khetManualPRs'), firestoreDoc);
      } else {
        await updateDoc(snap.docs[0].ref, firestoreDoc);
      }
    } catch (err) {
      console.error('[Khet] setManualPR error:', err);
    }
  }, [user, masterKey]);

  const deleteManualPR = useCallback(async (movement: string): Promise<void> => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'khetManualPRs'),
        where('userId', '==', user.uid),
        where('movement', '==', movement),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) await deleteDoc(snap.docs[0].ref);
    } catch (err) {
      console.error('[Khet] deleteManualPR error:', err);
    }
  }, [user]);

  return {
    programs,
    loading,
    addProgram,
    updateProgram,
    deleteProgram,
    saveSession,
    getGhostLogs,
    completeSessionAndSync,
    getProgramProgress,
    getLifetimePRs,
    getGlobalStats,
    getUserSettings,
    updateUserSettings,
    getManualPRs,
    setManualPR,
    deleteManualPR,
    getDiaryEntries,
    weightUnit,
  };
}
