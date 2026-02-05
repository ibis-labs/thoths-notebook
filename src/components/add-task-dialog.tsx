"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";

// --- NEW IMPORTS FOR THE FIRST BREATH ---
import { useAuth } from "@/components/auth-provider";
// ----------------------------------------
// --- NEW IMPORT FOR TASK CATEGORY LABELS
import { CATEGORY_LABELS } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Task, TaskCategory, TaskImportance, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const subtaskSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  // --- THE ALIGNMENT FIX ---
  category: z.enum(Object.values(CATEGORY_LABELS) as [string, ...string[]]),
  importance: z.enum(['low', 'medium', 'high']),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  estimatedTime: z.coerce.number().min(1, "Estimated time must be at least 1 minute."),
  details: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

const categoryDescriptions: Record<string, string> = {
  [CATEGORY_LABELS.GENERAL]: 'Mortal matter to be processed today.', // Khet
  [CATEGORY_LABELS.RITUAL]: 'Sacred patterns that repeat daily.',
  [CATEGORY_LABELS.DUTY]: 'Core duties and recurring obligations.',
  [CATEGORY_LABELS.MISSION]: 'Unique, one-off objectives with specific goals.',
  [CATEGORY_LABELS.EXPEDITION]: 'Large, long-term projects with multiple phases.',
};

const CYBER_BUTTON_STYLE = `
  font-headline font-bold uppercase tracking-widest 
  bg-black hover:bg-black 
  text-cyan-400 hover:text-cyan-300 
  border-2 border-cyan-400 hover:border-cyan-300 
  shadow-[0_0_10px_rgba(34,211,238,0.5)] 
  hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] 
  transition-all duration-300
`;

type AddTaskDialogProps = {
  onTaskAdd: (task: Omit<Task, 'id' | 'completed'>) => void;
};

export function AddTaskDialog({ onTaskAdd }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Need User ID for direct database writes
  const [subtaskText, setSubtaskText] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: CATEGORY_LABELS.GENERAL, // Defaults to 'Khet'
      importance: 'medium',
      dueDate: new Date(),
      estimatedTime: 30,
      details: "",
      subtasks: [],
    },
  });

  const handleAddSubtask = () => {
    if (subtaskText.trim()) {
      setSubtasks([...subtasks, { text: subtaskText, completed: false }]);
      setSubtaskText("");
    }
  };

  const handleRemoveSubtask = (indexToRemove: number) => {
    setSubtasks(subtasks.filter((_, index) => index !== indexToRemove));
  };

  // --- THE PURIFIED LOGIC ---

async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      // 🛡️ ALL CATEGORIES NOW USE THE ENCRYPTED PATH
      // The hook's addTask function handles encryption AND Daily Rituals logic
      const newTaskData = {
        ...values,
        subtasks,
        userId: user.uid,
      };

      // Call the unified handler for ALL task types
      onTaskAdd(newTaskData);

      toast({ title: "Task Scribed", description: `"${values.title}" added.` });

      form.reset();
      setSubtasks([]);
      setOpen(false);
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast({ title: "Error", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={CYBER_BUTTON_STYLE}>
          + Add Task
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Scribe a New Task</DialogTitle>
          <DialogDescription>
            Record your next objective. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* TITLE */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Decipher ancient texts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CATEGORY */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                   <SelectContent className="z-50 bg-black border-zinc-800">
  {Object.values(CATEGORY_LABELS).map((label) => (
    <SelectItem 
      key={label} 
      value={label}
      // text-[#39FF14] is your Neon Lime
      // focus:bg-[#39FF14]/10 creates a subtle lime glow on hover
      className="text-[#39FF14] focus:bg-[#39FF14]/10 focus:text-[#39FF14] cursor-pointer font-body"
    >
      {label}
    </SelectItem>
  ))}
</SelectContent>
                  </Select>
                  <FormDescription>
                    {categoryDescriptions[field.value as TaskCategory]}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DETAILS */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes, links, or the text of a prayer..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SUBTASKS */}
            <div>
              <FormLabel>Sub-tasks</FormLabel>
              <div className="space-y-2 mt-2 mb-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background/50 p-2 rounded-md border border-zinc-800">
                    <p className="flex-1 text-sm">{subtask.text}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => handleRemoveSubtask(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={subtaskText}
                  onChange={(e) => setSubtaskText(e.target.value)}
                  placeholder="Add a new sub-task..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                />
                {/* CYBER STYLE FOR SUBTASK ADD BUTTON */}
                <Button
                  type="button"
                  onClick={handleAddSubtask}
                  className={CYBER_BUTTON_STYLE}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* META: IMPORTANCE & TIME */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="importance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importance</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-50 bg-black">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Time (min)</FormLabel>
                    <FormControl>
                      {/* Note: type="number" ensures mobile keyboards show numbers */}
                      <Input type="number" placeholder="e.g., 60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DUE DATE */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-black border-zinc-800" align="start">
  <Calendar
    mode="single"
    selected={field.value}
    onSelect={field.onChange}
    initialFocus
    className="text-[#39FF14]"
    classNames={{
      // --- ALIGNMENT FIX ---
      head_row: "flex w-full justify-between", // Ensures the row spans the container
      head_cell: "text-[#39FF14]/60 font-headline uppercase text-[10px] w-9 font-normal flex-1 flex justify-center", 
      
      // --- THOTH NEON CIRCLE ---
      day_selected: cn(
        "bg-transparent border-2 border-[#B915CC]", // Thoth Purple border
        "text-[#39FF14] hover:bg-[#B915CC]/20 focus:bg-[#B915CC]/20", 
        "rounded-full shadow-[0_0_10px_rgba(185,21,204,0.8)]" // The Neon Glow
      ),
      
      // --- HOVER STATE ---
      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#39FF14]/10 rounded-full transition-all",
      
      day_today: "text-[#00FFFF] border border-[#00FFFF] rounded-full", // Cyber Cyan for 'Today'
    }}
  />
</PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              {/* CYBER STYLE FOR SUBMIT BUTTON */}
              <Button
                type="submit"
                className={`w-full ${CYBER_BUTTON_STYLE}`}
              >
                Add Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}