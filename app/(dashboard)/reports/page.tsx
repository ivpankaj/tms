"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  FolderGit2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

export default function ReportsPage() {
  const { organization } = useAuth();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["reports-analytics", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/reports/dashboard");
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  const kpi = data?.kpi;
  const statusBreakdown = data?.statusBreakdown || [];
  const priorityBreakdown = data?.priorityBreakdown || [];
  const teamWorkload = data?.teamWorkload || [];
  const projectProgress = data?.projectProgress || [];
  const completionTrend = data?.completionTrend || [];

  // Project Bar Chart data
  const projectChartData = projectProgress.map((p: any) => ({
    name: p.name.length > 15 ? p.key : p.name,
    completed: p.completedTasks,
    remaining: Math.max(0, p.taskCount - p.completedTasks),
  }));

  const handleExportCSV = () => {
    if (!teamWorkload || teamWorkload.length === 0) {
      toast.error("No report data available to export");
      return;
    }
    const headers = ["Member Name", "Email", "Total Tasks", "Completed", "In Progress", "Completion Rate %"];
    const rows = teamWorkload.map((m: any) => [
      `"${m.name}"`,
      `"${m.email}"`,
      m.total,
      m.completed,
      m.inProgress,
      m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `task_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Sprint velocity, distribution metrics, team workload balance, and completion rates.
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
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Tasks
          </span>
          <div className="text-2xl font-bold text-foreground">{kpi?.totalTasks ?? 0}</div>
          <p className="text-xs text-muted-foreground">Logged across all projects</p>
        </Card>

        <Card className="shadow-2xs p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Completion Rate
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {kpi?.completionRate ?? 0}%
          </div>
          <p className="text-xs text-muted-foreground">{kpi?.completedTasks ?? 0} finished</p>
        </Card>

        <Card className="shadow-2xs p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            In Progress
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {kpi?.inProgressTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">Active in sprint</p>
        </Card>

        <Card className="shadow-2xs p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {kpi?.overdueTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">Past scheduled deadline</p>
        </Card>
      </div>

      {/* Charts Grid 1: Velocity AreaChart & Tasks by Status PieChart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Velocity */}
        <Card className="lg:col-span-2 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Delivery Velocity (6 Weeks)</CardTitle>
            <CardDescription className="text-xs">
              Weekly volume of completed tasks versus created deliverables.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionTrend}>
                    <defs>
                      <linearGradient id="compG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="creG" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#compG)"
                      name="Completed Tasks"
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#creG)"
                      name="Created Tasks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution PieChart */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Tasks by Status</CardTitle>
            <CardDescription className="text-xs">
              Workflow stage distribution breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-44 w-44 rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusBreakdown.map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid 2: Priority BarChart & Tasks by Project BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority BarChart */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Tasks by Priority</CardTitle>
            <CardDescription className="text-xs">
              Severity distribution across active workloads.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="priority" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Task Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Task Breakdown */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Tasks by Project</CardTitle>
            <CardDescription className="text-xs">
              Completed vs remaining tasks per active project.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                      name="Completed"
                    />
                    <Bar
                      dataKey="remaining"
                      stackId="a"
                      fill="#94a3b8"
                      radius={[6, 6, 0, 0]}
                      name="Remaining"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Workload Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Team Workload & Completion Leaderboard
          </CardTitle>
          <CardDescription className="text-xs">
            Individual contributor allocation, completion performance, and active workload.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contributor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Total Assigned</TableHead>
              <TableHead className="text-center">In Progress</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="w-48">Completion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : teamWorkload.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                  No team activity recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              teamWorkload.map((m: any) => {
                const completionPct =
                  m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;

                return (
                  <TableRow key={m.email} className="hover:bg-muted/30 text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {m.name ? m.name.slice(0, 2).toUpperCase() : "TM"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.role}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-bold font-mono">{m.total}</TableCell>
                    <TableCell className="text-center font-bold font-mono text-amber-600">
                      {m.inProgress}
                    </TableCell>
                    <TableCell className="text-center font-bold font-mono text-emerald-600">
                      {m.completed}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span>{completionPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
