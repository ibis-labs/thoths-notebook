"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';
import { EditRitualTemplateDialog } from '@/components/edit-ritual-template-dialog';
import { RitualCard } from './ritual-card';
import { BookOpen } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FirstPylonIcon } from '@/components/icons/FirstPylonIcon';
import { OstraconIconLarge } from '@/components/icons/ostracon-icon-large';
import { useSidebar } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { DuamatefHead } from '@/components/icons/DuamatefHead';

export default function ManageRitualsPage() {
    const [rituals, setRituals] = useState<Task[]>([]);
    const { user, masterKey } = useAuth();
    const { toast } = useToast();
    const { setOpenMobile } = useSidebar();
    const router = useRouter();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRitual, setSelectedRitual] = useState<Task | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [ritualToDelete, setRitualToDelete] = useState<Task | null>(null);

    const handleReturn = () => {
        setOpenMobile(false);
        router.push("/");
    };

    useEffect(() => {
        if (!user) {
            setRituals([]);
            return;
        }
        const ritualsCollection = collection(db, 'dailyRituals');
        const q = query(ritualsCollection, where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ritualsData: Task[] = [];
            querySnapshot.forEach((doc) => {
                ritualsData.push({ id: doc.id, ...doc.data() } as Task);
            });
            setRituals(ritualsData);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDeleteRitual = async () => {
        if (!ritualToDelete) return;
        try {
            await deleteDoc(doc(db, 'dailyRituals', ritualToDelete.id));
            toast({ title: "Ritual Banished" });
        } catch (error) {
            toast({ title: "Error", variant: 'destructive' });
        } finally {
            setIsDeleteOpen(false);
            setRitualToDelete(null);
        }
    };

    const handleEditClick = (ritual: Task) => {
        setSelectedRitual(ritual);
        setIsEditOpen(true);
    };

    const handleDeleteClick = (ritual: Task) => {
        setRitualToDelete(ritual);
        setIsDeleteOpen(true);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
            <div className="w-full flex justify-between mb-6">
                <button onClick={() => router.push('/ostraca')} className="flex flex-col items-center justify-center p-0.1 rounded-2xl border-2 border-emerald-400 bg-emerald-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] min-w-[115px]">
                    <OstraconIconLarge className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                    <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-emerald-300 mt-1">OSTRACA</span>
                </button>
                <button onClick={handleReturn} className="flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-950/40 rounded-2xl p-2">
                    <FirstPylonIcon size={60} className="text-cyan-400" />
                    <span className="text-[8px] uppercase text-cyan-300">To Main Hall</span>
                </button>
            </div>

            <div className="mb-6 border-b border-cyan-900/50 pb-4">
                <h1 className="text-3xl font-headline text-primary tracking-wider">Manage Daily Rituals</h1>
                <p className="text-muted-foreground">View or edit your templates.</p>
            </div>

            {rituals.length > 0 ? (
                <div className="space-y-4">
                    {rituals.map((ritual) => (
                        <RitualCard 
                            key={ritual.id} 
                            ritual={ritual} 
                            masterKey={masterKey} 
                            onEdit={handleEditClick} 
                            onDelete={handleDeleteClick} 
                        />
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center border-2 border-dashed border-cyan-900/30 rounded-lg">
                    <BookOpen className="h-12 w-12 mx-auto text-cyan-800 mb-4" />
                    <h3 className="text-xl text-cyan-600">No Daily Rituals Found</h3>
                </div>
            )}

            {selectedRitual && (
                <EditRitualTemplateDialog
                    task={selectedRitual}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                />
            )}

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-black border-destructive">
                    <div className="flex flex-col items-center gap-6 p-8">
                        <DuamatefHead className="w-40 h-40 text-destructive" />
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive text-center">Banish Ritual?</AlertDialogTitle>
                            <AlertDialogDescription className="text-center">Confirm removal from daily templates.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-black text-primary border-primary">Preserve</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRitual} className="bg-black text-destructive border-destructive border-2">Confirm Banishment</AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}