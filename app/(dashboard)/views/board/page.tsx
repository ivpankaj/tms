"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Kanban as KanbanIcon,
  Plus,
  Search,
  FolderGit2,
  Calendar,
  ListChecks,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

// Draggable Kanban Task Card
function DraggableBoardCard({
  task,
  onSelect,
}: {
  task: any;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const subtasksCount = task.subtasks?.length || 0;
  const subtasksCompleted = task.subtasks?.filter((s: any) => s.completed).length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task._id)}
      className="p-3 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-2xs cursor-grab active:cursor-grabbing space-y-2.5 text-xs select-none"
    >
      {/* Priority & Project Header */}
      <div className="flex items-center justify-between gap-1">
        {task.projectId ? (
          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
            {task.projectId.key}
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">Personal</span>
        )}

        <Badge
          variant={
            task.priority === "Urgent" || task.priority === "High"
              ? "destructive"
              : "secondary"
          }
          className="text-[9px] px-1 py-0 font-normal shrink-0"
        >
          {task.priority}
        </Badge>
      </div>

      {/* Title */}
      <h5 className="font-semibold text-foreground line-clamp-2 leading-snug">
        {task.title}
      </h5>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((lbl: string) => (
            <span
              key={lbl}
              className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium"
            >
              {lbl}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[9px] text-muted-foreground">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer Meta: Subtasks, Due Date, Assignee */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {subtasksCount > 0 && (
            <span className="flex items-center gap-0.5 font-mono">
              <ListChecks className="h-3 w-3" />
              {subtasksCompleted}/{subtasksCount}
            </span>
          )}

          {task.dueDate && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>

        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
            {task.assignedTo?.name ? task.assignedTo.name[0] : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

// Droppable Board Column
function BoardColumn({
  status,
  tasks,
  onSelectTask,
  onQuickAdd,
}: {
  status: string;
  tasks: any[];
  onSelectTask: (id: string) => void;
  onQuickAdd: (status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const getStatusColor = () => {
    switch (status) {
      case "Backlog":
        return "#64748b";
      case "Todo":
        return "#3b82f6";
      case "In Progress":
        return "#f59e0b";
      case "In Review":
        return "#8b5cf6";
      case "Done":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col rounded-xl border bg-muted/20 transition-colors ${
        isOver ? "bg-muted/60 border-primary" : ""
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: getStatusColor() }}
          />
          <h4 className="font-semibold text-xs text-foreground">{status}</h4>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
            {tasks.length}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onQuickAdd(status)}
          title={`Add task in ${status}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cards List */}
      <div className="p-2.5 flex-1 overflow-y-auto space-y-2 min-h-[500px]">
        {tasks.map((task) => (
          <DraggableBoardCard
            key={task._id}
            task={task}
            onSelect={onSelectTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-32 flex items-center justify-center text-[11px] text-muted-foreground border border-dashed rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardViewPage() {
  const { organization, user } = useAuth();
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

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Fetch all tasks for the board
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-board", organization?.id, projectFilter, priorityFilter, search],
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
  });

  // Fetch Projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Drag Mutation to update status immediately in MongoDB
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success(`Moved to ${data.status}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks.find((t: any) => t._id === taskId);
    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ taskId, newStatus });
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

  const boardColumns = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <KanbanIcon className="h-6 w-6 text-primary" />
            Kanban Board
          </h1>
          <p className="text-sm text-muted-foreground">
            Drag and drop tasks between workflow stages to update statuses immediately.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleQuickAdd("Todo")}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search board tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40 h-9 text-xs">
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

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-9 text-xs">
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
      </div>

      {/* Kanban Drag-and-Drop Columns Area */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-4 overflow-x-auto pb-6 scrollbar-thin">
          {boardColumns.map((colStatus) => (
            <BoardColumn
              key={colStatus}
              status={colStatus}
              tasks={tasks.filter((t: any) => t.status === colStatus)}
              onSelectTask={handleOpenTask}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
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
    </div>
  );
}
