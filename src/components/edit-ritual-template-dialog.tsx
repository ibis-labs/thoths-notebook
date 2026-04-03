"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Task, Subtask, OstracaTileColor } from '@/lib/types';
import { useOstracaCollections } from '@/hooks/use-ostraca-collections';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus } from 'lucide-react';
import { CyberStylus } from './icons/cyber-stylus';
import { DuamatefHead } from '@/components/icons/DuamatefHead';
import { cn } from '@/lib/utils';

interface EditRitualTemplateDialogProps {
    task: Task;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditRitualTemplateDialog({ task, open, onOpenChange }: EditRitualTemplateDialogProps) {
    if (!task) return null;

    const { masterKey } = useAuth();
    const { toast } = useToast();
    const { collections, addCollection } = useOstracaCollections();

    // --- 1. LOCAL STATE ---
    const [title, setTitle] = useState(task.title);
    const [details, setDetails] = useState(task.details || '');
    const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime?.toString() || '');
    const [importance, setImportance] = useState(task.importance);
    const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [linkEnabled, setLinkEnabled] = useState(!!(task.linkedCollectionId));
    const [linkedCollectionId, setLinkedCollectionId] = useState<string>(task.linkedCollectionId || '');
    const [showNewColl, setShowNewColl] = useState(false);
    const [newCollName, setNewCollName] = useState('');
    const [newCollColor, setNewCollColor] = useState<OstracaTileColor>('cyan');

    // --- 2. DECRYPTION RITUAL (ON OPEN) ---
    useEffect(() => {
        if (open) {
            const decryptTemplate = async () => {
                // Set defaults
                setTitle(task.title || '');
                setDetails(task.details || '');
                setSubtasks(task.subtasks || []);
                setLinkEnabled(!!(task.linkedCollectionId));
                setLinkedCollectionId(task.linkedCollectionId || '');
                setShowNewColl(false);

                if (task.isEncrypted && masterKey && task.iv) {
                    try {
                        const ivUint8 = new Uint8Array(base64ToBuffer(task.iv));

                        // Decrypt Title
                        const dTitle = await decryptData(masterKey, base64ToBuffer(task.title), ivUint8);
                        setTitle(dTitle);

                        // Decrypt Details
                        if (task.details) {
                            const dDetails = await decryptData(masterKey, base64ToBuffer(task.details), ivUint8);
                            setDetails(dDetails);
                        }

                        // Decrypt Subtasks
                        if (task.encryptedSubtasks) {
                            const dSubs = await decryptData(masterKey, base64ToBuffer(task.encryptedSubtasks), ivUint8);
                            setSubtasks(dSubs ? JSON.parse(dSubs) : []);
                        }
                    } catch (e) {
                        console.error("Blueprint Decryption Failed:", e);
                        toast({ title: "Decryption Error", description: "The blueprint remains shrouded.", variant: "destructive" });
                    }
                }
            };
            decryptTemplate();
        }
    }, [open, task, masterKey, toast]);

    // --- 3. ACTIONS ---
    const handleAddSubtask = () => {
        if (!newSubtaskText.trim()) return;
        setSubtasks([...subtasks, { text: newSubtaskText, completed: false }]);
        setNewSubtaskText('');
    };

    const handleDeleteSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            const ritualRef = doc(db, "dailyRituals", task.id);
            let payload: any = {
                estimatedTime: parseInt(estimatedTime) || 0,
                importance,
                linkedCollectionId: linkEnabled ? linkedCollectionId || null : null,
            };

            if (masterKey) {
                // Create a fresh IV for the update
                const { ciphertext: titleCipher, iv } = await encryptData(masterKey, title);
                const ivString = bufferToBase64(iv.buffer as ArrayBuffer);

                // Encrypt Details
                let finalDetails = details 
                    ? bufferToBase64((await encryptData(masterKey, details, iv)).ciphertext) 
                    : null;
                
                // Encrypt Subtasks
                let finalEncryptedSubtasks = (subtasks.length > 0)
                    ? bufferToBase64((await encryptData(masterKey, JSON.stringify(subtasks), iv)).ciphertext)
                    : null;

                payload = {
                    ...payload,
                    title: bufferToBase64(titleCipher),
                    details: finalDetails,
                    encryptedSubtasks: finalEncryptedSubtasks,
                    subtasks: [], // Store empty array for fallback
                    iv: ivString,
                    isEncrypted: true
                };
            } else {
                // Fallback for unencrypted mode
                payload = {
                    ...payload,
                    title,
                    details,
                    subtasks,
                    isEncrypted: false,
                    iv: null
                };
            }

