"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import type { OstracaCollection, OstracaTileColor } from '@/lib/types';

/**
 * Lightweight hook — only loads public (non-vault) collections.
 * Safe to call inside dialogs without triggering tile/ephemera logic.
 */
export function useOstracaCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<OstracaCollection[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'ostracaCollections'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as OstracaCollection));
      setCollections(all.filter(c => !c.isVault));
    });
  }, [user]);

  const addCollection = async (name: string, color: OstracaTileColor = 'cyan'): Promise<string | null> => {
    if (!user) return null;
    const ref = await addDoc(collection(db, 'ostracaCollections'), {
      userId: user.uid,
      name,
      isVault: false,
      color,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  };

  return { collections, addCollection };
}
