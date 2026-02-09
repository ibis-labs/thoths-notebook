"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Obelisk } from '@/components/IstanbulProtocol/Obelisk';
import { HeroGlyphs } from '@/components/IstanbulProtocol/HeroGlyphs';
import { VariousGlyphs } from '@/components/IstanbulProtocol/VariousGlyphs';
import { Pedestal } from '@/components/IstanbulProtocol/Pedestal';
import { Keypad } from '@/components/IstanbulProtocol/Keypad';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { useAuth } from '@/components/auth-provider';

export default function IstanbulRitual({ onRitualComplete }: { onRitualComplete?: () => void }) {
    // --- 1. STATE ---
    const { setOnboardingComplete } = useAuth();
    const [stage, setStage] = useState('summit');
    const [knockCount, setKnockCount] = useState(0);
    const [isMigrating, setIsMigrating] = useState(false);
    const [inputCode, setInputCode] = useState<number[]>([]);
    const [isStashOpen, setIsStashOpen] = useState(false);
    const [allowStashInteraction, setAllowStashInteraction] = useState(false);
    const [isStashTransitioning, setIsStashTransitioning] = useState(false);
    const [savedPin, setSavedPin] = useState<string | null>(null);
    const [isSettingPin, setIsSettingPin] = useState(true);
    const [tempPin, setTempPin] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [activeStashId, setActiveStashId] = useState<string | null>(null);
    const [stashes, setStashes] = useState([
        { id: 'recovery', label: 'ACCOUNT RECOVERY STASH', content: '', placeholder: 'Use this stash to remind yourself of the location of the 12 words you wrote down. - On a piece of paper at page 219 of my copy of the Egyptian Book of the Dead or in a file called tomb.txt in my OneDrive or escribed on the inside of my Thoth Decoder Ring or even the 12-words themselves, though this is not recommended....', isLocked: false },
        { id: 'stash-2', label: 'STASH_ALPHA', content: '', placeholder: 'Enter secret data...', isLocked: true },
        { id: 'stash-3', label: 'STASH_BETA', content: '', placeholder: 'Enter secret data...', isLocked: true },
        { id: 'stash-4', label: 'STASH_GAMMA', content: '', placeholder: 'Enter secret data...', isLocked: true },
    ]);

    // --- 2. IDENTITY ---
    const user = auth.currentUser;
    const userId = user?.uid;

    const maatX = 42.5;
    const views = {
        summit: "07 0 40 40",
        landing: "07 235 40 40",
        anchored: "-10 235 65 65",
        totality: "-25 0 100 300",
        panelZoom: "17.5 255 20 20"
    };

    const RITUAL_TIMINGS = { settle: 1000, descent: 1, anchor: 1 };

    // --- 3. HELPERS ---
    const savePinToFirestore = async (hashedPin: string) => {
        if (!userId) return;
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                kryptosPin: hashedPin,
                lastKryptosSync: new Date().toISOString()
            });
        } catch (error) {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, {
                kryptosPin: hashedPin,
                lastKryptosSync: new Date().toISOString()
            }, { merge: true });
        }
    };

    const handleKeyTap = (num: number) => {
        if (!isMigrating || isStashOpen || isError) return;

        const newCode = [...inputCode, num].slice(-4);
        setInputCode(newCode);

        if (newCode.length === 4) {
            const attemptedPinRaw = newCode.join('');
            const attemptedHash = CryptoJS.SHA256(attemptedPinRaw).toString();

            if (isSettingPin) {
                if (!tempPin) {
                    setTempPin(attemptedPinRaw);
                    setInputCode([]);
                } else {
                    if (attemptedPinRaw === tempPin) {
                        setSavedPin(attemptedHash);
                        setIsSettingPin(false);
                        setInputCode([]);
                        savePinToFirestore(attemptedHash);
                    } else {
                        setIsError(true);
                        setTempPin(null);
                        setInputCode([]);
                        setTimeout(() => setIsError(false), 600);
                    }
                }
            } else {
                if (attemptedHash === savedPin) {
                    console.log("✅ PIN correct! Opening stash directory...");
                    setIsStashOpen(true);
                    setAllowStashInteraction(false); // 🏺 Disable interactions during transition
                    setIsStashTransitioning(true); // 🏺 Prevent state changes to activeStashId
                    setActiveStashId(null); // 🏺 Reset to directory view (not a specific stash)
                    console.log("✅ State: isStashTransitioning=true, activeStashId=null");
                } else {
                    setIsError(true);
                    setInputCode([]);
                    setTimeout(() => setIsError(false), 600);
                }
            }
        }
    };

    const handleEncryptAndSave = async () => {
        if (!userId || !savedPin) return;
        setIsEncrypting(true);

        try {
            const encryptedStashes = stashes.map(stash => {
                if (!stash.content || stash.content.startsWith("U2FsdGVkX1")) return stash;
                const ciphertext = CryptoJS.AES.encrypt(stash.content, savedPin).toString();
                return { ...stash, content: ciphertext };
            });

            console.log("🏺 Istanbul Ritual: Preparing to save onboarding completion...");
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                kryptosPin: savedPin,
                stashes: encryptedStashes,
                lastUpdated: new Date(),
                onboardingComplete: true  // 🏺 Mark onboarding as complete
            });

            console.log("✅ Istanbul Ritual: onboardingComplete saved to Firestore for user:", userId);
            // 🏺 Update the auth context to reflect onboarding completion
            setOnboardingComplete(true);
            console.log("✅ Istanbul Ritual: Auth context updated with onboardingComplete = true");

            setIsStashOpen(false);
            setKnockCount(0);
            setIsMigrating(false);
            setStage('summit');
            setInputCode([]);
            if (onRitualComplete) {
              console.log("📍 Istanbul Ritual: Calling onRitualComplete callback, navigating to home...");
              onRitualComplete();
            }
        } catch (error) {
            console.error("❌ Encryption Error:", error);
        } finally {
            setIsEncrypting(false);
        }
    };

    // --- 4. EFFECTS ---
    useEffect(() => {
        if (!userId) return;
        const fetchKryptosData = async () => {
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.kryptosPin) {
                    setSavedPin(data.kryptosPin);
                    setIsSettingPin(false);
                }
                if (data.stashes) setStashes(data.stashes);
            }
        };
        fetchKryptosData();
    }, [userId]);

    useEffect(() => {
        if (knockCount === 3) {
            const timer = setTimeout(() => setIsMigrating(true), 8000);
            return () => clearTimeout(timer);
        }
    }, [knockCount]);

    // 🏺 THE STASH INTERACTION DELAY
    // Prevent accidental taps on stash buttons when the directory first appears
    useEffect(() => {
        if (isStashOpen && !allowStashInteraction) {
            const timer = setTimeout(() => {
                setAllowStashInteraction(true);
                setIsStashTransitioning(false); // 🏺 Allow state changes again
                console.log("✅ Istanbul Ritual: Stash interactions re-enabled");
            }, 600); // 600ms delay to prevent accidental taps
            return () => clearTimeout(timer);
        }
    }, [isStashOpen, allowStashInteraction]);

    // 🏺 DIAGNOSTIC: Track state changes
    useEffect(() => {
        console.log("📊 Istanbul Stash State:", {
            isStashTransitioning,
            activeStashId,
            allowStashInteraction,
            isStashOpen
        });
    }, [isStashTransitioning, activeStashId, allowStashInteraction, isStashOpen]);

   useEffect(() => {
        // --- THE CINEMATIC TIMELINE ---
        
        // 0ms: Summit (Starting position)
        
        // 3000ms: Begin Descent to Landing
        const t1 = setTimeout(() => setStage('landing'), 3000); 
        
        // 10000ms: Zoom out to Anchored (7 seconds after Landing starts)
        const t2 = setTimeout(() => setStage('anchored'), 10000); 
        
        // 17000ms: Final Zoom to Totality (7 seconds after Anchored starts)
        const t3 = setTimeout(() => setStage('totality'), 17000); 
        
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);
    const handleKnock = () => {
        if (stage === 'totality' && knockCount < 3) setKnockCount(prev => prev + 1);
    };

    const handleRename = (id: string, newLabel: string) => {
        setStashes(prev => prev.map(s => s.id === id ? { ...s, label: newLabel.toUpperCase() } : s));
    };

    const getHeroColor = () => {
        if (knockCount === 0) return "#00FFFF";
        if (knockCount === 1) return "#6a0dad";
        if (knockCount === 2) return "#a020f0";
        return "#00ff41";
    };
// 🏺 THE DECODER LOGIC
    const activeStash = stashes.find(s => s.id === activeStashId);
    let displayContent = activeStash?.content || "";

    if (displayContent.startsWith("U2FsdGVkX1") && savedPin) {
        try {
            const bytes = CryptoJS.AES.decrypt(displayContent, savedPin);
            displayContent = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decryption failed", e);
            displayContent = "[CORRUPTED_SHADOW]";
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden touch-none" onClick={handleKnock}>
            <div className="w-full h-full max-w-[500px] aspect-[1/2] flex items-center justify-center relative">
              <motion.svg 
    animate={{ 
        viewBox: isMigrating ? views.panelZoom : 
                 (stage === 'totality' ? views.totality : 
                 (stage === 'anchored' ? views.anchored : 
                 (stage === 'landing' ? views.landing : views.summit))) 
    }}
    transition={{ 
        duration: isMigrating ? 5 : 6, // 6 seconds for the majestic glide!
        ease: [0.45, 0.05, 0.55, 0.95] // Elegant ease-in-out
    }}
    className="w-full h-full"
>
                    <g className={isMigrating ? "" : "animate-float-slow"}>
                        <Obelisk ritualStage={2} color="#00FFFF" capstoneColor={getHeroColor()} />
                        <g transform={`translate(${maatX - 43}, 0)`}>
                            <motion.g animate={{ opacity: 1 - (knockCount * 0.25) }}>
                                <VariousGlyphs ritualStage={2} />
                                 <HeroGlyphs ritualStage={2} color={getHeroColor()} />
                            </motion.g>
                        </g>
                    </g>
                    <g transform="translate(0.5, 6.0)">
                        <Pedestal ritualStage={2} />
                        <motion.rect x="22.1" y="254" width="10" height="15" rx="1" fill="none" stroke="#00ff41" strokeWidth="0.2" animate={{ opacity: knockCount * 0.33 }} />
                        <g transform="translate(22.1, 254)">
                            <motion.g animate={isError ? { x: [0, -0.4, 0.4, 0], filter: ["drop-shadow(0 0 5px #ff0000)", "drop-shadow(0 0 0px #ff0000)"] } : {}}>
                                <Keypad isVisible={isMigrating} onKeyClick={handleKeyTap} />
                            </motion.g>
                        </g>
                    </g>
                   {/* 🏺 THE SUMMONING TEXT: Only appears in Totality stage before knocks are complete */}
<AnimatePresence>
  {stage === 'totality' && knockCount < 3 && !isMigrating && (
    <motion.text
      key="knock-prompt"
      initial={{ opacity: 0, y: 275 }}
      animate={{ 
        opacity: [0, 1, 0.5, 1], 
        y: 272 
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.5,
        transition: { duration: 0.2 } // Snap it away instantly
      }}
      x="27.1" // Centered relative to the Obelisk
      textAnchor="middle"
      fill="#ff3131" // Crimson Cyber Red
      className="font-mono text-[1.5px] uppercase tracking-[0.2em] pointer-events-none"
      style={{ filter: "drop-shadow(0 0 1px #ff0000)" }}
    >
     {knockCount === 0 ? "Knock three times" : 
       knockCount === 1 ? "Two more..." : 
       "The final seal..."}
    </motion.text>
  )}
</AnimatePresence>
                </motion.svg>

                <AnimatePresence>
                    {isStashOpen && (
                        <motion.div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-8">
                            {/* 🏺 TRANSITION OVERLAY: Captures all clicks during the 600ms window */}
                            {isStashTransitioning && (
                                <div 
                                    className="absolute inset-0 z-[400] cursor-not-allowed bg-transparent touch-none select-none"
                                    style={{
                                        pointerEvents: "auto",
                                        WebkitTouchCallout: "none",
                                        WebkitUserSelect: "none",
                                        userSelect: "none",
                                        WebkitUserDrag: "none"
                                    } as React.CSSProperties}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onPointerUp={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onTouchMove={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                />
                            )}
                            {(!activeStashId || isStashTransitioning) ? (
                                <div className="w-full max-w-md flex flex-col gap-4">
                                    <h2 className="text-cyan-400 font-mono text-xs tracking-[0.4em] mb-8 text-center">ARCHIVE_DIRECTORY</h2>
                                    {stashes.map((stash) => (
                                        <button 
                                            key={stash.id} 
                                            onClick={(e) => {
                                                if (isStashTransitioning || !allowStashInteraction) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    return;
                                                }
                                                setActiveStashId(stash.id);
                                            }}
                                            disabled={!allowStashInteraction || isStashTransitioning}
                                            style={{
                                                pointerEvents: isStashTransitioning || !allowStashInteraction ? "none" : "auto",
                                                touchAction: isStashTransitioning ? "none" : "auto",
                                                WebkitTouchCallout: isStashTransitioning ? "none" : "auto"
                                            } as React.CSSProperties}
                                            className={`p-4 border border-emerald-500/30 bg-emerald-500/5 text-left transition-all touch-none select-none ${
                                                allowStashInteraction && !isStashTransitioning
                                                    ? "hover:bg-emerald-500/10 cursor-pointer" 
                                                    : "opacity-50"
                                            }`}
                                        >
                                            <span className="text-emerald-400 font-mono text-[10px] block mb-1">{stash.id === 'recovery' ? '◆ MANDATORY_RECOVERY' : '◇ CUSTOM_CELL'}</span>
                                            <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase">{stash.label}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                               <div className="w-full max-w-md flex flex-col gap-6">
    <button onClick={() => setActiveStashId(null)} className="text-emerald-500/50 font-mono text-[10px] hover:text-emerald-400">
        [ ← RETURN TO DIRECTORY ]
    </button>
    
    <textarea
        disabled={isEncrypting}
        className="w-full h-32 bg-slate-900 border border-emerald-500/30 p-4 font-mono text-sm text-emerald-400 rounded-sm resize-none focus:border-emerald-500 outline-none"
        placeholder={activeStash?.placeholder}
        
        /* 🏺 Using our pre-calculated variable */
        value={displayContent}

        onChange={(e) => {
            const newStashes = stashes.map(s => 
                s.id === activeStashId ? { ...s, content: e.target.value } : s
            );
            setStashes(newStashes);
        }}
    />
    
    <button 
        onClick={handleEncryptAndSave} 
        className="p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase hover:bg-emerald-500/40 transition-colors"
    >
        {isEncrypting ? "Encrypting..." : "Encrypt & Upload"}
    </button>
</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="absolute bottom-8 flex justify-center w-full">
                {isMigrating && !isStashOpen && (
                    <div className="px-6 py-3 bg-slate-900/80 border border-cyan-500/30 rounded-full text-cyan-400 font-mono text-[11px] uppercase tracking-widest">
                        {isSettingPin ? (!tempPin ? "Initialize 4-Key PIN" : "Confirm Master PIN") : "Enter Unlock Sequence"}
                    </div>
                )}
            </div>
        </div>
    );
}