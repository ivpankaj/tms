"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import {
  Kanban as KanbanIcon,
  Plus,
  Search,
  FolderGit2,
  Calendar,
  ListChecks,
  Paperclip,
  CheckCircle2,
  Edit2,
  Bell,
  Sparkles,
  Layers,
  ArrowDownCircle,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
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

// Status configuration with distinct accents
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgLight: string; badge: string; border: string; glow: string }
> = {
  Backlog: {
    label: "Backlog",
    color: "#64748b",
    bgLight: "bg-slate-500/10",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    border: "border-slate-300 dark:border-slate-800",
    glow: "shadow-slate-500/10",
  },
  Todo: {
    label: "Todo",
    color: "#3b82f6",
    bgLight: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    border: "border-blue-300 dark:border-blue-800",
    glow: "shadow-blue-500/10",
  },
  "In Progress": {
    label: "In Progress",
    color: "#f59e0b",
    bgLight: "bg-amber-500/10",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    border: "border-amber-300 dark:border-amber-800",
    glow: "shadow-amber-500/10",
  },
  "In Review": {
    label: "In Review",
    color: "#8b5cf6",
    bgLight: "bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    border: "border-purple-300 dark:border-purple-800",
    glow: "shadow-purple-500/10",
  },
  Done: {
    label: "Done",
    color: "#10b981",
    bgLight: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    border: "border-emerald-300 dark:border-emerald-800",
    glow: "shadow-emerald-500/10",
  },
};

