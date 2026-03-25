"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import * as bip39 from "bip39";
import {
  importKeyFromRaw,
  deriveWrappingKey,
  wrapMasterKey,
  bufferToBase64,
} from "@/lib/crypto";

const BYPASS_PATHS = ["/login", "/IstanbulProtocol"];

export function ArchiveUnlockGate() {
  const { user, loading, masterKey, ritualInProgress, unlockArchives, setMasterKey } = useAuth();
  const pathname = usePathname();

  const [hasCheckedFirestore, setHasCheckedFirestore] = useState(false);
  const [hasKeys, setHasKeys] = useState<boolean | null>(null); // null = not checked yet
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [isFromPasswordReset, setIsFromPasswordReset] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // If the user just reset their Firebase Auth password, the archive key is
  // still wrapped with the old password. Re-check whenever `user` changes so
  // this fires after the sign-in redirect (the gate never remounts in the layout).
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("thoth_needs_rekey") === "true") {
      setShowRecovery(true);
      setIsFromPasswordReset(true);
    }
  }, [user]);

  // Check Firestore for existing keys when the gate activates
  useEffect(() => {
    if (!user || loading || masterKey || ritualInProgress) return;
    if (BYPASS_PATHS.some((p) => pathname?.startsWith(p))) return;
    if (hasCheckedFirestore) return;

    const checkForKeys = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHasKeys(!!(data.wrappedMasterKey && data.kryptosSalt));
        } else {
          setHasKeys(false);
        }
      } catch (e) {
        console.error("ArchiveUnlockGate: failed to read Firestore:", e);
        setHasKeys(false);
      } finally {
        setHasCheckedFirestore(true);
      }
    };

    checkForKeys();
  }, [user, loading, masterKey, ritualInProgress, pathname, hasCheckedFirestore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !user) return;
    setIsWorking(true);
    setError(null);

    try {
      if (hasKeys) {
        // ── Branch A: Keys exist in Firestore, just unwrap them ──
        const success = await unlockArchives(password);
        if (!success) {
          setError("Incorrect password. The archives remain sealed.");
        }
      } else {
        // ── Branch B: No keys — forge new ones now ──
        setStatusMessage("Forging your master key...");
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const newKey = await importKeyFromRaw(window.crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer);
        const wrappingKey = await deriveWrappingKey(password, salt);
        const wrappedBuffer = await wrapMasterKey(newKey, wrappingKey);

        setStatusMessage("Sealing keys in the archives...");
        await updateDoc(doc(db, "users", user.uid), {
          kryptosSalt: bufferToBase64(salt.buffer as ArrayBuffer),
          wrappedMasterKey: bufferToBase64(wrappedBuffer),
        });

        // Load the live key into context (also mirrors to sessionStorage)
        await setMasterKey(newKey);
        setStatusMessage(null);
      }
    } catch (err) {
      console.error("ArchiveUnlockGate error:", err);
      setError("Something went wrong. Check the console for details.");
      setStatusMessage(null);
    } finally {
      setIsWorking(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsWorking(true);
    setRecoveryError(null);
    try {
      const phrase = recoveryPhrase.trim().toLowerCase().replace(/\s+/g, " ");
      if (!bip39.validateMnemonic(phrase)) {
        setRecoveryError("Invalid recovery phrase. Check for typos and ensure all 24 words are correct.");
        setIsWorking(false);
        return;
      }
      const entropyHex = bip39.mnemonicToEntropy(phrase);
      const entropyBytes = new Uint8Array((entropyHex.match(/.{2}/g) as string[]).map(b => parseInt(b, 16)));
      const recoveredKey = await importKeyFromRaw(entropyBytes.buffer as ArrayBuffer);
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const wrappingKey = await deriveWrappingKey(recoveryNewPassword, salt);
      const wrappedBuffer = await wrapMasterKey(recoveredKey, wrappingKey);
      const { updateDoc, doc: firestoreDoc } = await import("firebase/firestore");
      await updateDoc(firestoreDoc(db, "users", user.uid), {
        kryptosSalt: bufferToBase64(salt.buffer as ArrayBuffer),
        wrappedMasterKey: bufferToBase64(wrappedBuffer),
      });
      await setMasterKey(recoveredKey);
      localStorage.removeItem("thoth_needs_rekey");
    } catch (err) {
      console.error("Recovery error:", err);
      setRecoveryError("Recovery failed. Please check your phrase and try again.");
    } finally {
      setIsWorking(false);
    }
  };

  // ── Render gate? ──
  const shouldShow =
    !!user &&
    !loading &&
    !masterKey &&
    !ritualInProgress &&
    hasCheckedFirestore &&
    !dismissed &&
    !BYPASS_PATHS.some((p) => pathname?.startsWith(p));

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="archive-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(34,211,238,0.15)] p-8 space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full border border-cyan-500/50 p-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  <KeyRound className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-cyan-400 tracking-widest uppercase">
                {hasKeys ? "Unseal the Archives" : "Forge the Master Key"}
              </h2>
              {hasKeys ? (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {isFromPasswordReset
                    ? "Your login password was reset. Use your recovery phrase below to reseal your vault with the new password."
                    : "Your session has expired. Enter your password to restore the encryption key and access your tasks."}
                </p>
              ) : (
                <p className="text-sm text-slate-400 leading-relaxed">
                  No encryption keys were found for your account. Enter your
                  password below and the Forge will generate your master key and
                  save it securely to your archive.
                </p>
              )}
            </div>

            {/* Form */}
            {showRecovery ? (
              <form onSubmit={handleRestore} className="space-y-4">
                {isFromPasswordReset && (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 leading-relaxed">
                    <p className="font-bold mb-1">Your login password was reset.</p>
                    <p>Your encryption key is sealed with your <span className="text-white">old</span> password — they&apos;re separate credentials. Enter your 24 recovery words and choose a new archive password to reseal your vault.</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">
                    Your 24 Recovery Words
                  </label>
                  <textarea
                    value={recoveryPhrase}
                    onChange={(e) => { setRecoveryPhrase(e.target.value); setRecoveryError(null); }}
                    placeholder="word1 word2 word3 ... (all 24 words, space-separated)"
                    rows={4}
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-colors text-sm font-mono resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">
                    New Archive Password
                  </label>
                  <input
                    type="password"
                    value={recoveryNewPassword}
                    onChange={(e) => { setRecoveryNewPassword(e.target.value); setRecoveryError(null); }}
                    placeholder="Use the same password you just set for login"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                  {isFromPasswordReset && (
                    <p className="text-[10px] text-slate-500 mt-1">Use the same password you just set — after this, login and archive use the same password.</p>
                  )}
                </div>
                {recoveryError && (
                  <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
                    {recoveryError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isWorking || !recoveryPhrase || !recoveryNewPassword}
                  className="w-full py-3 font-display font-bold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 transition-colors tracking-widest uppercase text-sm"
                >
                  {isWorking ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Restoring...
                    </span>
                  ) : "Restore Access"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Back to password
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">
                  {hasKeys ? "Archive Password" : "Your Login Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your password..."
                    autoFocus
                    className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Status */}
              {statusMessage && (
                <p className="text-sm text-cyan-400 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {statusMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isWorking || !password}
                className="w-full py-3 font-display font-bold text-slate-900 bg-cyan-400 rounded-lg hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-500 transition-colors tracking-widest uppercase text-sm"
              >
                {isWorking ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {hasKeys ? "Unsealing..." : "Forging..."}
                  </span>
                ) : hasKeys ? (
                  "Unseal Archives"
                ) : (
                  "Forge Master Key"
                )}
              </button>

              {hasKeys && (
                <button
                  type="button"
                  onClick={() => { setShowRecovery(true); setIsFromPasswordReset(false); }}
                  className="w-full py-2 px-3 text-sm font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-lg hover:bg-amber-900/50 transition-colors"
                >
                  🔑 Just reset your password? Click here to restore your encryption key
                </button>
              )}

              <button
                type="button"
                disabled={isWorking}
                onClick={() => setDismissed(true)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Not now — enter without decryption
              </button>
            </form>
            )}

            {/* Footer hint */}
            <p className="text-center text-xs text-slate-600">
              Your key never leaves your device. Zero-knowledge encryption.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
