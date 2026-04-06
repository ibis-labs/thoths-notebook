'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { IphtyLink } from '@/lib/types';

interface ConversationItemProps {
  link: IphtyLink;
  myUid: string;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ link, myUid, isActive, onClick }: ConversationItemProps) {
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
          : 'bg-transparent border border-transparent hover:bg-violet-950/30 hover:border-violet-800/30'
        }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
        ${isActive
          ? 'bg-violet-800/70 border border-violet-400/50 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
          : 'bg-violet-900/40 border border-violet-700/30'
        }`}
      >
        <span className={`text-xs font-bold font-display
          ${isActive ? 'text-violet-200' : 'text-violet-400/70'}`}
        >
          {otherName.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-display font-bold text-sm truncate
          ${isActive ? 'text-violet-100' : 'text-violet-300/70 group-hover:text-violet-200'}`}
        >
          {otherName}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0
            ${isActive ? 'bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]' : 'bg-violet-700/40'}`}
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
