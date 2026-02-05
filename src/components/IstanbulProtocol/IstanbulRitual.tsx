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

export default function IstanbulRitual({ onRitualComplete }: { onRitualComplete?: () => void }) {
    // --- 1. STATE ---
    const [stage, setStage] = useState('summit');
    const [knockCount, setKnockCount] = useState(0);
    const [isMigrating, setIsMigrating] = useState(false);
    const [inputCode, setInputCode] = useState<number[]>([]);
    const [isStashOpen, setIsStashOpen] = useState(false);
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
                    setIsStashOpen(true);
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

            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                kryptosPin: savedPin,
                stashes: encryptedStashes,
                lastUpdated: new Date()
            });

            setIsStashOpen(false);
            setKnockCount(0);
            setIsMigrating(false);
            setStage('summit');
            setInputCode([]);
            if (onRitualComplete) onRitualComplete();
        } catch (error) {
            console.error("Encryption Error:", error);
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
            const timer = setTimeout(() => setIsMigrating(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [knockCount]);

    useEffect(() => {
        const t1 = setTimeout(() => setStage('descending'), RITUAL_TIMINGS.settle);
        const t2 = setTimeout(() => setStage('anchored'), RITUAL_TIMINGS.settle + 1000);
        const t3 = setTimeout(() => setStage('totality'), RITUAL_TIMINGS.settle + 3000);
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
                    animate={{ viewBox: isMigrating ? views.panelZoom : (stage === 'totality' ? views.totality : (stage === 'anchored' ? views.anchored : views.landing)) }}
                    transition={{ duration: isMigrating ? 4 : 1, ease: [0.45, 0.05, 0.55, 0.95] }}
                    className="w-full h-full"
                >
                    <g className={isMigrating ? "" : "animate-float-slow"}>
                        <Obelisk ritualStage={2} color="#00FFFF" capstoneColor={getHeroColor()} />
                        <g transform={`translate(${maatX - 43}, 0)`}>
                            <motion.g animate={{ opacity: 1 - (knockCount * 0.25) }}>
                                <VariousGlyphs ritualStage={2} />
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
                    <HeroGlyphs ritualStage={2} color={getHeroColor()} />
                </motion.svg>

                <AnimatePresence>
                    {isStashOpen && (
                        <motion.div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-8">
                            {!activeStashId ? (
                                <div className="w-full max-w-md flex flex-col gap-4">
                                    <h2 className="text-cyan-400 font-mono text-xs tracking-[0.4em] mb-8 text-center">ARCHIVE_DIRECTORY</h2>
                                    {stashes.map((stash) => (
                                        <button key={stash.id} onClick={() => setActiveStashId(stash.id)} className="p-4 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left">
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