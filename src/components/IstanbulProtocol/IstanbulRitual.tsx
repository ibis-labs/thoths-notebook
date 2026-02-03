"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Obelisk } from '@/components/IstanbulProtocol/Obelisk';
import { HeroGlyphs } from '@/components/IstanbulProtocol/HeroGlyphs';
import { VariousGlyphs } from '@/components/IstanbulProtocol/VariousGlyphs';
import { Pedestal } from '@/components/IstanbulProtocol/Pedestal';
import { Keypad } from '@/components/IstanbulProtocol/Keypad';
import { db, auth } from '@/lib/firebase'; // Adjust this path to your firebase config
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { X } from 'lucide-react'; // For the exit button

export default function IstanbulRitual({ onRitualComplete }: { onRitualComplete?: () => void }) {
    const [stage, setStage] = useState('summit');
    const [knockCount, setKnockCount] = useState(0);
    const [isMigrating, setIsMigrating] = useState(false);

    // --- NEW: KRYPTOS & STASH STATE ---
    const [inputCode, setInputCode] = useState<number[]>([]);
    const [isStashOpen, setIsStashOpen] = useState(false);
    const MASTER_KEY = "1234"; // Your encryption seed/trigger

    const maatX = 42.5;

    const views = {
        summit: "07 0 40 40",
        landing: "07 235 40 40",
        anchored: "-10 235 65 65",
        totality: "-25 0 100 300",
        panelZoom: "17.5 255 20 20"
    };

    const RITUAL_TIMINGS = {
        settle: 1000,
        descent: 1,
        anchor: 1,
        totality: 5,
        keypad: 10
    };

    const handleKnock = () => {
        if (stage === 'totality' && knockCount < 3) {
            setKnockCount(prev => prev + 1);
        }
    };

    // --- NEW: KEYPAD INTERACTION ---
    // 1. Add a state to track if a PIN has been established
    // --- KEYPAD INTERACTION ---
    const [savedPin, setSavedPin] = useState<string | null>(null);
    const [isSettingPin, setIsSettingPin] = useState(true);
    const [tempPin, setTempPin] = useState<string | null>(null); // For the 'Re-enter' step

    const handleKeyTap = (num: number) => {
    if (!isMigrating || isStashOpen) return;

    const newCode = [...inputCode, num].slice(-4);
    setInputCode(newCode);

    if (newCode.length === 4) {
        const attemptedPinRaw = newCode.join(''); // "7890", "1122", etc.
        
        // Create the "Fingerprint" of that PIN
        const attemptedHash = CryptoJS.SHA256(attemptedPinRaw).toString();

        if (isSettingPin) {
            if (!tempPin) {
                // PHASE 1: Store the hash of the first attempt
                setTempPin(attemptedHash); 
                setInputCode([]);
            } else {
                // PHASE 2: Compare the hash of the second attempt
                if (attemptedHash === tempPin) {
                    setSavedPin(attemptedHash); // This is what goes to Firestore
                    setIsSettingPin(false);
                    setTempPin(null);
                    setInputCode([]);
                    
                    // Anchor it to the Cloud
                    savePinToFirestore(attemptedHash);
                } else {
                    // Mismatch - reset the ritual
                    setTempPin(null);
                    setInputCode([]);
                }
            }
        } else {
            // PHASE 3: UNLOCK. Compare current input's hash to the stored hash.
            if (attemptedHash === savedPin) {
                setIsStashOpen(true);
            } else {
                setInputCode([]); 
                console.log("Kryptos Mismatch.");
            }
        }
    }
};
    // Inside your IstanbulRitual component
const [stashes, setStashes] = useState([
  { 
    id: 'recovery', 
    label: 'ACCOUNT RECOVERY STASH', 
    content: '', 
    placeholder: 'Location of the 12 words (e.g., Hidden in my copy of the Book of the Dead, page 364)',
    isLocked: false 
  },
  { id: 'stash-2', label: 'STASH_ALPHA', content: '', placeholder: 'Enter secret data...', isLocked: true },
  { id: 'stash-3', label: 'STASH_BETA', content: '', placeholder: 'Enter secret data...', isLocked: true },
  { id: 'stash-4', label: 'STASH_GAMMA', content: '', placeholder: 'Enter secret data...', isLocked: true },
]);

const [activeStashId, setActiveStashId] = useState<string | null>(null);

    const getHeroColor = () => {
        if (knockCount === 0) return "#00FFFF";
        if (knockCount === 1) return "#6a0dad";
        if (knockCount === 2) return "#a020f0";
        return "#00ff41";
    };

    const getPanelOpacity = () => knockCount * 0.33;
   
const [isEncrypting, setIsEncrypting] = useState(false);
const handleEncryptAndSave = async () => {
  if (!userId || !savedPin) return;
  setIsEncrypting(true); 

  try {
    const encryptedStashes = stashes.map(stash => {
      if (!stash.content) return stash;
      
      // LOGIC GATE: Only encrypt if it's NOT already encrypted
      // This prevents the "Double Encryption" bug
      const isAlreadyEncrypted = stash.content.startsWith("U2FsdGVkX1");
      
      if (isAlreadyEncrypted) return stash;

      const ciphertext = CryptoJS.AES.encrypt(stash.content, savedPin).toString();
      return { ...stash, content: ciphertext };
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      kryptosPin: savedPin, 
      stashes: encryptedStashes,
      lastUpdated: new Date()
    });
    
    // ... rest of your reset logic

console.log("Kryptos Breach Sealed.");
    
    // THE RESET SEALS: Clear the "Stage" before leaving
    setIsStashOpen(false); 
    setKnockCount(0);      // Reset the knocks
    setIsMigrating(false); // Move the Obelisk back to the top
    setStage('summit');    // Reset the camera view
    setInputCode([]);      // Clear any leftover digits
    
    if (onRitualComplete) onRitualComplete();
    setIsStashOpen(false); 
    if (onRitualComplete) onRitualComplete();
  } catch (error) {
    console.error("Encryption Error:", error);
  }
};
// Inside your IstanbulRitual function:
const user = auth.currentUser;
const userId = user?.uid;

useEffect(() => {
  if (!userId) return;

  const fetchKryptosData = async () => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.kryptosPin) {
          // WE FOUND A PIN
          setSavedPin(data.kryptosPin); 
          setIsSettingPin(false); // <--- CRUCIAL: Tell the UI to switch to 'Unlock' mode
        }
        if (data.stashes) {
          setStashes(data.stashes);
        }
      }
    } catch (error) {
      console.error("Error fetching Protocol data:", error);
    }
  };
  fetchKryptosData();
}, [userId]);

    useEffect(() => {
        if (knockCount === 3) {
            const migrationTimer = setTimeout(() => {
                setIsMigrating(true);
            }, 2000);
            return () => clearTimeout(migrationTimer);
        }
    }, [knockCount]);

    useEffect(() => {
        const startTimer = setTimeout(() => setStage('descending'), RITUAL_TIMINGS.settle);
        const anchorTimer = setTimeout(() => {
            setStage('anchored');
        }, RITUAL_TIMINGS.settle + (RITUAL_TIMINGS.descent * 1000));
        const totalityTimer = setTimeout(() => {
            setStage('totality');
        }, RITUAL_TIMINGS.settle + (RITUAL_TIMINGS.descent * 1000) + 2000);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(anchorTimer);
            clearTimeout(totalityTimer);
        };
    }, []);
