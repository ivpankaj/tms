"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Send,
  Plus,
  Loader2,
  ListChecks,
  MessageSquare,
  History,
  Link2,
  Tag,
  FolderGit2,
  Users,
  AlertCircle,
  Bug,
  Sparkles,
  Bookmark,
  Zap,
  CheckSquare,
  Timer,
} from "lucide-react";

const ISSUE_TYPES = [
  { id: "task", label: "Task", icon: CheckSquare, color: "text-blue-500" },
  { id: "bug", label: "Bug", icon: Bug, color: "text-red-500" },
  { id: "feature", label: "Feature", icon: Sparkles, color: "text-emerald-500" },
  { id: "story", label: "Story", icon: Bookmark, color: "text-purple-500" },
  { id: "epic", label: "Epic", icon: Zap, color: "text-amber-500" },
];

interface TaskDetailSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [activeTab, setActiveTab] = useState("overview");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [logHours, setLogHours] = useState("");
  const [logDesc, setLogDesc] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);

  // 1. Fetch Task Details
  const {
    data: task,
    isLoading: isTaskLoading,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await fetch(`/api/v1/tasks/${taskId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: Boolean(taskId) && open,
  });

  // 2. Fetch Comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await fetch(`/api/v1/tasks/${taskId}/comments`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(taskId) && open,
  });

  // 3. Fetch Activities
  const { data: activities = [] } = useQuery({
    queryKey: ["task-activities", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await fetch(`/api/v1/activities?entityType=task&entityId=${taskId}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(taskId) && open,
  });

  // 4. Fetch Users for assignee dropdown
  const { data: members = [] } = useQuery({
    queryKey: ["users-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/settings/users");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open,
  });

  // 5. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open,
  });

  // 6. Fetch Timelogs
  const { data: timelogsData } = useQuery({
    queryKey: ["task-timelogs", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await fetch(`/api/v1/tasks/${taskId}/timelogs`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: Boolean(taskId) && open,
  });

  // Log Time Mutation
  const logTimeMutation = useMutation({
    mutationFn: async () => {
      const hours = parseFloat(logHours);
      if (isNaN(hours) || hours <= 0) throw new Error("Enter valid hours");
      const res = await fetch(`/api/v1/tasks/${taskId}/timelogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, description: logDesc }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to log time");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Work hours logged successfully");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-timelogs", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
      queryClient.invalidateQueries({ queryKey: ["workload"] });
      setLogHours("");
      setLogDesc("");
      setShowLogForm(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Sync state when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
    }
  }, [task]);

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!taskId) return;
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to update task");
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["task", taskId], updated);
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-activities", taskId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !newComment.trim()) return;
      const res = await fetch(`/api/v1/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to add comment");
      return data.data;
    },
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["task-activities", taskId] });
      toast.success("Comment added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/v1/tasks/${taskId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to delete comment");
      return data.data;
    },
    onSuccess: () => {
      refetchComments();
      toast.success("Comment deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) return;
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to delete task");
      return data.data;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Inline Subtask Toggle
  const handleToggleSubtask = (idx: number) => {
    if (!task) return;
    const nextSubtasks = [...(task.subtasks || [])];
    nextSubtasks[idx] = {
      ...nextSubtasks[idx],
      completed: !nextSubtasks[idx].completed,
    };
    updateTaskMutation.mutate({ subtasks: nextSubtasks });
  };

  // Add new Subtask
  const handleAddSubtask = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSubtaskTitle.trim() && task) {
      e.preventDefault();
      const nextSubtasks = [
        ...(task.subtasks || []),
        { title: newSubtaskTitle.trim(), completed: false },
      ];
      updateTaskMutation.mutate({ subtasks: nextSubtasks });
      setNewSubtaskTitle("");
    }
  };

  // Remove Subtask
  const handleRemoveSubtask = (idx: number) => {
    if (!task) return;
    const nextSubtasks = (task.subtasks || []).filter((_: any, i: number) => i !== idx);
    updateTaskMutation.mutate({ subtasks: nextSubtasks });
  };

  // Checklist Toggle
  const handleToggleChecklist = (idx: number) => {
    if (!task) return;
    const nextList = [...(task.checklist || [])];
    nextList[idx] = {
      ...nextList[idx],
      completed: !nextList[idx].completed,
    };
    updateTaskMutation.mutate({ checklist: nextList });
  };

  // Add Checklist Item
  const handleAddChecklist = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newChecklistTitle.trim() && task) {
      e.preventDefault();
      const nextList = [
        ...(task.checklist || []),
        { title: newChecklistTitle.trim(), completed: false },
      ];
      updateTaskMutation.mutate({ checklist: nextList });
      setNewChecklistTitle("");
    }
  };

  // Subtask progress stats
  const subtasksCount = task?.subtasks?.length || 0;
  const subtasksCompleted = task?.subtasks?.filter((st: any) => st.completed).length || 0;
  const subtaskPct = subtasksCount > 0 ? Math.round((subtasksCompleted / subtasksCount) * 100) : 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-card">
          {/* Header Bar */}
          <SheetHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-sm font-bold flex items-center gap-2">
                {task?.projectId?.key ? (
                  <Badge variant="outline" className="font-mono text-[11px] font-bold">
                    {task.projectId.key}
                  </Badge>
                ) : task?.isPersonal ? (
                  <Badge variant="secondary" className="text-[11px]">
                    Personal To-Do
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px]">
                    Task
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">Details</span>
              </SheetTitle>
            </div>

            <div className="flex items-center gap-2 mr-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setIsDeleteOpen(true)}
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {isTaskLoading || !task ? (
            <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading task details...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Status / Priority / Assignee Control Row */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-muted/40 border text-xs">
                {/* Issue Type */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Type
                  </span>
                  <Select
                    value={task.issueType || "task"}
                    onValueChange={(val) => updateTaskMutation.mutate({ issueType: val })}
                  >
                    <SelectTrigger className="h-7 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((t) => {
                        const Icon = t.icon;
                        return (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-1.5">
                              <Icon className={`h-3 w-3 ${t.color}`} />
                              <span>{t.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Status
                  </span>
                  <Select
                    value={task.status}
                    onValueChange={(val) => updateTaskMutation.mutate({ status: val })}
                  >
                    <SelectTrigger className="h-7 text-xs font-semibold">
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

                {/* Priority */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Priority
                  </span>
                  <Select
                    value={task.priority}
                    onValueChange={(val) => updateTaskMutation.mutate({ priority: val })}
                  >
                    <SelectTrigger className="h-7 text-xs font-semibold">
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

                {/* Story Points */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Points
                  </span>
                  <Select
                    value={String(task.storyPoints || 0)}
                    onValueChange={(val) => updateTaskMutation.mutate({ storyPoints: Number(val) })}
                  >
                    <SelectTrigger className="h-7 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts</SelectItem>
                      <SelectItem value="1">1 pt</SelectItem>
                      <SelectItem value="2">2 pts</SelectItem>
                      <SelectItem value="3">3 pts</SelectItem>
                      <SelectItem value="5">5 pts</SelectItem>
                      <SelectItem value="8">8 pts</SelectItem>
                      <SelectItem value="13">13 pts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Assignee
                  </span>
                  <Select
                    value={task.assignedTo?._id || "none"}
                    onValueChange={(val) =>
                      updateTaskMutation.mutate({ assignedTo: val !== "none" ? val : null })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((m: any) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Due Date
                  </span>
                  <Input
                    type="date"
                    value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                    onChange={(e) => updateTaskMutation.mutate({ dueDate: e.target.value || null })}
                    className="h-7 text-xs px-2"
                  />
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => {
                        setIsEditingTitle(false);
                        if (title.trim() && title !== task.title) {
                          updateTaskMutation.mutate({ title: title.trim() });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setIsEditingTitle(false);
                          if (title.trim() && title !== task.title) {
                            updateTaskMutation.mutate({ title: title.trim() });
                          }
                        }
                      }}
                      autoFocus
                      className="text-base font-bold"
                    />
                  </div>
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="text-lg font-bold tracking-tight text-foreground hover:bg-muted/40 p-1.5 -ml-1.5 rounded-lg cursor-pointer transition-colors"
                    title="Click to edit title"
                  >
                    {task.title}
                  </h2>
                )}
              </div>

              {/* Tabs Container */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-9">
                  <TabsTrigger value="overview" className="text-xs">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="subtasks" className="text-xs flex items-center gap-1.5">
                    Subtasks
                    {subtasksCount > 0 && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono">
                        {subtasksCompleted}/{subtasksCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs flex items-center gap-1.5">
                    Comments
                    {comments.length > 0 && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono">
                        {comments.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="timelogs" className="text-xs flex items-center gap-1.5">
                    <Timer className="h-3 w-3 text-primary" />
                    Time Logs
                    {task.timeLogs && task.timeLogs.length > 0 && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono">
                        {task.timeLogs.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">
                    Activity
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview */}
                <TabsContent value="overview" className="space-y-4 pt-4">
                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Description
                    </Label>
                    <Textarea
                      placeholder="Add a detailed task description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => {
                        if (description !== task.description) {
                          updateTaskMutation.mutate({ description });
                        }
                      }}
                      rows={4}
                      className="text-xs resize-none"
                    />
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3 bg-muted/20 rounded-lg border space-y-1">
                      <span className="text-muted-foreground text-[11px]">Project</span>
                      <p className="font-semibold text-foreground">
                        {task.projectId?.name || "Independent"}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/20 rounded-lg border space-y-1">
                      <span className="text-muted-foreground text-[11px]">Reporter</span>
                      <p className="font-semibold text-foreground">
                        {task.reporterId?.name || "System Admin"}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/20 rounded-lg border space-y-1 col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                          <Timer className="h-3 w-3 text-primary" />
                          Time Tracking
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLogForm(!showLogForm)}
                          className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10"
                        >
                          + Log Work
                        </Button>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{task.actualHours || 0}h logged</span>
                          <span className="text-muted-foreground font-mono">
                            {task.estimatedHours ? `${task.estimatedHours}h estimate` : "No estimate"}
                          </span>
                        </div>
                        {task.estimatedHours > 0 && (
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                (task.actualHours || 0) > task.estimatedHours
                                  ? "bg-amber-500"
                                  : "bg-primary"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Math.round(((task.actualHours || 0) / task.estimatedHours) * 100),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {showLogForm && (
                        <div className="p-2.5 rounded-md border bg-card space-y-2 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              placeholder="Hours (e.g. 1.5)"
                              value={logHours}
                              onChange={(e) => setLogHours(e.target.value)}
                              className="h-7 text-xs"
                            />
                            <Input
                              placeholder="Description of work..."
                              value={logDesc}
                              onChange={(e) => setLogDesc(e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLogForm(false)}
                              className="h-6 text-[10px]"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              disabled={logTimeMutation.isPending || !logHours}
                              onClick={() => logTimeMutation.mutate()}
                              className="h-6 text-[10px]"
                            >
                              {logTimeMutation.isPending ? "Logging..." : "Save Worklog"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-muted/20 rounded-lg border space-y-1 col-span-2">
                      <span className="text-muted-foreground text-[11px]">Created</span>
                      <p className="font-semibold text-foreground">
                        {format(new Date(task.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Labels Section */}
                  {task.labels && task.labels.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Labels
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {task.labels.map((lbl: string) => (
                          <Badge key={lbl} variant="secondary" className="text-xs">
                            {lbl}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Subtasks & Checklist */}
                <TabsContent value="subtasks" className="space-y-5 pt-4">
                  {/* Progress Bar */}
                  {subtasksCount > 0 && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">Subtasks Progress</span>
                        <span className="font-mono text-muted-foreground">
                          {subtasksCompleted} / {subtasksCount} ({subtaskPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${subtaskPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtasks List */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" />
                      Subtasks
                    </Label>

                    <div className="space-y-1.5">
                      {task.subtasks?.map((st: any, idx: number) => (
                        <div
                          key={st._id || idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card hover:bg-muted/30 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              checked={st.completed}
                              onCheckedChange={() => handleToggleSubtask(idx)}
                            />
                            <span
                              className={`truncate font-medium ${
                                st.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveSubtask(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Input
                      placeholder="Type a new subtask and press Enter..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={handleAddSubtask}
                      className="text-xs h-8"
                    />
                  </div>

                  {/* Checklist Section */}
                  <div className="space-y-2 pt-3 border-t">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Checklist Items
                    </Label>
                    <div className="space-y-1.5">
                      {task.checklist?.map((item: any, idx: number) => (
                        <div
                          key={item._id || idx}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-card text-xs"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleToggleChecklist(idx)}
                          />
                          <span
                            className={`truncate flex-1 font-medium ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Input
                      placeholder="Add checklist item and press Enter..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      onKeyDown={handleAddChecklist}
                      className="text-xs h-8"
                    />
                  </div>
                </TabsContent>

                {/* Tab 3: Comments */}
                <TabsContent value="comments" className="space-y-4 pt-4">
                  {/* Comments Feed */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        No comments yet. Start the conversation below!
                      </div>
                    ) : (
                      comments.map((c: any) => {
                        const isAuthor =
                          c.userId?._id?.toString() === user?.id ||
                          c.userId === user?.id;
                        return (
                          <div
                            key={c._id}
                            className="p-3 rounded-xl border bg-muted/20 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={c.userId?.avatar} alt={c.userId?.name} />
                                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                                    {c.userId?.name ? c.userId.name[0] : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-foreground">
                                  {c.userId?.name || "Team Member"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {c.createdAt
                                    ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
                                    : "recently"}
                                </span>
                              </div>
                              {isAuthor && (
                                <button
                                  onClick={() => deleteCommentMutation.mutate(c._id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-foreground/90 pl-7 leading-relaxed">{c.body}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Comment Box */}
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Write a comment or update..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="text-xs resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        onClick={() => addCommentMutation.mutate()}
                        className="gap-1.5 h-8 text-xs"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Comment
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Time Tracking / Worklogs */}
                <TabsContent value="timelogs" className="space-y-4 pt-4">
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <Timer className="h-4 w-4 text-primary" />
                          Worklog Time Tracker
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Track billable and development time spent on this issue.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-foreground">
                          {task.actualHours || 0}h
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          of {task.estimatedHours ? `${task.estimatedHours}h` : "∞"} estimated
                        </span>
                      </div>
                    </div>

                    {/* Quick Log Form */}
                    <div className="pt-2 border-t flex flex-col sm:flex-row items-center gap-2">
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        placeholder="Hours (e.g. 2.5)"
                        value={logHours}
                        onChange={(e) => setLogHours(e.target.value)}
                        className="h-8 text-xs sm:w-32"
                      />
                      <Input
                        placeholder="Description of work done..."
                        value={logDesc}
                        onChange={(e) => setLogDesc(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        disabled={logTimeMutation.isPending || !logHours}
                        onClick={() => logTimeMutation.mutate()}
                        className="h-8 text-xs gap-1 shrink-0"
                      >
                        {logTimeMutation.isPending ? "Logging..." : "Log Work"}
                      </Button>
                    </div>
                  </div>

                  {/* Worklogs List */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Worklog History
                    </Label>
                    {!task.timeLogs || task.timeLogs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg border-dashed">
                        No time logged on this task yet. Enter hours above to log work.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {task.timeLogs.map((log: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={log.userId?.avatar} alt={log.userId?.name} />
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                  {log.userId?.name ? log.userId.name[0] : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="truncate">
                                <p className="font-semibold truncate">
                                  {log.userId?.name || "Team Member"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {log.description || "Logged development work"}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="font-mono text-xs font-bold">
                                +{log.hours}h
                              </Badge>
                              <span className="text-[10px] text-muted-foreground block">
                                {format(new Date(log.loggedAt || Date.now()), "MMM d, HH:mm")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 4: Activity Log */}
                <TabsContent value="activity" className="space-y-3 pt-4">
                  {activities.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No logged activities for this task yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                      {activities.map((act: any) => (
                        <div
                          key={act._id}
                          className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-muted/20 border"
                        >
                          <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5">
                            <History className="h-3 w-3" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{act.title}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {act.createdAt
                                  ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })
                                  : ""}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-[11px]">{act.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
        onConfirm={() => deleteTaskMutation.mutate()}
        confirmText="Delete Task"
      />
    </>
  );
}
