'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import type { IphtyLink, IphtyMessage } from '@/lib/types';
import {
  generateIphtyKeyPair,
  exportIphtyPublicKey,
  importIphtyPublicKey,
  wrapIphtyPrivateKey,
  unwrapIphtyPrivateKey,
  deriveSharedConversationKey,
} from '@/lib/iphty-crypto';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';

// --- Crypto-random invitation code (XXXX-XXXX, unambiguous chars) ------------
function generateInviteCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
  const bytes = new Uint8Array(8);
  window.crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => CHARS[b % CHARS.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

// Normalize user input -> stored format (XXXX-XXXX)
function normalizeCode(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  if (clean.length === 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return input.trim().toUpperCase();
}

// --- Helper: Normalize a Firestore doc into an IphtyLink --------------------
function normalizeLink(id: string, data: Record<string, any>): IphtyLink {
  return {
    id,
    participants: data.participants ?? [],
    requestorId: data.requestorId ?? '',
    requesteeId: data.requesteeId ?? '',
    requestorDisplayName: data.requestorDisplayName ?? 'Unknown Scribe',
    requesteeDisplayName: data.requesteeDisplayName ?? 'Unknown Scribe',
    requestorPublicKey: data.requestorPublicKey ?? '',
    requesteePublicKey: data.requesteePublicKey ?? '',
    status: data.status ?? 'pending',
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    lastMessageAt: data.lastMessageAt?.toDate?.() ?? undefined,
    lastMessageSenderId: data.lastMessageSenderId ?? undefined,
  };
}

// =============================================================================
export function useIphtyLink() {
  const { user, masterKey } = useAuth();
  const { toast } = useToast();

  const [links, setLinks] = useState<IphtyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [iphtyReady, setIphtyReady] = useState(false);
  const [keySetupStatus, setKeySetupStatus] = useState<'idle' | 'loading' | 'ready' | 'needs-vault'>('idle');

  const [activeLink, setActiveLinkState] = useState<IphtyLink | null>(null);
  const [messages, setMessages] = useState<IphtyMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const privateKeyRef = useRef<CryptoKey | null>(null);
  const conversationKeysRef = useRef<Map<string, CryptoKey>>(new Map());
  const activeLinkRef = useRef<IphtyLink | null>(null);
  const linksRef = useRef<IphtyLink[]>([]);
  useEffect(() => { linksRef.current = links; }, [links]);

  // --- INIT: Set up ECDH key pair (requires vault) --------------------------
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setKeySetupStatus('loading');
      try {
        if (!masterKey) {
          setKeySetupStatus('needs-vault');
          return;
        }

        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const data = userSnap.exists() ? userSnap.data() : {};

        if (data.iphtyWrappedPrivateKey && data.iphtyPrivateKeyIv) {
          privateKeyRef.current = await unwrapIphtyPrivateKey(
            data.iphtyWrappedPrivateKey,
            data.iphtyPrivateKeyIv,
            masterKey
          );
        } else {
          const keyPair = await generateIphtyKeyPair();
          const publicKeyJson = await exportIphtyPublicKey(keyPair.publicKey);
          const { wrappedKey, iv } = await wrapIphtyPrivateKey(keyPair.privateKey, masterKey);
          await updateDoc(doc(db, 'users', user.uid), {
            iphtyPublicKey: publicKeyJson,
            iphtyWrappedPrivateKey: wrappedKey,
            iphtyPrivateKeyIv: iv,
          });
          privateKeyRef.current = keyPair.privateKey;
        }

        setIphtyReady(true);
        setKeySetupStatus('ready');
      } catch (err) {
        console.error('Iphty: Key initialization failed:', err);
        setKeySetupStatus('needs-vault');
      }
    };

    init();
  }, [user, masterKey]);

  const [unreadLinkIds, setUnreadLinkIds] = useState<Set<string>>(new Set());

  // --- LISTEN: All IphtyLinks where current user is a participant -----------
  useEffect(() => {
    if (!user) {
      setLinks([]);
      setLoading(false);
      setUnreadLinkIds(new Set());
      return;
    }

    const q = query(
      collection(db, 'iphtyLinks'),
      where('participants', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const result: IphtyLink[] = snap.docs.map((d) =>
        normalizeLink(d.id, d.data() as Record<string, any>)
      );
      setLinks(result);
      setLoading(false);

      if (activeLinkRef.current) {
        const updated = result.find((l) => l.id === activeLinkRef.current!.id);
        if (updated) {
          activeLinkRef.current = updated;
          setActiveLinkState(updated);
        }
      }

      // ── Compute per-link unread badge state (for tile indicators) ─────
      const newUnread = new Set<string>();
      for (const link of result) {
        if (link.status !== 'active') continue;
        if (!link.lastMessageAt || link.lastMessageSenderId === user.uid) continue;
        const lastSeen = parseInt(localStorage.getItem(`iphty_seen_${link.id}`) ?? '0', 10);
        if (link.lastMessageAt.getTime() > lastSeen) {
          newUnread.add(link.id);
        }
      }
      setUnreadLinkIds(newUnread);
    });

    return () => unsub();
  }, [user]);

  // --- LISTEN: Messages for the active conversation -------------------------
  useEffect(() => {
    if (!activeLink || activeLink.status !== 'active') {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    const q = query(
      collection(db, 'iphtyLinks', activeLink.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const convKey = conversationKeysRef.current.get(activeLink.id);

      const raw: IphtyMessage[] = snap.docs.map((d) => ({
        id: d.id,
        linkId: activeLink.id,
        senderId: d.data().senderId ?? '',
        senderDisplayName: d.data().senderDisplayName ?? '',
        ciphertext: d.data().ciphertext ?? '',
        iv: d.data().iv ?? '',
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      }));

      if (convKey) {
        const decrypted = await Promise.all(
          raw.map(async (msg) => {
            try {
              const plain = await decryptData(
                convKey,
                base64ToBuffer(msg.ciphertext),
                new Uint8Array(base64ToBuffer(msg.iv))
              );
              return { ...msg, ciphertext: plain, iv: '' };
            } catch {
              return { ...msg, ciphertext: '🔒 [Sealed Transmission]', iv: '' };
            }
          })
        );
        setMessages(decrypted);
      } else {
        setMessages(raw.map((m) => ({ ...m, ciphertext: '🔒 [Sealed Transmission]', iv: '' })));
      }

      setMessagesLoading(false);
    });

    return () => unsub();
  }, [activeLink]);

  // --- ACTION: Derive (or restore) the shared conversation key -------------
  const getConversationKey = useCallback(
    async (link: IphtyLink): Promise<CryptoKey | null> => {
      if (!privateKeyRef.current) return null;

      const cached = conversationKeysRef.current.get(link.id);
      if (cached) return cached;

      try {
        const theirPublicKeyJson =
          link.requestorId === user?.uid ? link.requesteePublicKey : link.requestorPublicKey;
        if (!theirPublicKeyJson) return null;

        const theirKey = await importIphtyPublicKey(theirPublicKeyJson);
        const sharedKey = await deriveSharedConversationKey(privateKeyRef.current, theirKey);
        conversationKeysRef.current.set(link.id, sharedKey);
        return sharedKey;
      } catch (err) {
        console.error('Iphty: Failed to derive conversation key:', err);
        return null;
      }
    },
    [user]
  );

  // --- ACTION: Open a conversation (pre-derives the shared key) ------------
  const openConversation = useCallback(
    async (link: IphtyLink) => {
      activeLinkRef.current = link;
      setActiveLinkState(link);
      await getConversationKey(link);
      // Mark as seen so the sidebar node stops blinking and tile badge clears
      localStorage.setItem(`iphty_seen_${link.id}`, Date.now().toString());
      // Signal to the global notification hook that this conversation is open
      localStorage.setItem('iphty_active_link', link.id);
      // Remove from unread set immediately
      setUnreadLinkIds((prev) => {
        const next = new Set(prev);
        next.delete(link.id);
        return next;
      });
    },
    [getConversationKey]
  );

  const closeConversation = useCallback(() => {
    activeLinkRef.current = null;
    setActiveLinkState(null);
    setMessages([]);
    localStorage.removeItem('iphty_active_link');
  }, []);

  // --- ACTION: Generate a one-time invitation code -------------------------
  const generateInvitationCode = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const myPublicKey = userSnap.data()?.iphtyPublicKey ?? '';

      if (!myPublicKey) {
        toast({
          title: 'Vault Required',
          description: 'Unlock your vault first to generate an invitation code.',
        });
        return null;
      }

      const code = generateInviteCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await setDoc(doc(db, 'iphtyInvitations', code), {
        invitorId: user.uid,
        invitorDisplayName: user.displayName ?? 'Anonymous Scribe',
        invitorPublicKey: myPublicKey,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      return code;
    } catch (err) {
      console.error('Iphty: Code generation failed:', err);
      toast({ title: 'Generation Failed', description: 'Could not forge the invitation code.' });
      return null;
    }
  }, [user, toast]);

  // --- ACTION: Redeem an invitation code -> establish active link ----------
  const redeemInvitationCode = useCallback(
    async (rawCode: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Not logged in.' };

      const code = normalizeCode(rawCode);

      try {
        const inviteSnap = await getDoc(doc(db, 'iphtyInvitations', code));

        if (!inviteSnap.exists()) {
          return { success: false, error: 'Code not found. Check the code and try again.' };
        }

        const invite = inviteSnap.data();

        if (invite.status !== 'pending') {
          return { success: false, error: 'This code has already been used.' };
        }

        if (invite.expiresAt.toDate() < new Date()) {
          return { success: false, error: 'This code has expired.' };
        }

        if (invite.invitorId === user.uid) {
          return { success: false, error: 'You cannot use your own invitation code.' };
        }

        const existingActive = linksRef.current.find(
          (l) => l.participants.includes(invite.invitorId) && l.status === 'active'
        );
        if (existingActive) {
          return { success: false, error: 'You already have an active channel with this scribe.' };
        }

        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const myPublicKey = userSnap.data()?.iphtyPublicKey ?? '';

        if (!myPublicKey) {
          return {
            success: false,
            error: 'Your cipher key is not initialized. Unlock your vault first.',
          };
        }

        const participants = [user.uid, invite.invitorId].sort();
        await addDoc(collection(db, 'iphtyLinks'), {
          participants,
          requestorId: invite.invitorId,
          requesteeId: user.uid,
          requestorDisplayName: invite.invitorDisplayName,
          requesteeDisplayName: user.displayName ?? 'Anonymous Scribe',
          requestorPublicKey: invite.invitorPublicKey,
          requesteePublicKey: myPublicKey,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'iphtyInvitations', code), {
          status: 'used',
          redeemedBy: user.uid,
          redeemedAt: serverTimestamp(),
        });

        return { success: true };
      } catch (err) {
        console.error('Iphty: Redeem failed:', err);
        return { success: false, error: 'An error occurred. Check the code and try again.' };
      }
    },
    [user]
  );

  // --- ACTION: Send an encrypted message -----------------------------------
  const sendMessage = useCallback(
    async (link: IphtyLink, text: string) => {
      if (!user || !text.trim()) return;

      const convKey = await getConversationKey(link);
      if (!convKey) {
        toast({
          title: 'Cipher Unavailable',
          description: 'Unlock your vault to send transmissions.',
        });
        return;
      }

      try {
        const { ciphertext, iv } = await encryptData(convKey, text.trim());
        await addDoc(collection(db, 'iphtyLinks', link.id, 'messages'), {
          senderId: user.uid,
          senderDisplayName: user.displayName ?? 'Anonymous Scribe',
          ciphertext: bufferToBase64(ciphertext),
          iv: bufferToBase64(iv.buffer as ArrayBuffer),
          createdAt: serverTimestamp(),
        });
        // Update the link doc so the recipient's sidebar node can detect a new message
        await updateDoc(doc(db, 'iphtyLinks', link.id), {
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: user.uid,
        });
      } catch (err) {
        console.error('Iphty: Message send failed:', err);
        toast({ title: 'Transmission Failed', description: 'The cipher failed to seal your message.' });
      }
    },
    [user, getConversationKey, toast]
  );

  const activeLinks = links.filter((l) => l.status === 'active');

  return {
    links,
    loading,
    iphtyReady,
    keySetupStatus,
    activeLink,
    messages,
    messagesLoading,
    activeLinks,
    unreadLinkIds,
    openConversation,
    closeConversation,
    generateInvitationCode,
    redeemInvitationCode,
    sendMessage,
  };
}

