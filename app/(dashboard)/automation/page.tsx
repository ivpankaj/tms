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
  Bell,
  PlayCircle,
  Sliders,
  Sparkles,
  Layers,
  Bug,
  CheckCircle2,
  Clock,
  UserCheck,
  ListChecks,
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
    type: "assign_lead" | "notify_team" | "update_status" | "add_checklist" | "send_email";
    config: Record<string, any>;
  }>;
  createdAt: string;
}

const AUTOMATION_RECIPES = [
  {
    name: "⚡ Auto-Assign Urgent Bugs to Tech Lead",
    desc: "When a new Bug is created with Urgent priority, immediately route to Squad Lead.",
    trigger: "task.created",
    field: "priority",
    operator: "equals",
    val: "Urgent",
    action: "assign_lead",
    actionDetail: "Engineering Squad Lead",
  },
  {
    name: "🔔 Notify QA Squad when Task is In Review",
    desc: "When task status moves to 'In Review', dispatch notification to testing team.",
    trigger: "task.status_changed",
    field: "status",
    operator: "equals",
    val: "In Review",
    action: "notify_team",
    actionDetail: "QA Testing Squad",
  },
  {
    name: "🛡️ Auto-Attach Security Checklist to Epics",
    desc: "When an Epic is scheduled, automatically inject security & compliance checks.",
    trigger: "task.created",
    field: "issueType",
    operator: "equals",
    val: "epic",
    action: "add_checklist",
    actionDetail: "Security & OWASP Sign-off",
  },
];

