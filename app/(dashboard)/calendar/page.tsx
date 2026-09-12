"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { CreateTaskDialog } from "@/components/shared/create-task-dialog";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FolderGit2,
  CheckSquare,
} from "lucide-react";

export default function CalendarPage() {
  const { organization, user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch all calendar tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-calendar", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/tasks?calendar=true");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Tasks on currently selected date
  const tasksForSelectedDay = tasks.filter(
    (t: any) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate)
  );

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleQuickCreateOnDate = () => {
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Task Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule deadlines, track delivery milestones, and click any date to add a deliverable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleQuickCreateOnDate}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task on {format(selectedDate, "MMM d")}
          </Button>
        </div>
      </div>

      {/* Main Calendar Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Picker (1 col) */}
        <Card className="shadow-2xs p-4 flex flex-col items-center justify-center">
          <CalendarUI
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && handleDayClick(date)}
            className="rounded-md border p-3 w-full max-w-sm"
          />
        </Card>

        {/* Selected Date Agenda (2 cols) */}
        <Card className="lg:col-span-2 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Agenda for {format(selectedDate, "EEEE, MMMM do, yyyy")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {tasksForSelectedDay.length} deliverable
                {tasksForSelectedDay.length !== 1 ? "s" : ""} scheduled
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickCreateOnDate}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>

          {tasksForSelectedDay.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
              <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
              <p className="font-semibold text-foreground">No tasks due on this date</p>
              <p>Click &ldquo;Add Task&rdquo; to plan a deliverable.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasksForSelectedDay.map((task: any) => (
                <div
                  key={task._id}
                  onClick={() => handleOpenTask(task._id)}
                  className="p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer shadow-2xs"
                >
                  <div className="space-y-1 truncate flex-1">
                    <p className="font-semibold text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {task.projectId && (
                        <span className="font-mono text-primary font-medium">
                          [{task.projectId.key}] {task.projectId.name}
                        </span>
                      )}
                      <span>
                        Assignee: {task.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
                    <Badge variant="outline" className="text-[10px]">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

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
        defaultDueDate={format(selectedDate, "yyyy-MM-dd")}
      />
    </div>
  );
}
