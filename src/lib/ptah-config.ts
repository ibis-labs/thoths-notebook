export const PTAH_CONFIG = {
  version: "2.1.1", // Iphty Link — The Cipher of Twin Flames
  title: "IPHTY LINK — THE CIPHER OF TWIN FLAMES",
  date: "April 05, 2026 A.D. — Year 5526 of the Old Kingdom",
  type: "MAJOR_FEATURE",

  intro: "The Temple has opened a new gate — one that connects Scribes across the void. Iphty Link is a scribe-to-scribe encrypted messaging system built into the heart of the Temple. Two scribes may now exchange a secret invitation code — forged here, shared out-of-band — and upon redemption, a private end-to-end encrypted channel is established instantly. Every transmission is sealed with ECDH P-256 key exchange and AES-GCM-256 encryption. The shared cipher key is computed independently by each scribe using the mathematics of elliptic curves — it is never written, never transmitted, never stored. What passes between scribes cannot be read by any other, not even the Temple itself. The node blinks when a new transmission awaits.",

  changes: [
    {
      icon: "Radio",
      title: "Iphty Link — Scribe-to-Scribe Encrypted Channels",
      description: "A complete encrypted messaging system between any two authenticated Scribes. Channels are opened via one-time invitation codes (format XXXX-XXXX, forged from a cryptographically random alphabet that eliminates ambiguous characters). Each code is valid for 24 hours and consumed on first redemption — it cannot be reused. Once redeemed, the channel is immediately active; there is no accept/reject step because the act of sharing the code out-of-band IS the consent. The channel persists until either scribe chooses to close it."
    },
    {
      icon: "ECDH",
      title: "ECDH P-256 Key Exchange — The Twin-Flame Cipher",
      description: "Each Scribe holds an ECDH P-256 key pair generated once on first vault unlock. The public key is stored openly in Firestore. The private key is wrapped (AES-GCM) under the Scribe's existing master vault key and stored encrypted — it is never accessible without the recovery phrase. When two Scribes link, each independently runs ECDH derivation using their own private key and the other's public key, arriving at the same 256-bit AES-GCM shared secret without it ever crossing the network. This is the mathematics of elliptic-curve Diffie-Hellman: the secret is computed, never transmitted."
    },
    {
      icon: "Invitation",
      title: "Invitation Code System — No Public Registry",
      description: "There is no searchable scribe directory. Privacy is protected by design: a channel can only be opened if one Scribe physically shares their invitation code with the other through a channel of their own choosing (message, email, in person). This is the social layer of the cipher — the code is proof of intent. Codes are stored in the iphtyInvitations Firestore collection under their own document ID (the code itself), consumed on redemption, and covered by security rules that prevent any unauthenticated access."
    },
    {
      icon: "NodePulse",
      title: "Custom Iphty Link Icon — The Blinking Node",
      description: "A custom icon drawn in Inkscape (iphty-link-icon.svg) depicts a transmission bar with two antennas, a circuit trace, and a small circle node. This icon appears in the sidebar navigation and on the Iphty Link page header. The node circle uses the iphty-node-active CSS animation — a fuchsia glow that fades from full brightness to near-invisible and back every 1.8 seconds — whenever an unread message is waiting. Unread state is computed by comparing the lastMessageAt timestamp on each link document against a localStorage timestamp that is updated each time the Scribe opens that channel."
    },
    {
      icon: "Security",
      title: "Firestore Security Rules — Zero Privilege Escalation",
      description: "iphtyInvitations: any authenticated user can read (to redeem) and the owner can create/delete. iphtyLinks: both participants (stored as a sorted participants array) can read/update/delete; the messages sub-collection requires active status and validates senderId against auth.uid. No public scribe registry exists. No user can read another scribe's private Firestore user document. The ECDH private key is wrapped under a key that exists only in the user's vault — it cannot be recovered by anyone who does not know the recovery phrase."
    },
  ],

  instructions: [
    "1. UNLOCK YOUR VAULT: Iphty Link requires your vault to be unlocked. Open Archives and enter your recovery phrase if the amber 'Vault Required' banner appears.",
    "2. GENERATE A CODE: In the Iphty Link page, tap 'Generate Code'. A XXXX-XXXX invitation code appears. Copy it and share it privately with the Scribe you wish to link with — by any means you choose.",
    "3. REDEEM A CODE: If another Scribe has shared their code with you, tap 'Enter Code', type or paste the code, and tap 'Initiate Link'. The channel opens immediately.",
    "4. TRANSMIT: Select an active channel from the left panel and type into the transmission field. Press Enter or the send button. Your message is encrypted before it leaves your device.",
    "5. WATCH THE NODE: The Iphty Link icon in the sidebar has a small circle — the node. When it blinks fuchsia, a new transmission has arrived in one of your channels.",
    "6. CONTACT THE TEMPLE: Prayers, inquiries, and reports of peculiarities to: rites@unclepetelaboratories.net"
  ],

  devNote: "v2.1.1 introduces the first multi-user feature in the Temple. The cryptographic foundation (src/lib/iphty-crypto.ts) implements ECDH P-256 key generation, JWK export/import for the public key, AES-GCM wrapping of the private key under the existing master vault key, and shared key derivation. The invitation system avoids any public user registry — iphtyInvitations documents use the code itself as the doc ID for O(1) lookup. The useIphtyNodeActive sidebar hook opens a Firestore snapshot that compares lastMessageAt on each active link against localStorage timestamps set by openConversation(), producing a zero-overhead real-time unread indicator. The custom Inkscape SVG is reconstructed as a React component (IphtyLinkIcon.tsx) with a nodeActive prop that applies the iphty-node-active CSS keyframe directly to the node path element — not a wrapper div — so the glow emanates from the correct point in the icon geometry. The SidebarMenuButton CVA class applies [&>svg]:size-4 to all direct SVG children, so the icon is wrapped in a span to bypass that constraint."
};
