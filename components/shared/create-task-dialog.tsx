"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X, Tag as TagIcon, ListChecks } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
  defaultDueDate?: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultProjectId,
  defaultStatus = "Todo",
  defaultDueDate,
}: CreateTaskDialogProps) {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "none");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState(user?.id || "");
  const [dueDate, setDueDate] = useState(defaultDueDate || "");
  const [startDate, setStartDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setProjectId(defaultProjectId || "none");
      setStatus(defaultStatus || "Todo");
      setPriority("Medium");
      setAssignedTo(user?.id || "");
      setDueDate(defaultDueDate || "");
      setStartDate("");
      setEstimatedHours("");
      setIsPersonal(false);
      setLabels([]);
      setSubtasks([]);
    }
  }, [open, defaultProjectId, defaultStatus, defaultDueDate, user?.id]);

  // Fetch Projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open,
  });

  // Fetch Members/Users for dropdown
  const { data: members = [] } = useQuery({
    queryKey: ["users-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/settings/users");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId !== "none" ? projectId : undefined,
        status,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        startDate: startDate || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
        isPersonal,
        labels,
        subtasks: subtasks.map((st) => ({ title: st, completed: false })),
      };

      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to create task");
      return data.data;
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const val = tagInput.trim();
      if (!labels.includes(val)) {
        setLabels([...labels, val]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setLabels(labels.filter((t) => t !== tag));
  };

  const handleAddSubtask = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && subtaskInput.trim()) {
      e.preventDefault();
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput("");
    }
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a task title");
      return;
    }
    createTaskMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New Task</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a tracked task, assign project members, or add personal To-Do items.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="e.g., Implement dark mode tokens, Buy groceries, Fix login timeout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-sm font-medium"
            />
          </div>

          {/* Project & Personal Flag Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project</Label>
              <Select
                value={projectId}
                onValueChange={(val) => {
                  setProjectId(val);
                  if (val !== "none") setIsPersonal(false);
                }}
                disabled={isPersonal}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Project (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Independent Task)</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>
                      <span className="font-semibold text-primary mr-1.5">[{p.key}]</span>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="is-personal"
                checked={isPersonal}
                onCheckedChange={(checked) => {
                  setIsPersonal(Boolean(checked));
                  if (checked) setProjectId("none");
                }}
              />
              <Label
                htmlFor="is-personal"
                className="text-xs font-medium cursor-pointer leading-none"
              >
                Personal Manual To-Do (My Tasks only)
              </Label>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backlog">Backlog</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="No Priority">No Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-semibold">Assignee</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Assign user" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date, Start Date & Estimate Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-semibold">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due-date" className="text-xs font-semibold">
                Due Date
              </Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="est-hours" className="text-xs font-semibold">
                Estimate (Hours)
              </Label>
              <Input
                id="est-hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 8"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Description / Notes
            </Label>
            <Textarea
              id="description"
              placeholder="Add detailed acceptance criteria, context, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Labels / Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Labels (Press Enter to add)
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {labels.map((lbl) => (
                <Badge
                  key={lbl}
                  variant="secondary"
                  className="text-xs gap-1 px-2 py-0.5"
                >
                  {lbl}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(lbl)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="e.g. Frontend, API, Bug, Mobile"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="text-xs"
            />
          </div>

          {/* Quick Subtasks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              Subtasks (Press Enter to add)
            </Label>
            {subtasks.length > 0 && (
              <div className="space-y-1 p-2 bg-muted/30 rounded-lg border text-xs mb-1.5">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="truncate">{st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Input
              placeholder="Type subtask and press Enter..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={handleAddSubtask}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createTaskMutation.isPending}
              className="gap-1.5"
            >
              {createTaskMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
