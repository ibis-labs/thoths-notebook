"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  Sunrise,
  Eye,
  Scroll,
  History,
  LayoutDashboard,
  Mountain,
  LogOut,
  User,
  BookOpen,
  Eclipse,
  Moon,
  Landmark,
  Calendar,
  Package,
  Stars,
  Dumbbell,
} from "lucide-react";
import { OstraconIcon } from "@/components/icons/ostracon-icon";
import { IphtyLinkIcon } from "@/components/icons/IphtyLinkIcon";
import Link from 'next/link';
import { useAuth } from "@/components/auth-provider";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { MoonPhaseIcon } from "./moon-phase-icon";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { KhonsuTimer } from "@/components/khonsu-timer";
import { CATEGORY_LABELS } from "@/lib/types";
import { useIphtyNodeActive } from "@/hooks/use-iphty-link";

interface AppSidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export function AppSidebar({ activeCategory, setActiveCategory }: AppSidebarProps) {
  const { user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const hasActiveIphtyChannels = useIphtyNodeActive();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const temporalFilters = [
    { name: "Today", icon: <Home className="w-4 h-4" /> },
    { name: "7 Days", icon: <Calendar className="w-4 h-4" /> },
    { name: "30 Days", icon: <Landmark className="w-4 h-4" /> },
  ];

  // Restored with strict Constants to match TaskList filter logic
  const essenceFilters = [
    { name: CATEGORY_LABELS.GENERAL, icon: <Package className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.RITUAL, icon: <Sunrise className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.DUTY, icon: <Eye className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.MISSION, icon: <Scroll className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.EXPEDITION, icon: <Mountain className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <h1 className="text-xl font-bold text-cyan-400 font-display tracking-wider">
            Thoth's Notebook
          </h1>
          <MoonPhaseIcon />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-grow overflow-visible px-2 space-y-12 mt-8">

        {/* TEMPORAL GATEWAY */}
        <div className="group/temporal relative flex items-center h-12">
          <div className="cursor-pointer py-2 pl-3 border-l-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950/20 transition-all duration-300 w-full z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-300 font-display">
              Temporal
            </h3>
          </div>

          <div className="absolute left-[140px] top-0 flex flex-col space-y-2 opacity-0 -translate-x-8 pointer-events-none group-hover/temporal:opacity-100 group-hover/temporal:translate-x-4 group-hover/temporal:pointer-events-auto transition-all duration-300 ease-out z-[100] min-w-[140px]">
            {temporalFilters.map((item) => (
              <button
                key={item.name}
                onClick={() => handleCategoryClick(item.name)}
                className={`h-12 md:h-10 px-4 flex items-center gap-3 bg-black border font-display text-[10px] uppercase tracking-widest transition-all active:scale-95 ${activeCategory === item.name
                  ? "border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                  /* Brightened the inactive state for mobile visibility */
                  : "border-cyan-400/40 text-cyan-400/60 hover:border-cyan-400 hover:text-cyan-400"
                  }`}
              >
                <span className="w-4 h-4">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* THE UNDONE */}
        <div className="group/undone relative flex items-center h-12">
          <div className="cursor-pointer py-2 pl-3 border-l-2 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/20 transition-all duration-300 w-full z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-300 font-display">
              The Undone
            </h3>
          </div>

          <div className="absolute left-[140px] top-0 flex flex-col space-y-2 opacity-0 -translate-x-8 pointer-events-none group-hover/undone:opacity-100 group-hover/undone:translate-x-4 group-hover/undone:pointer-events-auto transition-all duration-300 ease-out z-[100] min-w-[160px]">
            {essenceFilters.map((item) => (
              <button
                key={item.name}
                onClick={() => handleCategoryClick(item.name)}
                className={`h-12 md:h-10 px-4 flex items-center gap-3 bg-black border font-display text-[10px] uppercase tracking-widest transition-all active:scale-95 ${activeCategory === item.name
                  ? "border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  /* Brightened the inactive state for mobile visibility */
                  : "border-emerald-500/40 text-emerald-500/60 hover:border-emerald-400 hover:text-emerald-400"
                  }`}
              >
                <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="pt-4 mt-4 border-t border-cyan-900/30">
          <Dialog>
            <DialogTrigger asChild>
              <SidebarMenuButton className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 group w-full justify-start pl-2 transition-all duration-300">
                <Eclipse className="w-4 h-4 mr-2 group-hover:animate-spin-slow transition-all duration-700" />
                <span className="font-bold tracking-wide">Invoke Khonsu</span>
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent className="p-0 border-none bg-transparent max-w-md shadow-none sm:max-w-lg">
              <DialogTitle className="sr-only">Invoke Khonsu Timer</DialogTitle>
              <KhonsuTimer />
            </DialogContent>
          </Dialog>
        </div>


        <div className="mt-auto border-t border-cyan-900/30 pt-2 flex flex-col gap-1">
          <SidebarMenuButton asChild className="text-zinc-400 hover:text-white hover:bg-zinc-800/60 group w-full justify-start pl-2 transition-all duration-300" onClick={handleNavClick}>
            <Link href="/">
              <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold tracking-wide">Main Hall</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton asChild className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 group w-full justify-start pl-2 transition-all duration-300" onClick={handleNavClick}>
            <Link href="/archives">
              <Scroll className="w-4 h-4 mr-2 group-hover:rotate-[-12deg] transition-transform duration-500" />
              <span className="font-bold tracking-wide">The Archives</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton asChild className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 group w-full justify-start pl-2 transition-all duration-300" onClick={handleNavClick}>
            <Link href="/library">
              <Landmark className="w-4 h-4 mr-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all duration-500" />
              <span className="font-bold tracking-wide">Grand Library</span>
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton asChild className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-950/50 group w-full justify-start pl-2 transition-all duration-300" onClick={handleNavClick}>
            <Link href="/SeshatInterface">
              <Stars className="w-4 h-4 mr-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(185,21,204,0.6)] transition-all duration-500" />
              <span className="font-bold tracking-wide">Seshat Interface</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton asChild className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 group w-full justify-start pl-2" onClick={handleNavClick}>
            <Link href="/rituals">
              <BookOpen className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold tracking-wide">Manage Rituals</span>
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton asChild className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 group w-full justify-start pl-2" onClick={handleNavClick}>
            <Link href="/evening-chronicle">
              <Moon className="w-4 h-4 mr-2 group-hover:animate-spin-slow transition-all duration-700" />
              <span className="font-bold tracking-wide">Evening Chronicle</span>
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton asChild className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 group w-full justify-start pl-2" onClick={handleNavClick}>
            <Link href="/ostraca">
              <OstraconIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold tracking-wide">The Ostraca</span>
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton asChild className="text-violet-400 hover:text-violet-300 hover:bg-violet-950/50 group w-full justify-start pl-2" onClick={handleNavClick}>
            <Link href="/iphty-link">
              <span className="shrink-0 mr-2 flex items-center">
                <IphtyLinkIcon
                  nodeActive={hasActiveIphtyChannels}
                  className="h-4 w-auto group-hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.8)] transition-all duration-300"
                />
              </span>
              <span className="font-bold tracking-wide">Iphty Link</span>
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton asChild className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 group w-full justify-start pl-2 transition-all duration-300" onClick={handleNavClick}>
            <Link href="/khet/dashboard">
              <Dumbbell className="w-4 h-4 mr-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-500" />
              <span className="font-bold tracking-wide">Khet-Station</span>
            </Link>
          </SidebarMenuButton>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-2 bg-black/20">
          {/* --- THE DOSSIER PORTAL TRIGGER --- */}
          <Link
            href="/scribe-dossier"
            className="flex flex-1 items-center gap-2 overflow-hidden hover:bg-cyan-900/20 p-1 rounded-lg transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-cyan-900/50 flex items-center justify-center rounded-full flex-shrink-0 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-shadow">
              <User className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-foreground truncate group-hover:text-cyan-300 transition-colors">
                {user ? user.displayName : "Scribe"}
              </div>
              <div className="text-[9px] text-cyan-700 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                View Dossier
              </div>
            </div>
          </Link>

          {/* --- ACTION BUTTONS (Rituals & Logout) --- */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full text-cyan-400/70 hover:text-cyan-400">
                  <Link href="/rituals">
                    <BookOpen className="w-5 h-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Manage Rituals</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSignOut} variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-pink-900/50 text-pink-900 hover:text-pink-500 hover:border-pink-500 hover:bg-pink-500/10 transition-all">
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SidebarFooter>
    </div>
  );
}