'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RedeemInviteDialogProps {
  onClose: () => void;
  onRedeem: (code: string) => Promise<{ success: boolean; error?: string }>;
}

// Auto-format input as XXXX-XXXX
function formatCodeInput(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  if (clean.length > 4) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return clean;
}

export function RedeemInviteDialog({ onClose, onRedeem }: RedeemInviteDialogProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setInput(formatCodeInput(e.target.value));
  };

  const handleSubmit = async () => {
    const clean = input.replace(/[^A-Za-z0-9]/g, '');
    if (clean.length !== 8) return;
    setLoading(true);
    const res = await onRedeem(input);
    setResult(res);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const cleanLength = input.replace(/[^A-Za-z0-9]/g, '').length;
  const isReady = cleanLength === 8;

  // Success state
  if (result?.success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-gradient-to-br from-[#030d10] via-[#051520] to-[#020a0e]
            border border-emerald-700/50 rounded-2xl shadow-[0_0_80px_rgba(16,185,129,0.2)] p-8 text-center"
        >
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4
            drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]" />
          <h2 className="text-emerald-200 font-display font-bold text-lg tracking-[0.2em] uppercase mb-2">
            Channel Established
          </h2>
          <p className="text-emerald-400/60 text-sm font-body mb-6 leading-relaxed">
            The encrypted transmission channel is now active.
          </p>
          <div className="text-emerald-900/50 text-[10px] font-display tracking-[0.4em] uppercase mb-6">
            𓂀 · Link forged in the void · 𓂀
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-700/50 hover:bg-emerald-600/60
              border border-emerald-500/40 text-emerald-200 text-sm font-display font-bold uppercase
              tracking-wider transition-all duration-200 active:scale-95"
          >
            Begin Transmitting
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-gradient-to-br from-[#0a0018] via-[#0d0028] to-[#080015]
          border border-violet-700/50 rounded-2xl shadow-[0_0_80px_rgba(139,92,246,0.25)]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-violet-900/40">
          <div className="w-7 h-7 rounded-full bg-fuchsia-900/50 border border-fuchsia-600/40
            flex items-center justify-center shrink-0">
            <KeyRound className="w-3.5 h-3.5 text-fuchsia-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-violet-100 font-display font-bold text-sm tracking-[0.2em] uppercase">
              Enter Invitation Code
            </h2>
            <p className="text-violet-500/70 text-xs mt-0.5">
              Enter the code from another scribe
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-violet-700/60 hover:text-violet-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6 space-y-5">
          {/* Code input */}
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className={`w-full bg-violet-950/50 rounded-xl px-5 py-4
                text-center text-2xl font-display font-bold tracking-[0.35em] uppercase
                border transition-all duration-200 focus:outline-none
                placeholder:text-violet-800/40 placeholder:tracking-[0.3em]
                ${result?.error
                  ? 'border-rose-700/60 text-rose-300 focus:border-rose-500/70 focus:shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : isReady
                    ? 'border-violet-400/50 text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.15)] focus:border-violet-400/70'
                    : 'border-violet-800/40 text-violet-200 focus:border-violet-600/60 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                }`}
            />

            {/* Error message */}
            {result?.error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                  bg-rose-950/40 border border-rose-800/40 text-rose-400"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-body">{result.error}</span>
              </motion.div>
            )}
          </div>

          {/* Progress pips */}
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-all duration-200
                  ${i === 4 ? 'mx-1' : ''}
                  ${i < cleanLength
                    ? 'bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]'
                    : 'bg-violet-900/60'
                  }`}
              />
            ))}
          </div>

          {/* Initiate button */}
          <button
            onClick={handleSubmit}
            disabled={!isReady || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-fuchsia-700/70 hover:bg-fuchsia-600/80
              border border-fuchsia-500/30 hover:border-fuchsia-400/50
              text-white text-sm font-display font-bold uppercase tracking-wider
              shadow-[0_0_20px_rgba(217,70,239,0.2)] hover:shadow-[0_0_35px_rgba(217,70,239,0.4)]
              transition-all duration-200 active:scale-95
              disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initiating Link...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Initiate Link
              </>
            )}
          </button>

          <div className="text-center text-violet-900/40 text-[10px] font-display tracking-[0.3em] uppercase">
            𓏞 · The code opens one channel · 𓏞
          </div>
        </div>
      </motion.div>
    </div>
  );
}
