"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Eye, EyeOff, Copy, CheckCheck, X, BookKey } from "lucide-react";
import * as bip39 from "bip39";
import { useAuth } from "@/components/auth-provider";

type Phase = "warning" | "reveal" | "confirmed";

interface RecoveryPhrasePanelProps {
  onClose: () => void;
}

export function RecoveryPhrasePanel({ onClose }: RecoveryPhrasePanelProps) {
  const { masterKey, needsFinalSeal, performFinalSeal } = useAuth();
  const [phase, setPhase] = useState<Phase>("warning");
  const [words, setWords] = useState<string[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sealPassword, setSealPassword] = useState('');
  const [isSealWorking, setIsSealWorking] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);

  const handleFinalSeal = async () => {
    if (!sealPassword) return;
    setIsSealWorking(true);
    setSealError(null);
    try {
      const ok = await performFinalSeal(sealPassword);
      if (!ok) {
        setSealError('Incorrect password. Check it and try again.');
        return;
      }
      // Success — wipe sensitive state then close
      setWords([]);
      setRevealed(false);
      setConfirmed(false);
      setSealPassword('');
      onClose();
    } finally {
      setIsSealWorking(false);
    }
  };

  const revealPhrase = async () => {
    if (!masterKey) {
      setError("Master key is not loaded. Return to the app and unseal your archives first.");
      return;
    }
    setIsRevealing(true);
    setError(null);
    try {
      // Export the raw 256-bit key bytes
      const rawBuffer = await window.crypto.subtle.exportKey("raw", masterKey);
      const bytes = new Uint8Array(rawBuffer);

      // Convert to hex string — bip39.entropyToMnemonic expects lowercase hex
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 256 bits of entropy → 24 BIP39 words (actual standard, not theatrical)
      const mnemonic = bip39.entropyToMnemonic(hex);
      setWords(mnemonic.split(" "));
      setPhase("reveal");
    } catch (e) {
      console.error("Recovery phrase export failed:", e);
      setError("Failed to export the key. See console for details.");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(words.join(" "));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      /* clipboard denied */
    }
  };

  const handleSeal = () => {
    // Wipe words from component state before closing
    setWords([]);
    setRevealed(false);
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-4 px-2">

      {/* ── Phase: Warning ── */}
      <AnimatePresence mode="wait">
        {phase === "warning" && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full border border-amber-500/50 p-4 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="font-display text-xl font-bold text-amber-400 tracking-widest uppercase">
                Sacred Recovery Phrase
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                This reveals your <span className="text-amber-300 font-bold">24-word master key</span> — the only way to recover your encrypted data if you lose your password. Anyone who sees these words can read your tasks.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 text-left w-full border border-slate-800 rounded-lg p-4">
                <li>✦ Never photograph or store digitally</li>
                <li>✦ Write on paper, store somewhere safe</li>
                <li>✦ Only view in a private location</li>
                <li>✦ These words ARE your key — treat them as such</li>
              </ul>
            </div>

            {!masterKey && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 text-center">
                Archives are sealed. Return to the app and unseal them first.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button
              onClick={revealPhrase}
              disabled={!masterKey || isRevealing}
              className="w-full py-3 font-display font-bold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 transition-colors tracking-widest uppercase text-sm"
            >
              {isRevealing ? "Summoning from the Abyss..." : "I understand — Reveal the Phrase"}
            </button>
          </motion.div>
        )}

        {/* ── Phase: Reveal ── */}
        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <BookKey className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="font-display text-lg font-bold text-amber-400 tracking-widest uppercase">
                Your 24 Sacred Words
              </h2>
              <p className="text-xs text-slate-500">
                Write these down in order. They are derived from your actual master key.
              </p>
            </div>

            {/* Word grid — blurred until revealed */}
            <div className="relative">
              <div
                className={`grid grid-cols-3 gap-2 transition-all duration-500 ${
                  revealed ? "" : "blur-sm select-none pointer-events-none"
                }`}
              >
                {words.map((word, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5"
                  >
                    <span className="text-[10px] text-slate-600 font-mono w-4 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-mono text-amber-200 truncate">{word}</span>
                  </div>
                ))}
              </div>

              {!revealed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setRevealed(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-amber-500/50 rounded-lg text-amber-400 text-sm font-display tracking-widest hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Tap to Reveal
                  </button>
                </div>
              )}
            </div>

            {/* Copy button — only after revealed */}
            {revealed && (
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-display text-slate-400 border border-slate-700 rounded-lg hover:border-slate-500 hover:text-slate-200 transition-colors tracking-widest uppercase"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy All Words
                  </>
                )}
              </button>
            )}

            {/* Confirmation gate */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setConfirmed((v) => !v)}
                className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  confirmed
                    ? "bg-amber-500 border-amber-500"
                    : "bg-transparent border-slate-600 group-hover:border-amber-500/50"
                }`}
              >
                {confirmed && <CheckCheck className="w-3 h-3 text-slate-900" />}
              </div>
              <span className="text-xs text-slate-400 leading-relaxed">
                ✍️ I have <span className="text-amber-300 font-semibold">physically written</span> all 24 words on paper, in order, and stored the paper somewhere safe.{" "}
                <span className="text-slate-500">
                  Tip: you can store the <span className="italic">location</span> of that paper as an encrypted note in the Obelisk vault — available in your Scribe&apos;s Dossier.
                </span>
              </span>
            </label>

            {needsFinalSeal ? (
              <div className="space-y-3 border border-emerald-500/30 rounded-xl p-4 bg-emerald-950/20">
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest text-center">
                  ❖ The Final Seal ❖
                </p>
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  Check the box above to confirm you&apos;ve written your words down, then enter your current login password to re-seal with the new security standard.
                </p>
                <input
                  type="password"
                  value={sealPassword}
                  onChange={(e) => setSealPassword(e.target.value)}
                  placeholder="Your current login password"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
                />
                {sealError && (
                  <p className="text-xs text-red-400 text-center">{sealError}</p>
                )}
                <button
                  onClick={handleFinalSeal}
                  disabled={!confirmed || !sealPassword || isSealWorking}
                  className="w-full py-3 font-display font-bold text-slate-900 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 transition-colors tracking-widest uppercase text-sm"
                >
                  {isSealWorking ? 'Sealing...' : 'Perform the Final Seal'}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSeal}
                  disabled={!confirmed}
                  className="w-full py-3 font-display font-bold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 transition-colors tracking-widest uppercase text-sm"
                >
                  Seal the Scroll
                </button>
                <p className="text-center text-xs text-slate-700">
                  These words will not be shown again without re-opening this panel.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
