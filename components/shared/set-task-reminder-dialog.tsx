"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { invalidateWorkspaceQueries } from "@/lib/utils/query-helpers";
import {
  Bell,
  Clock,
  Calendar,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface TaskForReminder {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string | Date;
  priority?: string;
}

interface SetTaskReminderDialogProps {
  task: TaskForReminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetTaskReminderDialog({
  task,
  open,
  onOpenChange,
}: SetTaskReminderDialogProps) {
  const router = useRouter();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [category, setCategory] = useState<"Work" | "Personal" | "Meeting" | "Deadline" | "Follow-up">("Work");

  // Sync with selected task when opened
  useEffect(() => {
    if (open && task) {
      setTitle(task.title ? `Reminder: ${task.title}` : "");
      setDescription(task.description || "");

      if (task.dueDate) {
        const d = new Date(task.dueDate);
        if (!isNaN(d.getTime())) {
          setReminderDate(d.toISOString().split("T")[0]);
        } else {
          setReminderDate(new Date().toISOString().split("T")[0]);
        }
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setReminderDate(tomorrow.toISOString().split("T")[0]);
      }

      const p = task.priority as "Low" | "Medium" | "High" | "Urgent";
      if (["Low", "Medium", "High", "Urgent"].includes(p)) {
        setPriority(p);
      } else {
        setPriority("Medium");
      }

      setReminderTime("09:00");
      setCategory("Work");
    }
  }, [open, task]);

  const scheduleReminderMutation = useMutation({
    mutationFn: async ({ shouldRedirect }: { shouldRedirect: boolean }) => {
      if (!title.trim()) throw new Error("Reminder title is required");
      if (!reminderDate || !reminderTime) throw new Error("Please pick a reminder date and time");

      const reminderDateTime = new Date(`${reminderDate}T${reminderTime}:00`);
      if (isNaN(reminderDateTime.getTime())) {
        throw new Error("Invalid reminder date or time");
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        reminderTime: reminderDateTime.toISOString(),
        priority,
        category,
        tags: ["task-reminder", ...(task?.title ? [task.title.slice(0, 20)] : [])],
      };

      const res = await authFetch("/api/v1/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Failed to schedule reminder");
      }

      return { data: json.data, shouldRedirect };
    },
    onSuccess: ({ shouldRedirect }) => {
      invalidateWorkspaceQueries(queryClient, { taskId: task?._id });
      onOpenChange(false);

      if (shouldRedirect) {
        toast.success("Reminder scheduled! Shifting to Reminders tab...");
        router.push("/reminders");
      } else {
        toast.success("Reminder scheduled successfully!", {
          action: {
            label: "Go to Reminders",
            onClick: () => router.push("/reminders"),
          },
        });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule reminder");
    },
  });

  const setQuickTime = (minutesAhead: number) => {
    const target = new Date(Date.now() + minutesAhead * 60 * 1000);
    setReminderDate(target.toISOString().split("T")[0]);
    setReminderTime(
      `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[calc(100vw-1.5rem)] sm:w-full p-0 overflow-hidden bg-card max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col rounded-2xl border border-border/80 shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Set Reminder for Task
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Schedule smart automated email and in-app alerts for this task.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 scrollbar-thin">
          {/* Linked Task Banner */}
          {task && (
            <div className="p-2.5 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Linked Task
                </span>
                <span className="font-semibold text-foreground truncate block">
                  {task.title}
                </span>
              </div>
              <span className="text-[10px] text-primary font-mono shrink-0">
                Auto-Synced
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reminder Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up on deployment checklist"
              className="text-xs h-9"
            />
          </div>

          {/* Date & Time Picker Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                Reminder Date *
              </Label>
              <Input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Reminder Time *
              </Label>
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Quick Time Presets */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Quick Presets:</Label>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime(15)}
                className="h-7 text-[11px] px-2.5"
              >
                +15 Mins
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime(30)}
                className="h-7 text-[11px] px-2.5"
              >
                +30 Mins
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime(60)}
                className="h-7 text-[11px] px-2.5"
              >
                +1 Hour
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const tom = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  setReminderDate(tom.toISOString().split("T")[0]);
                  setReminderTime("09:00");
                }}
                className="h-7 text-[11px] px-2.5"
              >
                Tomorrow 9:00 AM
              </Button>
            </div>
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Priority</Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="High">🟠 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Work">💼 Work</SelectItem>
                  <SelectItem value="Deadline">⏳ Deadline</SelectItem>
                  <SelectItem value="Meeting">👥 Meeting</SelectItem>
                  <SelectItem value="Follow-up">📞 Follow-up</SelectItem>
                  <SelectItem value="Personal">🏠 Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Notes / Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details to include in email notification..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={scheduleReminderMutation.isPending}
            className="text-xs h-8"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={scheduleReminderMutation.isPending || !title.trim()}
              onClick={() => scheduleReminderMutation.mutate({ shouldRedirect: false })}
              className="text-xs h-8 gap-1.5 flex-1 sm:flex-initial"
            >
              {scheduleReminderMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Save Reminder
            </Button>

            <Button
              size="sm"
              disabled={scheduleReminderMutation.isPending || !title.trim()}
              onClick={() => scheduleReminderMutation.mutate({ shouldRedirect: true })}
              className="text-xs h-8 gap-1.5 flex-1 sm:flex-initial bg-primary hover:bg-primary/90"
            >
              {scheduleReminderMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Save & Shift to Reminders Tab
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
