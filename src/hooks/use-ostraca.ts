"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';
import type { OstracaTile, OstracaCollection, ChecklistItem } from '@/lib/types';

export function useOstraca() {
  const { user, masterKey } = useAuth();
  const [tiles, setTiles] = useState<OstracaTile[]>([]);
  const ephemeraCreated = useRef(false);
  const [collections, setCollections] = useState<OstracaCollection[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load collections ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'ostracaCollections'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() } as OstracaCollection)));
      },
      (err) => {
        console.error('ostracaCollections snapshot error:', err);
        setCollections([]);
      }
    );
  }, [user]);

  // ── Load tiles ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'ostracaTiles'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setTiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as OstracaTile)));
        setLoading(false);
      },
      (err) => {
        console.error('ostracaTiles snapshot error:', err);
        setTiles([]);
        setLoading(false);
      }
    );
  }, [user]);

  // ── Ensure Ephemera tile exists (runs once after tiles load) ──
  useEffect(() => {
    if (!user || loading || ephemeraCreated.current) return;
    ephemeraCreated.current = true;
    const hasEphemera = tiles.some(t => t.collectionId === '__ephemera__');
    if (!hasEphemera) {
      setDoc(doc(db, 'ostracaTiles', `ephemera_${user.uid}`), {
        userId: user.uid,
        collectionId: '__ephemera__',
        title: 'Ephemera',
        isVault: false,
        isEncrypted: false,
        content: '',
        checklistItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // ── Add collection ────────────────────────────────────────────
  const addCollection = useCallback(async (
    name: string,
    isVault: boolean,
    color: OstracaCollection['color']
  ) => {
    if (!user) return;
    await addDoc(collection(db, 'ostracaCollections'), {
      userId: user.uid,
      name,
      isVault,
      color,
      createdAt: new Date().toISOString(),
    });
  }, [user]);

  // ── Delete collection (and all its tiles) ────────────────────
  const deleteCollection = useCallback(async (collectionId: string) => {
    const ownedTiles = tiles.filter(t => t.collectionId === collectionId);
    await Promise.all(ownedTiles.map(t => deleteDoc(doc(db, 'ostracaTiles', t.id))));
    await deleteDoc(doc(db, 'ostracaCollections', collectionId));
  }, [tiles]);

  // ── Add tile (encrypts on the way in) ─────────────────────────
  const addTile = useCallback(async (
    title: string,
    content: string,
    collectionId: string,
    isVault: boolean,
    checklistItems?: ChecklistItem[]
  ) => {
    if (!user) return;

    const baseFields = {
      userId: user.uid,
      collectionId,
      title,
      isVault,
      checklistItems: checklistItems ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (masterKey) {
      const { ciphertext, iv } = await encryptData(masterKey, content);
      await addDoc(collection(db, 'ostracaTiles'), {
        ...baseFields,
        isEncrypted: true,
        iv: bufferToBase64(iv.buffer as ArrayBuffer),
        encryptedContent: bufferToBase64(ciphertext),
      });
    } else {
      // No masterKey yet — store unencrypted
      await addDoc(collection(db, 'ostracaTiles'), {
        ...baseFields,
        isEncrypted: false,
        content,
      });
    }
  }, [user, masterKey]);

  // ── Update tile ───────────────────────────────────────────────
  const updateTile = useCallback(async (
    tileId: string,
    title: string,
    content: string,
    existingIv?: string,
    checklistItems?: ChecklistItem[]
  ) => {
    if (!user) return;
    const tileRef = doc(db, 'ostracaTiles', tileId);
    const extraFields = checklistItems !== undefined ? { checklistItems } : {};

    if (masterKey) {
      const ivUint8 = existingIv ? new Uint8Array(base64ToBuffer(existingIv)) : undefined;
      const { ciphertext, iv } = await encryptData(masterKey, content, ivUint8);
      await updateDoc(tileRef, {
        title,
        isEncrypted: true,
        iv: bufferToBase64(iv.buffer as ArrayBuffer),
        encryptedContent: bufferToBase64(ciphertext),
        updatedAt: new Date().toISOString(),
        ...extraFields,
      });
    }
  }, [user, masterKey]);

  // ── Update checklist items only (for in-card toggling) ────────
  const updateChecklistItems = useCallback(async (
    tileId: string,
    items: ChecklistItem[]
  ) => {
    await updateDoc(doc(db, 'ostracaTiles', tileId), {
      checklistItems: items,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  // ── Update Ephemera (plain scratchpad + checklist) ────────────
  const updateEphemera = useCallback(async (
    scratchpad: string,
    checklistItems: ChecklistItem[]
  ) => {
    if (!user) return;
    await updateDoc(doc(db, 'ostracaTiles', `ephemera_${user.uid}`), {
      content: scratchpad,
      checklistItems,
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  // ── Delete tile ───────────────────────────────────────────────
  const deleteTile = useCallback(async (tileId: string) => {
    await deleteDoc(doc(db, 'ostracaTiles', tileId));
  }, []);

  // ── Decrypt a single tile (returns plaintext or null) ─────────
  const decryptTile = useCallback(async (tile: OstracaTile): Promise<string | null> => {
    if (!masterKey) return null;
    if (!tile.isEncrypted || !tile.encryptedContent || !tile.iv) return null;
    try {
      const ciphertext = base64ToBuffer(tile.encryptedContent);
      const iv = new Uint8Array(base64ToBuffer(tile.iv));
      return await decryptData(masterKey, ciphertext, iv);
    } catch {
      return '[sealed — key mismatch]';
    }
  }, [masterKey]);

  const ephemeraTile = tiles.find(t => t.collectionId === '__ephemera__') ?? null;
  const regularTiles = tiles.filter(t => t.collectionId !== '__ephemera__');

  return {
    tiles: regularTiles,
    ephemeraTile,
    collections,
    loading,
    addCollection,
    deleteCollection,
    addTile,
    updateTile,
    updateChecklistItems,
    updateEphemera,
    deleteTile,
    decryptTile,
  };
}

