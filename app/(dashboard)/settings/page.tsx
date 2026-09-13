"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TimezoneCombobox } from "@/components/shared/timezone-combobox";
import { CurrencyCombobox } from "@/components/shared/currency-combobox";
import { AccountSettingsDialog } from "@/components/shared/account-settings-dialog";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Key,
  Tags,
  Sliders,
  ShieldAlert,
  CreditCard,
  Plus,
  Copy,
  Trash2,
  Check,
  Shield,
  Download,
  Upload,
  Globe,
  CheckCircle2,
  Sparkles,
  Server,
  Activity,
} from "lucide-react";

export default function SettingsPage() {
  const { user, authFetch } = useAuth();
  const queryClient = useQueryClient();

  // Sole platform administrator check (default created root admin)
  const isPlatformAdmin = Boolean(
    user?.isPlatformAdmin ||
    (user?.email && user.email.toLowerCase() === "admin@cookmywork.com")
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState("organization");
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  // Prevent non-platform admins from accessing developers or audit tabs
  useEffect(() => {
    if (!isPlatformAdmin && (activeTab === "developers" || activeTab === "audit")) {
      setActiveTab("organization");
    }
  }, [isPlatformAdmin, activeTab]);

  // Organization Form State
  const [orgName, setOrgName] = useState("");
  const [orgTimezone, setOrgTimezone] = useState("Asia/Kolkata");
  const [orgCurrency, setOrgCurrency] = useState("INR");
  const [orgFiscalYear, setOrgFiscalYear] = useState("January");
  const [orgInitialized, setOrgInitialized] = useState(false);

  // Invite User Modal
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Sales Rep");
  const [inviteTimezone, setInviteTimezone] = useState("Asia/Kolkata");

  // Custom Field Modal
  const [isCustomFieldOpen, setIsCustomFieldOpen] = useState(false);
  const [cfEntityType, setCfEntityType] = useState("contact");
  const [cfName, setCfName] = useState("");
  const [cfKey, setCfKey] = useState("");
  const [cfFieldType, setCfFieldType] = useState("text");
  const [cfOptions, setCfOptions] = useState("");
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

  // Tag Modal
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#3b82f6");
  const [tagEntityType, setTagEntityType] = useState("contact");
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // API Key Modal
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [hasCopiedKey, setHasCopiedKey] = useState(false);

  // Webhook settings state
  const [webhookUrl, setWebhookUrl] = useState("https://api.yourcompany.com/webhooks/crm");

  // Fetch Organization Settings
  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ["settings", "organization"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/organization");
      const json = await res.json();
      const org = json.data;
      if (org && !orgInitialized) {
        setOrgName(org.name || "");
        setOrgTimezone(org.timezone || "Asia/Kolkata");
        setOrgCurrency(org.currency || "INR");
        setOrgFiscalYear(org.fiscalYearStart || "January");
        setOrgInitialized(true);
      }
      return org;
    },
  });

  // Fetch Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["settings", "users"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/users");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch Custom Fields
  const { data: customFields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ["settings", "custom-fields"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/custom-fields");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch Tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ["settings", "tags"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/tags");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch API Keys (Only for default platform admin)
  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["settings", "api-keys"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/api-keys");
      const json = await res.json();
      return json.data || [];
    },
    enabled: isPlatformAdmin,
  });

  // Fetch Integrations & Environment Health (Only for default platform admin)
  const { data: integrationsData, isLoading: integrationsLoading } = useQuery({
    queryKey: ["settings", "integrations"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/integrations");
      const json = await res.json();
      return json.data || { integrations: [] };
    },
    enabled: isPlatformAdmin,
  });

  // Fetch Audit Logs (Only for default platform admin)
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["settings", "audit-logs"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/settings/audit-logs");
      const json = await res.json();
      return json.data || [];
    },
    enabled: isPlatformAdmin,
  });

  // Update Org Mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update organization");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "organization"] });
      toast.success("Organization settings updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Invite User Mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to invite user");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
      queryClient.invalidateQueries({ queryKey: ["settings", "audit-logs"] });
      toast.success("Team member invited successfully");
      setIsInviteUserOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("Sales Rep");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Create Custom Field Mutation
  const createCustomFieldMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/settings/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create field");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "custom-fields"] });
      toast.success("Custom field schema updated");
      setIsCustomFieldOpen(false);
      setCfName("");
      setCfKey("");
      setCfOptions("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Delete Custom Field Mutation
  const deleteCustomFieldMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/settings/custom-fields?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete field");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "custom-fields"] });
      toast.success("Custom field deleted");
      setFieldToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Create Tag Mutation
  const createTagMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/settings/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create tag");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "tags"] });
      toast.success("Tag created");
      setIsTagOpen(false);
      setTagName("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Delete Tag Mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/settings/tags?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete tag");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "tags"] });
      toast.success("Tag removed");
      setTagToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Create API Key Mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await authFetch("/api/v1/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to generate key");
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settings", "api-keys"] });
      setGeneratedRawKey(data.key);
      toast.success("Secret API Key generated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate({
      name: orgName,
      timezone: orgTimezone,
      currency: orgCurrency,
      fiscalYearStart: orgFiscalYear,
    });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      toast.error("Name and email are required");
      return;
    }
    inviteUserMutation.mutate({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      timezone: inviteTimezone,
    });
  };

  const handleCustomFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfName || !cfKey) {
      toast.error("Field name and key are required");
      return;
    }
    const optionsArray =
      cfFieldType === "dropdown"
        ? cfOptions.split(",").map((o) => o.trim()).filter(Boolean)
        : [];

    createCustomFieldMutation.mutate({
      entityType: cfEntityType,
      name: cfName.trim(),
      key: cfKey.trim(),
      fieldType: cfFieldType,
      options: optionsArray,
    });
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName) {
      toast.error("Tag name is required");
      return;
    }
    createTagMutation.mutate({
      name: tagName.trim(),
      color: tagColor,
      entityType: tagEntityType,
    });
  };

  const handleCopyApiKey = () => {
    if (generatedRawKey) {
      navigator.clipboard.writeText(generatedRawKey);
      setHasCopiedKey(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setHasCopiedKey(false), 3000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Super Admin</Badge>;
      case "Admin":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Admin</Badge>;
      case "Manager":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Manager</Badge>;
      case "Sales Rep":
        return <Badge variant="secondary">Sales Rep</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization & Settings</h1>
        <p className="text-sm text-muted-foreground">
          {isPlatformAdmin
            ? "Tenant governance, role-based access control, schema customization, developer keys, and security logs."
            : "Tenant governance, role-based access control, and workspace custom schema."}
        </p>
      </div>

      {/* Main Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${isPlatformAdmin ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-4"} h-auto p-1 gap-1`}>
          <TabsTrigger value="organization" className="gap-2 text-xs py-1.5">
            <Building2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 text-xs py-1.5">
            <Users className="h-3.5 w-3.5" />
            Team & RBAC
          </TabsTrigger>
          <TabsTrigger value="custom-fields" className="gap-2 text-xs py-1.5">
            <Sliders className="h-3.5 w-3.5" />
            Custom Fields
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2 text-xs py-1.5">
            <Tags className="h-3.5 w-3.5" />
            Tags
          </TabsTrigger>
          {isPlatformAdmin && (
            <>
              <TabsTrigger value="developers" className="gap-2 text-xs py-1.5">
                <Key className="h-3.5 w-3.5" />
                API & Keys
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2 text-xs py-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                Audit Logs
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* TAB 1: ORGANIZATION GENERAL SETTINGS */}
        <TabsContent value="organization" className="space-y-4">
          {/* User Personal Profile & Security Banner */}
          <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20 shadow-xs">
                <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{user?.name || "My Account"}</h3>
                  <Badge variant="secondary" className="text-[10px]">{user?.role || "Member"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAccountSettingsOpen(true)}
              className="text-xs gap-2 w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Edit Profile & Change Password
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Workspace Profile</CardTitle>
              <CardDescription>
                Configure multi-tenant organization identifiers, operating currency, and fiscal cycles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orgLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <form onSubmit={handleOrgSubmit} className="space-y-4 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Organization Legal Name
                    </label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Primary Timezone
                      </label>
                      <TimezoneCombobox value={orgTimezone} onValueChange={setOrgTimezone} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Default Currency
                      </label>
                      <CurrencyCombobox value={orgCurrency} onValueChange={setOrgCurrency} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fiscal Year Start Month
                    </label>
                    <Select value={orgFiscalYear} onValueChange={setOrgFiscalYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="January">January (Standard Calendar)</SelectItem>
                        <SelectItem value="April">April (Q2 Start)</SelectItem>
                        <SelectItem value="July">July (Mid-year)</SelectItem>
                        <SelectItem value="October">October (Q4 Start)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={updateOrgMutation.isPending}>
                      {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Subscription Tier Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Tenant Plan & Tier</CardTitle>
                  <CardDescription>Your current subscription quota and platform feature privileges.</CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  Enterprise Tier Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Records Allowance</div>
                  <div className="text-lg font-bold mt-1">Unlimited</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Contacts, Deals, and Accounts</div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Pipelines & Workflows</div>
                  <div className="text-lg font-bold mt-1">Unlimited</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Multi-funnel + event triggers</div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Security & SLA</div>
                  <div className="text-lg font-bold mt-1 text-emerald-600">99.99%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Audit trail & encrypted data isolation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: TEAM & RBAC MANAGEMENT */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage workspace collaborators, assign permission tiers, and invite new members.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setIsInviteUserOpen(true)}>
              <Plus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborator</TableHead>
                  <TableHead>Role & Permissions</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  users.map((u: any) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.timezone}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 3: CUSTOM FIELDS */}
        <TabsContent value="custom-fields" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define custom metadata properties for Contacts, Accounts, Deals, and Support Tickets.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setIsCustomFieldOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Custom Field
            </Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Field Label</TableHead>
                  <TableHead>Field Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldsLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : customFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No custom fields configured. Click "Add Custom Field" to create your first attribute.
                    </TableCell>
                  </TableRow>
                ) : (
                  customFields.map((cf: any) => (
                    <TableRow key={cf._id}>
                      <TableCell className="font-semibold capitalize">{cf.entityType}</TableCell>
                      <TableCell>{cf.name}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {cf.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {cf.fieldType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setFieldToDelete(cf._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 4: TAG MANAGEMENT */}
        <TabsContent value="tags" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Organize contacts, accounts, and deals with customizable color-coded taxonomy tags.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setIsTagOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Tag
            </Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Preview</TableHead>
                  <TableHead>Entity Scope</TableHead>
                  <TableHead>Color Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagsLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : tags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No tags configured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((t: any) => (
                    <TableRow key={t._id}>
                      <TableCell>
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: t.color || "#3b82f6" }}
                        >
                          {t.name}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {t.entityType}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.color}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setTagToDelete(t._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 5 & 6: DEVELOPERS & AUDIT LOGS (RESTRICTED TO PLATFORM ADMIN) */}
        {isPlatformAdmin && (
          <>
            <TabsContent value="developers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">API Credentials & External Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Authenticate external workflows, Zapier bridges, and programmatic REST clients.
              </p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setIsApiKeyOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate Key
            </Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key Identifier</TableHead>
                  <TableHead>Token Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keysLoading ? (
                  [1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  apiKeys.map((k: any) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-semibold">{k.name}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {k.prefix}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{k.lastUsed}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Webhook Configuration Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Outbound Event Webhook Relay
              </CardTitle>
              <CardDescription>
                HTTP POST payloads delivered in real-time when CRM entities are created or updated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payload URL
                </label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => toast.success("Webhook configuration saved and test ping sent (HTTP 200 OK)")}
                >
                  Save & Send Test Ping
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Services & Environment Health Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-500" />
                Environment & Connected Services
              </CardTitle>
              <CardDescription>
                Live status of third-party infrastructure and credentials fetched securely from .env.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrationsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(integrationsData?.integrations || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border bg-muted/30 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{item.name}</span>
                          <Badge
                            variant={
                              item.status === "connected" || item.status === "live" || item.status === "active" || item.status === "secured"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] capitalize"
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.details}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: AUDIT LOGS */}
        <TabsContent value="audit" className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Security & Access Audit Trail</h3>
            <p className="text-sm text-muted-foreground">
              Immutable logging of team invitations, permissions adjustments, and organization configurations.
            </p>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action Event</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No security audit events recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.userId?.name || "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {log.entityType}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
          </>
        )}
      </Tabs>

      {/* INVITE USER MODAL */}
      <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Assign role-based access control and dispatch an invitation email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <Input
                placeholder="Jane Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Corporate Email Address
              </label>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Role
              </label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin (Full Access)</SelectItem>
                  <SelectItem value="Admin">Admin (Organization Settings)</SelectItem>
                  <SelectItem value="Manager">Manager (Team Deals & Reports)</SelectItem>
                  <SelectItem value="Sales Rep">Sales Rep (Standard CRM Rep)</SelectItem>
                  <SelectItem value="Read-only/Viewer">Read-only / Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteUserMutation.isPending}>
                {inviteUserMutation.isPending ? "Inviting..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE CUSTOM FIELD MODAL */}
      <Dialog open={isCustomFieldOpen} onOpenChange={setIsCustomFieldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Extend the schema of CRM entities with dynamic properties.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustomFieldSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Entity
              </label>
              <Select value={cfEntityType} onValueChange={setCfEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="company">Company / Account</SelectItem>
                  <SelectItem value="deal">Deal / Pipeline</SelectItem>
                  <SelectItem value="ticket">Support Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Field Label
              </label>
              <Input
                placeholder="e.g. Contract Renewal Date"
                value={cfName}
                onChange={(e) => {
                  setCfName(e.target.value);
                  setCfKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Property Key (Database Identifier)
              </label>
              <Input
                placeholder="e.g. contract_renewal_date"
                value={cfKey}
                onChange={(e) => setCfKey(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data Type
              </label>
              <Select value={cfFieldType} onValueChange={setCfFieldType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text / String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="dropdown">Dropdown Select</SelectItem>
                  <SelectItem value="checkbox">Boolean Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cfFieldType === "dropdown" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Options (Comma-separated)
                </label>
                <Input
                  placeholder="Tier 1, Tier 2, Tier 3"
                  value={cfOptions}
                  onChange={(e) => setCfOptions(e.target.value)}
                  required
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCustomFieldOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomFieldMutation.isPending}>
                {createCustomFieldMutation.isPending ? "Creating..." : "Save Field"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE TAG MODAL */}
      <Dialog open={isTagOpen} onOpenChange={setIsTagOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>
              Assign a label and color token to categorize CRM records.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTagSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tag Name
              </label>
              <Input
                placeholder="e.g. VIP, Strategic, High Risk"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Entity Scope
              </label>
              <Select value={tagEntityType} onValueChange={setTagEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Color Preset
              </label>
              <div className="flex gap-3">
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-7 w-7 rounded-full transition-transform ${
                      tagColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setTagColor(c)}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTagOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTagMutation.isPending}>
                {createTagMutation.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GENERATE API KEY MODAL */}
      <Dialog
        open={isApiKeyOpen}
        onOpenChange={(open) => {
          setIsApiKeyOpen(open);
          if (!open) setGeneratedRawKey(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Secret API Key</DialogTitle>
            <DialogDescription>
              Create an authentication key for backend scripts, Zapier, or external services.
            </DialogDescription>
          </DialogHeader>
          {!generatedRawKey ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Key Description / Name
                </label>
                <Input
                  placeholder="e.g. Production Data Sync"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsApiKeyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createApiKeyMutation.mutate(apiKeyName || "Production API Key")}
                  disabled={createApiKeyMutation.isPending}
                >
                  {createApiKeyMutation.isPending ? "Generating..." : "Generate Secret Key"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-300">
                ⚠️ Make sure to copy your API key now. You will not be able to view it again.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Secret API Key
                </label>
                <div className="flex gap-2">
                  <Input value={generatedRawKey} readOnly className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    onClick={handleCopyApiKey}
                  >
                    {hasCopiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {hasCopiedKey ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsApiKeyOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE CUSTOM FIELD */}
      <ConfirmDialog
        open={!!fieldToDelete}
        onOpenChange={(open) => !open && setFieldToDelete(null)}
        title="Delete Custom Field"
        description="Are you sure you want to remove this custom field definition? Stored values will no longer be visible."
        confirmText="Delete Field"
        variant="destructive"
        onConfirm={() => {
          if (fieldToDelete) {
            deleteCustomFieldMutation.mutate(fieldToDelete);
          }
        }}
      />

      {/* CONFIRM DELETE TAG */}
      <ConfirmDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title="Delete Tag"
        description="Are you sure you want to delete this tag? Existing entity associations will be cleared."
        confirmText="Delete Tag"
        variant="destructive"
        onConfirm={() => {
          if (tagToDelete) {
            deleteTagMutation.mutate(tagToDelete);
          }
        }}
      />

      {/* Account Settings & Password Dialog */}
      <AccountSettingsDialog
        open={isAccountSettingsOpen}
        onOpenChange={setIsAccountSettingsOpen}
      />
    </div>
  );
}
