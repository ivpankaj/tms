"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { CreateTaskDialog } from "@/components/shared/create-task-dialog";
import { EditTaskDialog } from "@/components/shared/edit-task-dialog";
import { SetTaskReminderDialog } from "@/components/shared/set-task-reminder-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { invalidateWorkspaceQueries } from "@/lib/utils/query-helpers";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  FolderGit2,
  Calendar,
  Filter,
  ArrowUpDown,
  ListTodo,
  CheckSquare,
  Sparkles,
  Edit3,
  Bell,
  MoreVertical,
} from "lucide-react";

export default function TasksPage() {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit & Reminder dialog states
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [reminderTask, setReminderTask] = useState<any | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Bulk actions state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Fetch Tasks with pagination & filters
  const { data: listData, isLoading } = useQuery({
    queryKey: [
      "tasks-list",
      organization?.id,
      page,
      statusFilter,
      priorityFilter,
      projectFilter,
      search,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(priorityFilter !== "ALL" ? { priority: priorityFilter } : {}),
        ...(projectFilter !== "ALL" ? { projectId: projectFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/v1/tasks?${params.toString()}`);
      return res.json();
    },
  });

  const tasks = listData?.data || [];
  const meta = listData?.meta || { total: 0, totalPages: 1 };

  // Fetch Projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Toggle Complete Mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "Done" || currentStatus === "Completed" ? "Todo" : "Done";
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateWorkspaceQueries(queryClient);
    },
  });

  // Single Delete Mutation
  const deleteSingleTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/tasks/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to delete task");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      invalidateWorkspaceQueries(queryClient);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Bulk Status Change
  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await Promise.all(
        selectedTaskIds.map((id) =>
          fetch(`/api/v1/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
    },
    onSuccess: () => {
      toast.success(`Updated ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      invalidateWorkspaceQueries(queryClient);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Bulk Priority Change
  const bulkPriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      await Promise.all(
        selectedTaskIds.map((id) =>
          fetch(`/api/v1/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority }),
          })
        )
      );
    },
    onSuccess: () => {
      toast.success(`Updated priority for ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      invalidateWorkspaceQueries(queryClient);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Bulk Delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        selectedTaskIds.map((id) =>
          fetch(`/api/v1/tasks/${id}`, {
            method: "DELETE",
          })
        )
      );
    },
    onSuccess: () => {
      toast.success(`Deleted ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      invalidateWorkspaceQueries(queryClient);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleEditTask = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditTaskId(id);
    setIsEditOpen(true);
  };

  const handleSetReminder = (t: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReminderTask(t);
    setIsReminderOpen(true);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(tasks.map((t: any) => t._id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((tid) => tid !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Complete workspace task directory with multi-filtering and bulk actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Backlog">Backlog</SelectItem>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => {
              setPriorityFilter(val);
              setPage(1);
            }}
          >
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

          {/* Project Filter */}
          <Select
            value={projectFilter}
            onValueChange={(val) => {
              setProjectFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
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
        </div>
      </div>

      {/* Bulk Action Toolbar (appears when items are selected) */}
      {selectedTaskIds.length > 0 && (
        <div className="p-3 rounded-xl border bg-primary/10 border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="font-semibold text-primary">
            {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
          </div>

          <div className="flex items-center gap-2">
            <Select onValueChange={(val) => bulkStatusMutation.mutate(val)}>
              <SelectTrigger className="h-8 text-xs bg-background w-32">
                <SelectValue placeholder="Move Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(val) => bulkPriorityMutation.mutate(val)}>
              <SelectTrigger className="h-8 text-xs bg-background w-32">
                <SelectValue placeholder="Set Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="h-8 text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <Card className="shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    tasks.length > 0 && selectedTaskIds.length === tasks.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28">Priority</TableHead>
              <TableHead className="w-40">Project</TableHead>
              <TableHead className="w-40">Assignee</TableHead>
              <TableHead className="w-32">Due Date</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-xs text-muted-foreground">
                  No tasks match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task: any) => {
                const isDone = task.status === "Done" || task.status === "Completed";
                const isSelected = selectedTaskIds.includes(task._id);

                return (
                  <TableRow
                    key={task._id}
                    className={`hover:bg-muted/40 cursor-pointer ${
                      isSelected ? "bg-muted/30" : ""
                    }`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectTask(task._id)}
                      />
                    </TableCell>

                    <TableCell onClick={() => handleOpenTask(task._id)}>
                      <div className="space-y-0.5 truncate max-w-md">
                        <span
                          className={`font-semibold text-xs text-foreground truncate ${
                            isDone ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {task.subtasks.filter((s: any) => s.completed).length} /{" "}
                            {task.subtasks.length} subtasks
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell onClick={() => handleOpenTask(task._id)}>
                      <Badge variant="outline" className="text-[10px]">
                        {task.status}
                      </Badge>
                    </TableCell>

                    <TableCell onClick={() => handleOpenTask(task._id)}>
                      <Badge
                        variant={
                          task.priority === "Urgent" || task.priority === "High"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>

                    <TableCell onClick={() => handleOpenTask(task._id)}>
                      {task.projectId ? (
                        <span className="font-mono text-xs text-primary font-medium truncate block">
                          [{task.projectId.key}] {task.projectId.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Personal</span>
                      )}
                    </TableCell>

                    <TableCell onClick={() => handleOpenTask(task._id)}>
                      <div className="flex items-center gap-1.5 text-xs truncate">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {task.assignedTo?.name ? task.assignedTo.name[0] : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{task.assignedTo?.name || "Unassigned"}</span>
                      </div>
                    </TableCell>

                    <TableCell onClick={() => handleOpenTask(task._id)}>
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                      </span>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={(e) => handleSetReminder(task, e)}
                          title="Schedule Reminder / Shift to Reminders"
                        >
                          <Bell className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleEditTask(task._id, e)}
                          title="Edit Task"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => handleOpenTask(task._id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleEditTask(task._id, e)}>
                              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleSetReminder(task, e)}>
                              <Bell className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                              Set Reminder / Shift
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteSingleTaskMutation.mutate(task._id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t text-xs text-muted-foreground">
            <div>
              Showing page {page} of {meta.totalPages} ({meta.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

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
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="Delete Selected Tasks"
        description={`Are you sure you want to permanently delete ${selectedTaskIds.length} tasks? This cannot be undone.`}
        onConfirm={() => bulkDeleteMutation.mutate()}
        confirmText="Delete Tasks"
      />

      {/* Edit Task Modal */}
      <EditTaskDialog
        taskId={editTaskId}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onOpenReminder={(t) => {
          setReminderTask(t);
          setIsReminderOpen(true);
        }}
      />

      {/* Set Task Reminder Modal */}
      <SetTaskReminderDialog
        task={reminderTask}
        open={isReminderOpen}
        onOpenChange={setIsReminderOpen}
      />
    </div>
  );
}
