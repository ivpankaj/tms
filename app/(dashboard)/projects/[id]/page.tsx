"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { CreateTaskDialog } from "@/components/shared/create-task-dialog";
import { EditTaskDialog } from "@/components/shared/edit-task-dialog";
import { SetTaskReminderDialog } from "@/components/shared/set-task-reminder-dialog";
import { invalidateWorkspaceQueries } from "@/lib/utils/query-helpers";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  FolderGit2,
  ListTodo,
  Kanban,
  Calendar as CalendarIcon,
  GitCommitHorizontal,
  FileText,
  Activity as ActivityIcon,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Loader2,
  ChevronRight,
  Flag,
  Layers,
  BookOpen,
  Play,
  Check,
  Sparkles,
  Bug,
  Bookmark,
  Zap,
  CheckSquare,
  Eye,
  ListChecks,
  Paperclip,
  AlertTriangle,
  ArrowDownCircle,
  Edit3,
  Edit2,
  Bell,
  MoreVertical,
  Timer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";

const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgLight: string; badge: string; border: string }
> = {
  Backlog: {
    label: "Backlog",
    color: "#64748b",
    bgLight: "bg-slate-500/10",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    border: "border-slate-300 dark:border-slate-800",
  },
  Todo: {
    label: "Todo",
    color: "#3b82f6",
    bgLight: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    border: "border-blue-300 dark:border-blue-800",
  },
  "In Progress": {
    label: "In Progress",
    color: "#f59e0b",
    bgLight: "bg-amber-500/10",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    border: "border-amber-300 dark:border-amber-800",
  },
  "In Review": {
    label: "In Review",
    color: "#8b5cf6",
    bgLight: "bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    border: "border-purple-300 dark:border-purple-800",
  },
  Done: {
    label: "Done",
    color: "#10b981",
    bgLight: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    border: "border-emerald-300 dark:border-emerald-800",
  },
};

const getProjectTaskPriorityStyle = (priority: string) => {
  switch (priority) {
    case "Urgent":
      return {
        badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold",
        leftBorder: "border-l-rose-500",
        dot: "bg-rose-500",
      };
    case "High":
      return {
        badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 font-semibold",
        leftBorder: "border-l-orange-500",
        dot: "bg-orange-500",
      };
    case "Medium":
      return {
        badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium",
        leftBorder: "border-l-amber-500",
        dot: "bg-amber-500",
      };
    case "Low":
    default:
      return {
        badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium",
        leftBorder: "border-l-blue-500",
        dot: "bg-blue-500",
      };
  }
};

