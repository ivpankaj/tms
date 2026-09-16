"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { format, addDays, startOfWeek, differenceInDays } from "date-fns";
import {
  GitCommitHorizontal,
  FolderGit2,
  Calendar,
  Clock,
  Plus,
  Search,
  Flag,
  Edit2,
  Bell,
} from "lucide-react";

export default function TimelineViewPage() {
  const { organization, user } = useAuth();
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [reminderTask, setReminderTask] = useState<any | null>(null);

  // Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dropdown", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Fetch Tasks for timeline
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-timeline", organization?.id, projectFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        board: "true",
        ...(projectFilter !== "ALL" ? { projectId: projectFilter } : {}),
      });
      const res = await fetch(`/api/v1/tasks?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    staleTime: 0,
  });

  // Generate 28-day timeline columns starting from 7 days ago
  const startDate = addDays(new Date(), -7);
  const timelineDays = Array.from({ length: 28 }).map((_, i) => addDays(startDate, i));

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitCommitHorizontal className="h-6 w-6 text-primary" />
            Timeline & Gantt
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize project schedule overlaps, delivery durations, and milestone dependencies.
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

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-52 h-9 text-xs">
            <SelectValue placeholder="All Projects" />
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

        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-blue-500" />
            <span>Active / Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Timeline Gantt Grid Container */}
      <Card className="shadow-2xs overflow-hidden border">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Timeline Days Header */}
            <div className="flex border-b bg-muted/40 text-[11px] font-semibold">
              <div className="w-72 shrink-0 p-3 border-r bg-muted/30">Task Name</div>
              <div className="flex-1 grid grid-cols-28 divide-x divide-border/40">
                {timelineDays.map((day, idx) => {
                  const isCurrentDay =
                    format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 text-center truncate ${
                        isCurrentDay ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground"
                      }`}
                    >
                      <span className="block text-[9px] uppercase">{format(day, "EEE")}</span>
                      <span className="block font-mono text-[10px]">{format(day, "d")}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Gantt Rows */}
            <div className="divide-y divide-border/40">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No tasks found to display on timeline.
                </div>
              ) : (
                tasks.map((task: any) => {
                  const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
                  const taskDue = task.dueDate ? new Date(task.dueDate) : addDays(taskStart, 3);

                  // Calculate column offset and span
                  const startCol = Math.max(0, Math.min(27, differenceInDays(taskStart, startDate)));
                  const endCol = Math.max(0, Math.min(27, differenceInDays(taskDue, startDate)));
                  const span = Math.max(1, endCol - startCol + 1);

                  const isDone = task.status === "Done" || task.status === "Completed";

                  return (
                    <div
                      key={task._id}
                      className="flex items-center hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenTask(task._id)}
                    >
                      {/* Left: Task Label */}
                      <div className="w-72 shrink-0 p-3 border-r flex items-center justify-between gap-2 overflow-hidden text-xs">
                        <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-[9px]">
                            {task.status}
                          </Badge>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit Task"
                              onClick={() => setEditingTask(task)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                              title="Set Reminder / Shift"
                              onClick={() => setReminderTask(task)}
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Axis */}
                      <div className="flex-1 relative h-10 flex items-center px-1">
                        <div
                          className={`absolute h-6 rounded-md shadow-xs px-2 flex items-center text-[10px] font-medium text-white transition-all overflow-hidden truncate ${
                            isDone ? "bg-emerald-600" : "bg-primary"
                          }`}
                          style={{
                            left: `${(startCol / 28) * 100}%`,
                            width: `${(span / 28) * 100}%`,
                            minWidth: "60px",
                          }}
                        >
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
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