const getPriorityStyle = (priority: string) => {
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

// Pure Card Visual Component (Used in list & overlay)
function BoardCardVisual({
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
  const priorityStyle = getPriorityStyle(task.priority);
  const subtasksCount = task.subtasks?.length || 0;
  const subtasksCompleted = task.subtasks?.filter((s: any) => s.completed).length || 0;
  const progressPercent = subtasksCount > 0 ? Math.round((subtasksCompleted / subtasksCount) * 100) : 0;
  const attachmentsCount = task.attachments?.length || 0;

  // Due date status
  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== "Done";
  const isDueToday = dueDateObj && isToday(dueDateObj) && task.status !== "Done";

  if (isGhost) {
    return (
      <div className="p-3.5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 min-h-[110px] opacity-40 transition-all flex items-center justify-center">
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
      className={`group relative p-3.5 rounded-xl border bg-card/95 backdrop-blur-xs transition-all duration-150 select-none space-y-3 ${
        priorityStyle.leftBorder
      } border-l-[3.5px] ${
        isOverlay
          ? "shadow-2xl ring-2 ring-primary/50 rotate-1 scale-[1.02] cursor-grabbing z-50 bg-card"
          : "shadow-xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
      }`}
    >
      {/* Top Header: Project Key & Priority + Quick Actions */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {task.projectId ? (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-2 py-0 h-4.5 bg-primary/5 border-primary/20 text-primary shrink-0 gap-1"
            >
              <FolderGit2 className="h-2.5 w-2.5" />
              {task.projectId.key || task.projectId.name?.substring(0, 8)}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded">
              Personal
            </span>
          )}

          <Badge
            variant="outline"
            className={`text-[9.5px] px-1.5 py-0 h-4.5 shrink-0 ${priorityStyle.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full mr-1 ${priorityStyle.dot}`} />
            {task.priority || "Medium"}
          </Badge>
        </div>

        {/* Hover Action Buttons */}
        {!isOverlay && onEdit && onReminder && (
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-xs rounded-md px-1 py-0.5 shadow-2xs"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer rounded"
              title="Edit Task"
              onClick={() => onEdit(task)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer rounded"
              title="Set Reminder"
              onClick={() => onReminder(task)}
            >
              <Bell className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h5 className="font-medium text-xs sm:text-[13px] text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {task.title}
      </h5>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((lbl: string) => (
            <span
              key={lbl}
              className="text-[9.5px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-md font-medium border border-border/40"
            >
              #{lbl}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[9.5px] text-muted-foreground self-center">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Subtasks Progress Bar if available */}
      {subtasksCount > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3 text-primary" />
              Subtasks
            </span>
            <span>
              {subtasksCompleted}/{subtasksCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Meta: Dates, Attachments & Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10.5px]">
        <div className="flex items-center gap-2">
          {/* Due date badge */}
          {dueDateObj && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] ${
                isOverdue
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-medium"
                  : isDueToday
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium"
                  : "bg-muted/60 text-muted-foreground border border-border/40"
              }`}
              title={
                isOverdue
                  ? "Overdue"
                  : isDueToday
                  ? "Due Today"
                  : `Due: ${format(dueDateObj, "PPP")}`
              }
            >
              {isOverdue ? (
                <AlertTriangle className="h-2.5 w-2.5 text-rose-600 shrink-0" />
              ) : (
                <Calendar className="h-2.5 w-2.5 shrink-0" />
              )}
              {format(dueDateObj, "MMM d")}
            </span>
          )}

          {/* Attachments */}
          {attachmentsCount > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/30">
              <Paperclip className="h-2.5 w-2.5 text-blue-500" />
              {attachmentsCount}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5 shrink-0" title={task.assignedTo?.name || "Unassigned"}>
          <Avatar className="h-5 w-5 ring-1 ring-background shadow-2xs">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
              {task.assignedTo?.name ? task.assignedTo.name[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

// Draggable Kanban Task Card Wrapper
function DraggableBoardCard({
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
      <BoardCardVisual
        task={task}
        isGhost={isDragging}
        onSelect={onSelect}
        onEdit={onEdit}
        onReminder={onReminder}
      />
    </div>
  );
}

// Droppable Board Column
function BoardColumn({
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

  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "#64748b",
    bgLight: "bg-muted/40",
    badge: "bg-muted text-muted-foreground",
    border: "border-border",
    glow: "",
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
      {/* Column Header */}
      <div className="p-3.5 border-b border-border/50 flex items-center justify-between bg-card/50 rounded-t-2xl backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-xs"
            style={{ backgroundColor: config.color }}
          />
          <h4 className="font-semibold text-xs sm:text-sm text-foreground tracking-tight">
            {status}
          </h4>
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${config.badge}`}
          >
            {tasks.length}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg cursor-pointer transition-colors"
          onClick={() => onQuickAdd(status)}
          title={`Add task to ${status}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards Scrollable Body */}
      <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5 min-h-[480px] max-h-[calc(100vh-280px)] scrollbar-thin">
        {tasks.map((task) => (
          <DraggableBoardCard
            key={task._id}
            task={task}
            onSelect={onSelectTask}
            onEdit={onEditTask}
            onReminder={onReminderTask}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className={`h-36 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground border-2 border-dashed rounded-xl transition-all duration-150 ${
              isOver
                ? "border-primary/60 bg-primary/10 text-primary font-medium scale-[0.99]"
                : "border-border/60 bg-muted/10 hover:bg-muted/20"
            }`}
          >
            <ArrowDownCircle
              className={`h-5 w-5 ${
                isOver ? "text-primary animate-bounce" : "text-muted-foreground/50"
              }`}
            />
            <span>{isOver ? "Drop to move here" : "Drop tasks here"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardViewPage() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState("Todo");
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [reminderTask, setReminderTask] = useState<any | null>(null);

  // Active dragging card for DragOverlay
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Sensors for dnd-kit (activation constraint of 4px to distinguish click from drag)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  // Query Key for tasks board
  const boardQueryKey = [
    "tasks-board",
    organization?.id,
    projectFilter,
    priorityFilter,
    search,
  ];

  // Fetch all tasks for the board
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: boardQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        board: "true",
        ...(projectFilter !== "ALL" ? { projectId: projectFilter } : {}),
        ...(priorityFilter !== "ALL" ? { priority: priorityFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/v1/tasks?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    staleTime: 1000 * 60, // 1 minute fresh cache
  });

  // Fetch Projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Drag Mutation with 0ms Optimistic Update!
  const updateStatusMutation = useMutation({
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
      // 1. Cancel any active outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardQueryKey });

      // 2. Snapshot previous tasks
      const previousTasks = queryClient.getQueryData(boardQueryKey);

      // 3. Instantly update the board cache in 0ms!
      queryClient.setQueryData(boardQueryKey, (old: any[] | undefined) => {
        if (!old) return [];
        return old.map((t: any) =>
          t._id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
        );
      });

      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousTasks) {
        queryClient.setQueryData(boardQueryKey, context.previousTasks);
      }
      toast.error(err.message || "Failed to update task status");
    },
    onSuccess: (data) => {
      toast.success(`Task moved to ${data.status}`);
    },
    onSettled: (data) => {
      // Synchronize in background
      if (data?._id) {
        invalidateWorkspaceQueries(queryClient, { taskId: data._id });
      }
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t: any) => t._id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks.find((t: any) => t._id === taskId);
    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ taskId, newStatus });
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  const handleQuickAdd = (status: string) => {
    setCreateDefaultStatus(status);
    setIsCreateOpen(true);
  };

  const boardColumns = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

  // Quick summary counts
  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t: any) => t.status === "In Progress").length;
  const doneCount = tasks.filter((t: any) => t.status === "Done").length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
            <KanbanIcon className="h-7 w-7 text-primary" />
            Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Instant drag-and-drop board across workflow stages with real-time updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => handleQuickAdd("Todo")}
            className="gap-1.5 font-medium shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Quick Stats */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/60 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search board tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs bg-background">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {projects.map((p: any) => (
                <SelectItem key={p._id} value={p._id}>
                  [{p.key}] {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-background">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground px-2 py-1 bg-muted/40 rounded-lg border border-border/40 shrink-0 font-medium">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Total: <strong className="text-foreground">{totalTasks}</strong>
          </span>
          <span className="h-3 w-px bg-border" />
          <span>
            In Progress: <strong className="text-amber-500">{inProgressCount}</strong>
          </span>
          <span className="h-3 w-px bg-border" />
          <span>
            Done: <strong className="text-emerald-500">{doneCount}</strong>
          </span>
        </div>
      </div>

      {/* Kanban Drag-and-Drop Columns Area */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-6 scrollbar-thin pt-1">
          {boardColumns.map((colStatus) => (
            <BoardColumn
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

        {/* Smooth Drag Overlay preview */}
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
              <BoardCardVisual task={activeTask} isOverlay={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
        defaultStatus={createDefaultStatus}
      />

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
