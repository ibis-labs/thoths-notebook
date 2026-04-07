"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Ensure db is imported
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { base64ToBuffer, bufferToBase64, deriveWrappingKey, wrapMasterKey } from "@/lib/crypto";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  masterKey: CryptoKey | null;
  ritualInProgress: boolean;
  onboardingComplete: boolean;
  needsFinalSeal: boolean;
  setRitualInProgress: (inProgress: boolean) => void;
  setMasterKey: (key: CryptoKey | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  unlockArchives: (phrase: string) => Promise<boolean>;
  performFinalSeal: (password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  masterKey: null,
  ritualInProgress: false,
  onboardingComplete: false,
  needsFinalSeal: false,
  setRitualInProgress: () => {},
  setMasterKey: () => {},
  setOnboardingComplete: () => {},
  unlockArchives: async () => false,
  performFinalSeal: async () => false,
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

/**
 * 🛡️ THE SESSION SHIELD
 * Lives only in module memory — never in any storage.
 * Generated fresh on each page load. On hard refresh or new tab it is gone,
 * making any wrapped bytes in sessionStorage permanently unreadable.
 */
let _sessionWrappingKey: CryptoKey | null = null;

async function getOrCreateSessionWrappingKey(): Promise<CryptoKey> {
  if (!_sessionWrappingKey) {
    _sessionWrappingKey = await window.crypto.subtle.generateKey(
      { name: "AES-KW", length: 256 },
      false, // non-extractable — cannot be exported from memory
      ["wrapKey", "unwrapKey"]
    );
  }
  return _sessionWrappingKey;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [ritualInProgress, setRitualInProgress] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [needsFinalSeal, setNeedsFinalSeal] = useState(false);
  /**
   * 🏺 RITUAL 1: The Session Bridge Handler
   * Wraps the master key with an ephemeral AES-KW key that exists only in
   * module memory. Raw key bytes are never written to any browser storage.
   */
  const handleSetMasterKey = async (key: CryptoKey | null) => {
    setMasterKey(key);

    if (key) {
      try {
        const wrappingKey = await getOrCreateSessionWrappingKey();
        const wrappedBuffer = await window.crypto.subtle.wrapKey("raw", key, wrappingKey, "AES-KW");
        sessionStorage.setItem("thoth_session_key", bufferToBase64(wrappedBuffer));
      } catch (e) {
        console.error("❌ Auth: Failed to seal session key:", e);
      }
    } else {
      sessionStorage.removeItem("thoth_session_key");
      _sessionWrappingKey = null;
    }
  };

  /**
   * 🏺 RITUAL 2: The Retrieval Ritual
   * Tries 600k PBKDF2 first (kryptosVersion: 2). Falls back to 100k for the
   * grace-period migration. If only legacy succeeds, needsFinalSeal = true.
   */
  const unlockArchives = async (phrase: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return false;

      const data = userDoc.data();
      const wrappedMasterKey = data.wrappedMasterKey;
      const salt = data.kryptosSalt;

      if (!wrappedMasterKey || !salt) {
        console.error("❌ Archives found, but they are not sealed correctly.");
        return false;
      }

      const { unwrapKeyFromPhrase, unwrapKeyFromPhraseLegacy } = await import('@/lib/crypto');

      // Attempt 1: current 600k derivation
      try {
        const liveKey = await unwrapKeyFromPhrase(
          phrase,
          base64ToBuffer(wrappedMasterKey),
          base64ToBuffer(salt)
        );
        await handleSetMasterKey(liveKey);
        return true;
      } catch {
        // 600k derivation failed — vault was sealed with legacy 100k derivation
      }

      // Attempt 2: legacy 100k derivation (grace-period migration only)
      try {
        const liveKey = await unwrapKeyFromPhraseLegacy(
          phrase,
          base64ToBuffer(wrappedMasterKey),
          base64ToBuffer(salt)
        );
        await handleSetMasterKey(liveKey);
        setNeedsFinalSeal(true);
        return true;
      } catch {
        return false; // Both derivations failed — incorrect password
      }
    } catch (e) {
      console.error("❌ Archive retrieval failed:", e);
      return false;
    }
  };

  /**
   * 🏺 RITUAL 2b: The Final Seal
   * Re-wraps the master key with 600k PBKDF2 and a fresh salt, then writes
   * kryptosVersion: 2 to Firestore. Clears needsFinalSeal on success.
   */
  const performFinalSeal = async (password: string): Promise<boolean> => {
    if (!user || !masterKey) return false;
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const wrappingKey = await deriveWrappingKey(password, salt);
      const wrappedBuffer = await wrapMasterKey(masterKey, wrappingKey);
      const { updateDoc: fsUpdateDoc, doc: fsDoc } = await import('firebase/firestore');
      await fsUpdateDoc(fsDoc(db, 'users', user.uid), {
        kryptosSalt: bufferToBase64(salt.buffer as ArrayBuffer),
        wrappedMasterKey: bufferToBase64(wrappedBuffer),
        kryptosVersion: 2,
      });
      setNeedsFinalSeal(false);
      return true;
    } catch (e) {
      console.error('❌ Final Seal failed:', e);
      return false;
    }
  };

  /**
   * 🏺 RITUAL 3: The Morning Gate (App Startup)
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // If we have a firebase auth user, attempt to enrich/sync their profile from Firestore
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.displayName && (!firebaseUser.displayName || firebaseUser.displayName !== data.displayName)) {
              try {
                await updateProfile(firebaseUser, { displayName: data.displayName });
                // update local user reference after profile change
                setUser({ ...firebaseUser, displayName: data.displayName } as User);
              } catch (e) {
                console.warn("⚠️ Auth: Failed to update profile displayName:", e);
              }
            }
            // 🏺 Load onboarding completion status from Firestore
            if (data?.onboardingComplete) {
              setOnboardingComplete(true);
            }
          }
        } catch (e) {
          console.error("❌ Auth: Failed to fetch Firestore user profile:", e);
        }
      }

      setLoading(false);
    });

    const restoreKeyFromBridge = async () => {
      // If a password reset is in progress, the stored key was wrapped with the
      // old password and should not be restored — the gate will handle re-wrapping.
      if (localStorage.getItem("thoth_needs_rekey") === "true") {
        sessionStorage.removeItem("thoth_session_key");
        return;
      }
      // Without the ephemeral wrapping key in memory (i.e. after a hard refresh
      // or in a new tab) the stored bytes are cryptographically useless.
      if (!_sessionWrappingKey) return;

      const wrappedBase64 = sessionStorage.getItem("thoth_session_key");
      if (wrappedBase64) {
        try {
          const wrappedBuffer = base64ToBuffer(wrappedBase64);
          const restoredKey = await window.crypto.subtle.unwrapKey(
            "raw",
            wrappedBuffer,
            _sessionWrappingKey,
            "AES-KW",
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
          );
          setMasterKey(restoredKey);
        } catch (e) {
          console.error("❌ Bridge: Restoration failed — clearing session key.", e);
          sessionStorage.removeItem("thoth_session_key");
        }
      }
    };

    restoreKeyFromBridge();

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = async () => {
    try {
      await handleSetMasterKey(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const value = {
    user,
    loading,
    masterKey,
    ritualInProgress,
    onboardingComplete,
    needsFinalSeal,
    setRitualInProgress,
    setMasterKey: handleSetMasterKey,
    setOnboardingComplete,
    unlockArchives,
    performFinalSeal,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};