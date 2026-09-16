"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import { CreateTaskDialog } from "@/components/shared/create-task-dialog";
import { EditTaskDialog } from "@/components/shared/edit-task-dialog";
import { SetTaskReminderDialog } from "@/components/shared/set-task-reminder-dialog";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  FolderGit2,
  Users,
  ArrowUpRight,
  ListTodo,
  CheckSquare,
  Activity as ActivityIcon,
  ChevronRight,
  Flame,
  Edit2,
  Bell,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { formatDistanceToNow, format } from "date-fns";

export default function DashboardPage() {
  const { organization, user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [reminderTask, setReminderTask] = useState<any | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-metrics", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/reports/dashboard");
      const json = await res.json();
      return json.success ? json.data : null;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const kpi = data?.kpi;
  const projectProgress = data?.projectProgress || [];
  const teamWorkload = data?.teamWorkload || [];
  const myTasks = data?.myTasks || [];
  const recentActivities = data?.recentActivities || [];
  const completionTrend = data?.completionTrend || [];

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Workspace Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time project health, sprint velocity, and team workload analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Grid (6 cards as requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Tasks */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 px-4 pt-4">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Tasks
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ListTodo className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">{kpi?.totalTasks ?? 0}</div>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">Across all projects</p>
          </CardContent>
        </Card>

        {/* Card 2: Completed */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 px-4 pt-4">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Completed
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {kpi?.completedTasks ?? 0}
              </div>
            )}
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              {kpi?.completionRate ?? 0}% completed
            </p>
          </CardContent>
        </Card>

        {/* Card 3: In Progress */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 px-4 pt-4">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              In Progress
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {kpi?.inProgressTasks ?? 0}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">Active work</p>
          </CardContent>
        </Card>

        {/* Card 4: Overdue */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 px-4 pt-4">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Overdue
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {kpi?.overdueTasks ?? 0}
              </div>
            )}
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">Needs attention</p>
          </CardContent>
        </Card>

        {/* Card 5: Due Today */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 px-4 pt-4">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Due Today
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Flame className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">{kpi?.dueTodayTasks ?? 0}</div>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled today</p>
          </CardContent>
        </Card>

        {/* Card 6: Upcoming */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 px-4 pt-4">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <CalendarIcon className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">{kpi?.upcomingTasks ?? 0}</div>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">Next 7+ days</p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity & Workload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Velocity Trend Chart */}
        <Card className="lg:col-span-2 shadow-2xs">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base font-bold">Productivity & Sprint Velocity</CardTitle>
              <CardDescription className="text-xs">
                Tasks completed vs. newly created tasks over the past 6 weeks.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Completed ({kpi?.tasksCompletedThisWeek ?? 0} this week)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>Created ({kpi?.tasksCreatedThisWeek ?? 0} this week)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : !completionTrend.some((t: any) => (t.completed || 0) > 0 || (t.created || 0) > 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed rounded-lg border-border/60">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-30 text-primary" />
                  <p className="text-sm font-semibold text-foreground">No velocity data yet</p>
                  <p className="text-xs max-w-sm mt-1">
                    As your team creates and completes tasks over the coming weeks, your sprint velocity and productivity trends will appear here.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionTrend}>
                    <defs>
                      <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="creatGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#compGrad)"
                      name="Tasks Completed"
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#creatGrad)"
                      name="Tasks Created"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Workload Distribution */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team Workload
            </CardTitle>
            <CardDescription className="text-xs">
              Active task allocation per team member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : teamWorkload.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No active task allocations yet
              </div>
            ) : (
              teamWorkload.slice(0, 5).map((member: any) => {
                const completionPct =
                  member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                return (
                  <div key={member.email} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {member.name ? member.name.slice(0, 2).toUpperCase() : "TM"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold truncate">{member.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">
                        {member.completed}/{member.total} ({completionPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Projects Progress & Compact My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Section (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-primary" />
              Project Progress
            </h3>
            <Link
              href="/projects"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              View All Projects
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)
            ) : projectProgress.length === 0 ? (
              <Card className="col-span-2 p-8 text-center text-xs text-muted-foreground">
                No active projects found. Create your first project to get started!
              </Card>
            ) : (
              projectProgress.map((proj: any) => (
                <Card
                  key={proj._id}
                  className="shadow-2xs hover:border-primary/50 transition-all p-4 space-y-3 cursor-pointer"
                  onClick={() => (window.location.href = `/projects/${proj._id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || "#3b82f6" }}
                      />
                      <h4 className="font-bold text-sm truncate">{proj.name}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {proj.key}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {proj.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold font-mono">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>
                      {proj.completedTasks} / {proj.taskCount} tasks
                    </span>
                    <span>
                      {proj.dueDate
                        ? `Due ${format(new Date(proj.dueDate), "MMM d")}`
                        : "No deadline"}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Compact My Tasks (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              My Tasks
            </h3>
            <Link
              href="/my-tasks"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              Go to My Tasks
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="shadow-2xs divide-y divide-border/50">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : myTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                All caught up! No incomplete tasks assigned to you.
              </div>
            ) : (
              myTasks.map((t: any) => (
                <div
                  key={t._id}
                  onClick={() => handleOpenTask(t._id)}
                  className="p-3 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs group"
                >
                  <div className="space-y-1 truncate flex-1">
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {t.projectId && (
                        <span className="font-mono text-primary font-medium">
                          [{t.projectId.key}]
                        </span>
                      )}
                      {t.dueDate && (
                        <span>Due {format(new Date(t.dueDate), "MMM d")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={
                        t.priority === "Urgent" || t.priority === "High"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[9px] px-1 py-0 font-normal"
                    >
                      {t.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                      {t.status}
                    </Badge>

                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        title="Edit Task"
                        onClick={() => setEditingTask(t)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                        title="Set Reminder / Shift to Reminders"
                        onClick={() => setReminderTask(t)}
                      >
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-primary" />
            Recent Activity Log
          </CardTitle>
          <CardDescription className="text-xs">
            Audit stream of tasks created, status changes, assignments, and comments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No recent activities recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50 text-xs">
              {recentActivities.map((act: any) => (
                <div
                  key={act._id}
                  className="py-2.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px] bg-muted font-semibold">
                        {act.createdBy?.name ? act.createdBy.name.slice(0, 2).toUpperCase() : "SY"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <span className="font-semibold text-foreground mr-1.5">
                        {act.createdBy?.name || "Team Member"}
                      </span>
                      <span className="text-muted-foreground">{act.details}</span>
                    </div>
                  </div>

                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                    {act.createdAt
                      ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })
                      : "just now"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
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
