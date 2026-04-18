export const PTAH_CONFIG = {
  version: "2.2.1", // Khet-Station — The Mass Displacement Engine
  title: "KHET-STATION — THE MASS DISPLACEMENT ENGINE",
  date: "April 17, 2026 A.D. — Year 5526 of the Old Kingdom",
  type: "MAJOR_FEATURE",

  intro: "The Temple has forged a new altar — one dedicated entirely to the physical form. Khet-Station is a complete, encrypted, end-to-end workout tracking system built into the heart of Thoth's Notebook. Scribes may now architect multi-day training programs, log every set and rep against a bank of 66 exercises, review their entire lifting history through the Akashic Record, track cardio alongside their iron sessions, and watch their progress accumulate in the Gainz Panel — complete with a 90-day training heatmap, lifetime volume totals, and an auto-detected Hall of PRs for the foundational movements. Every session is sealed under AES-GCM encryption. When the workout is complete, the Temple stamps a finished task onto the main hall scroll. In the ancient tongue, Khet is the physical body. Now the Temple honours it.",

  changes: [
    {
      icon: "Dumbbell",
      title: "Program Wizard — Architect Your Training",
      description: "A three-step wizard (Foundation → Architect → Link) guides you through building a fully customised workout program. Choose a name, a training split (Push/Pull/Legs, Upper/Lower, or Full Body), and your weekly frequency. The Temple auto-generates intelligent day templates pre-loaded with classic exercise selections for each day type. In the Architect step you customise every exercise: sets, goal-rep range, and order. Exercises can be drag-reordered, replaced from the 66-exercise bank, or removed entirely. In the Link step the program can be wired to an existing Task or Daily Ritual so that completing your workout automatically ticks off that commitment in the main hall (Ma'at Sync). Each program also stores a duration-in-weeks and a chosen deload strategy for automatic periodisation. Programs can be fully edited after creation."
    },
    {
      icon: "Scroll",
      title: "66-Exercise Bank — Six Muscle Groups",
      description: "Khet-Station ships with a curated bank of 66 exercises spanning Legs (16), Back (14), Chest (12), Arms (9), Shoulders (9), and Core (6). Every exercise carries its primary muscle list, equipment tags, and a hand-curated list of equivalents — the foundation for the Substitution Engine. The bank is loaded from /public/docs/exercises.json and is fully extensible: adding a new JSON entry immediately makes it available in both the Program Wizard and the mid-session Substitution Engine without any code changes."
    },
    {
      icon: "Activity",
      title: "Session Tracker — Log the Work",
      description: "Each training session opens on its program day at /khet/session/[programId]/[dayIndex]. Every exercise displays its programmed sets as individual rows — each row records weight, reps, and an optional RPE rating. Sets are checked off as you complete them. You can add or remove sets at will, expand a per-exercise notes field, or tap the swap icon to invoke the Substitution Engine mid-session. An optional Cardio Tracker (6 types: Stairs, Treadmill, Row, Elliptical, Cycling, Other) records duration, distance, and calories. A session-level notes field sits below. Total session volume (weight × reps across all completed sets) calculates live. Duration is measured from the moment the session opens to the instant it is sealed."
    },
    {
      icon: "History",
      title: "Akashic Record — Ghost Logs & Progressive Overload",
      description: "Every exercise row shows its own ghost log — the weight, reps, and RPE from up to three previous sessions — displayed directly beneath the live set inputs. This eliminates the need to remember what you lifted last week: the record is right there. A full-day ghost panel above the session lists the complete exercise-by-exercise breakdown of every previous run of this day, expandable on tap. Ghost data is fetched once on session load (never re-queried) and seeded into the context so the opening weight fields auto-fill from the most recent session."
    },
    {
      icon: "Snowflake",
      title: "Deload System — Four Strategies, Automatic Periodisation",
      description: "Every program carries a duration (in weeks) and a deload strategy. When the final week of a program cycle is reached, a Deload Week is automatically activated. Four strategies are supported: Reduce Volume (auto-caps each exercise to 1–2 sets, preserving intensity — the recommended default); Reduce Intensity (auto-applies 60% weight to all programmed sets on session open); Reduce Reps (halves the rep count while preserving load); and Reduce Frequency (informational — take fewer sessions this week). A deload banner appears on the dashboard card and within the session itself with strategy-specific guidance. On completion of the final deload session, a 'System Recharge Complete' toast celebrates the athlete's recovery before routing back to the dashboard."
    },
    {
      icon: "ArrowLeftRight",
      title: "Substitution Engine — Swap Any Exercise Mid-Session",
      description: "Tapping the swap icon on any exercise row opens the Substitution Engine — a searchable bottom sheet that presents equivalent exercises first (curated per exercise in the database), followed by the full 66-exercise bank. Search queries filter by name, muscle group, or category simultaneously. Selecting a substitute instantly replaces the exercise in the session context and wires the ghost-log lookup to the new exercise ID, so historical data (if it exists) appears immediately."
    },
    {
      icon: "BarChart2",
      title: "Gainz Panel — Lifetime Statistics",
      description: "The Gainz button on the dashboard opens a full-screen stats sheet computed from the Scribe's entire session history. Headline stats: total sessions, lifetime volume (in the user's chosen weight unit), total reps logged, total training minutes, and total cardio calories burned. Streak tracking covers current and longest consecutive-week streaks. A 90-day GitHub-style training heatmap renders in pure SVG — no external chart dependencies — colour-coded by session density. The Hall of PRs auto-detects personal bests for nine foundational movements (Bench Press, Back Squat, Deadlift, Overhead Press, Barbell Row, Pull-ups/Chin-ups, Dips, Push-ups, Plank) by scanning every logged session, computing Brzycki estimated 1RMs, and surfacing the best date and program. PRs can also be entered manually (with optional notes), and those entries are encrypted at rest."
    },
    {
      icon: "User",
      title: "Athlete Profile — Body Stats & Unit Preferences",
      description: "The Athlete Profile panel stores the Scribe's body weight, daily maintenance calories, gym name, and preferred weight unit (lbs or kg). The unit preference propagates through every session input field, the Gainz Panel, and all PR displays — no manual conversion required. Settings persist in the khetSettings Firestore collection under the user's UID and are loaded once on hook initialisation."
    },
    {
      icon: "TrendingUp",
      title: "Progress Panel — Per-Program Analytics & Exercise PRs",
      description: "Each program card on the dashboard links to a Progress Panel showing volume trend history visualised as a pure-SVG sparkline, session count, total and average volume, and first-to-last session date range. A second tab breaks down per-exercise personal records across all sessions for that program, with expandable history rows for each movement."
    },
    {
      icon: "MaatSync",
      title: "Ma'at Sync — Workouts Become Tasks",
      description: "Khet-Station is fully wired into the Temple's task system. Three sync paths exist: (1) If the program is linked to a one-off Task, completing the session marks that task as done. (2) If linked to a Daily Ritual, today's ritual instance is automatically completed. (3) Every session — linked or not — stamps an already-completed task onto the main hall scroll with the title '<Program Name> — <Day Label>' (e.g. 'Strength Block A — Upper A'), categorised as Khet, so the workout appears in the Evening Chronicle's Ma'at list. All three paths are encrypted when a master key is active. The stamped task carries a khetProgramId field for future cross-linking."
    },
    {
      icon: "Lock",
      title: "AES-GCM Encryption — Sessions Sealed at Rest",
      description: "Every workout session is encrypted before it is written to Firestore. The entire exercise log, cardio log, and notes are serialised, sealed under AES-GCM using the user's master vault key, and stored as a single encryptedPayload with a random IV. Sessions are decrypted on-the-fly in the hook layer. Manual PRs follow the same pattern. The Gainz Panel and ghost-log queries read only the plaintext metadata fields (date, totalVolume, completed) without needing to decrypt the full payload — zero key-gating on read-only analytics."
    },
  ],

  instructions: [
    "1. UNLOCK YOUR VAULT: Khet-Station encrypts your sessions. Open Archives and enter your recovery phrase before your first session, or any time the amber 'Vault Required' banner appears.",
    "2. CREATE A PROGRAM: Navigate to the Khet-Station dashboard (sidebar → Khet-Station). Tap 'New Program'. Choose a name, training split, and frequency. The Temple pre-fills intelligent exercise templates — customise them freely in the Architect step.",
    "3. LOG A SESSION: From the dashboard, tap any day tab on a program card to open that day's session. Enter weight and reps for each set and tap the checkbox when the set is done. Use the swap icon to substitute any exercise mid-session. Toggle Cardio at the bottom to record cardio work.",
    "4. SEAL THE SESSION: Once at least one set is completed, the 'Workout Complete — Gold State' button activates. Tap it to seal the session. Your stats update instantly, the Akashic Record is written, and a completed task appears on your main hall scroll.",
    "5. REVIEW YOUR GAINZ: Tap the 'Gainz' button on the dashboard to open the lifetime stats sheet. Review your Hall of PRs, training heatmap, and volume trends. Enter manual PRs for lifts done before Khet-Station if you wish to seed your history.",
    "6. SET YOUR ATHLETE PROFILE: Tap 'Athlete Profile' to set your body weight, maintenance calories, gym name, and preferred weight unit (lbs or kg). This unit applies everywhere in the app.",
    "7. CONTACT THE TEMPLE: Prayers, inquiries, and reports of peculiarities to: rites@unclepetelaboratories.net"
  ],

  devNote: "v2.2.1 adds the entire Khet-Station subsystem. Key files: src/lib/khet-types.ts (all type definitions, FOUNDATIONAL_MOVEMENTS, exercise interfaces), src/hooks/use-khet.ts (unified hook: program CRUD, session write/read with AES-GCM encryption, ghost log queries, global stats computation, foundational PR engine, manual PR CRUD, user settings, Ma'at Sync, workout-task stamping), src/components/khet/ (khet-dashboard, khet-context, program-wizard, exercise-row, cardio-tracker, ghost-log, substitution-engine, volume-dashboard, progress-panel, gainz-panel, user-stats-panel), src/app/khet/ (layout, redirect page, dashboard page, program page, session/[programId]/[dayIndex] page). The session context (khet-context.tsx) uses useReducer so all set-level mutations are deterministic and testable. Ghost-log data is fetched once at the outer shell, passed down as a prop, and seeded into context initialState — no extra Firestore reads during the session. Volume computation is derived from context state on every render with no memoisation overhead. The Gainz Panel computes all stats client-side from a single getDocs query (no aggregation pipeline) using a single pass through the session array. Deload activation is written to the program document (isDeloading, lastDeloadStart, lastDeloadEnd) so the state survives page reloads. The exercise bank lives at /public/docs/exercises.json — 66 exercises, no npm dependency required. Firestore collections added: khetPrograms, khetSessions, khetSettings, khetManualPRs (all owner-only security rules, indexes deployed)."
};