export default function AutomationPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("task.created");
  const [conditionField, setConditionField] = useState("priority");
  const [conditionOperator, setConditionOperator] = useState("equals");
  const [conditionValue, setConditionValue] = useState("Urgent");
  const [actionType, setActionType] = useState<string>("assign_lead");
  const [actionDetail, setActionDetail] = useState("Engineering Lead");

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
      if (!res.ok) throw new Error(json.error?.message || "Failed to update rule");
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`Rule ${data.isActive ? "activated" : "paused"}`);
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
      if (!res.ok) throw new Error(json.error?.message || "Failed to create rule");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Automation rule created");
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
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete rule");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Automation rule deleted");
      setWorkflowToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerEvent("task.created");
    setConditionField("priority");
    setConditionOperator("equals");
    setConditionValue("Urgent");
    setActionType("assign_lead");
    setActionDetail("Engineering Lead");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Rule name is required");
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

  const applyRecipe = (recipe: (typeof AUTOMATION_RECIPES)[0]) => {
    setName(recipe.name.replace(/^[^\w\s]+/, "").trim());
    setDescription(recipe.desc);
    setTriggerEvent(recipe.trigger);
    setConditionField(recipe.field);
    setConditionOperator(recipe.operator);
    setConditionValue(recipe.val);
    setActionType(recipe.action);
    setActionDetail(recipe.actionDetail);
    setIsCreateOpen(true);
  };

  const getTriggerLabel = (event: string) => {
    switch (event) {
      case "task.created":
        return "When New Task / Issue Created";
      case "task.status_changed":
        return "When Task Status Changes";
      case "task.priority_urgent":
        return "When Priority Set to Urgent";
      case "task.overdue":
        return "When Task Passes Due Date";
      case "sprint.started":
        return "When Sprint Starts";
      case "sprint.completed":
        return "When Sprint Completes";
      default:
        return event.replace(".", " ");
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "assign_lead":
        return <UserCheck className="h-3.5 w-3.5 text-blue-500" />;
      case "notify_team":
        return <Bell className="h-3.5 w-3.5 text-amber-500" />;
      case "update_status":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "add_checklist":
        return <ListChecks className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Zap className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Zap className="h-6 w-6 text-primary" />
            Project Management Automations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            No-code visual rules to auto-assign tasks, route urgent bugs, and notify squads on status updates.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* 1-CLICK AUTOMATION RECIPES */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Recommended 1-Click Recipes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AUTOMATION_RECIPES.map((recipe) => (
            <Card
              key={recipe.name}
              onClick={() => applyRecipe(recipe)}
              className="p-4 space-y-2 cursor-pointer hover:border-primary/50 transition-all shadow-2xs border bg-card/60 hover:bg-card"
            >
              <h4 className="font-bold text-sm text-foreground">{recipe.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{recipe.desc}</p>
              <span className="text-[11px] font-semibold text-primary block pt-1">
                + Use this recipe
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* ACTIVE WORKFLOWS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configured Rules ({workflows.length})
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No automated rules configured"
            description="Create event-driven workflows to auto-assign tasks, enforce QA sign-offs, and dispatch notifications."
            actionLabel="Create Rule"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {workflows.map((wf) => (
              <Card key={wf._id} className="p-4 shadow-2xs space-y-3 transition-all hover:border-muted-foreground/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold">{wf.name}</h4>
                      {wf.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Paused
                        </Badge>
                      )}
                    </div>
                    {wf.description && (
                      <p className="text-xs text-muted-foreground">{wf.description}</p>
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

                {/* Flow Diagram Representation */}
                <div className="flex flex-wrap items-center gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border">
                  {/* Trigger */}
                  <div className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1 rounded-md border shadow-2xs">
                    <PlayCircle className="h-3.5 w-3.5 text-blue-500" />
                    <span>{getTriggerLabel(wf.trigger?.event || "event")}</span>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                  {/* Condition */}
                  {wf.trigger?.conditions && wf.trigger.conditions.length > 0 ? (
                    <div className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1 rounded-md border shadow-2xs">
                      <Sliders className="h-3.5 w-3.5 text-purple-500" />
                      <span>
                        If {wf.trigger.conditions[0].field}{" "}
                        {wf.trigger.conditions[0].operator.replace("_", " ")}{" "}
                        "{wf.trigger.conditions[0].value}"
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1 rounded-md border shadow-2xs text-muted-foreground">
                      <span>Always trigger</span>
                    </div>
                  )}

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {wf.actions.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 font-medium bg-background px-2.5 py-1 rounded-md border shadow-2xs text-foreground"
                      >
                        {getActionIcon(act.type)}
                        <span className="capitalize">
                          {act.type.replace("_", " ")}: {act.config?.detail || "Execute"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create Automation Rule</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Chain a project management trigger event, condition filter, and automated action.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rule Name
              </label>
              <Input
                placeholder="e.g. Route Urgent Bugs to Lead"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description (Optional)
              </label>
              <Textarea
                rows={2}
                placeholder="Brief summary of what this automation enforces..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* STEP 1: TRIGGER */}
            <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <PlayCircle className="h-3.5 w-3.5" />
                Step 1: Event Trigger
              </div>
              <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task.created">When a new Task / Issue is created</SelectItem>
                  <SelectItem value="task.status_changed">When Task Status changes</SelectItem>
                  <SelectItem value="task.priority_urgent">When Task is marked Urgent</SelectItem>
                  <SelectItem value="task.overdue">When Task passes Due Date</SelectItem>
                  <SelectItem value="sprint.started">When a Sprint starts</SelectItem>
                  <SelectItem value="sprint.completed">When a Sprint completes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* STEP 2: CONDITION */}
            <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Step 2: Condition Filter
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={conditionField} onValueChange={setConditionField}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="issueType">Issue Type</SelectItem>
                    <SelectItem value="storyPoints">Story Points</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={conditionOperator} onValueChange={setConditionOperator}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals (=)</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater than (&gt;)</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Target Value"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            {/* STEP 3: ACTION */}
            <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Step 3: Automated Action
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assign_lead">Assign to Squad Lead</SelectItem>
                    <SelectItem value="notify_team">Notify Team / Send In-App Alert</SelectItem>
                    <SelectItem value="update_status">Auto-Advance Status</SelectItem>
                    <SelectItem value="add_checklist">Attach Compliance Checklist</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Action detail (e.g. Lead Engineer)"
                  value={actionDetail}
                  onChange={(e) => setActionDetail(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWorkflowMutation.isPending}
                className="text-xs"
              >
                {createWorkflowMutation.isPending ? "Creating..." : "Save Automation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={Boolean(workflowToDelete)}
        onOpenChange={(open) => !open && setWorkflowToDelete(null)}
        title="Delete Automation Rule"
        description="Are you sure you want to delete this automation rule? It will no longer execute."
        onConfirm={() => workflowToDelete && deleteWorkflowMutation.mutate(workflowToDelete)}
        confirmText="Delete Rule"
      />
    </div>
  );
}
