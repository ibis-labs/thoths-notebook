"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useKhet } from '@/hooks/use-khet';
import { ProgramWizard } from '@/components/khet/program-wizard';
import { AppSidebar } from '@/components/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProgramManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { programs, deleteProgram } = useKhet();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleDelete = async (id: string, name: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    try {
      await deleteProgram(id);
      setDeletingId(null);
      toast({ title: `"${name}" removed.` });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar activeCategory="" setActiveCategory={() => {}} />
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 bg-background min-h-screen overflow-y-auto">
        <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <SidebarTrigger className="text-zinc-500 hover:text-cyan-400 transition-colors" />
            <Link
              href="/khet/dashboard"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-headline text-amber-400 text-xl uppercase tracking-widest">
                Program Manager
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Manage your microcycles</p>
            </div>
            <Button
              onClick={() => setWizardOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Program
            </Button>
          </div>

          {programs.length === 0 && (
            <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
              <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">No programs yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {programs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-950/30 hover:border-zinc-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-headline text-amber-300 text-sm truncate">{p.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {p.split} · {p.frequency}×/week · {p.days.length} days
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/khet/session/${p.id}/0`}
                    className="text-[10px] font-headline uppercase tracking-wider px-2 py-1 rounded border border-cyan-800/50 text-cyan-500 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
                  >
                    Start
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      deletingId === p.id
                        ? 'text-red-400 bg-red-950/30'
                        : 'text-zinc-600 hover:text-red-500',
                    )}
                    title={deletingId === p.id ? 'Click again to confirm delete' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <ProgramWizard
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
