'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { IphtyLink } from '@/lib/types';
import { IphtyLinkDuckIcon } from '@/components/icons/IphtyLinkDuckIcon';

interface ConversationItemProps {
  link: IphtyLink;
  myUid: string;
  isActive: boolean;
  hasUnread?: boolean;
  onClick: () => void;
}

export function ConversationItem({ link, myUid, isActive, hasUnread = false, onClick }: ConversationItemProps) {
  const otherName =
    link.requestorId === myUid ? link.requesteeDisplayName : link.requestorDisplayName;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
        transition-all duration-200 group
        ${isActive
          ? 'bg-violet-900/40 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
          : hasUnread
            ? 'bg-fuchsia-950/30 border border-fuchsia-700/40 hover:bg-fuchsia-900/30 hover:border-fuchsia-500/50'
            : 'bg-transparent border border-transparent hover:bg-violet-950/30 hover:border-violet-800/30'
        }`}
    >
      {/* Avatar with unread duck */}
      <div className="relative shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center
          ${isActive
            ? 'bg-violet-800/70 border border-violet-400/50 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
            : hasUnread
              ? 'bg-fuchsia-900/60 border border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
              : 'bg-violet-900/40 border border-violet-700/30'
          }`}
        >
          <span className={`text-xs font-bold font-display
            ${isActive ? 'text-violet-200' : hasUnread ? 'text-fuchsia-200' : 'text-violet-400/70 group-hover:text-violet-200'}`}
          >
            {otherName.slice(0, 2).toUpperCase()}
          </span>
        </div>
        {/* Unread duck badge — blinks on the avatar corner */}
        {hasUnread && !isActive && (
          <motion.div
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2"
          >
            <IphtyLinkDuckIcon
              size={18}
              className="text-fuchsia-300 drop-shadow-[0_0_5px_rgba(217,70,239,0.9)]"
            />
          </motion.div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-bold text-sm truncate
            ${isActive ? 'text-violet-100' : hasUnread ? 'text-fuchsia-100' : 'text-violet-300/70 group-hover:text-violet-200'}`}
          >
            {otherName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0
            ${isActive
              ? 'bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]'
              : hasUnread
                ? 'bg-fuchsia-400 shadow-[0_0_6px_rgba(217,70,239,0.6)]'
                : 'bg-violet-700/40'
            }`}
          />
          <span className="text-[10px] text-violet-600/60 font-display tracking-wider uppercase truncate">
            Encrypted · Active
          </span>
        </div>
      </div>
      <ArrowUpRight className={`w-3.5 h-3.5 shrink-0 transition-opacity
        ${isActive ? 'text-violet-400/70 opacity-100' : 'text-violet-700/40 opacity-0 group-hover:opacity-100'}`}
      />
    </motion.button>
  );
}
