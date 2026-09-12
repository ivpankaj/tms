"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { format, isToday, isPast, isFuture } from "date-fns";
import {
  CheckSquare,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  FolderGit2,
  Sparkles,
  Inbox,
  Loader2,
} from "lucide-react";

export default function MyTasksPage() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState("all");
  const [quickTodoTitle, setQuickTodoTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("Medium");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Fetch all tasks assigned to user or personal to-dos
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["my-tasks", organization?.id, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks?assignedTo=${user?.id}&limit=200`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(user),
  });

  // Quick-Add Personal To-Do Mutation
  const createQuickTodoMutation = useMutation({
    mutationFn: async () => {
      if (!quickTodoTitle.trim()) return;
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickTodoTitle.trim(),
          priority: quickPriority,
          dueDate: quickDueDate || undefined,
          status: "Todo",
          isPersonal: true,
          assignedTo: user?.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to create to-do");
      return data.data;
    },
    onSuccess: () => {
      setQuickTodoTitle("");
      setQuickDueDate("");
      setQuickPriority("Medium");
      toast.success("To-Do added");
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Toggle Task Completion Mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "Done" || currentStatus === "Completed" ? "Todo" : "Done";
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to update task");
      return data.data;
    },
    onSuccess: (data) => {
      toast.success(
        data.status === "Done" ? "Task marked as completed! 🎉" : "Task marked as Todo"
      );
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Helper date classifiers
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Filter tasks
  const filteredTasks = tasks.filter((t: any) => {
    if (searchQuery) {
      const matchTitle = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProject = t.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchProject) return false;
    }
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    return true;
  });

  // Section categorize
  const todayTasks = filteredTasks.filter(
    (t: any) =>
      t.status !== "Done" &&
      t.status !== "Completed" &&
      t.dueDate &&
      new Date(t.dueDate) >= startOfToday &&
      new Date(t.dueDate) <= endOfToday
  );

  const upcomingTasks = filteredTasks.filter(
    (t: any) =>
      t.status !== "Done" &&
      t.status !== "Completed" &&
      t.dueDate &&
      new Date(t.dueDate) > endOfToday
  );

  const overdueTasks = filteredTasks.filter(
    (t: any) =>
      t.status !== "Done" &&
      t.status !== "Completed" &&
      t.dueDate &&
      new Date(t.dueDate) < startOfToday
  );

  const completedTasks = filteredTasks.filter(
    (t: any) => t.status === "Done" || t.status === "Completed"
  );

  const personalTasks = filteredTasks.filter((t: any) => t.isPersonal);

  const projectTasks = filteredTasks.filter((t: any) => !t.isPersonal);

  // Quick Add submit
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTodoTitle.trim()) return;
    createQuickTodoMutation.mutate();
  };

  const openTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  // Render task row
  const renderTaskItem = (t: any) => {
    const isDone = t.status === "Done" || t.status === "Completed";
    return (
      <div
        key={t._id}
        className={`group p-3 rounded-xl border bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3 text-xs ${
          isDone ? "opacity-60 bg-muted/20" : ""
        }`}
      >
        <div className="flex items-center gap-3 truncate flex-1">
          <Checkbox
            checked={isDone}
            onCheckedChange={() =>
              toggleCompleteMutation.mutate({ taskId: t._id, currentStatus: t.status })
            }
            className="cursor-pointer"
          />
          <div
            className="truncate cursor-pointer flex-1"
            onClick={() => openTask(t._id)}
          >
            <p
              className={`font-semibold text-foreground truncate ${
                isDone ? "line-through text-muted-foreground" : ""
              }`}
            >
              {t.title}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              {t.projectId ? (
                <span className="flex items-center gap-1 font-mono text-primary font-medium">
                  <FolderGit2 className="h-3 w-3" />
                  [{t.projectId.key}] {t.projectId.name}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  Personal To-Do
                </span>
              )}

              {t.dueDate && (
                <span
                  className={`flex items-center gap-1 ${
                    !isDone && new Date(t.dueDate) < startOfToday
                      ? "text-rose-600 font-semibold"
                      : ""
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  {format(new Date(t.dueDate), "MMM d")}
                </span>
              )}

              {t.subtasks && t.subtasks.length > 0 && (
                <span className="font-mono">
                  ({t.subtasks.filter((s: any) => s.completed).length}/{t.subtasks.length} subtasks)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Personal manual To-Dos, assigned project deliverables, and prioritized agendas.
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

      {/* Quick-Add Manual To-Do Input Card (Section 7 Principle: Frictionless creation in seconds) */}
      <Card className="shadow-2xs border-primary/20 bg-linear-to-r from-card to-muted/20">
        <form onSubmit={handleQuickAdd} className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Quick Add Personal To-Do
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="What needs to be done? e.g., Buy groceries, Call client, Review sprint backlog... (Press Enter)"
              value={quickTodoTitle}
              onChange={(e) => setQuickTodoTitle(e.target.value)}
              className="flex-1 text-sm bg-background"
            />
            <div className="flex items-center gap-2">
              <Select value={quickPriority} onValueChange={setQuickPriority}>
                <SelectTrigger className="w-28 text-xs h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={quickDueDate}
                onChange={(e) => setQuickDueDate(e.target.value)}
                className="w-36 text-xs h-9 bg-background"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!quickTodoTitle.trim() || createQuickTodoMutation.isPending}
                className="h-9 px-4 shrink-0 gap-1.5"
              >
                {createQuickTodoMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search my tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
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

      {/* Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto p-1 gap-1">
          <TabsTrigger value="all" className="text-xs py-1.5">
            All ({filteredTasks.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="text-xs py-1.5 text-indigo-600 dark:text-indigo-400">
            Today ({todayTasks.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs py-1.5">
            Upcoming ({upcomingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs py-1.5 text-rose-600 dark:text-rose-400">
            Overdue ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="personal" className="text-xs py-1.5">
            Personal ({personalTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs py-1.5 text-emerald-600 dark:text-emerald-400">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Categorized */}
        <TabsContent value="all" className="space-y-6 pt-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="font-semibold text-foreground text-sm">You have zero pending tasks!</p>
              <p>Create a personal to-do above or relax.</p>
            </Card>
          ) : (
            <>
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Overdue ({overdueTasks.length})
                  </h3>
                  <div className="space-y-2">{overdueTasks.map(renderTaskItem)}</div>
                </div>
              )}

              {/* Today Section */}
              {todayTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Due Today ({todayTasks.length})
                  </h3>
                  <div className="space-y-2">{todayTasks.map(renderTaskItem)}</div>
                </div>
              )}

              {/* Upcoming Section */}
              {upcomingTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Upcoming ({upcomingTasks.length})
                  </h3>
                  <div className="space-y-2">{upcomingTasks.map(renderTaskItem)}</div>
                </div>
              )}

              {/* Personal Manual To-Dos Section */}
              {personalTasks.filter((t: any) => t.status !== "Done" && t.status !== "Completed" && !t.dueDate).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Personal Tasks (No Date)
                  </h3>
                  <div className="space-y-2">
                    {personalTasks
                      .filter((t: any) => t.status !== "Done" && t.status !== "Completed" && !t.dueDate)
                      .map(renderTaskItem)}
                  </div>
                </div>
              )}

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Recently Completed ({completedTasks.length})
                  </h3>
                  <div className="space-y-2">{completedTasks.slice(0, 5).map(renderTaskItem)}</div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab 2: Today */}
        <TabsContent value="today" className="space-y-2 pt-2">
          {todayTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              No tasks scheduled for today!
            </Card>
          ) : (
            todayTasks.map(renderTaskItem)
          )}
        </TabsContent>

        {/* Tab 3: Upcoming */}
        <TabsContent value="upcoming" className="space-y-2 pt-2">
          {upcomingTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              No upcoming tasks found.
            </Card>
          ) : (
            upcomingTasks.map(renderTaskItem)
          )}
        </TabsContent>

        {/* Tab 4: Overdue */}
        <TabsContent value="overdue" className="space-y-2 pt-2">
          {overdueTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400">
              No overdue tasks! You are on track.
            </Card>
          ) : (
            overdueTasks.map(renderTaskItem)
          )}
        </TabsContent>

        {/* Tab 5: Personal */}
        <TabsContent value="personal" className="space-y-2 pt-2">
          {personalTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              No personal to-dos yet. Add one using the quick bar above!
            </Card>
          ) : (
            personalTasks.map(renderTaskItem)
          )}
        </TabsContent>

        {/* Tab 6: Completed */}
        <TabsContent value="completed" className="space-y-2 pt-2">
          {completedTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              No completed tasks yet.
            </Card>
          ) : (
            completedTasks.map(renderTaskItem)
          )}
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
      />
    </div>
  );
}
