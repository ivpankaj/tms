"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  ArrowRight,
  Trash2,
  Mail,
  CheckSquare,
  UserCheck,
  Bell,
  PlayCircle,
  GitFork,
  Sliders,
  Sparkles,
} from "lucide-react";

interface WorkflowItem {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    event: string;
    conditions?: Array<{ field: string; operator: string; value: string }>;
    config?: Record<string, any>;
  };
  actions: Array<{
    type: "send_email" | "create_task" | "assign_owner" | "notify_team" | "update_field";
    config: Record<string, any>;
  }>;
  createdAt: string;
}

export default function AutomationPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("lead.created");
  const [conditionField, setConditionField] = useState("score");
  const [conditionOperator, setConditionOperator] = useState("greater_than");
  const [conditionValue, setConditionValue] = useState("50");
  const [actionType, setActionType] = useState<string>("assign_owner");
  const [actionDetail, setActionDetail] = useState("Round-Robin Sales Reps");

  // Fetch Workflows
  const { data: workflows = [], isLoading } = useQuery<WorkflowItem[]>({
    queryKey: ["workflows"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/workflows");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await authFetch(`/api/v1/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update workflow");
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`Workflow ${data.isActive ? "activated" : "paused"}`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Create Workflow Mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create workflow");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow rule created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Delete Workflow Mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/workflows/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete workflow");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow removed");
      setWorkflowToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerEvent("lead.created");
    setConditionField("score");
    setConditionOperator("greater_than");
    setConditionValue("50");
    setActionType("assign_owner");
    setActionDetail("Round-Robin Sales Reps");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    createWorkflowMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      trigger: {
        event: triggerEvent,
        conditions: [
          {
            field: conditionField,
            operator: conditionOperator,
            value: conditionValue,
          },
        ],
      },
      actions: [
        {
          type: actionType,
          config: {
            detail: actionDetail,
          },
        },
      ],
      isActive: true,
    });
  };

  const getTriggerLabel = (event: string) => {
    switch (event) {
      case "lead.created":
        return "When New Lead Created";
      case "deal.stage_changed":
        return "When Deal Stage Changes";
      case "ticket.created":
        return "When Support Ticket Logged";
      case "contact.created":
        return "When Contact Captured";
      default:
        return event;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "assign_owner":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "send_email":
        return <Mail className="h-4 w-4 text-emerald-500" />;
      case "create_task":
        return <CheckSquare className="h-4 w-4 text-purple-500" />;
      case "notify_team":
        return <Bell className="h-4 w-4 text-amber-500" />;
      default:
        return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const activeCount = workflows.filter((w) => w.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automation & Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Configure event-driven triggers, conditional filters, and automated actions across your CRM pipeline.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle>
            <Zap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently evaluating tenant events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Defined Workflows</CardTitle>
            <GitFork className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Installed triggers and logic pipelines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Execution Engine</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Live (0ms Latency)</div>
            <p className="text-xs text-muted-foreground mt-1">Real-time async event dispatching</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Configured Automation Rules</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No automated workflows configured"
            description="Create event-driven workflows to auto-assign leads, generate onboarding tasks, and dispatch email alerts."
            actionLabel="Create Rule"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {workflows.map((wf) => (
              <Card key={wf._id} className="transition-all hover:border-muted-foreground/30">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{wf.name}</CardTitle>
                        {wf.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                      </div>
                      {wf.description && (
                        <CardDescription className="text-xs">{wf.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {wf.isActive ? "Enabled" : "Disabled"}
                        </span>
                        <Switch
                          checked={wf.isActive}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: wf._id, isActive: checked })
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setWorkflowToDelete(wf._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  {/* Flow Diagram Representation */}
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-muted/30 p-3 rounded-lg border">
                    {/* Trigger */}
                    <div className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1.5 rounded-md border shadow-2xs">
                      <PlayCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span>{getTriggerLabel(wf.trigger?.event || "event")}</span>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                    {/* Condition */}
                    {wf.trigger?.conditions && wf.trigger.conditions.length > 0 ? (
                      <div className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1.5 rounded-md border shadow-2xs">
                        <Sliders className="h-3.5 w-3.5 text-purple-500" />
                        <span>
                          If {wf.trigger.conditions[0].field}{" "}
                          {wf.trigger.conditions[0].operator.replace("_", " ")}{" "}
                          "{wf.trigger.conditions[0].value}"
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1.5 rounded-md border shadow-2xs text-muted-foreground">
                        <span>Always trigger</span>
                      </div>
                    )}

                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {wf.actions.map((act, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1.5 rounded-md border shadow-2xs text-foreground"
                        >
                          {getActionIcon(act.type)}
                          <span className="capitalize">
                            {act.type.replace("_", " ")}: {act.config?.detail || "Execute"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
            <DialogDescription>
              Chain a trigger event, filtering condition, and execution action.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workflow Name
              </label>
              <Input
                placeholder="e.g. Hot Lead Instant Round-Robin Assignment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description (Optional)
              </label>
              <Textarea
                rows={2}
                placeholder="Brief summary of why this automation runs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* STEP 1: TRIGGER */}
            <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <PlayCircle className="h-3.5 w-3.5" />
                Step 1: Event Trigger
              </div>
              <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead.created">When a new Lead is created</SelectItem>
                  <SelectItem value="deal.stage_changed">When a Deal changes Stage</SelectItem>
                  <SelectItem value="ticket.created">When a Support Ticket is opened</SelectItem>
                  <SelectItem value="contact.created">When a new Contact is registered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* STEP 2: CONDITION */}
            <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Step 2: Condition Filter
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={conditionField} onValueChange={setConditionField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Lead Score</SelectItem>
                    <SelectItem value="source">Lead Source</SelectItem>
                    <SelectItem value="value">Deal Value ($)</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={conditionOperator} onValueChange={setConditionOperator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greater_than">Greater than (&gt;)</SelectItem>
                    <SelectItem value="equals">Equals (=)</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Target Value"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* STEP 3: ACTION */}
            <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Step 3: Automated Action
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assign_owner">Assign Owner (Round-Robin)</SelectItem>
                    <SelectItem value="send_email">Send Email Template</SelectItem>
                    <SelectItem value="create_task">Create Follow-up Task</SelectItem>
                    <SelectItem value="notify_team">Broadcast In-App Alert</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Config detail (e.g. Sales Team Alpha)"
                  value={actionDetail}
                  onChange={(e) => setActionDetail(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createWorkflowMutation.isPending}>
                {createWorkflowMutation.isPending ? "Creating Rule..." : "Deploy Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={!!workflowToDelete}
        onOpenChange={(open) => !open && setWorkflowToDelete(null)}
        title="Delete Automation Rule"
        description="Are you sure you want to permanently remove this automation? Active events will no longer trigger this action sequence."
        confirmText="Delete Workflow"
        variant="destructive"
        onConfirm={() => {
          if (workflowToDelete) {
            deleteWorkflowMutation.mutate(workflowToDelete);
          }
        }}
      />
    </div>
  );
}
