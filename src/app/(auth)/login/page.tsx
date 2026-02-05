"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateMasterKey, deriveWrappingKey, wrapMasterKey, saveWrappedKeyLocally, unwrapKeyFromPhrase, base64ToBuffer } from '@/lib/crypto';
import { bufferToBase64, encryptData, decryptData } from '@/lib/crypto';
import * as bip39 from 'bip39';
import { useAuth } from '@/components/auth-provider'; // Import our custom auth hook
import { DuamatefHead } from '@/components/icons/DuamatefHead';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [ritualComplete, setRitualComplete] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [demoText, setDemoText] = useState('');
  const [demoShadow, setDemoShadow] = useState('');
  const { setMasterKey, masterKey } = useAuth(); // Ensure setMasterKey is in your AuthProvider
  const [demoDecrypted, setDemoDecrypted] = useState('');
  const [showProof, setShowProof] = useState(false);
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { user } = useAuth(); // Get the current user from our context

  // NEW: This useEffect hook will handle redirecting the user if they are already logged in.
  // This makes our navigation logic robust and centralized.
useEffect(() => {
  if (!user) return;

  // 🏛️ THE SUPREME RULE: 
  // If we are in the middle of a signup ritual, the Gatekeeper stays silent.
  if (isSigningUp) return;

  // 🧪 DEMO PHASE: Don't navigate while showing the demo or mnemonic
  if (showDemo || showMnemonic) return;

  // 1. If the Ritual is finished, send them to Istanbul
  if (ritualComplete) {
    router.push('/IstanbulProtocol');
    return;
  }

  // 2. Standard login logic for returning scribes
  if (!isLoading && !displayName) {
    router.push('/');
  }
}, [user, ritualComplete, isLoading, displayName, router, isSigningUp, showDemo, showMnemonic]);
  useEffect(() => {
    const encryptDemo = async () => {
      if (demoText && masterKey) {
        const { ciphertext } = await encryptData(masterKey, demoText);
        setDemoShadow(bufferToBase64(ciphertext));
      } else {
        setDemoShadow('');
      }
    };
    encryptDemo();
  }, [demoText, masterKey]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const generatedMasterKey = await generateMasterKey();

      // 🔑 SHIFT: Save key to global RAM immediately
      setMasterKey(generatedMasterKey);

      const wrappingKey = await deriveWrappingKey(password, salt);
      const wrappedKeyBuffer = await wrapMasterKey(generatedMasterKey, wrappingKey);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        kryptosSalt: bufferToBase64(salt.buffer),
        wrappedMasterKey: bufferToBase64(wrappedKeyBuffer),
        isInitiated: false,
      });