// Pure Card Visual Component
function KanbanCardVisual({
  task,
  isOverlay = false,
  isGhost = false,
  onSelect,
  onEdit,
  onReminder,
}: {
  task: any;
  isOverlay?: boolean;
  isGhost?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (task: any) => void;
  onReminder?: (task: any) => void;
}) {
  const priorityStyle = getProjectTaskPriorityStyle(task.priority);
  const subtasksCount = task.subtasks?.length || 0;
  const subtasksCompleted = task.subtasks?.filter((s: any) => s.completed).length || 0;
  const progressPercent = subtasksCount > 0 ? Math.round((subtasksCompleted / subtasksCount) * 100) : 0;
  const attachmentsCount = task.attachments?.length || 0;

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && task.status !== "Done";

  if (isGhost) {
    return (
      <div className="p-3.5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 min-h-[100px] opacity-40 transition-all flex items-center justify-center">
        <span className="text-xs font-medium text-primary/70 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Moving task...
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect && onSelect(task._id)}
      className={`group relative p-3 rounded-xl border bg-card/95 backdrop-blur-xs transition-all duration-150 select-none space-y-2.5 ${
        priorityStyle.leftBorder
      } border-l-[3.5px] ${
        isOverlay
          ? "shadow-2xl ring-2 ring-primary/50 rotate-1 scale-[1.02] cursor-grabbing z-50 bg-card"
          : "shadow-xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <h5 className="font-medium text-xs sm:text-[13px] text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">
          {task.title}
        </h5>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={`text-[9.5px] px-1.5 py-0 h-4.5 shrink-0 ${priorityStyle.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full mr-1 ${priorityStyle.dot}`} />
            {task.priority || "Medium"}
          </Badge>
          {!isOverlay && onEdit && onReminder && (
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded px-1 py-0.5"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Edit Task"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                title="Set Reminder"
                onClick={() => onReminder(task)}
              >
                <Bell className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {subtasksCount > 0 && (
        <div className="w-full h-1.5 bg-muted/80 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[10.5px]">
        <div className="flex items-center gap-1.5 truncate">
          <Avatar className="h-4.5 w-4.5 ring-1 ring-background">
            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
              {task.assignedTo?.name ? task.assignedTo.name[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-muted-foreground text-[10.5px]">
            {task.assignedTo?.name || "Unassigned"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {subtasksCount > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground font-mono text-[9.5px]">
              <ListChecks className="h-2.5 w-2.5" />
              {subtasksCompleted}/{subtasksCount}
            </span>
          )}
          {dueDateObj && (
            <span
              className={`flex items-center gap-1 px-1 py-0.2 rounded font-mono text-[9.5px] ${
                isOverdue
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : "bg-muted/60 text-muted-foreground"
              }`}
            >
              {isOverdue && <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />}
              {format(dueDateObj, "MMM d")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Draggable Kanban Card Component
function KanbanCard({
  task,
  onSelect,
  onEdit,
  onReminder,
}: {
  task: any;
  onSelect: (id: string) => void;
  onEdit: (task: any) => void;
  onReminder: (task: any) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ touchAction: "none" }}
      className="outline-none"
    >
      <KanbanCardVisual
        task={task}
        isGhost={isDragging}
        onSelect={onSelect}
        onEdit={onEdit}
        onReminder={onReminder}
      />
    </div>
  );
}

// Droppable Kanban Column Component
function KanbanColumn({
  status,
  tasks,
  onSelectTask,
  onQuickAdd,
  onEditTask,
  onReminderTask,
}: {
  status: string;
  tasks: any[];
  onSelectTask: (id: string) => void;
  onQuickAdd: (status: string) => void;
  onEditTask: (task: any) => void;
  onReminderTask: (task: any) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const config = PROJECT_STATUS_CONFIG[status] || {
    label: status,
    color: "#64748b",
    bgLight: "bg-muted/40",
    badge: "bg-muted text-muted-foreground",
    border: "border-border",
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col rounded-2xl border bg-muted/20 transition-all duration-200 ${
        isOver
          ? "border-primary ring-2 ring-primary/30 bg-primary/[0.04] shadow-lg shadow-primary/5"
          : "border-border/70 hover:border-border"
      }`}
    >
      <div className="p-3.5 border-b border-border/50 flex items-center justify-between bg-card/50 rounded-t-2xl backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <h4 className="font-semibold text-xs sm:text-sm text-foreground">{status}</h4>
          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg cursor-pointer"
          onClick={() => onQuickAdd(status)}
          title={`Add task in ${status}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5 min-h-[450px] max-h-[calc(100vh-320px)] scrollbar-thin">
        {tasks.map((task) => (
          <KanbanCard
            key={task._id}
            task={task}
            onSelect={onSelectTask}
            onEdit={onEditTask}
            onReminder={onReminderTask}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className={`h-32 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground border-2 border-dashed rounded-xl transition-all duration-150 ${
              isOver
                ? "border-primary/60 bg-primary/10 text-primary font-medium"
                : "border-border/60 bg-muted/10"
            }`}
          >
            <ArrowDownCircle className={`h-4 w-4 ${isOver ? "text-primary animate-bounce" : "text-muted-foreground/50"}`} />
            <span>{isOver ? "Drop to move here" : "Drop tasks here"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  // Tab & selection state
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState("Todo");
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [reminderTask, setReminderTask] = useState<any | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Sensor for dnd-kit (activation constraint of 4px to distinguish click from drag)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  // 1. Fetch Project Details
  const { data: project, isLoading: isProjLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: Boolean(projectId),
    staleTime: 0,
  });

  // 2. Fetch Project Tasks
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks?projectId=${projectId}&limit=200`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(projectId),
    staleTime: 0,
  });

  // 3. Fetch Project Activities
  const { data: activities = [] } = useQuery({
    queryKey: ["project-activities", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/activities?entityType=project&entityId=${projectId}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(projectId),
  });

  // 4. Fetch Project Sprints
  const { data: sprints = [] } = useQuery({
    queryKey: ["project-sprints", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(projectId),
    staleTime: 0,
  });

  // 5. Fetch Project Docs
  const { data: docs = [] } = useQuery({
    queryKey: ["project-docs", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/docs`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(projectId),
  });

  // Sprint & Doc State
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("General");
  const [newDocContent, setNewDocContent] = useState("");
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState("ALL");

  // Create Sprint Mutation
  const createSprintMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSprintName, goal: newSprintGoal }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to create sprint");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      toast.success("Sprint created");
      setNewSprintName("");
      setNewSprintGoal("");
      setIsCreateSprintOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Start / Complete Sprint Mutation
  const sprintActionMutation = useMutation({
    mutationFn: async ({ sprintId, action, rollOverIncomplete }: any) => {
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sprintId, rollOverIncomplete }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update sprint");
      return json.data;
    },
    onSuccess: () => {
      invalidateWorkspaceQueries(queryClient, { projectId });
      queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      toast.success("Sprint updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Assign Task to Sprint
  const assignTaskSprintMutation = useMutation({
    mutationFn: async ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) => {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to assign sprint");
      return json.data;
    },
    onSuccess: (data) => {
      invalidateWorkspaceQueries(queryClient, { taskId: data._id, projectId });
      queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      toast.success("Task sprint updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create Doc Mutation
  const createDocMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          category: newDocCategory,
          content: newDocContent,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to create document");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] });
      toast.success("Document created");
      setNewDocTitle("");
      setNewDocContent("");
      setIsCreateDocOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update Project Mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update project");
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["project", projectId], updated);
      invalidateWorkspaceQueries(queryClient, { projectId });
      toast.success("Project updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update Task Status Mutation (For Drag-and-Drop with 0ms Optimistic UI)
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to move task");
      return json.data;
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["project-tasks", projectId] });
      const previousTasks = queryClient.getQueryData(["project-tasks", projectId]);

      // Optimistically update project tasks cache immediately in 0ms
      queryClient.setQueryData(["project-tasks", projectId], (old: any[] | undefined) => {
        if (!old) return [];
        return old.map((t: any) =>
          t._id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
        );
      });

      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["project-tasks", projectId], context.previousTasks);
      }
      toast.error(err.message || "Failed to update task status");
    },
    onSuccess: (data) => {
      toast.success(`Task moved to ${data.status}`);
    },
    onSettled: (data) => {
      if (data?._id) {
        invalidateWorkspaceQueries(queryClient, { taskId: data._id, projectId });
      }
    },
  });

  // Delete Project Mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to delete project");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t: any) => t._id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  // Handle Drag End in Kanban Board
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks.find((t: any) => t._id === taskId);
    if (task && task.status !== newStatus) {
      updateTaskStatusMutation.mutate({ taskId, newStatus });
    }
  };

  // Milestone toggling
  const handleToggleMilestone = (mIdx: number) => {
    if (!project) return;
    const nextMilestones = [...(project.milestones || [])];
    const curr = nextMilestones[mIdx];
    nextMilestones[mIdx] = {
      ...curr,
      completed: !curr.completed,
      completedAt: !curr.completed ? new Date() : null,
    };
    updateProjectMutation.mutate({ milestones: nextMilestones });
  };

  // Add Milestone
  const handleAddMilestone = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newMilestoneTitle.trim() && project) {
      e.preventDefault();
      const nextMilestones = [
        ...(project.milestones || []),
        { title: newMilestoneTitle.trim(), completed: false },
      ];
      updateProjectMutation.mutate({ milestones: nextMilestones });
      setNewMilestoneTitle("");
    }
  };

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  const handleQuickAdd = (status: string) => {
    setCreateDefaultStatus(status);
    setIsCreateOpen(true);
  };

  if (isProjLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="p-12 text-center text-xs text-muted-foreground space-y-3">
        <p className="font-semibold text-sm text-foreground">Project not found</p>
        <Button size="sm" onClick={() => router.push("/projects")}>
          Back to Projects
        </Button>
      </Card>
    );
  }

  // Board columns
  const boardColumns = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

  // Milestones count
  const totalMilestones = project.milestones?.length || 0;
  const completedMilestones = project.milestones?.filter((m: any) => m.completed).length || 0;

  return (
    <div className="space-y-6">
      {/* Project Header Card */}
      <Card className="shadow-2xs border-primary/20 bg-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            >
              {project.key}
            </div>
            <div className="space-y-0.5 truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {project.name}
                </h1>
                <Badge variant="secondary" className="text-xs capitalize">
                  {project.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {project.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {project.description || "No project description"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => handleQuickAdd("Todo")}
              className="gap-1.5 cursor-pointer text-sm"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteProjectOpen(true)}
              className="h-9 w-9 text-muted-foreground hover:text-destructive cursor-pointer"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar & Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t text-sm">
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Sprint Completion</span>
              <span className="font-bold font-mono">{project.progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Tasks</span>
            <p className="font-semibold text-foreground">
              {project.completedTasks ?? 0} / {project.totalTasks ?? 0} completed
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Target Deadline</span>
            <p className="font-semibold text-foreground">
              {project.dueDate
                ? format(new Date(project.dueDate), "MMM d, yyyy")
                : "No deadline"}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full h-auto p-1 gap-1">
          <TabsTrigger value="overview" className="text-sm py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-sm py-2">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="board" className="text-sm py-2">
            Board
          </TabsTrigger>
          <TabsTrigger value="sprints" className="text-sm py-2">
            Sprints ({sprints.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-sm py-2">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-sm py-2">
            Docs ({docs.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-sm py-2">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-sm py-2">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Milestones Checklist Card */}
            <Card className="lg:col-span-2 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <Flag className="h-4 w-4 text-primary" />
                    Key Milestones
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    High-level project phases and checkpoints.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {completedMilestones} / {totalMilestones} done
                </Badge>
              </div>

              <div className="space-y-2">
                {project.milestones?.map((m: any, idx: number) => (
                  <div
                    key={m._id || idx}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <Checkbox
                        checked={m.completed}
                        onCheckedChange={() => handleToggleMilestone(idx)}
                      />
                      <span
                        className={`font-semibold ${
                          m.completed ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                    {m.dueDate && (
                      <span className="text-muted-foreground text-[11px]">
                        Due {format(new Date(m.dueDate), "MMM d")}
                      </span>
                    )}
                  </div>
                ))}

                <Input
                  placeholder="Add a milestone and press Enter..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={handleAddMilestone}
                  className="text-xs h-9"
                />
              </div>
            </Card>

            {/* Members & Meta Card */}
            <Card className="shadow-2xs p-5 space-y-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Team Roster
              </h3>
              <div className="space-y-3">
                {project.members?.map((member: any) => (
                  <div key={member._id} className="flex items-center gap-2.5 text-xs">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                        {member.name ? member.name.slice(0, 2).toUpperCase() : "TM"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Tasks List */}
        <TabsContent value="tasks" className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks in this project..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            <Button
              size="sm"
              onClick={() => handleQuickAdd("Todo")}
              className="gap-1.5 text-sm h-10 px-3.5"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>

          <div className="space-y-2.5">
            {tasks
              .filter((t: any) =>
                taskSearch ? t.title.toLowerCase().includes(taskSearch.toLowerCase()) : true
              )
              .map((t: any) => (
                <div
                  key={t._id}
                  onClick={() => handleOpenTask(t._id)}
                  className="p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3 text-sm cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <span
                      className={`font-medium truncate group-hover:text-primary transition-colors ${
                        t.status === "Done" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        t.priority === "Urgent" || t.priority === "High"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs px-2 py-0.5"
                    >
                      {t.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {t.status}
                    </Badge>

                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit Task"
                        onClick={() => setEditingTask(t)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                        title="Set Reminder / Shift"
                        onClick={() => setReminderTask(t)}
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Tab 3: Kanban Board */}
        <TabsContent value="board" className="pt-2">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex items-start gap-4 overflow-x-auto pb-4 scrollbar-thin pt-1">
              {boardColumns.map((colStatus) => (
                <KanbanColumn
                  key={colStatus}
                  status={colStatus}
                  tasks={tasks.filter((t: any) => t.status === colStatus)}
                  onSelectTask={handleOpenTask}
                  onQuickAdd={handleQuickAdd}
                  onEditTask={(task) => setEditingTask(task)}
                  onReminderTask={(task) => setReminderTask(task)}
                />
              ))}
            </div>

            <DragOverlay
              zIndex={99999}
              dropAnimation={{
                duration: 150,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.4",
                    },
                  },
                }),
              }}
            >
              {activeTask ? (
                <div className="w-80 pointer-events-none shadow-2xl">
                  <KanbanCardVisual task={activeTask} isOverlay={true} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        {/* Tab 4: Calendar */}
        <TabsContent value="calendar" className="pt-2">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm">Project Deliverables by Due Date</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tasks.map((t: any) => (
                <div
                  key={t._id}
                  onClick={() => handleOpenTask(t._id)}
                  className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer space-y-1 text-xs"
                >
                  <p className="font-semibold text-foreground truncate">{t.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "No due date"}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {t.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 5: Timeline */}
        <TabsContent value="timeline" className="pt-2">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm">Task Timeline & Duration Bars</h3>
            <div className="space-y-3">
              {tasks.map((t: any) => (
                <div key={t._id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold truncate">{t.title}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {t.dueDate ? format(new Date(t.dueDate), "MMM d") : "Ongoing"}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/80"
                      style={{
                        width: t.status === "Done" ? "100%" : t.status === "In Progress" ? "50%" : "15%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Sprints & Backlog */}
        <TabsContent value="sprints" className="space-y-6 pt-2">
          {/* Active Sprint Section */}
          {(() => {
            const activeSprint = sprints.find((s: any) => s.status === "active");
            const sprintTasks = activeSprint
              ? tasks.filter((t: any) => t.sprintId === activeSprint._id)
              : [];
            const backlogTasks = tasks.filter((t: any) => !t.sprintId);

            return (
              <div className="space-y-6">
                {/* Active Sprint Header Banner */}
                {activeSprint ? (
                  <Card className="p-6 border-primary/40 bg-card space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground font-mono uppercase text-xs">
                            Active Sprint
                          </Badge>
                          <h3 className="text-lg font-bold text-foreground">{activeSprint.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activeSprint.goal || "Focusing on key deliverables and sprint goals."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            sprintActionMutation.mutate({
                              sprintId: activeSprint._id,
                              action: "complete",
                              rollOverIncomplete: true,
                            })
                          }
                          disabled={sprintActionMutation.isPending}
                          className="text-xs h-9"
                        >
                          Complete Sprint
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleQuickAdd("Todo")}
                          className="text-xs h-9 gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Task
                        </Button>
                      </div>
                    </div>

                    {/* Sprint Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Duration</span>
                        <span className="font-semibold text-foreground">
                          {activeSprint.endDate
                            ? `${format(new Date(activeSprint.startDate || Date.now()), "MMM d")} - ${format(new Date(activeSprint.endDate), "MMM d")}`
                            : "Ongoing"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Tasks</span>
                        <span className="font-semibold text-foreground font-mono">
                          {activeSprint.completedTasks} / {activeSprint.totalTasks} completed
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Story Points Velocity</span>
                        <span className="font-semibold text-foreground font-mono">
                          {activeSprint.completedStoryPoints} / {activeSprint.totalStoryPoints} pts
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Progress</span>
                        <span className="font-bold text-primary font-mono">
                          {activeSprint.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Active Sprint Task List */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Sprint Tasks ({sprintTasks.length})
                      </h4>
                      {sprintTasks.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg border-dashed">
                          No tasks in this sprint yet. Move tasks from the backlog below.
                        </div>
                      ) : (
                        sprintTasks.map((t: any) => (
                          <div
                            key={t._id}
                            className="p-3 rounded-xl border bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3 text-xs shadow-2xs"
                          >
                            <div
                              onClick={() => handleOpenTask(t._id)}
                              className="flex items-center gap-2.5 truncate cursor-pointer flex-1"
                            >
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {t.issueType || "task"}
                              </Badge>
                              <span
                                className={`font-semibold truncate ${
                                  t.status === "Done" ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {t.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {t.storyPoints > 0 && (
                                <Badge variant="secondary" className="font-mono text-[10px]">
                                  {t.storyPoints} pts
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  t.priority === "Urgent" || t.priority === "High"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {t.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {t.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Edit Task"
                                onClick={() => setEditingTask(t)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                                title="Set Reminder / Shift"
                                onClick={() => setReminderTask(t)}
                              >
                                <Bell className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  assignTaskSprintMutation.mutate({ taskId: t._id, sprintId: null })
                                }
                                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                To Backlog
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center space-y-3 border-dashed">
                    <Layers className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="text-base font-bold text-foreground">No Active Sprint</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Plan your next sprint by selecting tasks from the backlog below, or create a new sprint container.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setIsCreateSprintOpen(true)}
                        className="text-xs gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create Sprint
                      </Button>
                      {sprints.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            sprintActionMutation.mutate({
                              sprintId: sprints[0]._id,
                              action: "start",
                            })
                          }
                          className="text-xs gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5 text-emerald-500" />
                          Start {sprints[0].name}
                        </Button>
                      )}
                    </div>
                  </Card>
                )}

                {/* Backlog Section */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-primary" />
                        Project Backlog ({backlogTasks.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Unscheduled tasks ready for prioritization and sprint planning.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateSprintOpen(true)}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New Sprint
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {backlogTasks.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        Backlog is empty. Click "+ Add Task" to create new backlog items.
                      </div>
                    ) : (
                      backlogTasks.map((t: any) => (
                        <div
                          key={t._id}
                          className="p-3 rounded-xl border bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3 text-xs shadow-2xs"
                        >
                          <div
                            onClick={() => handleOpenTask(t._id)}
                            className="flex items-center gap-2.5 truncate cursor-pointer flex-1"
                          >
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {t.issueType || "task"}
                            </Badge>
                            <span className="font-semibold truncate">{t.title}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {t.storyPoints > 0 && (
                              <Badge variant="secondary" className="font-mono text-[10px]">
                                {t.storyPoints} pts
                              </Badge>
                            )}
                            <Badge
                              variant={
                                t.priority === "Urgent" || t.priority === "High"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {t.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {t.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit Task"
                              onClick={() => setEditingTask(t)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                              title="Set Reminder / Shift"
                              onClick={() => setReminderTask(t)}
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                            {activeSprint && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  assignTaskSprintMutation.mutate({
                                    taskId: t._id,
                                    sprintId: activeSprint._id,
                                  })
                                }
                                className="h-6 text-[10px] text-primary"
                              >
                                + Move to Sprint
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        {/* Tab: Project Docs & Wiki */}
        <TabsContent value="docs" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Select value={docCategoryFilter} onValueChange={setDocCategoryFilter}>
                <SelectTrigger className="w-40 text-xs h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="PRD">PRD</SelectItem>
                  <SelectItem value="Architecture">Architecture</SelectItem>
                  <SelectItem value="Meeting Notes">Meeting Notes</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateDocOpen(true)}
              className="text-xs h-9 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New Document
            </Button>
          </div>

          {/* Docs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs
              .filter((d: any) =>
                docCategoryFilter === "ALL" ? true : d.category === docCategoryFilter
              )
              .map((doc: any) => (
                <Card
                  key={doc._id}
                  onClick={() => setViewingDoc(doc)}
                  className="p-4 space-y-3 cursor-pointer hover:border-primary/50 transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">
                        {doc.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(doc.updatedAt || doc.createdAt), "MMM d")}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono">
                      {doc.content || "Empty document"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {doc.createdBy?.name ? doc.createdBy.name[0] : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{doc.createdBy?.name || "Author"}</span>
                    </div>
                    <span className="text-primary text-xs group-hover:underline">Read Doc</span>
                  </div>
                </Card>
              ))}

            {docs.length === 0 && (
              <Card className="col-span-full p-8 text-center text-xs text-muted-foreground space-y-3">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="font-semibold text-foreground text-sm">No documents in project wiki</p>
                <p>Create PRDs, architecture guides, and sprint notes to centralize knowledge.</p>
                <Button
                  size="sm"
                  onClick={() => setIsCreateDocOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create First Document
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 7: Activity */}
        <TabsContent value="activity" className="pt-2">
          <Card className="p-5 space-y-3">
            <h3 className="font-bold text-sm">Project Activity Trail</h3>
            <div className="divide-y divide-border/50 text-xs">
              {activities.length === 0 ? (
                <p className="py-4 text-muted-foreground">No activities logged yet.</p>
              ) : (
                activities.map((act: any) => (
                  <div key={act._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold mr-1.5">{act.title}</span>
                      <span className="text-muted-foreground">{act.details}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 8: Settings */}
        <TabsContent value="settings" className="pt-2">
          <Card className="p-6 max-w-xl space-y-4">
            <h3 className="font-bold text-base">Project Settings</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label>Project Name</Label>
                <Input
                  defaultValue={project.name}
                  onBlur={(e) => {
                    if (e.target.value !== project.name) {
                      updateProjectMutation.mutate({ name: e.target.value });
                    }
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label>Project Key</Label>
                <Input
                  defaultValue={project.key}
                  onBlur={(e) => {
                    if (e.target.value !== project.key) {
                      updateProjectMutation.mutate({ key: e.target.value.toUpperCase() });
                    }
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  defaultValue={project.status}
                  onValueChange={(val) => updateProjectMutation.mutate({ status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteProjectOpen(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaultProjectId={projectId}
        defaultStatus={createDefaultStatus}
      />

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteProjectOpen}
        onOpenChange={setIsDeleteProjectOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        onConfirm={() => deleteProjectMutation.mutate()}
        confirmText="Delete Project"
      />

      {/* Create Sprint Dialog */}
      <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Sprint</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a sprint cycle with goals to focus team velocity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Sprint Name</Label>
              <Input
                placeholder="e.g. Sprint 24 - Core API & Auth"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Sprint Goal</Label>
              <Textarea
                placeholder="What is the key objective of this sprint?"
                value={newSprintGoal}
                onChange={(e) => setNewSprintGoal(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateSprintOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newSprintName.trim() || createSprintMutation.isPending}
              onClick={() => createSprintMutation.mutate()}
              className="text-xs"
            >
              {createSprintMutation.isPending ? "Creating..." : "Create Sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog open={isCreateDocOpen} onOpenChange={setIsCreateDocOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">New Project Document</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a PRD, Architecture Spec, or Meeting Notes to the project wiki.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Title</Label>
                <Input
                  placeholder="Document title..."
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRD">PRD</SelectItem>
                    <SelectItem value="Architecture">Architecture</SelectItem>
                    <SelectItem value="Meeting Notes">Meeting Notes</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Content (Markdown supported)</Label>
              <Textarea
                placeholder="Write documentation, technical specs, or meeting decisions here..."
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                rows={8}
                className="text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDocOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newDocTitle.trim() || createDocMutation.isPending}
              onClick={() => createDocMutation.mutate()}
              className="text-xs"
            >
              {createDocMutation.isPending ? "Saving..." : "Save Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={Boolean(viewingDoc)} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {viewingDoc?.category}
              </Badge>
              <DialogTitle className="text-lg font-bold">{viewingDoc?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              By {viewingDoc?.createdBy?.name || "Team Member"} • Last updated{" "}
              {viewingDoc?.updatedAt ? format(new Date(viewingDoc.updatedAt), "MMM d, yyyy") : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-xl bg-muted/20 border font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {viewingDoc?.content || "No content."}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingDoc(null)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
      />

      {/* Set Task Reminder Dialog */}
      <SetTaskReminderDialog
        task={reminderTask}
        open={!!reminderTask}
        onOpenChange={(open) => {
          if (!open) setReminderTask(null);
        }}
      />
    </div>
  );
}
