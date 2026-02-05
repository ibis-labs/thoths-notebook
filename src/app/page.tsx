"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/components/auth-provider"; 
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskList } from "@/components/task-list";
import { FilterCategory } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { useTasks } from "@/hooks/use-tasks"; // 👈 Make sure this is here
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Today');
  
  const { user, loading } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();

  // --- 1. THE CRITICAL FIX ---
  // We pull addTask directly from your useTasks hook
  const { addTask } = useTasks(activeCategory); 

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]); 

  // --- 2. OLD handleAddTask REMOVED ---
  // We don't need the local function anymore because the hook handles the logic now.

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-cyan-400 font-display">
        <svg className="animate-spin h-10 w-10 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h1 className="text-2xl tracking-wider">Accessing the Archives...</h1>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden">
        <Sidebar>
          <AppSidebar 
             activeCategory={activeCategory} 
             setActiveCategory={(category: string) => setActiveCategory(category as any)} 
          />
        </Sidebar>
        <SidebarInset className="flex flex-col flex-1 bg-background h-full overflow-hidden">
        
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-display font-bold text-lg">{activeCategory}</span>
          
          <div className="ml-auto">
             {/* --- 3. THE CONNECTED DIALOG --- */}
             <AddTaskDialog 
                onTaskAdd={(data) => {
                  // This calls the hook function directly
                  addTask(data);
                }} 
             />
          </div>
        </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <TaskList filter={activeCategory} />
          </main>
        </SidebarInset>
      </div>
    );
  }

  return null;
}