const mnemonic = bip39.generateMnemonic(); // Generates 12 standard words
setWords(mnemonic.split(' '));
      const generateSacredMnemonic = (keyBuffer: ArrayBuffer) => {
  // In a production app, we'd use the 'bip39' library here.
  // For our Forge, we can derive 12 indices from your masterKey's bytes.
  const bytes = new Uint8Array(keyBuffer);
  const sacredLibrary = ["osiris", "thoth", "obelisk", "papyrus", "nile", "scribe", "cedar", "lotus", "falcon", "scarab", "amulet", "temple", "sun", "moon", "star", "desert"]; // ... imagine 2048 words here
  
  // Logic to pick words based on the actual key bits
  // This ensures the words are TIED to the key.
  return Array.from({ length: 12 }, (_, i) => sacredLibrary[bytes[i] % sacredLibrary.length]);
};

      // 🧪 PIVOT: Go to Demo first
      setIsSigningUp(false); // Release the gate so we can proceed through the ritual
      setShowDemo(true);

    } catch (err: any) {
      setError(err.message);
      setIsSigningUp(false);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const signedInUser = userCredential.user;

      // 🔑 RETRIEVE & UNWRAP: Get the wrapped key directly from Firestore using the signed-in user
      const userDoc = await getDoc(doc(db, "users", signedInUser.uid));
      if (!userDoc.exists()) {
        setError("User profile not found. Please sign up first.");
        return;
      }

      const userData = userDoc.data();
      const wrappedMasterKey = userData.wrappedMasterKey;
      const salt = userData.kryptosSalt;

      if (!wrappedMasterKey || !salt) {
        setError("Your encryption keys are corrupted. Please contact support.");
        return;
      }

      // Unwrap the master key using the password
      const unlockedKey = await unwrapKeyFromPhrase(
        password,
        base64ToBuffer(wrappedMasterKey),
        base64ToBuffer(salt)
      );

      // Set the master key in the auth context
      setMasterKey(unlockedKey);
      console.log("✅ Sign-in: Master key successfully unwrapped and loaded.");

    } catch (err: any) {
      console.error("❌ Sign-in error:", err);
      setError(err.message || "Sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100 font-body p-4">

      {/* 1. THE LOGIN / SIGN-UP GATE (Phase 1) */}
      {!showDemo && !showMnemonic && (
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg border border-cyan-500/30 animate-in fade-in duration-500">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-cyan-400 font-display tracking-wider">Thoth's Notebook</h1>
            <p className="text-gray-400">Enter the archives of wisdom</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* ... Scribe's Name Input ... */}
            <div>
              <label className="text-sm font-bold text-gray-400 block">Scribe's Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Sesh of Thoth"
                className="w-full px-4 py-2 mt-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* ... Email Input ... */}
            <div>
              <label className="text-sm font-bold text-gray-400 block">Sacred Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 mt-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* ... Password Input ... */}
            <div>
              <label className="text-sm font-bold text-gray-400 block">Secret Glyphs (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 mt-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400 text-center bg-red-900/30 p-2 rounded-md italic">{error}</p>}

            <div className="flex flex-col space-y-4">
              <button onClick={handleSignUp} disabled={isLoading} className="w-full px-4 py-2 text-lg font-bold text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-300 disabled:bg-gray-600">
                {isLoading ? 'Forging Master Key...' : 'Become a Scribe (Sign Up)'}
              </button>
              <button onClick={handleSignIn} disabled={isLoading} className="w-full px-4 py-2 text-lg font-bold text-cyan-400 border border-cyan-400 rounded-md hover:bg-cyan-400/10">
                Enter the Archive (Sign In)
              </button>
            </div>
          </form>
        </div>
      )}

{showDemo && !showMnemonic && (
  <div className="w-full max-w-xl p-8 space-y-6 bg-gray-800 rounded-2xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] animate-in fade-in zoom-in duration-500">
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-display text-cyan-400 uppercase tracking-widest">The Covenant of Privacy</h2>
      <p className="text-gray-300 text-sm leading-relaxed">
        Thoth's Notebook is <span className="text-cyan-400 font-bold">VERY serious</span> about protecting your privacy. Every task, goal, and secret is encrypted. No administrator, thief, or hacker can read what you entrust to us.
      </p>
    </div>

    <div className="space-y-6 bg-black/40 p-6 rounded-xl border border-gray-700">
      <div className="space-y-2">
        <label className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">1. Enter a secret (Try it out!)</label>
        <input
          type="text"
          placeholder="e.g., My plan to conquer the world"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-400 outline-none transition-all"
          onChange={(e) => {
            setDemoText(e.target.value);
            setShowProof(false); // Reset proof if they change the text
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">2. How the Cloud sees it (The Shadow):</label>
        <div className="p-3 bg-black rounded-lg border border-cyan-900/50 break-all font-mono text-[11px] text-green-500/80 min-h-[60px]">
          {demoShadow || "Waiting for your intent..."}
        </div>
      </div>

      {showProof && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">3. Decrypted using your private key:</label>
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-200 font-medium italic">
            "{demoText}"
          </div>
        </div>
      )}
    </div>

    {!showProof ? (
      <button
        onClick={() => setShowProof(true)}
        disabled={!demoText}
        className="w-full py-3 bg-gray-700 text-cyan-400 border border-cyan-400/50 font-bold rounded-lg hover:bg-cyan-400 hover:text-black transition-all uppercase text-xs tracking-[0.2em]"
      >
        Test your Private Key
      </button>
    ) : (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="p-4 bg-red-900/20 border border-red-900/40 rounded-lg text-center">
          <p className="text-xs text-gray-300">
            A Key was created for you and you alone. <span className="text-white font-bold underline">YOU are responsible for this key!</span> Thoth's Notebook cannot recreate it. You will now be taken to a screen with 12 words - you MUST write these down on a piece of paper. It will be the ONLY way to recover your data if you forget your password.
          </p>
        </div>
        <button
          onClick={() => setShowMnemonic(true)}
          className="w-full py-4 bg-cyan-400 text-black font-black rounded-lg hover:bg-cyan-300 transition-all uppercase text-sm tracking-[0.3em] shadow-lg shadow-cyan-400/20"
        >
          Proceed to recovery options...
        </button>
      </div>
    )}
  </div>
)}

{/* PHASE 3: THE REVELATION (MNEMONIC) */}
{showMnemonic && (
  <div className="w-full max-w-2xl min-h-[80vh] flex flex-col justify-between p-8 bg-black border-2 border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-in fade-in zoom-in duration-700">
    
    {/* TOP: The Header (The Warning) */}
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-display text-amber-500 tracking-[0.3em] uppercase brightness-150">
        The Hall of Records
      </h2>
      <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl">
        <p className="text-gray-300 text-xs italic leading-relaxed">
          "These 12 glyphs are the <span className="text-amber-500 font-bold">Only Key</span> to your archive. They never touch our servers. If you lose them, your secrets remain in the void forever."
        </p>
      </div>
    </div>

    {/* MIDDLE: The Sacred Glyphs (Real BIP-39 Words) */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-8">
      {words.map((word, i) => (
        <div 
          key={i} 
          className="group relative flex items-center justify-between p-4 bg-zinc-900/50 border-2 border-amber-900/40 rounded-xl hover:border-amber-500/60 transition-all duration-300"
        >
          <span className="text-[10px] font-mono text-amber-700/80 font-bold">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-amber-100 font-headline tracking-[0.1em] uppercase text-sm">
            {word}
          </span>
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
        </div>
      ))}
    </div>

    {/* BOTTOM: The Final Commitment */}
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-red-950/20 border border-red-500/30 rounded-2xl">
        <div className="shrink-0">
           <DuamatefHead className="w-12 h-12 text-red-500 brightness-125" />
        </div>
        <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest leading-tight">
          Ma'at requires your witness. Do not screenshot - unless you want to. That's fine. Carve them into stone or paper. After you press the button, you will be taken to the Crypto-Obelisk of Istanbul. Set a PIN there and use the Stash at the top of the vault to give yourself a hint as to the where abouts of your 12 sacred words, such as "In the Family Bible at Micah 6:8"
        </p>
      </div>

      <button
        onClick={() => {
          setRitualComplete(true);
          router.push('/IstanbulProtocol');
        }}
        className="w-full py-5 bg-black text-amber-500 font-headline border-2 border-amber-500 hover:bg-amber-500/20 active:scale-[0.98] transition-all uppercase tracking-[0.4em] text-xs brightness-125 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
      >
        I have committed the words to the physical world
      </button>
    </div>
  </div>
)}
    </div>
  );
}
