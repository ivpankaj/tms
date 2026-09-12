"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FolderGit2,
  Plus,
  Search,
  Users,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Loader2,
  ListTodo,
} from "lucide-react";

export default function ProjectsPage() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Project Form State
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [priority, setPriority] = useState("Medium");
  const [color, setColor] = useState("#3b82f6");
  const [dueDate, setDueDate] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", organization?.id, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        limit: "100",
      });
      const res = await fetch(`/api/v1/projects?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) return;
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase() || name.slice(0, 3).toUpperCase(),
          description: description.trim(),
          status,
          priority,
          color,
          dueDate: dueDate || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to create project");
      return data.data;
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setIsCreateOpen(false);
      setName("");
      setKey("");
      setDescription("");
      setDueDate("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    createProjectMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage product roadmaps, milestones, and cross-functional deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center text-xs text-muted-foreground space-y-3">
          <FolderGit2 className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-semibold text-foreground text-sm">No projects found</p>
          <p>Get started by creating your team&apos;s first project!</p>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj: any) => (
            <Link key={proj._id} href={`/projects/${proj._id}`} className="block group">
              <Card className="shadow-2xs hover:border-primary/50 transition-all p-5 space-y-4 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || "#3b82f6" }}
                      />
                      <Badge variant="outline" className="font-mono text-xs font-bold">
                        {proj.key}
                      </Badge>
                      <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                        {proj.name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize shrink-0">
                      {proj.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {proj.description || "No description provided for this project."}
                  </p>
                </div>

                {/* Progress Bar & Milestones */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Progress</span>
                      <span className="font-bold font-mono">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2.5 border-t">
                    <div className="flex items-center gap-1.5 font-medium">
                      <ListTodo className="h-4 w-4" />
                      <span>
                        {proj.completedTasks ?? 0} / {proj.totalTasks ?? 0} tasks
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {proj.dueDate
                          ? format(new Date(proj.dueDate), "MMM d, yyyy")
                          : "No deadline"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Project</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a high-level project container for tasks, boards, and milestones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., Mobile App 2.0, Infrastructure Migration"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!key) {
                    setKey(e.target.value.slice(0, 3).toUpperCase());
                  }
                }}
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Project Key (Prefix)</Label>
                <Input
                  placeholder="e.g., MOB, ENG, DS"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="text-xs font-mono uppercase"
                  maxLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Color Tag</Label>
                <div className="flex items-center gap-2 pt-0.5">
                  {["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#6366f1"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-6 w-6 rounded-full transition-transform cursor-pointer ${
                          color === c ? "scale-125 ring-2 ring-foreground" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Deadline</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                placeholder="Briefly describe the objectives and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createProjectMutation.isPending}
                className="gap-1.5"
              >
                {createProjectMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
