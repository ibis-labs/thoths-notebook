"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckSquare2, Square, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { decryptData, base64ToBuffer } from '@/lib/crypto';
import type { OstracaTile, OstracaTileColor, ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { Badge } from '@/components/ui/badge';

interface OstracaTileCardProps {
  tile: OstracaTile;
  isVaultUnlocked: boolean;
  color: OstracaTileColor;
  onEdit: (tile: OstracaTile, decryptedContent: string) => void;
  onDelete: (tileId: string) => void;
  onSaveChecklist?: (tileId: string, items: ChecklistItem[]) => void;
}

const COLOR_CARD: Record<OstracaTileColor, {
  borderL: string; sides: string; shadow: string;
  badgeBorder: string; badgeText: string; badgeBg: string;
  label: string; divider: string;
}> = {
  amber: {
    borderL: 'border-l-amber-500',
    sides: 'border-y border-y-amber-500/70 border-r border-r-amber-500/70',
    shadow: 'shadow-[0_0_18px_rgba(245,158,11,0.3)]',
    badgeBorder: 'border-amber-800', badgeText: 'text-amber-400', badgeBg: 'bg-amber-950',
    label: 'text-amber-400', divider: 'border-amber-900/40',
  },
  cyan: {
    borderL: 'border-l-cyan-500',
    sides: 'border-y border-y-cyan-500/70 border-r border-r-cyan-500/70',
    shadow: 'shadow-[0_0_18px_rgba(34,211,238,0.3)]',
    badgeBorder: 'border-cyan-800', badgeText: 'text-cyan-400', badgeBg: 'bg-cyan-950',
    label: 'text-cyan-400', divider: 'border-cyan-900/40',
  },
  rose: {
    borderL: 'border-l-rose-500',
    sides: 'border-y border-y-rose-500/70 border-r border-r-rose-500/70',
    shadow: 'shadow-[0_0_18px_rgba(244,63,94,0.3)]',
    badgeBorder: 'border-rose-800', badgeText: 'text-rose-400', badgeBg: 'bg-rose-950',
    label: 'text-rose-400', divider: 'border-rose-900/40',
  },
  emerald: {
    borderL: 'border-l-emerald-500',
    sides: 'border-y border-y-emerald-500/70 border-r border-r-emerald-500/70',
    shadow: 'shadow-[0_0_18px_rgba(16,185,129,0.3)]',
    badgeBorder: 'border-emerald-800', badgeText: 'text-emerald-400', badgeBg: 'bg-emerald-950',
    label: 'text-emerald-400', divider: 'border-emerald-900/40',
  },
  purple: {
    borderL: 'border-l-purple-500',
    sides: 'border-y border-y-purple-500/70 border-r border-r-purple-500/70',
    shadow: 'shadow-[0_0_18px_rgba(168,85,247,0.3)]',
    badgeBorder: 'border-purple-800', badgeText: 'text-purple-400', badgeBg: 'bg-purple-950',
    label: 'text-purple-400', divider: 'border-purple-900/40',
  },
};

export function OstracaTileCard({ tile, isVaultUnlocked, color, onEdit, onDelete, onSaveChecklist }: OstracaTileCardProps) {
  const { masterKey } = useAuth();
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded]             = useState(false);
  const [isDecrypting, setIsDecrypting]         = useState(false);
  const [localChecklist, setLocalChecklist]     = useState<ChecklistItem[]>(tile.checklistItems ?? []);

  useEffect(() => {
    setLocalChecklist(tile.checklistItems ?? []);
  }, [tile.checklistItems]);

  const toggleChecklistItem = (id: string) => {
    const updated = localChecklist.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setLocalChecklist(updated);
    onSaveChecklist?.(tile.id, updated);
  };

  const c = COLOR_CARD[color] ?? COLOR_CARD.cyan;
  const isLocked = tile.isVault && !isVaultUnlocked;

  useEffect(() => {
    if (!masterKey || isLocked) { setDecryptedContent(null); return; }
    if (!tile.isEncrypted || !tile.encryptedContent || !tile.iv) {
      setDecryptedContent((tile as any).content ?? '');
      return;
    }
    setIsDecrypting(true);
    (async () => {
      try {
        const plain = await decryptData(
          masterKey,
          base64ToBuffer(tile.encryptedContent!),
          new Uint8Array(base64ToBuffer(tile.iv!))
        );
        setDecryptedContent(plain);
      } catch {
        setDecryptedContent('[sealed — key mismatch]');
      } finally {
        setIsDecrypting(false);
      }
    })();
  }, [masterKey, tile, isLocked]);

  // Preview: first line of notes (truncated) or first unchecked list item
  const firstUnchecked = localChecklist.find(i => !i.checked);
  const previewText = isDecrypting
    ? null
    : decryptedContent?.split('\n')[0]?.slice(0, 80) || (firstUnchecked ? `☐ ${firstUnchecked.text}` : null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => !isLocked && setIsExpanded(v => !v)}
      className={cn(
        'rounded-xl border cursor-pointer relative overflow-hidden backdrop-blur-md',
        'p-5 select-none',
        'bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-[#0f0518]',
        'border-l-4',
        'transition-[transform,filter] duration-75 active:scale-[0.97] active:brightness-125',
        c.borderL, c.sides, c.shadow,
      )}
    >
      {/* Carbon-fibre texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay" />

      <div className="relative z-10">
        {/* ── TITLE ROW ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-body font-bold text-base text-slate-100 tracking-wider leading-tight flex-1">
            {tile.title || 'Untitled'}
          </h3>
          <motion.div
            animate={{ rotate: isExpanded && !isLocked ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 mt-0.5"
          >
            {isLocked
              ? <Lock className="w-4 h-4 text-amber-500/50" />
              : <ChevronDown className={cn('w-4 h-4', c.label)} />
            }
          </motion.div>
        </div>

        {/* ── BADGE ROW ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className={cn('bg-opacity-30 border text-[10px]', c.badgeBorder, c.badgeText, c.badgeBg)}
          >
            {tile.isVault ? 'Vault' : 'Ostracon'}
          </Badge>
          <span className="text-xs font-mono text-slate-400 font-medium">
            {new Date(tile.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
          {tile.isEncrypted && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
              <Lock className="w-2.5 h-2.5" /> sealed
            </span>
          )}
          {localChecklist.length > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
              <CheckSquare2 className="w-2.5 h-2.5" />
              {localChecklist.filter(i => i.checked).length}/{localChecklist.length}
            </span>
          )}
        </div>

        {/* ── PREVIEW LINE ──────────────────────────────── */}
        {isLocked ? (
          <div className="flex items-center gap-2 bg-slate-900/50 p-2.5 rounded-md border border-amber-900/30">
            <Lock className="w-3 h-3 text-amber-500/40 flex-shrink-0" />
            <span className="font-mono text-xs text-amber-500/40 tracking-widest uppercase">vault sealed</span>
          </div>
        ) : isDecrypting ? (
          <p className="font-mono text-xs text-slate-600 animate-pulse tracking-widest uppercase py-1">Unsealing...</p>
        ) : (
          <p className="font-mono text-xs text-slate-500 truncate py-0.5">
            {previewText ?? <span className="italic text-slate-700">No content scribed.</span>}
          </p>
        )}

        {/* ── EXPANDED CONTENT ──────────────────────────── */}
        <AnimatePresence initial={false}>
          {isExpanded && !isLocked && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className={cn('border-t mt-3 pt-3', c.divider)}>
                {/* Full notes */}
                {decryptedContent && (
                  <div className="bg-slate-900/50 p-3 rounded-md border border-cyan-900/30 mb-2">
                    <p className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-56 overflow-y-auto">
                      {decryptedContent}
                    </p>
                  </div>
                )}

                {/* Checklist */}
                {localChecklist.length > 0 && (
                  <div className="bg-slate-900/50 p-3 rounded-md border border-cyan-900/30 space-y-1.5 mb-3">
                    {localChecklist.map(item => (
                      <button
                        key={item.id}
                        onClick={e => { e.stopPropagation(); toggleChecklistItem(item.id); }}
                        className="flex items-center gap-2 w-full text-left active:opacity-70 transition-opacity duration-75"
                      >
                        {item.checked
                          ? <CheckSquare2 className={cn('w-3.5 h-3.5 flex-shrink-0', c.label)} />
                          : <Square className="w-3.5 h-3.5 flex-shrink-0 opacity-40 text-slate-400" />
                        }
                        <span className={cn('font-mono text-xs leading-snug', item.checked ? 'line-through text-slate-600' : 'text-slate-300')}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!decryptedContent && localChecklist.length === 0 && (
                  <div className="bg-slate-900/50 p-3 rounded-md border border-cyan-900/30 mb-3">
                    <p className="font-mono text-sm text-slate-600 italic">Nothing scribed yet.</p>
                  </div>
                )}

                {/* Action bar: Edit + Banish */}
                <div className="flex items-stretch gap-2 mt-1">
                  <div
                    role="button"
                    onClick={e => { e.stopPropagation(); onEdit(tile, decryptedContent ?? ''); }}
                    className="cyber-input-white flex-1 h-12 flex flex-col items-center justify-center select-none cursor-pointer active:invert transition-[filter] duration-75"
                  >
                    <CyberStylus className="w-7 h-7 mb-0.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    <span className="tracking-[0.15em] font-headline text-[8px] uppercase font-bold text-white/90">Edit</span>
                  </div>
                  <div
                    role="button"
                    onClick={e => { e.stopPropagation(); onDelete(tile.id); }}
                    className="flex-1 h-12 flex flex-col items-center justify-center rounded-md bg-black select-none cursor-pointer border-2 border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.3)] active:invert transition-[filter] duration-75"
                  >
                    <DuamatefJar className="w-7 h-7 mb-0.5 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                    <span className="tracking-[0.15em] font-headline text-[8px] uppercase font-bold text-red-500">Banish</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