const savePinToFirestore = async (hashedPin: string) => {
    if (!userId) {
        console.error("No Scribe detected. Cannot save to the archive.");
        return;
    }
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            kryptosPin: hashedPin,
            lastKryptosSync: new Date().toISOString()
        });
        console.log("PIN Hash anchored to Firestore.");
    } catch (error) {
        // If the document doesn't exist yet, we use setDoc instead
        console.error("Update failed, attempting to initialize document...", error);
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            kryptosPin: hashedPin,
            lastKryptosSync: new Date().toISOString()
        }, { merge: true });
    }
};

const handleRename = (id: string, newLabel: string) => {
  setStashes(prev => prev.map(s => 
    s.id === id ? { ...s, label: newLabel.toUpperCase() } : s
  ));
};
    return (
        <div
            className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden touch-none"
            onClick={handleKnock}
        >
            <div className="w-full h-full max-w-[500px] aspect-[1/2] flex items-center justify-center relative">

                <motion.svg
                    animate={{
                        viewBox: isMigrating ? views.panelZoom :
                            (knockCount === 3 ? views.totality :
                                (stage === 'totality' ? views.totality :
                                    (stage === 'anchored' ? views.anchored : views.landing)))
                    }}
                    transition={{
                        duration: isMigrating ? 4 :
                            stage === 'descending' ? RITUAL_TIMINGS.descent :
                                stage === 'anchored' ? RITUAL_TIMINGS.anchor : 0.8,
                        ease: [0.45, 0.05, 0.55, 0.95]
                    }}
                    className="w-full h-full"
                >
                    {/* 1. THE FLOATING ASSEMBLY */}
                    <g className={isMigrating ? "" : "animate-float-slow"}>
                        <Obelisk ritualStage={2} color="#00FFFF" capstoneColor={getHeroColor()} />
                        <g transform={`translate(${maatX - 43}, 0)`}>
                            <motion.g animate={{ opacity: 1 - (knockCount * 0.25) }}>
                                <VariousGlyphs ritualStage={2} />
                            </motion.g>
                        </g>
                    </g>

                    {/* 2. THE STATIONARY ANCHOR + STASH */}
                    <g transform="translate(0.5, 6.0)">
                        

                        <Pedestal ritualStage={2} />

                        <motion.rect
                            x="22.1" y="254" width="10" height="15" rx="1"
                            fill="none" stroke="#00ff41" strokeWidth="0.2"
                            animate={{ opacity: getPanelOpacity() }}
                            className="drop-shadow-[0_0_5px_#00ff41]"
                        />

                        <g transform="translate(22.1, 254)">
                            <Keypad isVisible={isMigrating} onKeyClick={handleKeyTap} />
                        </g>
                    </g>

                    {/* 3. THE HERO MIGRATION    */}
                    <motion.g
                    //animate={{ rotate: isMigrating ? 360 : 0 }}
                    // transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
                    // style={{ transformOrigin: "27.1px 261.5px" }} 
                    >

                        <HeroGlyphs
                            ritualStage={2}
                            color={getHeroColor()}
                        />

                    </motion.g>
                </motion.svg>
{/* 4. THE DATA BREACH OVERLAY (HTML) */}
<AnimatePresence>
  {isStashOpen && (
    <motion.div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-8">
      
      {!activeStashId ? (
        // VIEW A: THE 4 DRAWERS
        <motion.div className="w-full max-w-md flex flex-col gap-4">
          <h2 className="text-cyan-400 font-mono text-xs tracking-[0.4em] mb-8 text-center">ARCHIVE_DIRECTORY</h2>
          {stashes.map((stash) => (
            <button
              key={stash.id}
              onClick={() => setActiveStashId(stash.id)}
              className="p-4 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all"
            >
              <span className="text-emerald-400 font-mono text-[10px] block mb-1">
                {stash.id === 'recovery' ? '◆ MANDATORY_RECOVERY' : '◇ CUSTOM_CELL'}
              </span>
              <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase">
                {stash.label}
              </span>
            </button>
          ))}
        </motion.div>
      ) : (
        // VIEW B: THE INPUT PROMPT (The "Evening Chronicle" Style)
        <motion.div className="w-full max-w-md flex flex-col gap-6">
          <button onClick={() => setActiveStashId(null)} className="text-emerald-500/50 font-mono text-[10px] hover:text-emerald-400">
            [ ← RETURN TO DIRECTORY ]
          </button>
          
          <div className="space-y-2">
             {/* Allow renaming for custom stashes */}
            {activeStashId !== 'recovery' && (
  <div className="flex flex-col gap-1">
    <label className="text-emerald-500/40 font-mono text-[8px] tracking-[0.2em]">RENAME_CELL</label>
    <input 
      className="bg-transparent border-b border-emerald-500/20 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 w-full pb-1 uppercase transition-colors"
      value={stashes.find(s => s.id === activeStashId)?.label}
      onChange={(e) => handleRename(activeStashId, e.target.value)}
      placeholder="CELL_NAME"
    />
  </div>
)}
             <h3 className="text-cyan-400 font-mono text-lg uppercase">{stashes.find(s => s.id === activeStashId)?.label}</h3>
          </div>

     {/* 1. This is inside your activeStashId view (View B) */}
<div className="relative group">
 <textarea
  disabled={isEncrypting}
  className={`w-full h-32 bg-slate-900 border p-4 font-mono text-sm transition-all duration-700
    ${isEncrypting 
        ? 'border-cyan-400 text-cyan-300 scale-[0.98] blur-[1px]' 
        : 'border-emerald-500/30 text-emerald-400 focus:border-emerald-500/60'
    } outline-none rounded-sm resize-none`}
  placeholder={stashes.find(s => s.id === activeStashId)?.placeholder}
  
  // THE DECODER LOGIC:
  value={isEncrypting 
    ? "∆§πΩ≈µ∫√∑†‡¬∞ﬁﬂ‡°·‚—±" 
    : (() => {
        const currentStash = stashes.find(s => s.id === activeStashId);
        if (!currentStash || !currentStash.content) return "";
        
        // If it starts with the CryptoJS header, it's encrypted
        if (currentStash.content.startsWith("U2FsdGVkX1")) {
          try {
            const bytes = CryptoJS.AES.decrypt(currentStash.content, savedPin!);
            const plaintext = bytes.toString(CryptoJS.enc.Utf8);
            return plaintext;
          } catch (e) {
            console.error("Decryption failed", e);
            return "[CORRUPTED_DATA_STREAM]";
          }
        }
        return currentStash.content;
      })()
  }
  onChange={(e) => {
    const newStashes = stashes.map(s => 
      s.id === activeStashId ? {...s, content: e.target.value} : s
    );
    setStashes(newStashes);
  }}
/>
  
  {/* 2. Optional: A "Locking" icon that appears during encryption */}
  <AnimatePresence>
    {isEncrypting && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-slate-900/40 pointer-events-none"
      >
        <span className="text-cyan-400 font-mono text-[10px] tracking-[0.3em] bg-slate-950 px-4 py-1 border border-cyan-400">
          ENCRYPTING_DATA...
        </span>
      </motion.div>
    )}
  </AnimatePresence>
</div>

    <button 
  onClick={handleEncryptAndSave} // WAS: () => setIsStashOpen(false)
  className="p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono text-xs hover:bg-emerald-500/40 transition-colors"
>
  {isEncrypting ? "ENCRYPTING..." : "ENCRYPT AND UPLOAD"}
</button>
        </motion.div>
      )}
    </motion.div>
  )}
