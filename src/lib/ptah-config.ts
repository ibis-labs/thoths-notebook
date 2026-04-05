export const PTAH_CONFIG = {
  version: "2.0.0", // The Neheh-Circuit — The Incentives Epoch
  title: "THE NEHEH-CIRCUIT — SHEN RING OF COMMITMENT",
  date: "April 04, 2026 A.D. — Year 5526 of the Old Kingdom",
  type: "MAJOR_EPOCH_TRANSITION",

  intro: "The Temple has crossed a threshold. What began as a record-keeping instrument has been transfigured into a living system of devotion, rank, and reward. The Neheh-Circuit — the Eternal Loop of the Shen Ring — now pulses at the heart of the Temple, tracking the sacred chain of daily Oaths and elevating the committed Scribe through twelve tiers of distinction across 360 consecrated days. You are no longer merely a keeper of records. You are a Seeker ascending through circuit-light toward the Transcendent.",

  changes: [
    {
      icon: "ShenRing",
      title: "The Neheh-Circuit — Shen Ring of Commitment",
      description: "A complete 360-day incentive platform built from first principles. Complete the daily Oath of Commitment consecutively to advance through twelve major rank boundaries across six tiers: Hour (Days 1–11), Nightwatch (12–30), Hidden (31–70), Seasonal (71–120), Longcount (121–360), and Transcendent (360). Each tier carries its own colour, its own glyph, and its own gravity. The Shen Ring — an interactive SVG drawn by hand in Inkscape and reconstructed in circuit-light — displays your live position: ten decan indicators pulse green for active days, the iris glows with seven accumulated-wisdom markers, and a separate outer arc records the higher mysteries. Decay logic applies: every ten consecutive missed days costs one major boundary. A Stone Tablet Floor at Day 70 is granted once the Seasonal tier is first reached — you cannot fall below it."
    },
    {
      icon: "StreakCelebration",
      title: "Oath Streak Tracking — The Chain of Days",
      description: "The Evening Chronicle now captures and celebrates your Oath of Commitment streak alongside all ritual streaks. Consecutive days are tracked, best streaks are preserved, and the post-seal StreakCelebration renders a dedicated amber Oath card showing days accumulated. The underlying data — oathCurrentStreak, oathBestStreak, lastOathDate, oathRankDay — lives in Firestore and is updated atomically each morning."
    },
    {
      icon: "Promotion",
      title: "Rank Promotion Notifications — The Rite of Elevation",
      description: "When the Oath advances you through a major rank boundary, a full-width promotion banner appears at the top of the Temple — styled in the tier's accent colour, bordered in silver and circuit-light, pulsing with the colours of your new station. Accepting inscribes a Special Mission task into your task list: a scroll bearing your new rank title, the date of achievement, your circuit day, and the specific mission that accompanies that rank. The task card adopts the tier's exact accent colour as its border and shadow — so a Longcount promotion glows cyan, a Seasonal promotion glows purple, a Transcendent promotion blazes white."
    },
    {
      icon: "GlobalBanners",
      title: "Banner Priority System — No Conflict, No Freeze",
      description: "The Gift of Ptah and Promotion banners now share a GlobalBanners priority context. When a Promotion is pending, the Gift of Ptah defers silently. When the Promotion is accepted, the Gift of Ptah banner may emerge if an update also awaits. The two rituals can never stack, overlap, or race against each other. The Temple speaks with one voice at a time."
    },
    {
      icon: "ShenRingInkscape",
      title: "Hand-Drawn SVG Integration — The Living Glyph",
      description: "The Shen Ring is not a stock icon. It was drawn by hand in Inkscape: two outer orbital rings, an iris with twelve hieroglyph-detail paths, an ankh-circuit glyph at the base, a decan bar with ten tick slots, and thirty-six ribs that animate in a harp-like arpeggio sweep. All 89 named paths were extracted from the Inkscape SVG by a dedicated extraction script (scripts/extract-svg-paths.js) and stored in src/data/NehehCircuitSVGData.json. The component properly maps the two coordinate spaces — structural paths in SVG mm units, indicator paths in Inkscape px units — using the exact 1:3.7795 conversion factor. Glow filters are tuned separately for mm-space and px-space elements."
    },
    {
      icon: "StreakBugFix",
      title: "Streak Integrity Fix — The Chronicle Cannot Lie",
      description: "A critical bug was found and sealed: the automatedChronicle Cloud Function was unconditionally resetting all ritual streaks to zero when it ran after a manual evening seal had already occurred. The fix guards the per-ritual streak update behind alreadySealed — so automated and manual paths now produce identical, consistent results. A secondary double-count was also corrected in the Evening Chronicle's post-commit celebration, which was reading fresh Firestore data instead of reusing the pre-commit snapshot, causing streak values to appear one higher than truth."
    },
  ],

  instructions: [
    "1. SEAL YOUR OATH: Tap the Oath of Commitment each morning in the ritual card. Consecutive completions build your Neheh-Circuit rank day.",
    "2. WATCH THE SHEN RING: Navigate to the Scribe's Dossier (tap your avatar in the sidebar) to see your live circuit position, tier, next milestone, and decay warnings.",
    "3. ACCEPT PROMOTIONS: When a rank promotion banner appears at the top of the Temple, read your new rank and accept. A Special Mission scroll will be inscribed in your task list with your promotion details and mission.",
    "4. FIND YOUR MISSIONS: Open the task list and filter for 'Special Missions'. Promotion tasks are bordered in your tier's accent colour.",
    "5. GUARD THE CHAIN: The Stone Tablet Floor is granted at Day 70. Reach the Seasonal tier and you can never fall below that floor — but the higher mysteries above it require sustained devotion.",
    "6. CONTACT THE TEMPLE: Prayers, inquiries, and reports of peculiarities to: rites@unclepetelaboratories.net"
  ],

  devNote: "v2.0.0 marks the transition from a task/ritual manager into a full incentives platform. The Neheh-Circuit required: a complete rank engine (src/lib/neheh-circuit.ts, ~360 day mappings, decay logic, Stone Tablet Floor), a Firestore schema extension (oathRankDay, oathCurrentStreak, oathBestStreak, lastOathDate, pendingPromotion on the user doc; accentColor on tasks), a hand-traced SVG rebuilt in React with dual coordinate-space rendering, a GlobalBanners priority context to prevent banner conflicts, and a comprehensive promotion flow from OathGate trigger → Firestore write → banner notification → Special Mission task creation. The Rule of Ptah is satisfied: the system rewards the devotion it demands. The circuit is live. Let it run."
};
