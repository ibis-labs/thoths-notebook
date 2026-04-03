export const PTAH_CONFIG = {
  version: "1.5.0", // The Ostraca Initiation
  title: "THE OSTRACA — SHARDS OF INFINITE RECORD",
  date: "April 03, 2026 A.D. - Year 5526 of the Old Kingdom",
  type: "KNOWLEDGE_INSCRIPTION",

  intro: "A new chamber has been unsealed within the Temple. The Ostraca — named for the ancient pottery shards upon which Egyptian scribes cast their most urgent and ephemeral thoughts — is now yours to wield. Inscribe tiles of knowledge, seal them in colour-coded collections, and lock your most sacred records behind a Vault of your own devising. The Permanent Scratchpad, the Ephemera, awaits your first inscription.",

  // The "What's New" Section
  changes: [
    {
      icon: "Ostracon",
      title: "The Ostraca Chamber",
      description: "Navigate to the Ostraca in the sidebar. Here you may create Collections — named, colour-coded groupings (Amber, Cyan, Rose, Emerald, or Purple) — and fill them with Ostracon tiles: encrypted notes, scribe thought-fragments, and living checklists.",
    },
    {
      icon: "Lock",
      title: "The Vault — PIN-Sealed Collection",
      description: "When creating a Collection, you may designate it a Vault. Vault tiles are encrypted with your Master Key and the Collection itself is sealed behind a 4-digit PIN of your choosing. Your PIN is never stored — only its shadow remains in the temple records.",
    },
    {
      icon: "Scroll",
      title: "Ephemera — The Permanent Scratchpad",
      description: "Every Scribe is granted an Ephemera: a single, permanent shard that exists outside all collections. It holds a freeform scratchpad and a living checklist — open, edit, and close it from the top of the Ostraca page at any time.",
    },
    {
      icon: "CheckSquare",
      title: "Living Checklists on Every Tile",
      description: "Any Ostracon tile — vault or standard — may carry a checklist. Items can be toggled directly on the tile card without opening the editor. Progress is saved to the Temple in real time.",
    },
  ],

  // The "How to Use" Section
  instructions: [
    "1. ENTER THE OSTRACA: Tap the Ostraca glyph in the sidebar to open the new chamber.",
    "2. CREATE A COLLECTION: Tap the '+' icon to name your collection, choose a colour, and decide whether it requires a Vault PIN.",
    "3. INSCRIBE A TILE: Select a collection tab, then tap '+' to open the Tile dialog. Give your shard a title, scribe your notes, and optionally add a checklist.",
    "4. UNLOCK THE VAULT: If you created a Vault Collection, tap 'Unlock Vault' when prompted. On first access, you will inscribe a new 4-digit seal; on subsequent visits, enter your seal to reveal its contents.",
    "5. USE THE EPHEMERA: Tap the Ephemera card at the top of the page to open your personal scratchpad. Your notes and checklist there are permanent and always accessible.",
    "6. CONTACT THE TEMPLE: Prayers, inquiries, and reports of peculiarities to: rites@unclepetelaboratories.net"
  ],

  devNote: "The Ostraca required a dual-hook architecture: useOstraca (full CRUD + encryption + ephemera seed logic) and useOstracaCollections (a lightweight read-only listener safe for dialog contexts). All Vault tile content is encrypted client-side using AES-GCM with the user's masterKey before it reaches Firestore. The Vault PIN is hashed with SHA-256 and never stored in plaintext. Colour theming is expressed as a discriminated union across five named colours, each carrying its own border, shadow, badge, label, and divider tokens. The OstraconIconLarge is a hand-traced SVG — a genuine fragment of the ancient record, rendered in circuit light. Let all things be inscribed upon the shard. The Temple does not forget."
};