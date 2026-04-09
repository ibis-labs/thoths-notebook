"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Lock, Unlock, X, Check,
  FolderPlus, BookOpen, Shield, ListChecks, Square, CheckSquare2, Trash2
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useOstraca } from '@/hooks/use-ostraca';
import { OstracaTileCard } from '@/components/ostraca/OstracaTileCard';
import { VaultGate } from '@/components/ostraca/VaultGate';
import { EphemeraModal } from '@/components/ostraca/EphemeraModal';
import { BanishmentPortal } from '@/components/banishment-portal';
import { FirstPylonIcon } from '@/components/icons/FirstPylonIcon';
import { OstraconIconLarge } from '@/components/icons/ostracon-icon-large';
import { IphtyLinkDuckIcon } from '@/components/icons/IphtyLinkDuckIcon';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import type { OstracaTile, OstracaCollection, OstracaTileColor, ChecklistItem } from '@/lib/types';
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
  amber:   'border-amber-400   text-amber-300   bg-amber-950/40   shadow-[0_0_18px_rgba(245,158,11,0.35)]   ring-1 ring-amber-400/40 ring-offset-1 ring-offset-black',
  cyan:    'border-cyan-400    text-cyan-300    bg-cyan-950/40    shadow-[0_0_18px_rgba(34,211,238,0.35)]    ring-1 ring-cyan-400/40 ring-offset-1 ring-offset-black',
  rose:    'border-rose-400    text-rose-300    bg-rose-950/40    shadow-[0_0_18px_rgba(244,63,94,0.35)]     ring-1 ring-rose-400/40 ring-offset-1 ring-offset-black',
  emerald: 'border-emerald-400 text-emerald-300 bg-emerald-950/40 shadow-[0_0_18px_rgba(16,185,129,0.35)]   ring-1 ring-emerald-400/40 ring-offset-1 ring-offset-black',
  purple:  'border-purple-400  text-purple-300  bg-purple-950/40  shadow-[0_0_18px_rgba(168,85,247,0.35)]   ring-1 ring-purple-400/40 ring-offset-1 ring-offset-black',
};

const TAB_INACTIVE: Record<OstracaTileColor, string> = {
  amber:   'border-amber-500/55   text-amber-400/70   ring-1 ring-amber-500/20   ring-offset-1 ring-offset-black',
  cyan:    'border-cyan-500/55    text-cyan-400/70    ring-1 ring-cyan-500/20    ring-offset-1 ring-offset-black',
  rose:    'border-rose-500/55    text-rose-400/70    ring-1 ring-rose-500/20    ring-offset-1 ring-offset-black',
  emerald: 'border-emerald-500/55 text-emerald-400/70 ring-1 ring-emerald-500/20 ring-offset-1 ring-offset-black',
  purple:  'border-purple-500/55  text-purple-400/70  ring-1 ring-purple-500/20  ring-offset-1 ring-offset-black',
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
  isVaultContext?: boolean;  // restrict everything to vault collections only
  isVaultUnlocked: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, collectionId: string, checklistItems: ChecklistItem[]) => void;
}

const ciUid = () => Math.random().toString(36).slice(2, 9);

