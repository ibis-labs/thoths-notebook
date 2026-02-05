// src/components/banishment-portal.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DuamatefHead } from "@/components/icons/DuamatefHead";

interface BanishmentPortalProps {
  children: React.ReactNode; // The button/icon that triggers the dialog
  onConfirm: () => void;     // The handleDelete function
  ritualTitle: string;
}

export function BanishmentPortal({ children, onConfirm, ritualTitle }: BanishmentPortalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      
      <AlertDialogContent className="bg-black border-destructive text-slate-50 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.2)] min-h-[80vh] flex flex-col justify-between p-8 z-[100]">
        
        {/* TOP: Sacred Icon */}
        <div className="flex-1 flex items-center justify-center">
          <DuamatefHead className="w-80 h-80 text-destructive brightness-125 animate-pulse" />
        </div>

        {/* BOTTOM: Action Zone */}
        <div className="space-y-6">
          <AlertDialogHeader className="flex flex-col items-center text-center p-0">
            <AlertDialogTitle className="font-headline text-destructive text-2xl tracking-[0.3em] brightness-150 uppercase">
              Banish {ritualTitle}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 font-body brightness-110 text-xs max-w-[250px] uppercase tracking-widest">
              Confirm this ritual no longer supports Ma'at.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6">
            <div className="flex flex-col gap-4 w-full justify-center items-center">
              <AlertDialogAction
                onClick={onConfirm}
                className="w-full h-14 bg-black text-destructive font-headline border-2 border-destructive/80 brightness-150 saturate-150 hover:bg-destructive/20 uppercase tracking-[0.2em] text-[11px] transition-all font-bold"
              >
                Confirm Banishment
              </AlertDialogAction>
              <AlertDialogCancel
                className="w-full h-14 bg-black text-primary font-headline border-2 border-primary hover:bg-primary/20 mt-0 uppercase tracking-[0.2em] text-[11px] transition-all"
              >
                Preserve Ritual
              </AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}