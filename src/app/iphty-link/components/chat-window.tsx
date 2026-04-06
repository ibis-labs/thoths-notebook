'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, ChevronLeft, Radio } from 'lucide-react';
import type { IphtyLink, IphtyMessage } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { format, isToday, isYesterday } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMsgTime(date: Date): string {
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
  return format(date, 'MMM d, HH:mm');
}

function getOtherScribeName(link: IphtyLink, myUid: string): string {
  return link.requestorId === myUid
    ? link.requesteeDisplayName
    : link.requestorDisplayName;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
interface BubbleProps {
  msg: IphtyMessage;
  isMine: boolean;
}
function MessageBubble({ msg, isMine }: BubbleProps) {
  const isSealed = msg.ciphertext === '🔒 [Sealed Transmission]';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words
          ${isMine
            ? 'bg-violet-900/60 border border-violet-500/40 text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.25)] rounded-tr-sm'
            : 'bg-slate-900/80 border border-violet-800/30 text-slate-200 rounded-tl-sm'
          }
          ${isSealed ? 'opacity-60 italic' : ''}
        `}
      >
        {!isMine && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70 mb-1 font-display">
            {msg.senderDisplayName}
          </div>
        )}
        <p className="whitespace-pre-wrap">{msg.ciphertext}</p>
        <div className={`text-[10px] mt-1 font-display tracking-wide ${isMine ? 'text-violet-400/50 text-right' : 'text-slate-500'}`}>
          {formatMsgTime(msg.createdAt)}
          {isSealed && <Lock className="inline w-2.5 h-2.5 ml-1" />}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Welcome Screen (no active conversation) ─────────────────────────────────
export function ChatWelcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-violet-500/30 flex items-center justify-center
          shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          <Radio className="w-9 h-9 text-violet-400/60" />
        </div>
        <div className="absolute inset-0 rounded-full border border-violet-500/10 animate-ping" />
      </div>
      <div className="space-y-2">
        <h3 className="text-violet-300/80 font-display font-bold text-lg tracking-[0.2em] uppercase">
          Awaiting Transmission
        </h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-body">
          Select a channel from the left to begin reading transmissions, or seek a new scribe to open a channel.
        </p>
      </div>
      {/* Decorative hieroglyph border */}
      <div className="flex items-center gap-3 text-violet-800/40 text-xs font-display tracking-[0.3em] uppercase">
        <span>𓂀</span>
        <span>·</span>
        <span>𓏞</span>
        <span>·</span>
        <span>𓂀</span>
      </div>
    </div>
  );
}

// ─── Main Chat Window ─────────────────────────────────────────────────────────
interface ChatWindowProps {
  link: IphtyLink;
  messages: IphtyMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onBack: () => void;
  iphtyReady: boolean;
}

export function ChatWindow({ link, messages, loading, onSend, onBack, iphtyReady }: ChatWindowProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const otherName = user ? getOtherScribeName(link, user.uid) : '';

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-violet-900/40 bg-black/40 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden text-violet-400/60 hover:text-violet-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full bg-violet-900/50 border border-violet-500/40 flex items-center justify-center shrink-0
          shadow-[0_0_12px_rgba(139,92,246,0.3)]">
          <span className="text-violet-300 text-xs font-bold font-display">
            {otherName.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-violet-200 font-display font-bold text-sm tracking-wider truncate">
            {otherName}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
            <span className="text-[10px] text-violet-400/70 uppercase tracking-widest font-display">
              Encrypted Channel
            </span>
          </div>
        </div>

        <Lock className="w-4 h-4 text-violet-500/50 shrink-0" />
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1
        scrollbar-thin scrollbar-thumb-violet-900/50 scrollbar-track-transparent">

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-violet-500/60 text-sm font-display tracking-wider animate-pulse uppercase">
              Deciphering Transmissions...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-violet-800/60 text-4xl">𓏞</div>
            <p className="text-slate-600 text-sm font-display tracking-wider uppercase">
              No transmissions yet
            </p>
            <p className="text-slate-700 text-xs">Send the first signal across the void</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === user?.uid}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 border-t border-violet-900/40 bg-black/60 px-4 py-3">
        {!iphtyReady ? (
          <div className="flex items-center gap-2 text-violet-500/60 text-sm py-2">
            <Lock className="w-4 h-4" />
            <span className="font-display text-xs tracking-wider uppercase">
              Unlock vault to transmit
            </span>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter transmission..."
              rows={1}
              className="flex-1 resize-none bg-violet-950/30 border border-violet-800/40 rounded-xl px-4 py-2.5
                text-sm text-violet-100 placeholder:text-violet-700/60 font-body
                focus:outline-none focus:border-violet-500/70 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)]
                transition-all duration-200 max-h-32 scrollbar-thin scrollbar-thumb-violet-900"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                bg-violet-600/80 hover:bg-violet-500/90 disabled:opacity-30 disabled:cursor-not-allowed
                border border-violet-400/30 hover:border-violet-400/60
                shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]
                transition-all duration-200 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
