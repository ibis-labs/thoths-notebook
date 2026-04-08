'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Zap,
  KeyRound,
  MessageSquare,
  Lock,
  Loader2,
} from 'lucide-react';
import { IphtyLinkIcon } from '@/components/icons/IphtyLinkIcon';
import { IphtyLinkDuckIcon } from '@/components/icons/IphtyLinkDuckIcon';
import { useAuth } from '@/components/auth-provider';
import { useIphtyLink } from '@/hooks/use-iphty-link';
import { ChatWindow, ChatWelcome } from './components/chat-window';
import { GenerateInviteDialog } from './components/generate-invite-dialog';
import { RedeemInviteDialog } from './components/redeem-invite-dialog';
import { ConversationItem } from './components/link-request-card';

// =============================================================================
export default function IphtyLinkPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const {
    loading,
    iphtyReady,
    keySetupStatus,
    activeLink,
    messages,
    messagesLoading,
    activeLinks,
    openConversation,
    closeConversation,
    generateInvitationCode,
    redeemInvitationCode,
    sendMessage,
  } = useIphtyLink();

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleOpenConversation = async (link: typeof activeLink) => {
    if (!link) return;
    await openConversation(link);
    setMobileView('chat');
  };

  const handleBack = () => {
    closeConversation();
    setMobileView('list');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-violet-400 font-display">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden">

      {/* ===== PAGE HEADER ===== */}
      <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-violet-900/40
        bg-gradient-to-r from-black via-violet-950/20 to-black">

        <button
          onClick={() => router.push('/')}
          aria-label="Back to Notebook"
          className="text-violet-500/60 hover:text-violet-300 transition-colors mr-1 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="flex items-center gap-2.5">
          <IphtyLinkIcon
            nodeActive={iphtyReady}
            className="h-5 w-auto text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]"
          />
          <div>
            <h1 className="text-violet-200 font-display font-bold text-sm tracking-[0.25em] uppercase leading-none">
              Iphty Link
            </h1>
            <div className="text-[9px] text-violet-600/70 font-display tracking-[0.4em] uppercase">
              Scribe Transmission Protocol
            </div>
          </div>
        </div>

        {/* Cipher status pill */}
        <div className="ml-auto">
          {keySetupStatus === 'needs-vault' && (
            <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-700/40
              rounded-full px-3 py-1 text-[10px] text-amber-400/80 font-display tracking-wider uppercase">
              <Lock className="w-3 h-3" />
              Vault Required
            </div>
          )}
          {keySetupStatus === 'ready' && (
            <div className="flex items-center gap-1.5 bg-violet-950/40 border border-violet-700/20
              rounded-full px-3 py-1 text-[10px] text-violet-500/70 font-display tracking-wider uppercase">
              <Zap className="w-3 h-3" />
              Cipher Active
            </div>
          )}
        </div>
      </header>

      {/* ===== VAULT LOCKED BANNER ===== */}
      <AnimatePresence>
        {keySetupStatus === 'needs-vault' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3
              bg-gradient-to-r from-amber-950/40 to-black border-b border-amber-800/30">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-300/80 text-xs font-display tracking-wider">
                Your vault is locked. Unlock Archives to generate invitation codes and decrypt transmissions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ───────────────────────────────────────── */}
        <div className={`
          w-full md:w-72 lg:w-80 shrink-0
          relative
          border-r border-violet-900/30
          bg-gradient-to-b from-violet-950/10 to-black
          flex flex-col overflow-hidden
          ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
        `}>

          {/* 🦆 Duck backdrop — shimmer animation lives behind all panel content */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <IphtyLinkDuckIcon
              size={328}
              className="text-violet-300 opacity-[0.42] drop-shadow-[0_0_8px_rgba(196,181,253,0.6)]"
              aria-hidden="true"
            />
          </div>

          {/* Section header */}
          <div className="relative z-10 shrink-0 flex items-center gap-2 px-4 py-3 border-b border-violet-900/30">
            <MessageSquare className="w-3.5 h-3.5 text-violet-500/60" />
            <span className="text-[10px] text-violet-500/70 font-display tracking-[0.3em] uppercase font-bold">
              Active Channels
            </span>
            {activeLinks.length > 0 && (
              <span className="ml-auto bg-violet-800/50 text-violet-300 rounded-full px-2 py-0.5
                text-[9px] font-display font-bold">
                {activeLinks.length}
              </span>
            )}
          </div>

          {/* Channel list */}
          <div className="relative z-10 flex-1 overflow-y-auto p-3 space-y-1.5
            scrollbar-thin scrollbar-thumb-violet-900/50 scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              </div>
            ) : activeLinks.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="text-4xl text-violet-800/30">𓏞</div>
                <p className="text-violet-700/60 text-xs font-display tracking-wider uppercase">
                  No active channels
                </p>
                <p className="text-violet-800/40 text-xs font-body">
                  Generate an invitation code or enter one below to open a channel
                </p>
              </div>
            ) : (
              activeLinks.map((link) => (
                <ConversationItem
                  key={link.id}
                  link={link}
                  myUid={user.uid}
                  isActive={activeLink?.id === link.id}
                  onClick={() => handleOpenConversation(link)}
                />
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="relative z-10 shrink-0 p-3 border-t border-violet-900/30 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowGenerateDialog(true)}
              disabled={keySetupStatus === 'needs-vault'}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl
                bg-violet-700/40 hover:bg-violet-600/60
                border border-violet-600/30 hover:border-violet-400/50
                text-violet-200 text-[11px] font-display font-bold uppercase tracking-wider
                shadow-[0_0_12px_rgba(139,92,246,0.15)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                transition-all duration-200 active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Code
            </button>
            <button
              onClick={() => setShowRedeemDialog(true)}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl
                bg-fuchsia-900/30 hover:bg-fuchsia-800/40
                border border-fuchsia-700/30 hover:border-fuchsia-500/50
                text-fuchsia-300 text-[11px] font-display font-bold uppercase tracking-wider
                transition-all duration-200 active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Enter Code
            </button>
          </div>

          {/* Footer inscription */}
          <div className="relative z-10 shrink-0 px-4 py-2 border-t border-violet-900/20">
            <div className="text-center text-[10px] text-violet-900/50 font-display tracking-[0.3em] uppercase">
              𓂀 · End-to-End Encrypted · 𓂀
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (chat) ───────────────────────────────── */}
        <div className={`
          flex-1 flex flex-col overflow-hidden
          bg-gradient-to-br from-black via-violet-950/5 to-black
          ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
        `}>
          {activeLink ? (
            <ChatWindow
              link={activeLink}
              messages={messages}
              loading={messagesLoading}
              onSend={(text) => sendMessage(activeLink, text)}
              onBack={handleBack}
              iphtyReady={iphtyReady}
            />
          ) : (
            <ChatWelcome />
          )}
        </div>
      </div>

      {/* ===== DIALOGS ===== */}
      <AnimatePresence>
        {showGenerateDialog && (
          <GenerateInviteDialog
            onClose={() => setShowGenerateDialog(false)}
            onGenerate={generateInvitationCode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRedeemDialog && (
          <RedeemInviteDialog
            onClose={() => setShowRedeemDialog(false)}
            onRedeem={redeemInvitationCode}
          />
        )}
      </AnimatePresence>

      {/* Background grid decoration */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02] z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