            await updateDoc(ritualRef, payload);
            toast({ title: "Template Recorded", description: "The blueprint is secured." });
            onOpenChange(false);
        } catch (error) {
            console.error("Blueprint failure:", error);
            toast({ title: "Error", description: "The scribe failed to record the changes.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[400px] bg-black border-cyan-900/50 p-6 rounded-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="text-center font-headline text-2xl text-primary uppercase tracking-widest">
                        Edit Ritual Template
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label className="text-primary opacity-70">Ritual Identity</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="cyber-input" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="text-primary opacity-70">Est. Time (min)</Label>
                            <Input type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="cyber-input" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-primary opacity-70">Importance</Label>
                            <select value={importance} onChange={(e) => setImportance(e.target.value as any)} className="cyber-input bg-black">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {/* OSTRACA LINK */}
                    <div className="border border-cyan-900/40 rounded-lg p-3 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={linkEnabled}
                                onChange={e => { setLinkEnabled(e.target.checked); setShowNewColl(false); setLinkedCollectionId(''); }}
                                className="w-4 h-4 accent-cyan-400"
                            />
                            <span className="text-xs font-body text-cyan-400 uppercase tracking-widest">Link to Ostraca Collection</span>
                        </label>
                        {linkEnabled && (
                            <div className="space-y-2">
                                <select
                                    value={showNewColl ? '__new__' : linkedCollectionId}
                                    onChange={e => {
                                        if (e.target.value === '__new__') { setShowNewColl(true); setLinkedCollectionId(''); }
                                        else { setShowNewColl(false); setLinkedCollectionId(e.target.value); }
                                    }}
                                    className="w-full bg-slate-950 border border-cyan-900/60 text-slate-300 text-sm rounded px-2 py-1.5 font-body"
                                >
                                    <option value="">— Select a collection —</option>
                                    {collections.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                    <option value="__new__">+ Create New Collection</option>
                                </select>
                                {showNewColl && (
                                    <div className="space-y-2 pl-1">
                                        <input
                                            type="text"
                                            placeholder="Collection name"
                                            value={newCollName}
                                            onChange={e => setNewCollName(e.target.value)}
                                            className="w-full bg-slate-950 border border-cyan-900/60 text-slate-200 text-sm rounded px-2 py-1.5 font-body placeholder:text-slate-600"
                                        />
                                        <div className="flex gap-1.5 items-center">
                                            {(['cyan','amber','emerald','rose','purple'] as OstracaTileColor[]).map(col => (
                                                <button
                                                    key={col}
                                                    type="button"
                                                    onClick={() => setNewCollColor(col)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                        newCollColor === col ? 'border-white scale-125' : 'border-transparent opacity-60'
                                                    }`}
                                                    style={{ backgroundColor: { cyan:'#22d3ee', amber:'#f59e0b', emerald:'#10b981', rose:'#f43f5e', purple:'#a855f7' }[col] }}
                                                />
                                            ))}
                                            <button
                                                type="button"
                                                disabled={!newCollName.trim()}
                                                onClick={async () => {
                                                    const id = await addCollection(newCollName.trim(), newCollColor);
                                                    if (id) { setLinkedCollectionId(id); setShowNewColl(false); setNewCollName(''); }
                                                }}
                                                className="ml-auto px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-700 rounded disabled:opacity-30"
                                            >
                                                Create
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-cyan-400 opacity-70">Details / Wisdom</Label>
                        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} className="bg-slate-900 border-cyan-900 min-h-[100px]" />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-cyan-400 opacity-70">Blueprint Steps</Label>
                        <div className="flex gap-2">
                            <Input value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} placeholder="Add a step..." className="bg-slate-900 border-cyan-900" onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} />
                            <Button onClick={handleAddSubtask} size="icon" variant="outline" className="border-cyan-700 text-cyan-400"><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                            {subtasks.map((subtask, index) => (
                                <div key={index} className="flex items-center gap-3 bg-slate-900/30 p-2 pl-4 rounded border border-cyan-900/30 group transition-all">
                                    <span className="flex-1 text-sm font-body text-slate-300 truncate">{subtask.text}</span>
                                    <div role="button" onClick={() => handleDeleteSubtask(index)} className="w-12 h-12 flex items-center justify-center cursor-pointer transition-all active:scale-75 shrink-0 select-none">
                                        <DuamatefHead className="w-10 h-10 text-red-600 active:drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 mt-2 border-t border-cyan-900/30">
                    <div role="button" onClick={handleSave} className="w-full h-16 rounded-md flex items-center justify-center gap-4 cursor-pointer border-2 border-cyan-400 bg-black text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all active:scale-95">
                        <CyberStylus className="w-10 h-10 animate-pulse" />
                        <span className="font-headline font-bold uppercase tracking-[0.3em]">save blueprint</span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}