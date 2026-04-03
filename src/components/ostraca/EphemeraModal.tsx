"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, CheckSquare2, Square, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const uid = () => Math.random().toString(36).slice(2, 9);

interface EphemeraModalProps {
  scratchpad: string;
  checklistItems: ChecklistItem[];
  onClose: () => void;
  onSave: (scratchpad: string, checklistItems: ChecklistItem[]) => void;
}

export function EphemeraModal({
  scratchpad: initialScratchpad,
  checklistItems: initialItems,
  onClose,
  onSave,
}: EphemeraModalProps) {
  const [scratchpad, setScratchpad]   = useState(initialScratchpad);
  const [items, setItems]             = useState<ChecklistItem[]>(initialItems);
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    setItems(prev => [...prev, { id: uid(), text, checked: false }]);
    setNewItemText('');
  };

  const toggleItem = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  const updateItemText = (id: string, text: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, text } : i));

  const deleteItem = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const handleSave = () => {
    onSave(scratchpad, items);
    onClose();
  };

  const checkedCount   = items.filter(i => i.checked).length;
  const uncheckedCount = items.filter(i => !i.checked).length;

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
        className="w-full max-w-lg flex flex-col max-h-[90vh] bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-[#0f0518] border-2 border-amber-500/50 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)]"
      >
        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-amber-500/20 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-headline text-amber-300 tracking-[0.25em] uppercase drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]">
              Ephemera
            </h2>
            <p className="text-[10px] text-amber-500 font-mono uppercase tracking-widest mt-0.5">
              Permanent · No Collection
              {items.length > 0 && (
                <span className="ml-2 text-amber-400">
                  · {uncheckedCount} open · {checkedCount} done
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-amber-500/30 text-amber-500/60 hover:text-amber-300 hover:border-amber-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* ── UPPER — Checklist ───────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChevronUp className="w-3.5 h-3.5 text-amber-400/70" />
              <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.25em]">
                Upper · List
              </h3>
            </div>

            <div className="space-y-1.5 min-h-[40px]">
              {items.length === 0 && (
                <p className="text-xs font-mono text-amber-700/60 italic py-2">
                  No items yet — add one below.
                </p>
              )}
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 group py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex-shrink-0 transition-colors text-amber-400 hover:text-amber-200"
                  >
                    {item.checked
                      ? <CheckSquare2 className="w-4 h-4" />
                      : <Square className="w-4 h-4 opacity-60" />
                    }
                  </button>
                  <input
                    value={item.text}
                    onChange={e => updateItemText(item.id, e.target.value)}
                    className={cn(
                      'flex-1 bg-transparent font-body text-sm outline-none border-b border-transparent focus:border-amber-500/50 transition-colors py-0.5',
                      item.checked ? 'text-slate-600 line-through' : 'text-slate-200'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-700/60 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add new item — use a form so Enter reliably submits */}
              <form
                onSubmit={e => { e.preventDefault(); addItem(); }}
                className="flex items-center gap-2 pt-2 border-t border-amber-500/20"
              >
                <Plus className="w-4 h-4 text-amber-400/60 flex-shrink-0" />
                <input
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  placeholder="Add item..."
                  className="flex-1 bg-transparent font-body text-sm text-slate-300 placeholder:text-amber-900/60 outline-none border-b border-amber-500/20 focus:border-amber-400/60 transition-colors py-0.5"
                />
                <button
                  type="submit"
                  disabled={!newItemText.trim()}
                  className="text-amber-400 hover:text-amber-200 disabled:opacity-20 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-amber-500/20" />
            <span className="text-[9px] font-mono text-amber-500 uppercase tracking-[0.3em]">
              ✦
            </span>
            <div className="flex-1 border-t border-amber-500/20" />
          </div>

          {/* ── LOWER — Scratchpad ──────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="w-3.5 h-3.5 text-amber-400/70" />
              <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.25em]">
                Lower · Scratchpad
              </h3>
            </div>
            <div className="bg-slate-900/50 rounded-md border border-amber-500/20">
              <textarea
                value={scratchpad}
                onChange={e => setScratchpad(e.target.value)}
                placeholder="Jot down whatever comes to mind..."
                rows={6}
                className="w-full bg-transparent p-4 font-mono text-sm text-slate-300 leading-relaxed resize-none outline-none placeholder:text-amber-900/50"
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 py-4 border-t border-amber-500/20 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="cyber-input-white flex-1 text-sm font-body font-bold tracking-wider"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 px-4 rounded-md border-2 border-amber-500 bg-amber-500/10 text-amber-300 font-body font-bold text-sm tracking-wider hover:bg-amber-500/20 transition-all shadow-[0_0_16px_rgba(245,158,11,0.2)]"
          >
            Seal Ephemera
          </button>
        </div>
      </motion.div>
    </div>
  );
}