</AnimatePresence>
            </div>

            {/* Progress HUD */}
            <div className="absolute top-10 left-0 right-0 flex justify-center font-mono text-[10px] text-purple-500/50 uppercase tracking-[0.3em]">
                {isStashOpen ? "KRYPTOS: BREACHED" : (isMigrating ? "PROTOCOL: MIGRATION_ACTIVE" : `KNOCK_SEQUENCE: ${knockCount}/3`)}
            </div>

            {/* Sub-instruction for the PIN phase */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                <AnimatePresence>
                    {isMigrating && !isStashOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="px-6 py-3 bg-slate-900/80 border border-cyan-500/30 rounded-full backdrop-blur-sm shadow-lg shadow-cyan-500/10"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-cyan-400 font-mono text-[11px] uppercase tracking-widest animate-pulse whitespace-nowrap">
                                    {isSettingPin
                                        ? (!tempPin ? "Initialize 4-Key PIN" : "Confirm Master PIN")
                                        : "Enter Unlock Sequence"}
                                </p>
                                <p className="text-cyan-400/60 font-mono text-[12px] uppercase tracking-[0.2em] whitespace-nowrap">
                                    {isSettingPin
                                        ? (!tempPin ? "Enter 4 Keys" : "Re-enter 4 Keys")
                                        : "Kryptos Authorization Required"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}