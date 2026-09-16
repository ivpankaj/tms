"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskImageUploader, TaskAttachment } from "@/components/shared/task-image-uploader";
import { invalidateWorkspaceQueries } from "@/lib/utils/query-helpers";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Edit3,
  CheckSquare,
  Sparkles,
  Bug,
  Bookmark,
  Zap,
  Plus,
  Trash2,
  Tag as TagIcon,
  ListChecks,
  Paperclip,
  Loader2,
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  Image as ImageIcon,
  Cloud,
} from "lucide-react";

interface EditTaskDialogProps {
  taskId?: string | null;
  task?: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenReminder?: (task: any) => void;
}

const ISSUE_TYPES = [
  { id: "task", label: "Task", icon: CheckSquare, color: "text-blue-500" },
  { id: "bug", label: "Bug", icon: Bug, color: "text-red-500" },
  { id: "feature", label: "Feature", icon: Sparkles, color: "text-emerald-500" },
  { id: "story", label: "Story", icon: Bookmark, color: "text-purple-500" },
  { id: "epic", label: "Epic", icon: Zap, color: "text-amber-500" },
];

export function EditTaskDialog({
  taskId,
  task: initialTask,
  open,
  onOpenChange,
  onOpenReminder,
}: EditTaskDialogProps) {
  const { organization, authFetch } = useAuth();
  const queryClient = useQueryClient();

  const effectiveTaskId = initialTask?._id || taskId;

  const [activeTab, setActiveTab] = useState("general");
  const descImageInputRef = React.useRef<HTMLInputElement>(null);
  const [isDescUploading, setIsDescUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("none");
  const [sprintId, setSprintId] = useState("none");
  const [status, setStatus] = useState("Todo");
  const [priority, setPriority] = useState("Medium");
  const [issueType, setIssueType] = useState("task");
  const [storyPoints, setStoryPoints] = useState("0");
  const [assignedTo, setAssignedTo] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<{ title: string; completed: boolean }[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  const handleUploadDescriptionImage = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsDescUploading(true);
    try {
      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
          toast.error(`File "${file.name}" is not an image.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "task-attachments");
        formData.append("resourceType", "image");

        const res = await authFetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (!json.success || !json.data?.url) {
          throw new Error(json.error?.message || `Failed to upload ${file.name}`);
        }

        const newAtt: TaskAttachment = {
          name: json.data.name || file.name,
          url: json.data.url,
          size: json.data.size || file.size,
          mimeType: json.data.type || file.type || "image/png",
          createdAt: new Date().toISOString(),
        };

        setAttachments((prev) => [...prev, newAtt]);
        setDescription((prev) =>
          prev
            ? `${prev}\n\n![${newAtt.name}](${newAtt.url})\n`
            : `![${newAtt.name}](${newAtt.url})\n`
        );
        toast.success(`Image "${file.name}" uploaded and added to description!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsDescUploading(false);
      if (descImageInputRef.current) descImageInputRef.current.value = "";
    }
  };

  const handleDescriptionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleUploadDescriptionImage(imageFiles);
    }
  };

  // 1. Fetch Task Details if only taskId provided or fresh copy needed
  const { data: fetchedTask, isLoading: isTaskLoading } = useQuery({
    queryKey: ["task", effectiveTaskId],
    queryFn: async () => {
      if (!effectiveTaskId) return null;
      const res = await authFetch(`/api/v1/tasks/${effectiveTaskId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: Boolean(effectiveTaskId) && open,
  });

  const activeTask = fetchedTask || initialTask;

  // 2. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await authFetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open,
  });

  // 3. Fetch Sprints
  const { data: projectSprints = [] } = useQuery({
    queryKey: ["project-sprints", projectId],
    queryFn: async () => {
      if (!projectId || projectId === "none") return [];
      const res = await authFetch(`/api/v1/projects/${projectId}/sprints`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open && projectId !== "none",
  });

  // 4. Fetch Users
  const { data: members = [] } = useQuery({
    queryKey: ["users-dropdown", organization?.id],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/users");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open,
  });

  // Populate form when task loads
  useEffect(() => {
    if (activeTask && open) {
      setTitle(activeTask.title || "");
      setDescription(activeTask.description || "");
      setProjectId(activeTask.projectId?._id || activeTask.projectId || "none");
      setSprintId(activeTask.sprintId?._id || activeTask.sprintId || "none");
      setStatus(activeTask.status || "Todo");
      setPriority(activeTask.priority || "Medium");
      setIssueType(activeTask.issueType || "task");
      setStoryPoints(String(activeTask.storyPoints || 0));
      setAssignedTo(activeTask.assignedTo?._id || activeTask.assignedTo || "none");
      setDueDate(activeTask.dueDate ? format(new Date(activeTask.dueDate), "yyyy-MM-dd") : "");
      setStartDate(activeTask.startDate ? format(new Date(activeTask.startDate), "yyyy-MM-dd") : "");
      setEstimatedHours(activeTask.estimatedHours ? String(activeTask.estimatedHours) : "");
      setIsPersonal(Boolean(activeTask.isPersonal));
      setLabels(activeTask.labels || []);
      setSubtasks(
        (activeTask.subtasks || []).map((st: any) => ({
          title: st.title,
          completed: Boolean(st.completed),
        }))
      );
      setAttachments(activeTask.attachments || []);
    }
  }, [activeTask, open]);

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveTaskId) return;
      if (!title.trim()) throw new Error("Task title cannot be empty");

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId !== "none" ? projectId : null,
        sprintId: sprintId !== "none" ? sprintId : null,
        status,
        priority,
        issueType,
        storyPoints: Number(storyPoints) || 0,
        assignedTo: assignedTo !== "none" ? assignedTo : null,
        dueDate: dueDate || null,
        startDate: startDate || null,
        estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
        isPersonal,
        labels,
        subtasks,
        attachments,
      };

      const res = await authFetch(`/api/v1/tasks/${effectiveTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Failed to update task");
      }

      return json.data;
    },
    onSuccess: (updated) => {
      toast.success("Task updated successfully!");
      invalidateWorkspaceQueries(queryClient, { taskId: effectiveTaskId, projectId });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update task");
    },
  });

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      if (!labels.includes(clean)) {
        setLabels([...labels, clean]);
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
      setSubtasks([...subtasks, { title: subtaskInput.trim(), completed: false }]);
      setSubtaskInput("");
    }
  };

  const handleToggleSubtask = (idx: number) => {
    const next = [...subtasks];
    next[idx] = { ...next[idx], completed: !next[idx].completed };
    setSubtasks(next);
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-card max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Edit Task</span>
                {activeTask?.projectId?.key && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {activeTask.projectId.key}
                  </Badge>
                )}
              </DialogTitle>
            </div>
          </div>

          {onOpenReminder && activeTask && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenReminder(activeTask);
              }}
              className="text-xs h-7 gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
            >
              <Bell className="h-3.5 w-3.5" />
              Set Reminder / Shift
            </Button>
          )}
        </DialogHeader>

        {isTaskLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading task details...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-8 mb-3">
                <TabsTrigger value="general" className="text-xs">
                  General Details
                </TabsTrigger>
                <TabsTrigger value="subtasks" className="text-xs flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  Subtasks ({subtasks.length})
                </TabsTrigger>
                <TabsTrigger value="attachments" className="text-xs flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Images & Files ({attachments.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: General Details */}
              <TabsContent value="general" className="space-y-4 pt-1">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title..."
                    className="text-xs h-9 font-semibold"
                  />
                </div>

                {/* Primary Row: Type, Status, Priority, Points */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Issue Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Issue Type</Label>
                    <Select value={issueType} onValueChange={setIssueType}>
                      <SelectTrigger className="text-xs h-9">
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="text-xs h-9">
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                        <SelectItem value="High">🟠 High</SelectItem>
                        <SelectItem value="Medium">🟡 Medium</SelectItem>
                        <SelectItem value="Low">🟢 Low</SelectItem>
                        <SelectItem value="No Priority">⚪ No Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Story Points */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Story Points</Label>
                    <Select value={storyPoints} onValueChange={setStoryPoints}>
                      <SelectTrigger className="text-xs h-9">
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
                </div>

                {/* Project & Sprint Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Project</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Independent / Personal</SelectItem>
                        {projects.map((p: any) => (
                          <SelectItem key={p._id} value={p._id}>
                            [{p.key}] {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Sprint</Label>
                    <Select
                      value={sprintId}
                      onValueChange={setSprintId}
                      disabled={projectId === "none"}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Select sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Sprint (Backlog)</SelectItem>
                        {projectSprints.map((sp: any) => (
                          <SelectItem key={sp._id} value={sp._id}>
                            {sp.name} ({sp.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Assignee & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Assignee</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {members.map((m: any) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.name} ({m.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Due Date</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Estimated Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      placeholder="e.g. 4"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Description with Direct Inline Image Upload */}
                <div className="space-y-2 p-3 rounded-xl border bg-muted/10 border-border/70">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <span>Description</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        (Supports Paste Ctrl+V for screenshots)
                      </span>
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={descImageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleUploadDescriptionImage(e.target.files)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDescUploading}
                        onClick={() => descImageInputRef.current?.click()}
                        className="h-7 text-[11px] gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer font-medium"
                      >
                        {isDescUploading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ImageIcon className="h-3 w-3" />
                        )}
                        <span>+ Add Image</span>
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onPaste={handleDescriptionPaste}
                    placeholder="Task details and acceptance criteria... You can type notes, paste images directly with Ctrl+V, or click '+ Add Image' above."
                    rows={4}
                    className="text-xs resize-none bg-background"
                  />

                  {/* Inline Attachments & Image Manager */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        Attached Images & Files ({attachments.length})
                      </span>
                    </div>

                    <TaskImageUploader
                      attachments={attachments}
                      onChange={setAttachments}
                      compact={true}
                      onInsertMarkdown={(snippet) =>
                        setDescription((prev) => (prev ? `${prev}\n\n${snippet}\n` : `${snippet}\n`))
                      }
                    />
                  </div>
                </div>

                {/* Labels */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Labels / Tags</Label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {labels.map((lbl) => (
                      <Badge
                        key={lbl}
                        variant="secondary"
                        className="text-xs gap-1 pl-2 pr-1 py-0.5"
                      >
                        {lbl}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(lbl)}
                          className="hover:text-destructive text-muted-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Type tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="text-xs h-8"
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Subtasks */}
              <TabsContent value="subtasks" className="space-y-3 pt-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Subtasks Checklist</span>
                    <span>
                      {subtasks.filter((s) => s.completed).length} of {subtasks.length} completed
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {subtasks.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            checked={st.completed}
                            onCheckedChange={() => handleToggleSubtask(idx)}
                          />
                          <span
                            className={`truncate ${
                              st.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {st.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(idx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Input
                    placeholder="Add a new subtask and press Enter..."
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={handleAddSubtask}
                    className="text-xs h-8"
                  />
                </div>
              </TabsContent>

              {/* Tab 3: Attachments & Images */}
              <TabsContent value="attachments" className="space-y-3 pt-1">
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-foreground">
                    Media & Attachments
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Upload images, design mocks, and files attached to this task.
                  </p>
                </div>
                <TaskImageUploader
                  attachments={attachments}
                  onChange={setAttachments}
                  disabled={updateTaskMutation.isPending}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="p-4 border-t bg-muted/20 shrink-0 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateTaskMutation.isPending}
            className="text-xs h-8"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={updateTaskMutation.isPending || !title.trim() || isTaskLoading}
            onClick={() => updateTaskMutation.mutate()}
            className="text-xs h-8 gap-1.5"
          >
            {updateTaskMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
