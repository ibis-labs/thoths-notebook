import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 🏛️ THE MIDNIGHT SCRIBE: Generates new rituals at 03:00
export const midnightScribe = onSchedule({
  schedule: "every day 03:00",
  timeZone: "America/Los_Angeles",
}, async () => {
  console.log("The Midnight Scribe awakens to prepare the new day.");
  try {
    const usersSnapshot = await db.collection("users").get();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const batch = db.batch();
      const ritualsSnapshot = await db.collection("dailyRituals")
        .where("userId", "==", userId)
        .get();
      if (ritualsSnapshot.empty) continue;
      ritualsSnapshot.forEach((doc) => {
        const ritual = doc.data();
        const newTaskRef = db.collection("tasks").doc();
        batch.set(newTaskRef, {
          userId: userId,
          title: ritual.title,
          category: ritual.category || "Daily Ritual",
          importance: ritual.importance || "medium",
          estimatedTime: ritual.estimatedTime || 15,
          details: ritual.details || "",
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          subtasks: ritual.encryptedSubtasks ?
            [] :
            (ritual.subtasks || []).map((st: any) => ({
              ...st,
              completed: false,
            })),
          encryptedSubtasks: ritual.encryptedSubtasks || null,
          isEncrypted: ritual.isEncrypted || false,
          iv: ritual.iv || null,
          completed: false,
          createdAt: Timestamp.now(),
          dueDate: Timestamp.fromDate(today),
          isRitual: true,
          originRitualId: doc.id,
        });
      });
      await batch.commit();
      console.log(`Rituals prepared for Scribe ${userId}.`);
    }
    console.log("The Temple is prepared for the morning light.");
  } catch (error) {
    console.error("The Midnight Scribe was interrupted:", error);
  }
});

// 🏺 THE AUTOMATED CHRONICLE: Seals and Resets at 02:30
export const automatedChronicle = onSchedule({
  schedule: "every day 02:30",
  timeZone: "America/Los_Angeles",
}, async () => {
  console.log("The Automated Evening Chronicle begins.");
  const tasksRef = db.collection("tasks");
  const chroniclesRef = db.collection("chronicles");
  const usersRef = db.collection("users");
  try {
    const usersSnapshot = await usersRef.get();
    const ritualDate = new Date();
    ritualDate.setDate(ritualDate.getDate() - 1);
    const dateString = ritualDate.toISOString().split("T")[0];
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const batch = db.batch();
      const existingChronicle = await chroniclesRef
        .where("userId", "==", userId)
        .where("date", "==", dateString)
        .get();
      const alreadySealed = !existingChronicle.empty;
      const tasksSnapshot = await tasksRef.where("userId", "==", userId).get();
      const completedTitles: string[] = [];
      const incompleteRitualTitles: string[] = [];
      const tasksToDelete: admin.firestore.DocumentReference[] = [];
      tasksSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.completed) {
          completedTitles.push(data.title);
          tasksToDelete.push(doc.ref);
        } else if (data.category === "Daily Ritual" || data.isRitual) {
          incompleteRitualTitles.push(data.title);
          tasksToDelete.push(doc.ref);
        }
      });
      const maAtCreated = alreadySealed || completedTitles.length > 0;
      let newStreak = userData.stats?.currentStreak || 0;
      const oldHist = userData.stats?.history10Day || [0, 0, 0, 0, 0, 0,
        0, 0, 0, 0];
      const history = [...oldHist];
      if (maAtCreated) {
        newStreak += 1;
        history.push(1);
      } else {
        newStreak = 0;
        history.push(0);
      }
      const finalHistory = history.slice(-10);
      const maxStreak = Math.max(newStreak, userData.stats?.maxStreak || 0);
      batch.update(userDoc.ref, {
        "stats.currentStreak": newStreak,
        "stats.maxStreak": maxStreak,
        "stats.history10Day": finalHistory,
        "stats.lastResetDate": dateString,
      });
      if (!alreadySealed) {
        const archiveRef = chroniclesRef.doc();
        batch.set(archiveRef, {
          userId,
          createdAt: Timestamp.now(),
          date: dateString,
          victoriesLog: completedTitles,
          retainedNunLog: incompleteRitualTitles,
          winsNote: "Sealed by the Midnight Scribe (Automated Reset)",
          shadowWorkNote: "Recorded by the Proxy Scribe in the night.",
          tomorrowQuest: "Act with intention - Midnight Scribe",
          type: "automated-seal",
          streakAtSeal: newStreak,
        });
      }
      tasksToDelete.forEach((ref) => batch.delete(ref));
      await batch.commit();
      console.log(`User ${userId} sealed for ${dateString}.`);
    }
  } catch (error) {
    console.error("The Chronicle was interrupted by chaos:", error);
  }
});

// 🏺 THE RITE OF UNIVERSAL POTTERY (Temporary Migration)
export const universalKhnumMigration = onSchedule({
  schedule: "every day 23:00", // Set to run once soon, or trigger manually
  timeZone: "America/Los_Angeles",
}, async () => {
  console.log("🏺 Khnum reaches out to touch every ritual in the Empire...");
  try {
    const ritualsSnapshot = await db.collection("dailyRituals").get();
    const tasksSnapshot = await db.collection("tasks").where("isRitual",
      "==", true).get();
    const batch = db.batch();
    const INITIAL_STREAK_DATA = {
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      history10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      lastUpdated: "",
    };
    let count = 0;

    // 1. Touch every Ritual Template
    ritualsSnapshot.docs.forEach((doc) => {
      if (!doc.data().streakData) {
        batch.update(doc.ref, {streakData: INITIAL_STREAK_DATA});
        count++;
      }
    });
    // 2. Touch every Ritual Task Instance
    tasksSnapshot.docs.forEach((doc) => {
      if (!doc.data().streakData) {
        batch.update(doc.ref, {streakData: INITIAL_STREAK_DATA});
        count++;
      }
    });
    await batch.commit();
    console.log(`✅ Success! ${count} vessels have been fashioned by Khnum.`);
  } catch (error) {
    console.error("❌ The Potter's wheel broke:", error);
  }
});
