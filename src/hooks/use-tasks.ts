"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast"; 
import { Task } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { encryptData, bufferToBase64 } from "@/lib/crypto";

export function useTasks(filter?: string) {
  const { user, masterKey } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]); // Standard Tasks
  const [rituals, setRituals] = useState<Task[]>([]); // Ritual Templates
  const [loading, setLoading] = useState(true);

  // 1. FETCH STANDARD TASKS (The Nun)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Normalize Timestamps safely
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
            streakData: data.streakData || null,
            
            isRitual: data.isRitual ?? false, 
            originRitualId: data.originRitualId ?? null,
        };
      }) as Task[];
      
      setTasks(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. FETCH RITUAL TEMPLATES (The Source Code)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "dailyRituals"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isRitual: true, // Tag these as Templates!
      })) as unknown as Task[];
      
      setRituals(results);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. SAFE ACTIONS
const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
  if (!user) return;

  const { title, category, dueDate, details, subtasks, ...rest } = taskData;

  // 🛡️ THE SACRED SEALING
  let finalTitle = title;
  let finalDetails = details;
  let encryptedSubtasks: string | null = null;
  let ivString: string | null = null;
  let detailsIvString: string | null = null;
  let encryptedSubtasksIvString: string | null = null;
  let isEncrypted = false;
  
  // We clear subtasks from the top level; they will live in encryptedSubtasks
  const finalSubtasks = subtasks || [];


  if (masterKey) {
    try {
      // 1. Encrypt Title — each field gets its own cryptographically random IV
      const { ciphertext: titleCipher, iv: titleIv } = await encryptData(masterKey, title);
      finalTitle = bufferToBase64(titleCipher);
      ivString = bufferToBase64(titleIv.buffer as ArrayBuffer);
      isEncrypted = true;

      // 2. Encrypt Details with its own fresh IV
      if (details) {
        const { ciphertext: detailsCipher, iv: detailsIv } = await encryptData(masterKey, details);
        finalDetails = bufferToBase64(detailsCipher);
        detailsIvString = bufferToBase64(detailsIv.buffer as ArrayBuffer);
      }
      
      // 3. Encrypt Subtasks with their own fresh IV
      if (subtasks && subtasks.length > 0) {
        const subtasksString = JSON.stringify(subtasks);
        const { ciphertext: subtasksCipher, iv: subtasksIv } = await encryptData(masterKey, subtasksString);
        encryptedSubtasks = bufferToBase64(subtasksCipher);
        encryptedSubtasksIvString = bufferToBase64(subtasksIv.buffer as ArrayBuffer);
      }

    } catch (err) {
      console.error("The Scribe failed to seal the data:", err);
      // Fallback to plaintext if encryption fails to prevent losing data
    }
  }

  const isDailyRitual = category === CATEGORY_LABELS.RITUAL;

  const commonTaskData = {
    ...rest,
    iv: ivString,
    detailsIv: detailsIvString,
    encryptedSubtasksIv: encryptedSubtasksIvString,
    isEncrypted,
    userId: user.uid,
    createdAt: serverTimestamp(),
    // Base data
    title: finalTitle,
    details: finalDetails,
    subtasks: (subtasks && subtasks.length > 0 && encryptedSubtasks) ? [] : subtasks, // Store empty array if encrypted
    encryptedSubtasks: encryptedSubtasks,
  };

  if (isDailyRitual) {
    // --- RITUAL LOGIC ---
    const ritualTemplate = {
      ...commonTaskData,
      category,
      isRitual: true,
    };
    const templateRef = await addDoc(collection(db, "dailyRituals"), ritualTemplate);

    const firstInstance = {
      ...commonTaskData,
      category,
      completed: false,
      dueDate: dueDate || new Date(),
      isRitual: true,
      originRitualId: templateRef.id,
    };
    await addDoc(collection(db, "tasks"), firstInstance);

  } else {
    // --- STANDARD TASK ---
    const newTask = {
      ...commonTaskData,
      category,
      completed: false,
      dueDate: dueDate || null,
      isRitual: false,
      originRitualId: null
    };

    await addDoc(collection(db, "tasks"), newTask);
  }
};

  const toggleTask = async (task: Task) => {
    // Determine which collection this task belongs to
    const collectionName = task.isRitual && !task.originRitualId ? "dailyRituals" : "tasks";
    // NOTE: If it has originRitualId, it's a clone in "tasks". If it's a raw template, it's in "dailyRituals".
    // But usually, we only toggle clones. This safety check ensures we target the right place.
    
    // Simplification for your current architecture:
    // If it's in the main list, it's in "tasks" (even if it is a ritual instance).
    // If it's in the Manage Rituals list, it's in "dailyRituals".
    // For now, let's keep your logic simple:
    const targetCollection = (task as any).originRitualId ? "tasks" : (task.isRitual ? "dailyRituals" : "tasks");
    
    const taskRef = doc(db, targetCollection, task.id);
    await updateDoc(taskRef, {
      completed: !task.completed
    });
  };

  // --- THE SAFETY LOCK ---
  const deleteTask = async (task: Task) => {
    // Check if it is a Ritual Instance (Clone) OR a Ritual Template
    if (task.isRitual) {
      // STOP! Do not delete ritual instances or templates from the main view.
      toast({
        title: "The Scales Demand Order",
        description: "RA Daily Ritual is a sacred commitment. It cannot be banished from this view.",
        variant: "destructive"
      });
      return; 
    }

    // Proceed if it is a normal task
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      toast({ title: "Banished", description: "Task removed from the archives." });
    } catch (error) {
      console.error("Delete failed", error);
      toast({ title: "Error", variant: "destructive", description: "Could not delete task." });
    }
  };

  return { 
    tasks,      // Regular tasks list (Including First Breath Clones)
    rituals,    // Ritual templates list
    loading, 
    addTask, 
    toggleTask, 
    deleteTask 
  };
}