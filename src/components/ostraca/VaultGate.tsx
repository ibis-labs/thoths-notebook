"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keypad } from '@/components/IstanbulProtocol/Keypad';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

interface VaultGateProps {
  onUnlock: () => void;
}

type GatePhase = 'loading' | 'set-new' | 'confirm-new' | 'enter' | 'error' | 'granted';

const PHASE_LABELS: Record<GatePhase, string> = {
  loading:      'Accessing vault...',
  'set-new':    'Inscribe new vault seal',
  'confirm-new':'Confirm seal',
  enter:        'Enter vault seal',
  error:        'Incorrect — retry',
  granted:      'Access granted',
};

export function VaultGate({ onUnlock }: VaultGateProps) {
  const [phase, setPhase]         = useState<GatePhase>('loading');
  const [inputCode, setInputCode] = useState<number[]>([]);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [tempPin, setTempPin]     = useState<string | null>(null);
  const [shakeKey, setShakeKey]   = useState(0);

  const userId = auth.currentUser?.uid;

  // Haptic feedback on phase changes (mobile)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.navigator.vibrate) return;
    if (phase === 'error')   window.navigator.vibrate([40, 30, 40, 30, 40]);
    if (phase === 'granted') window.navigator.vibrate([15, 60, 15]);
  }, [phase]);

  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, 'users', userId)).then(snap => {
      if (snap.exists() && snap.data().ostraca_vault_pin) {
        setSavedHash(snap.data().ostraca_vault_pin);
        setPhase('enter');
      } else {
        setPhase('set-new');
      }
    });
  }, [userId]);

  const savePinHash = async (hash: string) => {
    if (!userId) return;
    await setDoc(doc(db, 'users', userId), { ostraca_vault_pin: hash }, { merge: true });
  };

  const triggerError = (nextPhase: GatePhase) => {
    setPhase('error');
    setInputCode([]);
    setShakeKey(k => k + 1);
    setTimeout(() => setPhase(nextPhase), 1400);
  };

  const handleKeyClick = (num: number) => {
    if (phase === 'loading' || phase === 'error' || phase === 'granted') return;
    const newCode = [...inputCode, num].slice(-4);
    setInputCode(newCode);
    if (newCode.length < 4) return;
    const pin  = newCode.join('');
    const hash = CryptoJS.SHA256(pin).toString();
    if (phase === 'set-new') {
      setTempPin(pin); setInputCode([]); setPhase('confirm-new'); return;
    }
    if (phase === 'confirm-new') {
      if (pin === tempPin) { setSavedHash(hash); savePinHash(hash); setPhase('granted'); setTimeout(() => onUnlock(), 900); }
      else { triggerError('set-new'); setTempPin(null); }
      return;
    }
    if (phase === 'enter') {
      if (hash === savedHash) { setPhase('granted'); setTimeout(() => onUnlock(), 900); }
      else triggerError('enter');
    }
  };

  const dotClass = (i: number) => {
    if (phase === 'error')   return 'border-red-500    bg-red-500/60';
    if (phase === 'granted') return 'border-emerald-400 bg-emerald-400/70';
    return inputCode.length > i ? 'border-amber-400 bg-amber-400/80' : 'border-amber-400/25 bg-transparent';
  };

  const labelColor = phase === 'error' ? 'text-red-400' : phase === 'granted' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/60" />
          <span className="text-amber-400/50 text-base">𓂀</span>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/60" />
        </div>
        <motion.p key={phase} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className={`font-headline text-sm tracking-widest uppercase ${labelColor}`}>
          {PHASE_LABELS[phase]}
        </motion.p>
        {phase !== 'error' && phase !== 'loading' && phase !== 'granted' && (
          <p className="text-xs text-muted-foreground mt-1 font-body">
            {phase === 'set-new' && 'Choose 4 keys for your vault seal'}
            {phase === 'confirm-new' && 'Re-enter to confirm'}
            {phase === 'enter' && '4-key code required'}
          </p>
        )}
      </div>

      <motion.div key={shakeKey} className="flex gap-5"
        animate={phase === 'error' ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.45 }}>
        {[0, 1, 2, 3].map(i => (
          <motion.div key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${dotClass(i)}`}
            animate={phase === 'granted' ? { scale: [1, 1.5, 1] } : {}}
            transition={{ delay: i * 0.07 }} />
        ))}
      </motion.div>

      <AnimatePresence>
        {phase !== 'loading' && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }} className="w-52 h-72">
            <svg viewBox="-0.6 -0.6 11.2 16.2" className="w-full h-full"
              style={{ overflow: 'visible', filter: 'drop-shadow(0 0 14px rgba(0,255,65,0.2))' }}>
              <Keypad isVisible={true} onKeyClick={handleKeyClick} />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