// ─── Sidebar hook: pulse the node orb when there are unread messages ─────────
// Compares lastMessageAt on each link against a localStorage timestamp that
// openConversation() updates whenever the user opens that channel.
export function useIphtyNodeActive(): boolean {
  const { user } = useAuth();
  const [nodeActive, setNodeActive] = useState(false);

  useEffect(() => {
    if (!user) {
      setNodeActive(false);
      return;
    }
    const q = query(
      collection(db, 'iphtyLinks'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'active')
    );
    const unsub = onSnapshot(q, (snap) => {
      const hasUnread = snap.docs.some((d) => {
        const data = d.data();
        // No message yet / I sent the last one → no unread
        if (!data.lastMessageAt || data.lastMessageSenderId === user.uid) return false;
        const lastSeen = parseInt(localStorage.getItem(`iphty_seen_${d.id}`) ?? '0', 10);
        const lastMsgMs: number = data.lastMessageAt?.toMillis?.() ?? 0;
        return lastMsgMs > lastSeen;
      });
      setNodeActive(hasUnread);
    });
    return () => unsub();
  }, [user]);

  return nodeActive;
}

// ─── Always-on hook: fires OS notifications for new Iphty messages ────────────
// Mount this in GlobalBanners (root layout) so it runs on every page,
// not just the Iphty Link page.
export function useIphtyMessageNotifications(): void {
  const { user } = useAuth();
  const { toast } = useToast();
  const notifInitializedRef = useRef(false);

  // Register the service worker and request notification permission once
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    // Register SW so showNotification() uses the app icon, not the browser icon
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[Iphty SW] Registration failed:', err);
      });
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {/* silently ignore */});
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      notifInitializedRef.current = false;
      return;
    }

    const q = query(
      collection(db, 'iphtyLinks'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(q, (snap) => {
      // The very first snapshot is the initial load — all docs come through
      // as 'added'. Skip it so we don't notify for stale messages.
      if (!notifInitializedRef.current) {
        notifInitializedRef.current = true;
        return;
      }

      for (const change of snap.docChanges()) {
        // Only care about documents that were modified (new message sent)
        if (change.type !== 'modified') continue;

        const data = change.doc.data();

        // No message timestamp, or I sent it — skip
        if (!data.lastMessageAt) continue;
        if (data.lastMessageSenderId === user.uid) continue;

        // Conversation is currently open — skip
        const activeLinkId = localStorage.getItem('iphty_active_link');
        if (activeLinkId === change.doc.id) continue;

        const senderName =
          data.requestorId === user.uid
            ? (data.requesteeDisplayName ?? 'Unknown Scribe')
            : (data.requestorDisplayName ?? 'Unknown Scribe');

        // Try service-worker notification first (shows app icon in taskbar)
        if (
          'Notification' in window &&
          Notification.permission === 'granted' &&
          'serviceWorker' in navigator
        ) {
          navigator.serviceWorker.ready
            .then((registration) => {
              registration.showNotification('New Iphty Transmission', {
                body: `${senderName} sent you an encrypted message.`,
                icon: '/icons/iphty-link-duck-notification-icon-512.svg',
                image: '/icons/iphty-link-duck-notification-icon-512.svg',
                badge: '/icons/iphty-link-duck-notification-icon-512.svg',
                tag: `iphty-msg-${change.doc.id}`,
                renotify: true,
                data: { url: '/iphty-link' },
              });
            })
            .catch((err) => {
              console.error('[Iphty] SW notification failed:', err);
              // Fallback to plain notification
              try {
                new Notification('New Iphty Transmission', {
                  body: `${senderName} sent you an encrypted message.`,
                  icon: '/icons/iphty-link-duck-notification-icon-512.svg',
                  tag: `iphty-msg-${change.doc.id}`,
                });
              } catch {/* silently ignore */}
            });
        } else {
          // In-app toast fallback when OS notifications are unavailable
          toast({
            title: '𓅭 New Iphty Transmission',
            description: `${senderName} sent you an encrypted message.`,
          });
        }
      }
    });

    return () => {
      unsub();
      notifInitializedRef.current = false;
    };
  }, [user, toast]);
}
