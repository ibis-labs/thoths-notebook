"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';
import { BanishmentPortal } from './banishment-portal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Task, Subtask, OstracaTileColor } from '@/lib/types';
import { useOstracaCollections } from '@/hooks/use-ostraca-collections';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus } from 'lucide-react';
import { DuamatefHead } from '@/components/icons/DuamatefHead';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { CyberJar } from '@/components/icons/cyber-jar';
import { CyberStylus } from './icons/cyber-stylus';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { CATEGORY_LABELS } from "@/lib/types"; // Summon the Sacred Labels

const CYBER_BUTTON_STYLE = `
  font-headline font-bold uppercase tracking-widest 
  bg-black hover:bg-black 
  text-cyan-400 hover:text-cyan-300 
  border-2 border-cyan-400 hover:border-cyan-300 
  shadow-[0_0_10px_rgba(34,211,238,0.5)] 
  hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] 
  transition-all duration-300
`;

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName?: string;
}

export function EditTaskDialog({ task, open, onOpenChange, collectionName = "tasks" }: EditTaskDialogProps) {
  if (!task) return null;

  const { masterKey } = useAuth();
  const { toast } = useToast();
  const { collections, addCollection } = useOstracaCollections();

  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details || '');
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime?.toString() || '');
  const [importance, setImportance] = useState(task.importance);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkEnabled, setLinkEnabled] = useState(!!(task.linkedCollectionId));
  const [linkedCollectionId, setLinkedCollectionId] = useState<string>(task.linkedCollectionId || '');
  const [showNewColl, setShowNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollColor, setNewCollColor] = useState<OstracaTileColor>('cyan');

  useEffect(() => {
    if (open) {
      const decryptAndSetState = async () => {
        // Set state to raw values by default.
        setTitle(task.title || '');
        setDetails(task.details || '');
        setSubtasks(task.subtasks || []);
        setEstimatedTime(task.estimatedTime?.toString() || '');
        setImportance(task.importance);
        setLinkEnabled(!!(task.linkedCollectionId));
        setLinkedCollectionId(task.linkedCollectionId || '');
        setShowNewColl(false);
        if (task.dueDate) {
          try {
            const dateObj = (task.dueDate as any).toDate ? (task.dueDate as any).toDate() : new Date(task.dueDate);
            setDueDate(isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0]);
          } catch (e) { setDueDate(''); }
        } else {
          setDueDate('');
        }

        // If the task is marked as encrypted, attempt to decrypt each field individually.
        if (task.isEncrypted && masterKey && task.iv) {
          try {
            const ivBuff = base64ToBuffer(task.iv);
            const ivUint8 = new Uint8Array(ivBuff);

            // --- Decrypt Title ---
            try {
              setTitle(await decryptData(masterKey, base64ToBuffer(task.title), ivUint8));
            } catch (e) {
              console.warn(`Failed to decrypt title, assuming plaintext. Task ID: ${task.id}`, e);
              setTitle(task.title); // Fallback to raw title
            }

            // --- Decrypt Details ---
            if (task.details) {
              try {
                setDetails(await decryptData(masterKey, base64ToBuffer(task.details), ivUint8));
              } catch (e) {
                console.warn(`Failed to decrypt details, assuming plaintext. Task ID: ${task.id}`, e);
                setDetails(task.details); // Fallback to raw details
              }
            }

            // --- Decrypt Subtasks ---
            if (task.encryptedSubtasks) {
              try {
                const subData = await decryptData(masterKey, base64ToBuffer(task.encryptedSubtasks), ivUint8);
                setSubtasks(subData ? JSON.parse(subData) : []);
              } catch (e) {
                console.warn(`Failed to decrypt subtasks. Task ID: ${task.id}`, e);
                setSubtasks(task.subtasks || []); // Fallback to raw subtasks
              }
            } else {
              setSubtasks(task.subtasks || []);
            }

          } catch (e) {
            // This outer catch is for critical failures like a bad IV.
            console.error("DECRYPTION CRITICAL FAILURE (Edit Dialog): Bad IV or master key.", e);
            toast({ title: "Decryption Failed", description: "The master key or task data is corrupt.", variant: "destructive" });
          }
        }
      };

      decryptAndSetState();
    }
  }, [task, masterKey, open, toast]);

  const isSacredInstance = collectionName === "tasks" && (task.isRitual || !!(task as any).originRitualId) ||
    task.category === CATEGORY_LABELS.RITUAL;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { text: newSubtaskText, completed: false }]);
    setNewSubtaskText('');
  };

  const handleDeleteSubtask = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks.splice(index, 1);
    setSubtasks(newSubtasks);
  };

  const handleToggleSubtask = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = {
      ...newSubtasks[index],
      completed: !newSubtasks[index].completed
    };
    setSubtasks(newSubtasks);
  };

  const canEditDate = collectionName === "tasks" && !isSacredInstance;

  const handleSave = async () => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      let payload: any = {
        importance,
        estimatedTime: parseInt(estimatedTime) || 0,
        linkedCollectionId: linkEnabled ? linkedCollectionId || null : null,
        ...(canEditDate && { dueDate: dueDate ? new Date(dueDate) : null })
      };

      if (masterKey) {
        const { ciphertext: titleCipher, iv } = await encryptData(masterKey, title);
        const ivString = bufferToBase64(iv.buffer as ArrayBuffer);

        let finalDetails = details ? bufferToBase64((await encryptData(masterKey, details, iv)).ciphertext) : null;
        let finalEncryptedSubtasks = (subtasks && subtasks.length > 0) ? bufferToBase64((await encryptData(masterKey, JSON.stringify(subtasks), iv)).ciphertext) : null;

        payload = {
          ...payload,
          title: bufferToBase64(titleCipher),
          details: finalDetails,
          encryptedSubtasks: finalEncryptedSubtasks,
          subtasks: [],
          iv: ivString,
          isEncrypted: true
        };
      } else {
        payload = {
          ...payload,
          title,
          details,
          subtasks,
          isEncrypted: false,
          encryptedSubtasks: null,
          iv: null
        };
      }

      await updateDoc(taskRef, payload);
      toast({ title: "Archives Updated", description: "The scrolls have been sealed and stored." });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating archive:", error);
      toast({ title: "Error", description: "The scribe failed to record the changes.", variant: "destructive" });
    }
  };

  const handleDeleteRitual = async () => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await deleteDoc(taskRef);
      toast({ title: "Ritual Banished", description: "Removed from the scrolls." });
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting ritual:", error);
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 1. We apply the scroll logic directly to the DialogContent to match Production */}
      <DialogContent className="w-[95vw] max-w-[400px] bg-black border-cyan-900/50 p-6 rounded-lg max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-0">

        <DialogHeader className="mb-4">
          <DialogTitle className="text-center font-headline text-2xl text-primary">
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-primary">Task Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="cyber-input font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="time" className="text-primary">Approx. Time (min)</Label>
              <Input
                id="time"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="cyber-input font-body"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="importance" className="text-primary">Importance</Label>
              <select
                id="importance"
                value={importance}
                onChange={(e) => setImportance(e.target.value as 'low' | 'medium' | 'high')}
                className="cyber-input font-body"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* --- THE TIMELINE GATE (Full-Area Trigger) --- */}
          {canEditDate && (
            <div className="grid gap-2 mb-6 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="dueDate" className="text-primary font-headline text-[10px] uppercase tracking-widest ml-1">
                Adjust Due Date
              </Label>

              {/* The Capture Zone: Now an Altar of Time */}
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  const input = document.getElementById('dueDate-hidden') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
              >
                <div className="cyber-input flex items-center justify-between h-14 px-4 font-body">
                  <span className="text-foreground tracking-wider">
                    {dueDate ? format(new Date(dueDate), "PPPP") : "NO DATE SET"}
                  </span>
                  <CalendarIcon className="w-6 h-6 text-primary group-hover:text-cyan-300 transition-colors" />
                </div>

                {/* The Hidden Actual Input remains unchanged for logic */}
                <input
                  id="dueDate-hidden"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                />
              </div>
            </div>
          )}


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
            <Label htmlFor="details" className="text-cyan-400">Details / Notes</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="bg-slate-900 border-cyan-900 focus:border-cyan-500 min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-cyan-400">Subtasks</Label>
            <div className="flex gap-2">
              <Input
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Add a step..."
                className="bg-slate-900 border-cyan-900"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button onClick={handleAddSubtask} size="icon" variant="outline" className="border-cyan-700 text-cyan-400 hover:bg-cyan-950">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
              {subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded border transition-all duration-500 overflow-hidden",
                    subtask.completed
                      ? "bg-gradient-to-r from-amber-900/20 via-amber-500/10 to-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-slate-900/50 border-cyan-900/30 hover:border-cyan-500/50"
                  )}
                  onClick={() => handleToggleSubtask(index)}
                >
                  {/* 🏺 THE GOLDEN THREAD: The top-border glow for completed steps */}
                  {subtask.completed && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                  )}

                
                  <span
                    className={cn(
                      "flex-1 text-sm font-body transition-all duration-500 select-none",
                      subtask.completed
                        ? "text-amber-200 font-bold tracking-wide drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : "text-slate-300"
                    )}
                  >
                    {subtask.text}
                  </span>

                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent toggling when trying to banish
                      handleDeleteSubtask(index);
                    }}
                    className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all active:scale-75 shrink-0"
                  >
                    <DuamatefHead className={cn(
                      "w-8 h-8 transition-colors",
                      subtask.completed ? "text-amber-900/40 hover:text-red-600" : "text-red-600/50 hover:text-red-600"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-4 w-full pt-6 mt-4 border-t border-cyan-900/30">
          {/* ROW 1: ESCAPE & BANISH (Desktop: More compact) */}
          <div className="flex flex-row gap-4 w-full items-stretch">
            {/* ESCAPE: Now using the White/Lunar style */}
            <div
              role="button"
              onClick={() => onOpenChange(false)}
              className={cn(
                "cyber-input-white flex items-center justify-center cursor-pointer",
                "h-20 md:h-14", // Shorter on desktop
                isSacredInstance ? "w-full" : "flex-1"
              )}
            >
              <span className="font-headline font-bold uppercase tracking-[0.3em] text-sm md:text-xs">
                ESCAPE
              </span>
            </div>

            {/* BANISH: Keeping the Red-Head Sentinel */}
            {!isSacredInstance && (
              <BanishmentPortal onConfirm={handleDeleteRitual} ritualTitle={title}>
                <div
                  role="button"
                  className={cn(
                    "flex-1 rounded-md border-2 border-red-600 flex items-center justify-center bg-black cursor-pointer transition-all active:scale-95 active:bg-red-950/40",
                    "h-20 md:h-14" // Match the Escape button height
                  )}
                >
                  <DuamatefJar className="w-14 h-14 md:w-8 md:h-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
              </BanishmentPortal>
            )}
          </div>

          {/* ROW 2: SAVE (Desktop: Less massive) */}
          <div
            role="button"
            onClick={handleSave}
            className={cn(
              "w-full h-20 md:h-16 rounded-md flex items-center justify-center gap-6 cursor-pointer",
              CYBER_BUTTON_STYLE,
              "border-2 border-cyan-400 active:scale-95"
            )}
          >
            <CyberStylus className="w-12 h-12 md:w-8 md:h-8 animate-pulse text-cyan-400" />
            <span className="font-headline font-bold uppercase tracking-[0.4em] text-lg md:text-base text-cyan-400">
              SAVE
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}