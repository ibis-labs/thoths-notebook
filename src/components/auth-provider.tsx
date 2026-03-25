"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Ensure db is imported
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { base64ToBuffer, bufferToBase64 } from "@/lib/crypto"; // Ensure unwrapKey is exported from crypto.ts

interface AuthContextType {
  user: User | null;
  loading: boolean;
  masterKey: CryptoKey | null;
  ritualInProgress: boolean; 
  onboardingComplete: boolean;
  setRitualInProgress: (inProgress: boolean) => void;
  setMasterKey: (key: CryptoKey | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  unlockArchives: (phrase: string) => Promise<boolean>; // 🏺 New Ritual
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  masterKey: null,
  ritualInProgress: false,
  onboardingComplete: false,
  setRitualInProgress: () => {},
  setMasterKey: () => {},
  setOnboardingComplete: () => {},
  unlockArchives: async () => false,
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [ritualInProgress, setRitualInProgress] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  /**
   * 🏺 RITUAL 1: The Session Bridge Handler
   */
  const handleSetMasterKey = async (key: CryptoKey | null) => {
    console.log("🔑 Auth: handleSetMasterKey triggered. Key present?", !!key);
    setMasterKey(key);
    
    if (key) {
      try {
        const exported = await window.crypto.subtle.exportKey("raw", key);
        sessionStorage.setItem("thoth_session_key", bufferToBase64(exported));
        console.log("✅ Auth: Key mirrored to Session Storage.");
      } catch (e) {
        console.error("❌ Auth: Failed to export key:", e);
      }
    } else {
      sessionStorage.removeItem("thoth_session_key");
    }
  };

  /**
   * 🏺 RITUAL 2: The Retrieval Ritual
   * Fetches the wrapped key from Firestore and attempts to unwrap it with a phrase.
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

      // 🏺 THE UNSEALING
      const { unwrapKeyFromPhrase } = await import('@/lib/crypto');
      
      const liveKey = await unwrapKeyFromPhrase(
        phrase,
        base64ToBuffer(wrappedMasterKey),
        base64ToBuffer(salt)
      );

      // Save to RAM and Bridge
      await handleSetMasterKey(liveKey);
      return true;
    } catch (e) {
      console.error("❌ The phrase failed to move the stone. Likely incorrect phrase.", e);
      return false;
    }
  };

  /**
   * 🏺 RITUAL 3: The Morning Gate (App Startup)
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase: Auth state changed. User:", firebaseUser?.email);
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
                console.log("✅ Auth: displayName synced from Firestore to Auth user.");
                // update local user reference after profile change
                setUser({ ...firebaseUser, displayName: data.displayName } as User);
              } catch (e) {
                console.warn("⚠️ Auth: Failed to update profile displayName:", e);
              }
            }
            // 🏺 Load onboarding completion status from Firestore
            console.log("🔥 Auth: Firestore user data keys:", Object.keys(data));
            if (data?.onboardingComplete) {
              console.log("✅ Auth: Onboarding marked as complete in Firestore.");
              setOnboardingComplete(true);
            } else {
              console.log("❌ Auth: Onboarding NOT marked as complete. onboardingComplete value:", data?.onboardingComplete);
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
      const savedKeyBase64 = sessionStorage.getItem("thoth_session_key");
      if (savedKeyBase64) {
        try {
          console.log("🏺 Bridge: Found saved key. Attempting restoration...");
          const rawKey = base64ToBuffer(savedKeyBase64);
          const restoredKey = await window.crypto.subtle.importKey(
            "raw",
            rawKey,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
          );
          setMasterKey(restoredKey);
          console.log("✨ Bridge: Master Key restored successfully.");
        } catch (e) {
          console.error("❌ Bridge: Restoration failed:", e);
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
    ritualInProgress, // 🏺 The Signal
    onboardingComplete, // 🏺 The Onboarding Flag
    setRitualInProgress, // 🏺 The Command
    setMasterKey: handleSetMasterKey,
    setOnboardingComplete, // 🏺 The Onboarding Command
    unlockArchives, // 🏺 Exported for use in the UI
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};