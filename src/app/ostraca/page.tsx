"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Lock, Unlock, X, Check,
  FolderPlus, BookOpen, Shield
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useOstraca } from '@/hooks/use-ostraca';
import { OstracaTileCard } from '@/components/ostraca/OstracaTileCard';
import { VaultGate } from '@/components/ostraca/VaultGate';
import { FirstPylonIcon } from '@/components/icons/FirstPylonIcon';
import type { OstracaTile, OstracaCollection, OstracaTileColor } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// COLOR CONSTANTS
// ─────────────────────────────────────────────────────────────
const COLORS: { value: OstracaTileColor; label: string; swatch: string }[] = [
  { value: 'amber',   label: 'Amber',   swatch: 'border-amber-500   bg-amber-500/20   text-amber-300' },
  { value: 'cyan',    label: 'Cyan',    swatch: 'border-cyan-500    bg-cyan-500/20    text-cyan-300' },
  { value: 'rose',    label: 'Rose',    swatch: 'border-rose-500    bg-rose-500/20    text-rose-300' },
  { value: 'emerald', label: 'Emerald', swatch: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
  { value: 'purple',  label: 'Purple',  swatch: 'border-purple-500  bg-purple-500/20  text-purple-300' },
];

const TAB_ACTIVE: Record<OstracaTileColor, string> = {
  amber:   'border-amber-400   text-amber-300   bg-amber-950/40   shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  cyan:    'border-cyan-400    text-cyan-300    bg-cyan-950/40    shadow-[0_0_20px_rgba(34,211,238,0.3)]',
  rose:    'border-rose-400    text-rose-300    bg-rose-950/40    shadow-[0_0_20px_rgba(244,63,94,0.3)]',
  emerald: 'border-emerald-400 text-emerald-300 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  purple:  'border-purple-400  text-purple-300  bg-purple-950/40  shadow-[0_0_20px_rgba(168,85,247,0.3)]',
};

// ─────────────────────────────────────────────────────────────
// DIALOG OVERLAY SHELL
// ─────────────────────────────────────────────────────────────
function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-[#0f0518] border border-cyan-900/50 rounded-2xl p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)]"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADD COLLECTION DIALOG
// ─────────────────────────────────────────────────────────────
interface AddCollectionDialogProps {
  onClose: () => void;
  onSave: (name: string, isVault: boolean, color: OstracaTileColor) => void;
}
function AddCollectionDialog({ onClose, onSave }: AddCollectionDialogProps) {
  const [name, setName]       = useState('');
  const [isVault, setIsVault] = useState(false);
  const [color, setColor]     = useState<OstracaTileColor>('cyan');

  return (
    <DialogOverlay onClose={onClose}>
      <h2 className="text-2xl font-headline text-cyan-400 tracking-wider mb-1">New Collection</h2>
      <p className="text-muted-foreground text-sm mb-6">Name and configure your new ostraca collection.</p>

      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">Name</h4>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Collection name..."
            className="cyber-input font-body text-sm"
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim(), isVault, color)}
          />
        </div>

        <div>
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">Colour</h4>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  'px-3 py-1.5 rounded border text-xs font-body font-bold tracking-wider uppercase transition-all',
                  c.swatch,
                  color === c.value ? 'opacity-100 scale-105 ring-1 ring-white/20' : 'opacity-40 hover:opacity-70'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-md border border-cyan-900/30">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setIsVault(v => !v)}
              className={cn(
                'w-10 h-5 rounded-full border transition-all relative flex-shrink-0',
                isVault ? 'border-amber-500 bg-amber-500/20' : 'border-slate-700 bg-black'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full transition-all',
                isVault ? 'left-5 bg-amber-400' : 'left-0.5 bg-slate-600'
              )} />
            </div>
            <div>
              <p className={cn('font-body font-bold text-sm', isVault ? 'text-amber-400' : 'text-slate-400')}>
                {isVault ? 'Vault Collection' : 'Standard Collection'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isVault ? 'Requires your Vault PIN to view tiles.' : 'Tiles always visible when archive is unlocked.'}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-8 pt-4 border-t border-cyan-900/30">
        <button onClick={onClose} className="cyber-input-white flex-1 text-sm font-body font-bold tracking-wider">
          Cancel
        </button>
        <button
          disabled={!name.trim()}
          onClick={() => name.trim() && onSave(name.trim(), isVault, color)}
          className="flex-1 py-2 px-4 rounded-md border-2 border-cyan-500 bg-cyan-500/10 text-cyan-300 font-body font-bold text-sm tracking-wider hover:bg-cyan-500/20 transition-all disabled:opacity-30"
        >
          Inscribe
        </button>
      </div>
    </DialogOverlay>
  );
}

