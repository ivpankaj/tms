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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  X,
  Tag as TagIcon,
  ListChecks,
  Sparkles,
  Bug,
  Bookmark,
  Zap,
  CheckSquare,
  FileText,
  ChevronDown,
  Layers,
  Timer,
} from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
  defaultDueDate?: string;
  defaultSprintId?: string;
}

const ISSUE_TYPES = [
  { id: "task", label: "Task", icon: CheckSquare, color: "text-blue-500" },
  { id: "bug", label: "Bug", icon: Bug, color: "text-red-500" },
  { id: "feature", label: "Feature", icon: Sparkles, color: "text-emerald-500" },
  { id: "story", label: "Story", icon: Bookmark, color: "text-purple-500" },
  { id: "epic", label: "Epic", icon: Zap, color: "text-amber-500" },
];

const TASK_TEMPLATES = [
  {
    name: "🐛 Bug Report",
    type: "bug",
    priority: "High",
    title: "[Bug] ",
    description: `### Steps to Reproduce:\n1. Navigate to ...\n2. Click on ...\n3. Observe error\n\n### Expected Result:\nShould perform smoothly without exception.\n\n### Actual Result:\nThrows an unhandled exception.`,
    subtasks: ["Reproduce in staging", "Root cause investigation", "Implement fix", "Add regression test"],
    labels: ["bug", "triage"],
  },
  {
    name: "🚀 Feature Specification",
    type: "feature",
    priority: "Medium",
    title: "[Feature] ",
    description: `### User Story:\nAs a user, I want ... so that I can ...\n\n### Acceptance Criteria:\n- [ ] Criteria 1\n- [ ] Criteria 2\n\n### Technical Approach:\n- Frontend: React / Next.js\n- API: Authenticated endpoint with validation`,
    subtasks: ["Design review", "API implementation", "Frontend integration", "QA verification"],
    labels: ["feature", "roadmap"],
  },
  {
    name: "🔄 Sprint Retrospective",
    type: "story",
    priority: "Medium",
    title: "[Retro] Sprint Retrospective",
    description: `### What went well:\n- Key milestones delivered on target\n\n### What can be improved:\n- PR review turnaround time\n\n### Action Items:\n- Pair programming on complex modules`,
    subtasks: ["Gather feedback", "Prioritize action items", "Assign owners"],
    labels: ["agile", "retro"],
  },
  {
    name: "🛡️ Security Audit",
    type: "task",
    priority: "Urgent",
    title: "[Security] Security Audit & Review",
    description: `Perform thorough security review of dependencies, endpoints, and credentials.`,
    subtasks: ["Audit npm dependencies", "Verify RBAC permissions", "Check secret leaks", "Penetration test"],
    labels: ["security", "audit"],
  },
  {
    name: "📋 Client Launch Checklist",
    type: "epic",
    priority: "High",
    title: "[Launch] Go-Live & Launch Checklist",
    description: `Production release and client sign-off verification.`,
    subtasks: ["Database backups confirmed", "DNS & SSL propagation verified", "Smoke tests executed", "Client stakeholders notified"],
    labels: ["release", "launch"],
  },
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultProjectId,
  defaultStatus = "Todo",
  defaultDueDate,
  defaultSprintId,
}: CreateTaskDialogProps) {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "none");
  const [sprintId, setSprintId] = useState(defaultSprintId || "none");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("Medium");
  const [issueType, setIssueType] = useState<string>("task");
  const [storyPoints, setStoryPoints] = useState("0");
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
      setSprintId(defaultSprintId || "none");
      setStatus(defaultStatus || "Todo");
      setPriority("Medium");
      setIssueType("task");
      setStoryPoints("0");
      setAssignedTo(user?.id || "");
      setDueDate(defaultDueDate || "");
      setStartDate("");
      setEstimatedHours("");
      setIsPersonal(false);
      setLabels([]);
      setSubtasks([]);
    }
  }, [open, defaultProjectId, defaultStatus, defaultDueDate, defaultSprintId, user?.id]);

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

  // Fetch Sprints when project is selected
  const { data: projectSprints = [] } = useQuery({
    queryKey: ["project-sprints", projectId],
    queryFn: async () => {
      if (!projectId || projectId === "none") return [];
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: open && projectId !== "none",
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

  const applyTemplate = (tpl: (typeof TASK_TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setDescription(tpl.description);
    setIssueType(tpl.type);
    setPriority(tpl.priority);
    setLabels(tpl.labels);
    setSubtasks(tpl.subtasks);
    toast.info(`Applied "${tpl.name}" template`);
  };

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId !== "none" ? projectId : undefined,
        sprintId: sprintId !== "none" ? sprintId : undefined,
        status,
        priority,
        issueType,
        storyPoints: Number(storyPoints) || 0,
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
      queryClient.invalidateQueries({ queryKey: ["project-sprints"] });
      queryClient.invalidateQueries({ queryKey: ["workload"] });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
          <div>
            <DialogTitle className="text-xl font-bold">Create New Task</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Production task management with issue types, sprints, templates, and estimates.
            </DialogDescription>
          </div>

          {/* Template Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Use Template</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Task Templates</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TASK_TEMPLATES.map((tpl) => (
                <DropdownMenuItem
                  key={tpl.name}
                  onClick={() => applyTemplate(tpl)}
                  className="text-xs cursor-pointer py-1.5"
                >
                  {tpl.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Issue Type & Title Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-title" className="text-xs font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-1">
                {ISSUE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = issueType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setIssueType(t.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "border-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className={`h-3 w-3 ${t.color}`} />
                      <span className="capitalize">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Input
              id="task-title"
              placeholder="e.g., Fix session timeout bug, Setup Kubernetes auto-scaler"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-sm font-medium"
            />
          </div>

          {/* Project & Sprint Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project</Label>
              <Select
                value={projectId}
                onValueChange={(val) => {
                  setProjectId(val);
                  setSprintId("none");
                  if (val !== "none") setIsPersonal(false);
                }}
                disabled={isPersonal}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Project (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project (Workspace Task)</SelectItem>
                  {projects.map((proj: any) => (
                    <SelectItem key={proj._id} value={proj._id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || "#3b82f6" }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {proj.key}
                        </span>
                        <span>{proj.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sprint Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-muted-foreground" />
                Sprint
              </Label>
              <Select
                value={sprintId}
                onValueChange={setSprintId}
                disabled={isPersonal || projectId === "none"}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Sprint (Backlog / Planned)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Backlog (No Sprint)</SelectItem>
                  {projectSprints.map((sprint: any) => (
                    <SelectItem key={sprint._id} value={sprint._id}>
                      <div className="flex items-center gap-2">
                        <span>{sprint.name}</span>
                        <Badge
                          variant={sprint.status === "active" ? "default" : "secondary"}
                          className="text-[10px] px-1 py-0 capitalize"
                        >
                          {sprint.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  <SelectItem value="No Priority">No Priority</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Story Points</Label>
              <Select value={storyPoints} onValueChange={setStoryPoints}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 pts (Unestimated)</SelectItem>
                  <SelectItem value="1">1 pt (Tiny)</SelectItem>
                  <SelectItem value="2">2 pts (Small)</SelectItem>
                  <SelectItem value="3">3 pts (Medium)</SelectItem>
                  <SelectItem value="5">5 pts (Large)</SelectItem>
                  <SelectItem value="8">8 pts (Very Large)</SelectItem>
                  <SelectItem value="13">13 pts (Epic / Complex)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee, Due Date & Estimated Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assignee</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
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
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Timer className="h-3 w-3 text-muted-foreground" />
                Estimate (Hours)
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 4"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description" className="text-xs font-semibold">
              Description / Acceptance Criteria
            </Label>
            <Textarea
              id="task-description"
              placeholder="Add details, acceptance criteria, steps to reproduce, or specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-xs font-mono"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Subtasks & Checklist
            </Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type subtask and press Enter..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleAddSubtask}
                className="text-xs h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (subtaskInput.trim()) {
                    setSubtasks([...subtasks, subtaskInput.trim()]);
                    setSubtaskInput("");
                  }
                }}
                className="text-xs h-8 shrink-0"
              >
                Add
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-muted/40 px-2.5 py-1 rounded-md border"
                  >
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
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-primary" />
              Labels & Tags
            </Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add label (press Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="text-xs h-8"
              />
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {labels.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs gap-1 pl-2 pr-1 py-0.5"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Personal To-Do checkbox */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              id="is-personal"
              checked={isPersonal}
              onCheckedChange={(checked) => {
                setIsPersonal(Boolean(checked));
                if (checked) {
                  setProjectId("none");
                  setSprintId("none");
                }
              }}
            />
            <label
              htmlFor="is-personal"
              className="text-xs text-muted-foreground cursor-pointer font-medium"
            >
              Mark as personal manual To-Do item (Visible under My Tasks personal section)
            </label>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="text-xs gap-1.5"
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
