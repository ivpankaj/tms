"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDetailSheet } from "@/components/shared/task-detail-sheet";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Timer,
  Layers,
  ListTodo,
  TrendingUp,
} from "lucide-react";

export default function WorkloadPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch Workload Data
  const { data, isLoading } = useQuery({
    queryKey: ["workload"],
    queryFn: async () => {
      const res = await fetch("/api/v1/workload");
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  const workload = data?.workload || [];
  const summary = data?.summary || {
    totalTeamMembers: 0,
    totalAssignedTasks: 0,
    totalEstimatedHours: 0,
    overAllocatedMembers: 0,
  };

  const filteredWorkload = workload.filter((item: any) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(search.toLowerCase()) ||
      item.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-primary" />
            Team Workload & Capacity Planning
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor team allocation, balance task hours, and optimize velocity across active projects.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Team Members
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {isLoading ? <Skeleton className="h-8 w-12" /> : summary.totalTeamMembers}
          </div>
          <span className="text-xs text-muted-foreground">Active collaborators</span>
        </Card>

        <Card className="p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assigned Tasks
            </span>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {isLoading ? <Skeleton className="h-8 w-12" /> : summary.totalAssignedTasks}
          </div>
          <span className="text-xs text-muted-foreground">In-flight active tasks</span>
        </Card>

        <Card className="p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Allocated Hours
            </span>
            <Timer className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {isLoading ? <Skeleton className="h-8 w-16" /> : `${summary.totalEstimatedHours}h`}
          </div>
          <span className="text-xs text-muted-foreground">Estimated task backlog</span>
        </Card>

        <Card className="p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Over-Allocated
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {isLoading ? <Skeleton className="h-8 w-12" /> : summary.overAllocatedMembers}
          </div>
          <span className="text-xs text-muted-foreground">&gt;40h capacity threshold</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs h-9">
              <SelectValue placeholder="All Capacities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Capacities</SelectItem>
              <SelectItem value="over_allocated">⚠️ Over-Allocated (&gt;40h)</SelectItem>
              <SelectItem value="optimal">✅ Optimal (25-40h)</SelectItem>
              <SelectItem value="under_allocated">🟢 Available (&lt;25h)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workload Roster */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : filteredWorkload.length === 0 ? (
        <Card className="p-12 text-center text-xs text-muted-foreground space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No team members match the filter</p>
          <p>Try clearing your search or status filter to see full workload.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkload.map((item: any) => {
            const isOver = item.status === "over_allocated";
            const isOptimal = item.status === "optimal";

            return (
              <Card
                key={item.user.id}
                className={`p-5 space-y-4 shadow-2xs border transition-all ${
                  isOver ? "border-amber-500/40 bg-amber-500/5" : ""
                }`}
              >
                {/* Member Header & Capacity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {item.user.name ? item.user.name[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">{item.user.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {item.user.role}
                        </Badge>
                        {isOver && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Over-Capacity (+{item.estimatedHours - 40}h)
                          </Badge>
                        )}
                        {isOptimal && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                          >
                            Balanced
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.user.email}</p>
                    </div>
                  </div>

                  {/* Hours & Progress Gauge */}
                  <div className="sm:text-right space-y-1 sm:w-64">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Capacity Utilization</span>
                      <span className="font-mono">
                        {item.estimatedHours}h / {item.weeklyCapacity}h ({item.capacityUtilization}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOver
                            ? "bg-amber-500"
                            : isOptimal
                              ? "bg-primary"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(item.capacityUtilization, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      {item.actualHours}h work logged to date
                    </span>
                  </div>
                </div>

                {/* Assigned Tasks preview */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Active Tasks ({item.totalTasks})
                    </span>
                  </div>

                  {item.tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No tasks currently assigned to this member. Available for new assignments.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {item.tasks.map((task: any) => (
                        <div
                          key={task._id}
                          onClick={() => {
                            setSelectedTaskId(task._id);
                            setIsDetailOpen(true);
                          }}
                          className="p-2.5 rounded-lg border bg-card hover:border-primary/50 transition-all text-xs cursor-pointer flex flex-col justify-between space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate">{task.title}</span>
                            <Badge
                              variant={
                                task.priority === "Urgent" || task.priority === "High"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[9px] px-1 py-0 shrink-0"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{task.projectId?.name || "Task"}</span>
                            <span className="font-mono">
                              {task.estimatedHours ? `${task.estimatedHours}h` : "No est"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
