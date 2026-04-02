"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';
import type { OstracaTile, OstracaCollection } from '@/lib/types';

export function useOstraca() {
  const { user, masterKey } = useAuth();
  const [tiles, setTiles] = useState<OstracaTile[]>([]);
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
    isVault: boolean
  ) => {
    if (!user) return;

    if (masterKey) {
      const { ciphertext, iv } = await encryptData(masterKey, content);
      await addDoc(collection(db, 'ostracaTiles'), {
        userId: user.uid,
        collectionId,
        title,
        isVault,
        isEncrypted: true,
        iv: bufferToBase64(iv.buffer as ArrayBuffer),
        encryptedContent: bufferToBase64(ciphertext),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // No masterKey yet — store unencrypted (will be sealed on next save with key)
      await addDoc(collection(db, 'ostracaTiles'), {
        userId: user.uid,
        collectionId,
        title,
        isVault,
        isEncrypted: false,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [user, masterKey]);

  // ── Update tile ───────────────────────────────────────────────
  const updateTile = useCallback(async (
    tileId: string,
    title: string,
    content: string,
    existingIv?: string
  ) => {
    if (!user) return;
    const tileRef = doc(db, 'ostracaTiles', tileId);

    if (masterKey) {
      const ivUint8 = existingIv ? new Uint8Array(base64ToBuffer(existingIv)) : undefined;
      const { ciphertext, iv } = await encryptData(masterKey, content, ivUint8);
      await updateDoc(tileRef, {
        title,
        isEncrypted: true,
        iv: bufferToBase64(iv.buffer as ArrayBuffer),
        encryptedContent: bufferToBase64(ciphertext),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [user, masterKey]);

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

  return {
    tiles,
    collections,
    loading,
    addCollection,
    deleteCollection,
    addTile,
    updateTile,
    deleteTile,
    decryptTile,
  };
}
