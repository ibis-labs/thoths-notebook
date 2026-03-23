"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import {
  generateMasterKey,
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
        const newKey = await generateMasterKey();
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

  // ── Render gate? ──
  const shouldShow =
    !!user &&
    !loading &&
    !masterKey &&
    !ritualInProgress &&
    hasCheckedFirestore &&
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
                  Your session has expired. Enter your password to restore the
                  encryption key and access your tasks.
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
            </form>

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