// ─────────────────────────────────────────────────────────────
// TILE DIALOG (add / edit)
// ─────────────────────────────────────────────────────────────
interface TileDialogProps {
  tile?: OstracaTile;
  initialContent?: string;
  collections: OstracaCollection[];
  defaultCollectionId?: string;
  isVaultUnlocked: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, collectionId: string) => void;
}
function TileDialog({
  tile, initialContent, collections, defaultCollectionId,
  isVaultUnlocked, onClose, onSave
}: TileDialogProps) {
  const [title,        setTitle]        = useState(tile?.title ?? '');
  const [content,      setContent]      = useState(initialContent ?? '');
  const [collectionId, setCollectionId] = useState(
    tile?.collectionId ?? defaultCollectionId ?? collections[0]?.id ?? ''
  );

  const availableCollections = collections.filter(c => !c.isVault || isVaultUnlocked);

  // If collectionId is still empty after Firestore collections load, pick the first available one
  useEffect(() => {
    if (!collectionId && availableCollections.length > 0) {
      setCollectionId(availableCollections[0].id);
    }
  }, [availableCollections.length, collectionId]);

  return (
    <DialogOverlay onClose={onClose}>
      <h2 className="text-2xl font-headline text-cyan-400 tracking-wider mb-1">
        {tile ? 'Edit Ostracon' : 'New Ostracon'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {tile ? 'Reseal with updated contents.' : 'Inscribe a new tile of knowledge.'}
      </p>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">Title</h4>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ostracon title..."
            className="cyber-input font-body text-sm"
          />
        </div>
        <div>
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">Scribe Notes</h4>
          <div className="bg-slate-900/50 rounded-md border border-cyan-900/30">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Inscribe your thoughts on this shard..."
              rows={6}
              className="w-full bg-transparent p-4 font-mono text-sm text-slate-300 leading-relaxed resize-none outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
        {!tile && availableCollections.length > 1 && (
          <div>
            <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">Collection</h4>
            <select
              value={collectionId}
              onChange={e => setCollectionId(e.target.value)}
              className="cyber-input font-body text-sm w-full bg-black"
            >
              {availableCollections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8 pt-4 border-t border-cyan-900/30">
        <button onClick={onClose} className="cyber-input-white flex-1 text-sm font-body font-bold tracking-wider">
          Cancel
        </button>
        <button
          disabled={!title.trim() || !collectionId}
          onClick={() => title.trim() && collectionId && onSave(title.trim(), content, collectionId)}
          className="flex-1 py-2 px-4 rounded-md border-2 border-cyan-500 bg-cyan-500/10 text-cyan-300 font-body font-bold text-sm tracking-wider hover:bg-cyan-500/20 transition-all disabled:opacity-30"
        >
          {tile ? 'Update Seal' : 'Inscribe'}
        </button>
      </div>
    </DialogOverlay>
  );
}

// ─────────────────────────────────────────────────────────────
// COLLECTION TAB
// ─────────────────────────────────────────────────────────────
function CollectionTab({
  coll, isActive, onClick, onDelete,
}: {
  coll: OstracaCollection;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative group/tab">
      <button
        onClick={onClick}
        className={cn(
          'h-12 md:h-10 px-4 flex items-center gap-2 border font-body font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-black',
          isActive
            ? TAB_ACTIVE[coll.color]
            : 'border-cyan-400/40 text-cyan-400/60 hover:border-cyan-400 hover:text-cyan-400'
        )}
      >
        <div className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all',
          isActive ? 'bg-current shadow-[0_0_6px_currentColor]' : 'bg-current opacity-40'
        )} />
        {coll.name}
      </button>
      {isActive && (
        <button
          onClick={() => confirmDelete ? onDelete() : setConfirmDelete(true)}
          onBlur={() => setConfirmDelete(false)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500 flex items-center justify-center transition-all opacity-0 group-hover/tab:opacity-100 z-10"
          title={confirmDelete ? 'Confirm delete' : 'Delete collection'}
        >
          {confirmDelete ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyState({ isVault, isLocked, onAdd }: {
  isVault: boolean; isLocked: boolean; onAdd: () => void;
}) {
  if (isLocked) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-amber-900/30 rounded-lg">
        <Lock className="h-12 w-12 mx-auto text-amber-800 mb-4" />
        <h3 className="text-xl text-amber-600 font-headline">Vault Sealed</h3>
        <p className="text-muted-foreground text-sm mt-2">Enter the PIN to access vault ostraca.</p>
      </div>
    );
  }
  return (
    <div className="p-8 text-center border-2 border-dashed border-cyan-900/30 rounded-lg">
      <BookOpen className="h-12 w-12 mx-auto text-cyan-800 mb-4" />
      <h3 className="text-xl text-cyan-600 font-headline">
        {isVault ? 'No Vault Ostraca Yet' : 'No Ostraca Yet'}
      </h3>
      <p className="text-muted-foreground text-sm mt-2 mb-4">
        {isVault
          ? 'Inscribe encrypted tiles into the vault.'
          : 'Inscribe your first shard of ephemeral wisdom.'}
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 border-2 border-cyan-700 text-cyan-400 rounded-lg hover:border-cyan-500 font-body font-bold text-sm tracking-wider transition-all"
      >
        + Inscribe First Ostracon
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function OstracaPage() {
  const router = useRouter();
  const { user, masterKey } = useAuth();

  const { tiles, collections, loading, addCollection, deleteCollection, addTile, updateTile, deleteTile } = useOstraca();

  const [activeCollectionId, setActiveCollectionId] = useState<string | 'vault' | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked]       = useState(false);
  const [showVaultGate, setShowVaultGate]            = useState(false);
  const [showAddCollection, setShowAddCollection]    = useState(false);
  const [showTileDialog, setShowTileDialog]          = useState(false);
  const [editTarget, setEditTarget]                  = useState<{ tile: OstracaTile; content: string } | null>(null);

  // Auth redirect
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    if (collections.length > 0 && activeCollectionId === null) {
      const first = collections.find(c => !c.isVault);
      if (first) setActiveCollectionId(first.id);
    }
  }, [collections, activeCollectionId]);

  const publicCollections = collections.filter(c => !c.isVault);
  const vaultCollections  = collections.filter(c =>  c.isVault);
  const activeColl        = collections.find(c => c.id === activeCollectionId);
  const visibleTiles      = activeCollectionId === 'vault'
    ? tiles.filter(t => t.isVault)
    : tiles.filter(t => t.collectionId === activeCollectionId);

  const handleAddCollection = async (name: string, isVault: boolean, color: OstracaTileColor) => {
    await addCollection(name, isVault, color);
    setShowAddCollection(false);
  };

  const handleAddTile = async (title: string, content: string, collectionId: string) => {
    const coll = collections.find(c => c.id === collectionId);
    await addTile(title, content, collectionId, coll?.isVault ?? false);
    setShowTileDialog(false);
  };

  const handleUpdateTile = async (title: string, content: string) => {
    if (!editTarget) return;
    await updateTile(editTarget.tile.id, title, content, editTarget.tile.iv);
    setEditTarget(null);
  };

  const handleVaultClick = () => {
    if (isVaultUnlocked) setActiveCollectionId('vault');
    else setShowVaultGate(true);
  };

  const handleVaultUnlock = () => {
    setIsVaultUnlocked(true);
    setShowVaultGate(false);
    setActiveCollectionId('vault');
  };

  if (!user) return null;

  // For vault tab: prefer first vault collection, fall back to any collection
  const defaultColId = activeCollectionId === 'vault'
    ? (vaultCollections[0]?.id ?? collections[0]?.id ?? undefined)
    : (typeof activeCollectionId === 'string' ? activeCollectionId : undefined);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="w-full flex justify-between items-start mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-950/40 rounded-2xl p-2 hover:border-cyan-300 hover:bg-cyan-900/40 transition-all"
        >
          <FirstPylonIcon size={60} className="text-cyan-400" />
          <span className="text-[8px] uppercase text-cyan-300 tracking-widest">To Main Hall</span>
        </button>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setShowAddCollection(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-cyan-800 text-cyan-400 rounded-lg hover:border-cyan-500 hover:bg-cyan-950/40 font-body font-bold text-sm tracking-wider transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:block">New Collection</span>
          </button>
          {activeCollectionId && activeCollectionId !== 'vault' && (
            <button
              onClick={() => setShowTileDialog(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-emerald-600 text-emerald-400 rounded-lg hover:border-emerald-400 hover:bg-emerald-950/40 font-body font-bold text-sm tracking-wider transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">New Ostracon</span>
            </button>
          )}
          {activeCollectionId === 'vault' && isVaultUnlocked && (
            <button
              onClick={() => setShowTileDialog(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-amber-600 text-amber-400 rounded-lg hover:border-amber-400 hover:bg-amber-950/40 font-body font-bold text-sm tracking-wider transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">New Vault Ostracon</span>
            </button>
          )}
        </div>
      </div>

      {/* PAGE TITLE */}
      <div className="mb-6 border-b border-cyan-900/50 pb-4">
        <h1 className="text-3xl font-headline text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          The Ostraca
        </h1>
        <p className="text-muted-foreground mt-1">Ephemeral shards of thought, sealed with the master key.</p>
      </div>

      {/* ENCRYPTION NOTICE */}
      {!masterKey && (
        <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg">
          <p className="text-amber-400/70 font-body text-sm">
            🔒 Vault key not loaded — ostraca are sealed. Unlock the Archives to read your inscriptions.
          </p>
        </div>
      )}

      {/* ── COLLECTION TABS ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {publicCollections.map(coll => (
          <CollectionTab
            key={coll.id}
            coll={coll}
            isActive={activeCollectionId === coll.id}
            onClick={() => setActiveCollectionId(coll.id)}
            onDelete={() => deleteCollection(coll.id)}
          />
        ))}

        <button
          onClick={handleVaultClick}
          className={cn(
            'flex items-center gap-2 h-12 md:h-10 px-4 border font-body font-bold text-xs uppercase tracking-widest transition-all active:scale-95',
            activeCollectionId === 'vault' && isVaultUnlocked
              ? 'border-amber-400 text-amber-300 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'border-amber-500/40 text-amber-500/60 hover:border-amber-400 hover:text-amber-400 bg-black'
          )}
        >
          {isVaultUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          The Vault
        </button>
      </div>

      {/* ── SECTION HEADER ──────────────────────────────────── */}
      {activeColl && (
        <div className="mb-6 border-b border-cyan-900/30 pb-2">
          <h2 className="font-headline text-lg text-cyan-400 tracking-wider">{activeColl.name}</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mt-0.5">
            {visibleTiles.length} ostraca inscribed
          </p>
        </div>
      )}
      {activeCollectionId === 'vault' && (
        <div className="mb-6 border-b border-amber-900/30 pb-2">
          <h2 className="font-headline text-lg text-amber-400 tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5" />
            The Vault
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mt-0.5">
            {visibleTiles.length} sealed ostraca
          </p>
        </div>
      )}

      {/* ── VAULT GATE ──────────────────────────────────────── */}
      <AnimatePresence>
        {showVaultGate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-xs mx-auto mb-8 border-2 border-amber-500/30 rounded-2xl bg-gradient-to-b from-slate-950 to-black shadow-[0_0_40px_rgba(245,158,11,0.12)]"
          >
            <VaultGate onUnlock={handleVaultUnlock} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TILE GRID ───────────────────────────────────────── */}
      {activeCollectionId && !showVaultGate && (
        loading ? (
          <div className="p-8 text-center border-2 border-dashed border-cyan-900/30 rounded-lg">
            <p className="font-mono text-cyan-600 animate-pulse tracking-widest uppercase text-sm">
              Unsealing records...
            </p>
          </div>
        ) : visibleTiles.length === 0 ? (
          <EmptyState
            isVault={activeCollectionId === 'vault'}
            isLocked={activeCollectionId === 'vault' && !isVaultUnlocked}
            onAdd={() => setShowTileDialog(true)}
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {visibleTiles.map(tile => {
                const coll = collections.find(c => c.id === tile.collectionId);
                return (
                  <OstracaTileCard
                    key={tile.id}
                    tile={tile}
                    isVaultUnlocked={isVaultUnlocked}
                    color={coll?.color ?? 'cyan'}
                    onEdit={(t, content) => setEditTarget({ tile: t, content })}
                    onDelete={deleteTile}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )
      )}

      {/* No collection selected */}
      {!activeCollectionId && !loading && (
        <div className="p-8 text-center border-2 border-dashed border-cyan-900/30 rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-cyan-800 mb-4" />
          <h3 className="text-xl text-cyan-600 font-headline">No Collections Yet</h3>
          <p className="text-muted-foreground text-sm mt-2 mb-4">Create your first collection to begin inscribing ostraca.</p>
          <button
            onClick={() => setShowAddCollection(true)}
            className="px-4 py-2 border-2 border-cyan-700 text-cyan-400 rounded-lg hover:border-cyan-500 font-body font-bold text-sm tracking-wider transition-all"
          >
            + First Collection
          </button>
        </div>
      )}

      {/* ── DIALOGS ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddCollection && (
          <AddCollectionDialog
            onClose={() => setShowAddCollection(false)}
            onSave={handleAddCollection}
          />
        )}
        {(showTileDialog || editTarget) && (
          <TileDialog
            tile={editTarget?.tile}
            initialContent={editTarget?.content}
            collections={collections}
            defaultCollectionId={defaultColId}
            isVaultUnlocked={isVaultUnlocked}
            onClose={() => { setShowTileDialog(false); setEditTarget(null); }}
            onSave={editTarget ? handleUpdateTile : handleAddTile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
