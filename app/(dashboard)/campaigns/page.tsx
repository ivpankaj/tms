"useclient";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import {
  Mail,
  Send,
  Plus,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  MousePointer,
  AlertCircle,
  Eye,
  Trash2,
  Play,
  Search,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";

interface CampaignItem {
  _id: string;
  name: string;
  type: string;
  status: "Draft" | "Scheduled" | "Sending" | "Completed" | "Cancelled";
  templateId?: { _id: string; name: string; subject: string };
  segmentFilter?: { tag?: string; lifecycleStage?: string };
  scheduledAt?: string;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  createdAt: string;
}

interface TemplateItem {
  _id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  category: string;
  updatedAt: string;
}

export default function CampaignsPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("campaigns");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Create Campaign Modal state
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("email");
  const [campaignTemplateId, setCampaignTemplateId] = useState("");
  const [segmentTag, setSegmentTag] = useState("");
  const [segmentLifecycle, setSegmentLifecycle] = useState("");

  // Create Template Modal state
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Marketing");
  const [templateBody, setTemplateBody] = useState(
    "Hi {{first_name}},\n\nWe wanted to share some exciting news regarding your account with CookMyWork.\n\nBest regards,\nCookMyWork Team"
  );

  // Detail / Analytics Drawer state
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Send Confirmation
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);

  // Delete template state
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Fetch Campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", selectedStatus, searchQuery],
    queryFn: async () => {
      let url = "/api/v1/campaigns?limit=100";
      if (selectedStatus !== "all") url += `&status=${selectedStatus}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await authFetch(url);
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch Email Templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<TemplateItem[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/email-templates");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Create Campaign Mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create campaign");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created successfully");
      setIsCreateCampaignOpen(false);
      resetCampaignForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Send Campaign Mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/campaigns/${id}/send`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to dispatch campaign");
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(data.message || "Campaign dispatched successfully!");
      setIsSendConfirmOpen(false);
      setSendingCampaignId(null);
      if (selectedCampaign && selectedCampaign._id === data.campaign?._id) {
        setSelectedCampaign(data.campaign);
      }
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/v1/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create template");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Email template saved");
      setIsCreateTemplateOpen(false);
      resetTemplateForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Delete Template Mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/email-templates/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete template");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted");
      setDeletingTemplateId(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetCampaignForm = () => {
    setCampaignName("");
    setCampaignType("email");
    setCampaignTemplateId("");
    setSegmentTag("");
    setSegmentLifecycle("");
  };

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateSubject("");
    setTemplateCategory("Marketing");
    setTemplateBody(
      "Hi {{first_name}},\n\nWe wanted to share some exciting news regarding your account.\n\nBest,\nTeam"
    );
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    createCampaignMutation.mutate({
      name: campaignName.trim(),
      type: campaignType,
      templateId: campaignTemplateId || undefined,
      segmentFilter: {
        tag: segmentTag.trim() || undefined,
        lifecycleStage: segmentLifecycle || undefined,
      },
      status: "Draft",
    });
  };

  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateSubject.trim() || !templateBody.trim()) {
      toast.error("All template fields are required");
      return;
    }
    const detectedVars = Array.from(templateBody.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)).map(
      (m) => m[1]
    );
    createTemplateMutation.mutate({
      name: templateName.trim(),
      subject: templateSubject.trim(),
      bodyHtml: templateBody,
      variables: Array.from(new Set(detectedVars)),
      category: templateCategory,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Completed</Badge>;
      case "Sending":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 animate-pulse">Sending</Badge>;
      case "Scheduled":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  // Aggregated total metrics across all completed campaigns
  const campaignsList: CampaignItem[] = campaignsData || [];
  const totalSent = campaignsList.reduce((acc, c) => acc + (c.metrics?.sent || 0), 0);
  const totalOpened = campaignsList.reduce((acc, c) => acc + (c.metrics?.opened || 0), 0);
  const totalClicked = campaignsList.reduce((acc, c) => acc + (c.metrics?.clicked || 0), 0);
  const totalBounced = campaignsList.reduce((acc, c) => acc + (c.metrics?.bounced || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  const getChartDataForCampaign = (c: CampaignItem) => [
    { name: "Sent", count: c.metrics?.sent || 0, fill: "#3b82f6" },
    { name: "Opened", count: c.metrics?.opened || 0, fill: "#10b981" },
    { name: "Clicked", count: c.metrics?.clicked || 0, fill: "#8b5cf6" },
    { name: "Bounced", count: c.metrics?.bounced || 0, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Segment contacts, dispatch targeted bulk email broadcasts, and monitor real-time engagement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsCreateTemplateOpen(true)}
          >
            <FileText className="h-4 w-4" />
            New Template
          </Button>
          <Button
            className="gap-2"
            onClick={() => setIsCreateCampaignOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Broadcasts</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Emails sent across active campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate}%</div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              {totalOpened.toLocaleString()} total opens registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Click-Through Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClickRate}%</div>
            <p className="text-xs text-purple-600 mt-1 font-medium">
              {totalClicked.toLocaleString()} link clicks tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSent > 0 ? Math.max(0, 100 - Math.round((totalBounced / totalSent) * 100)) : 100}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{totalBounced} bounces detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="campaigns" className="gap-2">
            <Mail className="h-4 w-4" />
            Campaigns ({campaignsList.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Email Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS LIST TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Sending">Sending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {campaignsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : campaignsList.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns found"
              description="Create your first marketing broadcast to engage with your segmented contacts."
              actionLabel="Create Campaign"
              onAction={() => setIsCreateCampaignOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignsList.map((campaign) => {
                const sent = campaign.metrics?.sent || 0;
                const opened = campaign.metrics?.opened || 0;
                const openPct = sent > 0 ? Math.round((opened / sent) * 100) : 0;
                const clicked = campaign.metrics?.clicked || 0;
                const clickPct = sent > 0 ? Math.round((clicked / sent) * 100) : 0;

                return (
                  <Card key={campaign._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold line-clamp-1">
                            {campaign.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {campaign.templateId?.name ? `Template: ${campaign.templateId.name}` : "Custom Layout"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      {/* Segmentation Pill */}
                      <div className="flex flex-wrap gap-1 text-xs">
                        {campaign.segmentFilter?.tag && (
                          <Badge variant="outline" className="text-xs">
                            Tag: {campaign.segmentFilter.tag}
                          </Badge>
                        )}
                        {campaign.segmentFilter?.lifecycleStage && (
                          <Badge variant="outline" className="text-xs">
                            Stage: {campaign.segmentFilter.lifecycleStage}
                          </Badge>
                        )}
                        {!campaign.segmentFilter?.tag && !campaign.segmentFilter?.lifecycleStage && (
                          <span className="text-muted-foreground text-xs">Target: All Contacts</span>
                        )}
                      </div>

                      {/* Mini Stats Bar */}
                      <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-lg p-2.5 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Sent</div>
                          <div className="text-sm font-semibold">{sent.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Open %</div>
                          <div className="text-sm font-semibold text-emerald-600">{openPct}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Click %</div>
                          <div className="text-sm font-semibold text-purple-600">{clickPct}%</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex items-center justify-between border-t bg-muted/20 px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsAnalyticsOpen(true);
                        }}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Performance
                      </Button>

                      {campaign.status === "Draft" && (
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => {
                            setSendingCampaignId(campaign._id);
                            setIsSendConfirmOpen(true);
                          }}
                        >
                          <Play className="h-3.5 w-3.5" />
                          Send Now
                        </Button>
                      )}

                      {campaign.status === "Completed" && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Delivered
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* EMAIL TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Reusable transactional & marketing email layouts with dynamic merge variables like{" "}
              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{"{{first_name}}"}</code>.
            </p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setIsCreateTemplateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No templates saved"
              description="Build email layouts with dynamic tokens to accelerate your outbound campaigns."
              actionLabel="Create Template"
              onAction={() => setIsCreateTemplateOpen(true)}
            />
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl._id}>
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {tpl.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tpl.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tpl.variables?.map((v) => (
                            <Badge key={v} variant="outline" className="text-[10px] font-mono">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingTemplateId(tpl._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* CREATE CAMPAIGN DIALOG */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Marketing Campaign</DialogTitle>
            <DialogDescription>
              Configure targeting and template selection for your outbound email blast.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Campaign Name
              </label>
              <Input
                placeholder="e.g. Q3 Executive Enterprise Webinar Invite"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Template
              </label>
              <Select value={campaignTemplateId} onValueChange={setCampaignTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Tag Filter
                </label>
                <Input
                  placeholder="e.g. Enterprise, VIP"
                  value={segmentTag}
                  onChange={(e) => setSegmentTag(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lifecycle Stage
                </label>
                <Select value={segmentLifecycle} onValueChange={setSegmentLifecycle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Opportunity">Opportunity</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCampaignOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaignMutation.isPending}>
                {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE EMAIL TEMPLATE DIALOG */}
      <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Email Template</DialogTitle>
            <DialogDescription>
              Create parameterized templates. Supported tokens: <code className="text-xs font-mono">{"{{first_name}}"}</code>, <code className="text-xs font-mono">{"{{company}}"}</code>, <code className="text-xs font-mono">{"{{email}}"}</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTemplateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Template Name
                </label>
                <Input
                  placeholder="e.g. Product Demo Follow-up"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Subject Line
              </label>
              <Input
                placeholder="e.g. Accelerating your team's workflow with CookMyWork"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Body HTML / Text
              </label>
              <Textarea
                rows={7}
                placeholder="Write your email body..."
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                className="font-mono text-sm leading-relaxed"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTemplateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SEND CAMPAIGN CONFIRMATION */}
      <ConfirmDialog
        open={isSendConfirmOpen}
        onOpenChange={setIsSendConfirmOpen}
        title="Dispatch Campaign Broadcast"
        description="Are you sure you want to trigger this email campaign to all recipients in the target audience segment? Real-time open and click telemetry will begin recording immediately."
        confirmText="Send Campaign Now"
        onConfirm={() => {
          if (sendingCampaignId) {
            sendCampaignMutation.mutate(sendingCampaignId);
          }
        }}
      />

      {/* DELETE TEMPLATE CONFIRMATION */}
      <ConfirmDialog
        open={!!deletingTemplateId}
        onOpenChange={(open) => !open && setDeletingTemplateId(null)}
        title="Delete Email Template"
        description="Are you sure you want to remove this template? This cannot be undone."
        confirmText="Delete Template"
        variant="destructive"
        onConfirm={() => {
          if (deletingTemplateId) {
            deleteTemplateMutation.mutate(deletingTemplateId);
          }
        }}
      />

      {/* CAMPAIGN ANALYTICS SHEET */}
      <Sheet open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedCampaign && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedCampaign.status)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold">{selectedCampaign.name}</SheetTitle>
                <SheetDescription>
                  Detailed delivery statistics and engagement telemetry for this campaign.
                </SheetDescription>
              </SheetHeader>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Recipients Sent</div>
                  <div className="text-2xl font-bold mt-1 text-blue-600">
                    {selectedCampaign.metrics?.sent.toLocaleString() || 0}
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Unique Opens</div>
                  <div className="text-2xl font-bold mt-1 text-emerald-600">
                    {selectedCampaign.metrics?.opened.toLocaleString() || 0}
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Clicks Registered</div>
                  <div className="text-2xl font-bold mt-1 text-purple-600">
                    {selectedCampaign.metrics?.clicked.toLocaleString() || 0}
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">Bounces</div>
                  <div className="text-2xl font-bold mt-1 text-red-500">
                    {selectedCampaign.metrics?.bounced.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Recharts Bar Breakdown */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-semibold">Delivery Funnel Distribution</h4>
                <div className="h-60 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartDataForCampaign(selectedCampaign)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {getChartDataForCampaign(selectedCampaign).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Template Info */}
              {selectedCampaign.templateId && (
                <div className="rounded-md border p-3 space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">Linked Template</div>
                  <div className="text-sm font-medium">{selectedCampaign.templateId.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Subject: {selectedCampaign.templateId.subject}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {selectedCampaign.status === "Draft" && (
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    setSendingCampaignId(selectedCampaign._id);
                    setIsSendConfirmOpen(true);
                  }}
                >
                  <Send className="h-4 w-4" />
                  Dispatch Broadcast to Target Segment
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