function TileDialog({
  tile, initialContent, collections, defaultCollectionId, isVaultContext,
  isVaultUnlocked, onClose, onSave
}: TileDialogProps) {
  // Vault is its own implicit collection — no Firestore collection doc needed
  const poolCollections = isVaultContext
    ? []
    : collections.filter(c => !c.isVault || isVaultUnlocked);

  const [title,        setTitle]        = useState(tile?.title ?? '');
  const [content,      setContent]      = useState(initialContent ?? '');
  const [collectionId, setCollectionId] = useState(
    isVaultContext ? '__vault__' : (tile?.collectionId ?? defaultCollectionId ?? poolCollections[0]?.id ?? '')
  );

  const hasExistingList = (tile?.checklistItems?.length ?? 0) > 0;
  const [showChecklist,  setShowChecklist]  = useState(hasExistingList);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(tile?.checklistItems ?? []);
  const [newCiText,      setNewCiText]      = useState('');

  // Auto-select first pool collection when empty (regular tiles only)
  useEffect(() => {
    if (isVaultContext) return;
    if (!collectionId && poolCollections.length > 0) {
      setCollectionId(poolCollections[0].id);
    }
  }, [poolCollections.length, collectionId, isVaultContext]);

  const headingColor = isVaultContext ? 'text-amber-400' : 'text-cyan-400';
  const buttonColor  = isVaultContext
    ? 'border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
    : 'border-cyan-500 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20';
  const dividerColor = isVaultContext ? 'border-amber-900/30' : 'border-cyan-900/30';

  const addCi = () => {
    const text = newCiText.trim();
    if (!text) return;
    setChecklistItems(prev => [...prev, { id: ciUid(), text, checked: false }]);
    setNewCiText('');
  };

  const toggleCi = (id: string) =>
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  const updateCiText = (id: string, text: string) =>
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, text } : i));

  const deleteCi = (id: string) =>
    setChecklistItems(prev => prev.filter(i => i.id !== id));

  return (
    <DialogOverlay onClose={onClose}>
      <h2 className={`text-2xl font-headline tracking-wider mb-1 ${headingColor}`}>
        {tile ? 'Edit Ostracon' : isVaultContext ? 'New Vault Ostracon' : 'New Ostracon'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {tile ? 'Reseal with updated contents.' : isVaultContext ? 'Inscribe an encrypted tile into the Vault.' : 'Inscribe a new tile of knowledge.'}
      </p>

      {/* Vault mode indicator — always shown when isVaultContext and adding new */}
      {isVaultContext && !tile && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md border border-amber-500/30 bg-amber-950/20">
          <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
            Vault &mdash; sealed with master key
          </span>
        </div>
      )}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
              rows={4}
              className="w-full bg-transparent p-4 font-mono text-sm text-slate-300 leading-relaxed resize-none outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* ── MAKE LIST ──────────────────────────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setShowChecklist(v => !v)}
            className={cn(
              'flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors',
              showChecklist ? 'text-cyan-400' : 'text-cyan-700 hover:text-cyan-500'
            )}
          >
            <ListChecks className="w-3.5 h-3.5" />
            {showChecklist ? 'Hide List' : 'Make List'}
          </button>

          <AnimatePresence>
            {showChecklist && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-slate-900/50 rounded-md border border-cyan-900/30 p-3 space-y-1.5">
                  {checklistItems.length === 0 && (
                    <p className="text-xs font-mono text-slate-700 italic mb-1">No items yet.</p>
                  )}
                  {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <button
                        type="button"
                        onClick={() => toggleCi(item.id)}
                        className="flex-shrink-0 text-cyan-600 hover:text-cyan-400 transition-colors"
                      >
                        {item.checked
                          ? <CheckSquare2 className="w-3.5 h-3.5" />
                          : <Square className="w-3.5 h-3.5 opacity-50" />
                        }
                      </button>
                      <input
                        value={item.text}
                        onChange={e => updateCiText(item.id, e.target.value)}
                        className={cn(
                          'flex-1 bg-transparent font-mono text-xs outline-none border-b border-transparent focus:border-cyan-800 transition-colors py-0.5',
                          item.checked ? 'text-slate-600 line-through' : 'text-slate-300'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => deleteCi(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add item input */}
                  <div className="flex items-center gap-2 pt-1.5 border-t border-cyan-900/20">
                    <input
                      value={newCiText}
                      onChange={e => setNewCiText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCi()}
                      placeholder="Add list item..."
                      className="flex-1 bg-transparent font-mono text-xs text-slate-400 placeholder:text-slate-700 outline-none border-b border-cyan-900/20 focus:border-cyan-700 transition-colors py-0.5"
                    />
                    <button
                      type="button"
                      onClick={addCi}
                      disabled={!newCiText.trim()}
                      className="text-cyan-700 hover:text-cyan-400 disabled:opacity-20 transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collection picker — only when multiple choices exist and not in vault context */}
        {!isVaultContext && !tile && poolCollections.length > 1 && (
          <div>
            <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2">Collection</h4>
            <select
              value={collectionId}
              onChange={e => setCollectionId(e.target.value)}
              className="cyber-input font-body text-sm w-full bg-black"
            >
              {poolCollections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={`flex gap-3 mt-8 pt-4 border-t ${dividerColor}`}>
        <button onClick={onClose} className="cyber-input-white flex-1 text-sm font-body font-bold tracking-wider">
          Cancel
        </button>
        <button
          disabled={!title.trim() || !collectionId}
          onClick={() => title.trim() && collectionId && onSave(title.trim(), content, collectionId, checklistItems)}
          className={`flex-1 py-2 px-4 rounded-md border-2 font-body font-bold text-sm tracking-wider transition-all disabled:opacity-30 ${buttonColor}`}
        >
          {tile ? 'Update Seal' : 'Inscribe'}
        </button>
      </div>
    </DialogOverlay>
  );
}

// ─────────────────────────────────────────────────────────────
// EPHEMERA PINNED CARD
// ─────────────────────────────────────────────────────────────
function EphemeraCard({ tile, onClick }: { tile: OstracaTile | null; onClick: () => void }) {
  const items       = tile?.checklistItems ?? [];
  const checked     = items.filter(i => i.checked).length;
  const firstItem   = items.find(i => !i.checked);
  const scratchpad  = tile?.content ?? '';

  return (
    <button
      onClick={onClick}
      className="w-full mb-6 p-4 rounded-xl border-2 border-amber-400 ring-1 ring-amber-500/40 ring-offset-1 ring-offset-black bg-gradient-to-r from-amber-950/20 via-slate-950/60 to-[#0a0f1e] shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-[transform,filter] duration-75 text-left active:scale-[0.98] active:brightness-125"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-headline text-sm text-amber-400 tracking-[0.2em] uppercase">Ephemera</span>
         
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {items.length > 0 && (
            <span className="text-[10px] font-mono text-amber-700">
              {checked}/{items.length}
            </span>
          )}
          <span className="text-[10px] font-mono text-amber-600 uppercase tracking-wider">
            open ›
          </span>
        </div>
      </div>

      <div className="mt-2 text-xs font-mono text-slate-600 truncate">
        {firstItem
          ? `☐ ${firstItem.text}${items.length > 1 ? ` +${items.length - 1} more` : ''}`
          : scratchpad
            ? scratchpad.slice(0, 70) + (scratchpad.length > 70 ? '…' : '')
            : <span className="italic">Click to open your permanent scratchpad…</span>
        }
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// COLLECTION TAB
// ─────────────────────────────────────────────────────────────
function CollectionTab({
  coll, isActive, onClick,
}: {
  coll: OstracaCollection;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-12 md:h-10 px-4 flex items-center border-2 font-body font-bold text-xs uppercase tracking-widest rounded-lg bg-black transition-[transform,filter] duration-75 active:scale-[0.95] active:brightness-150',
        isActive ? TAB_ACTIVE[coll.color] : TAB_INACTIVE[coll.color]
      )}
    >
      {coll.name}
    </button>
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
  const searchParams = useSearchParams();
  const { user, masterKey } = useAuth();

  const { tiles, collections, loading, ephemeraTile, addCollection, deleteCollection, addTile, updateTile, updateChecklistItems, updateEphemera, deleteTile } = useOstraca();

  const [activeCollectionId, setActiveCollectionId] = useState<string | 'vault' | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked]       = useState(false);
  const [showVaultGate, setShowVaultGate]            = useState(false);
  const [showAddCollection, setShowAddCollection]    = useState(false);
  const [showTileDialog, setShowTileDialog]          = useState(false);
  const [showEphemera, setShowEphemera]              = useState(false);
  const [editTarget, setEditTarget]                  = useState<{ tile: OstracaTile; content: string } | null>(null);

  // Auth redirect
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    if (collections.length > 0 && activeCollectionId === null) {
      const requested = searchParams.get('collection');
      const first = requested
        ? collections.find(c => c.id === requested && !c.isVault) ?? collections.find(c => !c.isVault)
        : collections.find(c => !c.isVault);
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

  const handleAddTile = async (title: string, content: string, collectionId: string, checklistItems: ChecklistItem[]) => {
    const isVault = collectionId === '__vault__' || (collections.find(c => c.id === collectionId)?.isVault ?? false);
    await addTile(title, content, collectionId, isVault, checklistItems);
    setShowTileDialog(false);
  };

  const handleUpdateTile = async (title: string, content: string, _colId: string, checklistItems: ChecklistItem[]) => {
    if (!editTarget) return;
    await updateTile(editTarget.tile.id, title, content, editTarget.tile.iv, checklistItems);
    setEditTarget(null);
  };

  const handleSaveEphemera = async (scratchpad: string, checklistItems: ChecklistItem[]) => {
    await updateEphemera(scratchpad, checklistItems);
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

        {/* 🦆 IPHTY LINK — centered nav duck */}
        <button
          onClick={() => router.push('/iphty-link')}
          className="flex flex-col items-center justify-center p-0.5 rounded-2xl border-2 border-violet-400 bg-violet-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(167,139,250,0.4)] min-w-[110px]"
        >
          <IphtyLinkDuckIcon size={78} className="text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
          <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-violet-300 mt-0.5">IPHTY LINK</span>
        </button>

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

      {/* ── EPHEMERA PINNED TILE ─────────────────────────────── */}
      <EphemeraCard tile={ephemeraTile} onClick={() => setShowEphemera(true)} />

      {/* ── NEW COLLECTION ──────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => setShowAddCollection(true)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-cyan-500/60 text-cyan-400 rounded-lg font-body font-bold text-sm tracking-wider transition-[transform,filter] duration-75 active:scale-[0.95] active:brightness-150"
        >
          <FolderPlus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {/* ── COLLECTION TABS ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {publicCollections.map(coll => (
          <CollectionTab
            key={coll.id}
            coll={coll}
            isActive={activeCollectionId === coll.id}
            onClick={() => setActiveCollectionId(coll.id)}
          />
        ))}

        <button
          onClick={handleVaultClick}
          className={cn(
            'flex items-center gap-2 h-12 md:h-10 px-4 border-2 font-body font-bold text-xs uppercase tracking-widest rounded-lg bg-black transition-[transform,filter] duration-75 active:scale-[0.95] active:brightness-150',
            activeCollectionId === 'vault' && isVaultUnlocked
              ? 'border-amber-400 text-amber-300 bg-amber-950/40 shadow-[0_0_18px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40 ring-offset-1 ring-offset-black'
              : 'border-amber-500/55 text-amber-400/70 ring-1 ring-amber-500/20 ring-offset-1 ring-offset-black'
          )}
        >
          {isVaultUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          The Vault
        </button>
      </div>

      {/* ── SECTION HEADER ──────────────────────────────────── */}
      {activeColl && (
        <div className="mb-6 border-b border-cyan-900/30 pb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-lg text-cyan-400 tracking-wider">{activeColl.name}</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mt-0.5">
              {visibleTiles.length} ostraca inscribed
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowTileDialog(true)}
              className="flex flex-col items-center justify-center w-[108px] h-[108px] border-2 border-emerald-400 bg-emerald-950/40 rounded-2xl active:scale-95 transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)]"
            >
              <OstraconIconLarge className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-emerald-300 mt-1">+ New Ostracon</span>
            </button>
            <BanishmentPortal
              onConfirm={() => deleteCollection(activeColl.id)}
              ritualTitle={`"${activeColl.name}" Collection`}
            >
              <button
                className="flex flex-col items-center justify-center gap-1 w-[108px] h-[108px] border-2 border-red-500 text-red-400 rounded-lg shadow-[0_0_12px_rgba(239,68,68,0.45)] transition-[transform,filter] duration-75 active:scale-[0.95] active:brightness-150"
                title="Banish collection"
              >
                <DuamatefJar className="w-14 h-14 brightness-150 saturate-150" />
                <span className="font-body font-bold text-[9px] uppercase tracking-widest leading-none">Banish Collection</span>
              </button>
            </BanishmentPortal>
          </div>
        </div>
      )}
      {activeCollectionId === 'vault' && (
        <div className="mb-6 border-b border-amber-900/30 pb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-lg text-amber-400 tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5" />
              The Vault
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mt-0.5">
              {visibleTiles.length} sealed ostraca
            </p>
          </div>
          {isVaultUnlocked && (
            <button
              onClick={() => setShowTileDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-amber-500/60 text-amber-400 rounded-lg font-body font-bold text-xs tracking-wider transition-[transform,filter] duration-75 active:scale-[0.95] active:brightness-150 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New Vault Ostracon
            </button>
          )}
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
                    onSaveChecklist={updateChecklistItems}
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
            defaultCollectionId={activeCollectionId !== 'vault' ? defaultColId : undefined}
            isVaultContext={activeCollectionId === 'vault' && !editTarget}
            isVaultUnlocked={isVaultUnlocked}
            onClose={() => { setShowTileDialog(false); setEditTarget(null); }}
            onSave={editTarget ? handleUpdateTile : handleAddTile}
          />
        )}
        {showEphemera && ephemeraTile && (
          <EphemeraModal
            scratchpad={ephemeraTile.content ?? ''}
            checklistItems={ephemeraTile.checklistItems ?? []}
            onClose={() => setShowEphemera(false)}
            onSave={handleSaveEphemera}
          />
        )}
        {showEphemera && !ephemeraTile && (
          <EphemeraModal
            scratchpad=""
            checklistItems={[]}
            onClose={() => setShowEphemera(false)}
            onSave={handleSaveEphemera}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
