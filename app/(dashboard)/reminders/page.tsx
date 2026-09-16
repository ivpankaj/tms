"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invalidateWorkspaceQueries } from "@/lib/utils/query-helpers";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  MailCheck,
  Send,
  Trash2,
  MoreVertical,
  RotateCw,
  Search,
  Sparkles,
  Tag,
  ArrowRight,
  Check,
  Timer,
  Mail,
  Zap,
  ListTodo,
} from "lucide-react";

interface ReminderItem {
  _id: string;
  title: string;
  description?: string;
  reminderTime: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Pending" | "Completed" | "Cancelled";
  category: "Work" | "Personal" | "Meeting" | "Deadline" | "Follow-up";
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
}

export default function RemindersPage() {
  const { user, authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000); // 1 hour ahead
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [category, setCategory] = useState<"Work" | "Personal" | "Meeting" | "Deadline" | "Follow-up">("Work");
  const [selectedTaskLink, setSelectedTaskLink] = useState<string>("NONE");

  // Fetch Reminders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reminders", activeTab, categoryFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("section", activeTab);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await authFetch(`/api/v1/reminders?${params.toString()}`);
      const json = await res.json();
      return json;
    },
    staleTime: 0,
    refetchInterval: 15000,
  });

  // Fetch existing tasks for quick linking
  const { data: workspaceTasks = [] } = useQuery({
    queryKey: ["tasks-reminder-picker"],
    queryFn: async () => {
      const res = await fetch("/api/v1/tasks?limit=100");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const reminders: ReminderItem[] = data?.data || [];
  const counts = data?.meta?.counts || {
    total: 0,
    pending: 0,
    today: 0,
    overdue: 0,
    completed: 0,
    sent: 0,
  };

  // Create Reminder Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to schedule reminder");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Reminder scheduled successfully!");
      setIsCreateOpen(false);
      resetForm();
      invalidateWorkspaceQueries(queryClient);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule reminder");
    },
  });

  // Update Status / Toggle Completion
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await authFetch(`/api/v1/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Update failed");
      return json.data;
    },
    onSuccess: () => {
      invalidateWorkspaceQueries(queryClient);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/reminders/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Delete failed");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Reminder removed");
      invalidateWorkspaceQueries(queryClient);
    },
  });

  // Manual Process Trigger
  const processNowMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/v1/reminders/process", { method: "POST" });
      return res.json();
    },
    onSuccess: (res) => {
      if (res?.data?.sent > 0) {
        toast.success(`Dispatched ${res.data.sent} due reminder email(s)!`);
      } else {
        toast.info("Reminders checked. No new due emails to send right now.");
      }
      invalidateWorkspaceQueries(queryClient);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedTaskLink("NONE");
    const today = new Date();
    setReminderDate(today.toISOString().split("T")[0]);
    const d = new Date(Date.now() + 60 * 60 * 1000);
    setReminderTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    setPriority("Medium");
    setCategory("Work");
  };

  const handleSelectTaskLink = (taskId: string) => {
    setSelectedTaskLink(taskId);
    if (taskId === "NONE") return;
    const t = workspaceTasks.find((item: any) => item._id === taskId);
    if (t) {
      setTitle(t.title || "");
      setDescription(t.description || "");
      if (t.priority) {
        setPriority(t.priority as any);
      }
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        setReminderDate(d.toISOString().split("T")[0]);
        setReminderTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
      toast.info(`Populated details from task "${t.title}"`);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for your reminder");
      return;
    }

    const dateTimeString = `${reminderDate}T${reminderTime}:00`;
    const scheduled = new Date(dateTimeString);
    if (isNaN(scheduled.getTime())) {
      toast.error("Please select a valid date and time");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      reminderTime: scheduled.toISOString(),
      priority,
      category,
    });
  };

  const setQuickTime = (minutesAhead: number) => {
    const target = new Date(Date.now() + minutesAhead * 60 * 1000);
    setReminderDate(target.toISOString().split("T")[0]);
    setReminderTime(
      `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`
    );
  };

  const formatDisplayTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getRelativeTimeLabel = (isoString: string, status: string, emailSent: boolean) => {
    if (status === "Completed") return "Task Completed";
    const now = new Date().getTime();
    const target = new Date(isoString).getTime();
    const diffMs = target - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMs < 0) {
      const pastMins = Math.abs(diffMins);
      if (emailSent) return "Email Sent";
      if (pastMins < 60) return `${pastMins}m overdue`;
      const hours = Math.floor(pastMins / 60);
      return `${hours}h overdue`;
    }

    if (diffMins < 1) return "Due right now";
    if (diffMins < 60) return `Due in ${diffMins} mins`;
    const hours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    if (hours < 24) return `Due in ${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ""}`;
    const days = Math.floor(hours / 24);
    return `Due in ${days} day${days > 1 ? "s" : ""}`;
  };

  const priorityStyles = {
    Urgent: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50",
    High: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50",
    Medium: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50",
    Low: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reminders</h1>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Reminder</span>
          </Button>
        </div>
      </div>

      {/* Main Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-5 h-9 p-1">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.total})
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs">
              Today ({counts.today})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done ({counts.completed})
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs">
              Sent ({counts.sent})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Deadline">Deadline</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reminder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card/40">
            <RotateCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading reminders...
          </div>
        ) : reminders.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-card/40">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">No reminders found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              {searchQuery
                ? "No reminders match your current search criteria."
                : "Schedule your first task reminder. We'll automatically email you when it's due!"}
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Reminder
            </Button>
          </Card>
        ) : (
          reminders.map((r) => {
            const isCompleted = r.status === "Completed";
            const relativeTime = getRelativeTimeLabel(r.reminderTime, r.status, r.emailSent);

            return (
              <Card
                key={r._id}
                className={`transition-all duration-200 border-border/80 hover:border-border hover:shadow-2xs ${
                  isCompleted ? "opacity-60 bg-muted/20" : "bg-card"
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkbox & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({
                          id: r._id,
                          updates: { status: isCompleted ? "Pending" : "Completed" },
                        })
                      }
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title={isCompleted ? "Mark incomplete" : "Mark completed"}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-semibold text-sm text-foreground truncate ${
                            isCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {r.title}
                        </h4>

                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 font-medium ${priorityStyles[r.priority]}`}
                        >
                          {r.priority}
                        </Badge>

                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {r.category}
                        </Badge>
                      </div>

                      {r.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      )}

                      {/* Scheduled Time & Email Delivery Status */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {formatDisplayTime(r.reminderTime)}
                        </span>

                        <span className="text-[11px] text-muted-foreground">({relativeTime})</span>

                        {r.emailSent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <MailCheck className="h-3.5 w-3.5" />
                            Reminder Emailed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <Mail className="h-3.5 w-3.5" />
                            Email Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0">
                    {/* Snooze Options */}
                    {!isCompleted && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                            <Timer className="h-3.5 w-3.5" />
                            <span>Snooze</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase">
                            Reschedule Reminder
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({
                                id: r._id,
                                updates: { snoozeMinutes: 15 },
                              })
                            }
                            className="cursor-pointer"
                          >
                            + 15 Minutes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({
                                id: r._id,
                                updates: { snoozeMinutes: 60 },
                              })
                            }
                            className="cursor-pointer"
                          >
                            + 1 Hour
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({
                                id: r._id,
                                updates: { snoozeMinutes: 24 * 60 },
                              })
                            }
                            className="cursor-pointer"
                          >
                            + 1 Day (Tomorrow)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Delete action */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(r._id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE REMINDER MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New Scheduled Reminder</DialogTitle>
            <DialogDescription className="text-xs">
              Set task details and alert timing. An automated email reminder will be sent when due.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            {workspaceTasks.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <ListTodo className="h-3.5 w-3.5 text-primary" />
                  Select Task to Auto-Fill (Optional)
                </Label>
                <Select value={selectedTaskLink} onValueChange={handleSelectTaskLink}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose a task to copy from..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- None (Create custom reminder) --</SelectItem>
                    {workspaceTasks.map((t: any) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.projectId ? `[${t.projectId.key}] ` : ""}{t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="rem-title" className="text-xs font-semibold">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rem-title"
                placeholder="e.g. Client presentation review, Follow up on deal proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rem-desc" className="text-xs font-semibold">
                Notes & Description (Optional)
              </Label>
              <Textarea
                id="rem-desc"
                placeholder="Add extra details, agenda, or links to include in the email reminder..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Date & Time Picker */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rem-date" className="text-xs font-semibold">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rem-date"
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rem-time" className="text-xs font-semibold">
                  Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rem-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Quick Presets:</label>
              <div className="flex gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(15)}
                  className="h-7 text-[11px] px-2"
                >
                  +15 Mins
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(30)}
                  className="h-7 text-[11px] px-2"
                >
                  +30 Mins
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(60)}
                  className="h-7 text-[11px] px-2"
                >
                  +1 Hour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tom = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    setReminderDate(tom.toISOString().split("T")[0]);
                    setReminderTime("09:00");
                  }}
                  className="h-7 text-[11px] px-2"
                >
                  Tomorrow 9:00 AM
                </Button>
              </div>
            </div>

            {/* Priority & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Deadline">Deadline</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipient Notice Box */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>
                Reminder email will be dispatched to <strong className="text-foreground">{user?.email}</strong> via verified Resend domain when due.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-1.5 cursor-pointer"
              >
                {createMutation.isPending ? "Scheduling..." : "Schedule Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
