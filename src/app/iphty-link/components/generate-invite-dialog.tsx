'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, RefreshCw, Zap, Clock } from 'lucide-react';

interface GenerateInviteDialogProps {
  onClose: () => void;
  onGenerate: () => Promise<string | null>;
}

export function GenerateInviteDialog({ onClose, onGenerate }: GenerateInviteDialogProps) {
  const [code, setCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setCopied(false);
    const newCode = await onGenerate();
    setCode(newCode);
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
          <div className="w-7 h-7 rounded-full bg-violet-900/60 border border-violet-500/40
            flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-violet-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-violet-100 font-display font-bold text-sm tracking-[0.2em] uppercase">
              Generate Invitation
            </h2>
            <p className="text-violet-500/70 text-xs mt-0.5">
              Share this code privately with another scribe
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
          {code ? (
            <>
              {/* Code display */}
              <div className="relative">
                <div className="flex items-center justify-between px-5 py-5 rounded-xl
                  bg-violet-950/60 border border-violet-500/40
                  shadow-[0_0_30px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(139,92,246,0.1)]">
                  <span className="font-display font-bold text-2xl tracking-[0.35em] text-violet-100
                    drop-shadow-[0_0_12px_rgba(139,92,246,0.7)]">
                    {code}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-xs font-display font-bold uppercase tracking-wider
                      transition-all duration-300 active:scale-95
                      ${copied
                        ? 'bg-emerald-700/50 text-emerald-300 border border-emerald-600/30'
                        : 'bg-violet-700/50 hover:bg-violet-600/70 text-violet-200 border border-violet-500/30 hover:border-violet-400/60'
                      }`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-violet-600/70 text-xs font-display">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Expires in <span className="text-violet-400">24 hours</span> · Single use · Share privately</span>
              </div>

              {/* Decorative */}
              <div className="text-center text-violet-900/40 text-[10px] font-display tracking-[0.3em] uppercase">
                𓂀 · Transmission code forged · 𓂀
              </div>

              {/* Regenerate */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-transparent border border-violet-800/40 hover:border-violet-600/50
                  text-violet-500/70 hover:text-violet-300
                  text-xs font-display uppercase tracking-wider
                  transition-all duration-200 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                Generate New Code
              </button>
            </>
          ) : (
            <>
              {/* Pre-generate state */}
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl text-violet-800/30 font-display tracking-[0.4em]">
                  ????-????
                </div>
                <p className="text-violet-400/60 text-sm font-body leading-relaxed max-w-xs mx-auto">
                  Forge a secret one-time code. Share it out-of-band with another scribe
                  to open an encrypted channel.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-violet-600/80 hover:bg-violet-500/90
                  border border-violet-400/30 hover:border-violet-400/60
                  text-white text-sm font-display font-bold uppercase tracking-wider
                  shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.55)]
                  transition-all duration-200 active:scale-95 disabled:opacity-40"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Forging...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Forge Invitation Code
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
