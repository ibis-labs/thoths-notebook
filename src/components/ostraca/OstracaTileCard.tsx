"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { decryptData, base64ToBuffer } from '@/lib/crypto';
import type { OstracaTile, OstracaTileColor } from '@/lib/types';
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
}

// Mirrors the exact border-l + side-border + shadow pattern from task-card.tsx
const COLOR_CARD: Record<OstracaTileColor, {
  borderL: string; sides: string; shadow: string;
  hoverBorderL: string; hoverSides: string; hoverShadow: string;
  badgeBorder: string; badgeText: string; badgeBg: string;
  label: string;
}> = {
  amber: {
    borderL: 'border-l-amber-500',
    sides: 'border-y border-y-amber-500/50 border-r border-r-amber-500/50',
    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    hoverBorderL: 'hover:border-l-amber-400',
    hoverSides: 'hover:border-y-amber-500 hover:border-r-amber-500',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    badgeBorder: 'border-amber-800', badgeText: 'text-amber-400', badgeBg: 'bg-amber-950',
    label: 'text-amber-400',
  },
  cyan: {
    borderL: 'border-l-cyan-500',
    sides: 'border-y border-y-cyan-500/50 border-r border-r-cyan-500/50',
    shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.25)]',
    hoverBorderL: 'hover:border-l-cyan-400',
    hoverSides: 'hover:border-y-cyan-500 hover:border-r-cyan-500',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]',
    badgeBorder: 'border-cyan-800', badgeText: 'text-cyan-400', badgeBg: 'bg-cyan-950',
    label: 'text-cyan-400',
  },
  rose: {
    borderL: 'border-l-rose-500',
    sides: 'border-y border-y-rose-500/50 border-r border-r-rose-500/50',
    shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    hoverBorderL: 'hover:border-l-rose-400',
    hoverSides: 'hover:border-y-rose-500 hover:border-r-rose-500',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]',
    badgeBorder: 'border-rose-800', badgeText: 'text-rose-400', badgeBg: 'bg-rose-950',
    label: 'text-rose-400',
  },
  emerald: {
    borderL: 'border-l-emerald-500',
    sides: 'border-y border-y-emerald-500/50 border-r border-r-emerald-500/50',
    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    hoverBorderL: 'hover:border-l-emerald-400',
    hoverSides: 'hover:border-y-emerald-500 hover:border-r-emerald-500',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]',
    badgeBorder: 'border-emerald-800', badgeText: 'text-emerald-400', badgeBg: 'bg-emerald-950',
    label: 'text-emerald-400',
  },
  purple: {
    borderL: 'border-l-purple-500',
    sides: 'border-y border-y-purple-500/50 border-r border-r-purple-500/50',
    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
    hoverBorderL: 'hover:border-l-purple-400',
    hoverSides: 'hover:border-y-purple-500 hover:border-r-purple-500',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    badgeBorder: 'border-purple-800', badgeText: 'text-purple-400', badgeBg: 'bg-purple-950',
    label: 'text-purple-400',
  },
};

export function OstracaTileCard({ tile, isVaultUnlocked, color, onEdit, onDelete }: OstracaTileCardProps) {
  const { masterKey } = useAuth();
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isRevealed, setIsRevealed]             = useState(false);
  const [isDecrypting, setIsDecrypting]         = useState(false);

  const c = COLOR_CARD[color] ?? COLOR_CARD.cyan;
  const isLocked = tile.isVault && !isVaultUnlocked;

  // ── Auto-decrypt when key + vault state allow ──────────────
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        // Exact gradient from task-card
        'rounded-xl border transition-all duration-500 cursor-pointer group relative overflow-hidden backdrop-blur-md',
        'p-5',
        'bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-[#0f0518]',
        'border-l-4',
        'hover:scale-[1.01]',
        c.borderL, c.sides, c.shadow,
        c.hoverBorderL, c.hoverSides, c.hoverShadow
      )}
    >
      {/* Carbon-fibre texture overlay (same as task-card) */}
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay" />

      <div className="relative z-10">
        {/* ── TITLE ROW ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-body font-bold text-base text-slate-100 tracking-wider leading-tight flex-1">
            {tile.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {!isLocked && (
              <button
                onClick={() => setIsRevealed(v => !v)}
                className={cn(
                  'transition-colors duration-300 pl-0 flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider',
                  c.label,
                )}
                title={isRevealed ? 'Conceal' : 'Reveal'}
              >
                {isRevealed
                  ? <EyeOff className="w-3.5 h-3.5" />
                  : <Eye className="w-3.5 h-3.5" />
                }
              </button>
            )}
          </div>
        </div>

        {/* ── BADGE ROW ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
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
        </div>

        {/* ── CONTENT AREA ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-md border border-amber-900/30 min-h-[48px]"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500/40 flex-shrink-0" />
              <span className="font-mono text-xs text-amber-500/40 tracking-widest uppercase">vault sealed</span>
            </motion.div>
          ) : isDecrypting ? (
            <motion.div
              key="decrypting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-slate-900/50 p-3 rounded-md border border-cyan-900/30 min-h-[48px] flex items-center"
            >
              <p className="font-mono text-xs text-slate-600 animate-pulse tracking-widest uppercase">Unsealing...</p>
            </motion.div>
          ) : isRevealed ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/50 p-3 rounded-md border border-cyan-900/30">
                <p className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-56 overflow-y-auto">
                  {decryptedContent ?? '—'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-slate-900/50 p-3 rounded-md border border-cyan-900/30 min-h-[48px] flex items-center gap-2"
            >
              <span className="font-mono text-xs text-slate-600 italic">No additional details scribed.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTION FOOTER ─────────────────────────────── */}
        <div className="mt-4 flex items-stretch justify-between pt-3 border-t border-cyan-900/30 gap-2">
          {/* REVEAL / CONCEAL */}
          {!isLocked && (
            <div
              role="button"
              onClick={() => setIsRevealed(v => !v)}
              className={cn(
                'flex-1 h-14 flex flex-col items-center justify-center rounded-md border-2 select-none transition-all active:scale-95',
                isRevealed
                  ? 'border-slate-600/50 text-slate-400 bg-slate-950/20'
                  : `border-current ${c.label} bg-current/5 shadow-[0_0_12px_currentColor/20]`
              )}
            >
              {isRevealed
                ? <EyeOff className="w-5 h-5 mb-0.5 opacity-50" />
                : <Eye className={cn('w-5 h-5 mb-0.5', c.label)} />
              }
              <span className="tracking-[0.15em] font-headline text-[8px] uppercase font-bold">
                {isRevealed ? 'Conceal' : 'Reveal'}
              </span>
            </div>
          )}

          {/* EDIT */}
          {!isLocked && (
            <div
              role="button"
              onClick={() => onEdit(tile, decryptedContent ?? '')}
              className="cyber-input-white flex-1 h-14 flex flex-col items-center justify-center select-none cursor-pointer transition-all active:scale-90"
            >
              <CyberStylus className="w-8 h-8 mb-0.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              <span className="tracking-[0.15em] font-headline text-[8px] uppercase font-bold text-white/90">
                Edit
              </span>
            </div>
          )}

          {/* BANISH */}
          <div
            role="button"
            onClick={() => onDelete(tile.id)}
            className="flex-1 h-14 flex flex-col items-center justify-center rounded-md bg-black select-none cursor-pointer transition-all active:scale-75 border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            <DuamatefJar className="w-8 h-8 mb-0.5 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
            <span className="tracking-[0.15em] font-headline text-[8px] uppercase font-bold text-red-500">
              Banish
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
