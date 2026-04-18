"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { KhetDashboard } from '@/components/khet/khet-dashboard';
import { AppSidebar } from '@/components/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function KhetDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar activeCategory="" setActiveCategory={() => {}} />
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 bg-background min-h-screen overflow-y-auto">
        <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <SidebarTrigger className="text-zinc-500 hover:text-cyan-400 transition-colors" />
          </div>
          <KhetDashboard />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
