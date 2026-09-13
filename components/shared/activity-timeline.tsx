"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  ArrowRightCircle,
  Clock,
  Plus,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ActivityTimelineProps {
  entityType: "contact" | "deal" | "company" | "lead" | "ticket";
  entityId: string;
  recipientEmail?: string;
  recipientName?: string;
}

export function ActivityTimeline({
  entityType,
  entityId,
  recipientEmail,
  recipientName,
}: ActivityTimelineProps) {
  const queryClient = useQueryClient();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // New activity form
  const [activityType, setActivityType] = useState<"call" | "meeting" | "note">("call");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDetails, setActivityDetails] = useState("");

  // Email form
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", entityType, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/activities?entityType=${entityType}&entityId=${entityId}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: Boolean(entityId),
  });

  const logMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/v1/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to log activity");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", entityType, entityId] });
      toast.success("Activity logged successfully");
      setIsLogOpen(false);
      setActivityTitle("");
      setActivityDetails("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/v1/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to send email");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", entityType, entityId] });
      toast.success("Email sent and recorded to timeline");
      setIsEmailOpen(false);
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return toast.error("Please enter a title");
    logMutation.mutate({
      type: activityType,
      title: activityTitle,
      details: activityDetails,
      entityType,
      entityId,
    });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return toast.error("Recipient email not found");
    if (!emailSubject.trim() || !emailBody.trim()) return toast.error("Subject and body are required");
    emailMutation.mutate({
      to: recipientEmail,
      subject: emailSubject,
      bodyHtml: emailBody,
      entityType,
      entityId,
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-emerald-500" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case "stage_change":
      case "status_change":
        return <ArrowRightCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Activity Timeline
        </h4>
        <div className="flex items-center gap-2">
          {recipientEmail && (
            <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5 text-emerald-500" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Email to {recipientName || recipientEmail}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">To</label>
                    <Input value={recipientEmail} disabled className="h-9 bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Subject</label>
                    <Input
                      placeholder="e.g. Following up on our recent conversation"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Message Body</label>
                    <Textarea
                      placeholder="Type your email... (supports {{first_name}} variables)"
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEmailOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={emailMutation.isPending} className="gap-2">
                      {emailMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Email
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Activity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Activity Type</label>
                  <Select
                    value={activityType}
                    onValueChange={(val: any) => setActivityType(val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="meeting">Meeting / Demo</SelectItem>
                      <SelectItem value="note">Internal Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Title</label>
                  <Input
                    placeholder="e.g. Discussed Q3 requirements & pricing"
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    className="h-9"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Details & Outcomes</label>
                  <Textarea
                    placeholder="Add notes, key takeaways, next steps..."
                    rows={4}
                    value={activityDetails}
                    onChange={(e) => setActivityDetails(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsLogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={logMutation.isPending}>
                    {logMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Activity
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="h-12 bg-muted/40 rounded animate-pulse" />
          <div className="h-12 bg-muted/40 rounded animate-pulse" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No activities logged yet. Click &ldquo;Log Activity&rdquo; to record calls, notes, or meetings.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {activities.map((act: any) => (
            <div key={act._id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border shadow-xs">
                {getActivityIcon(act.type)}
              </div>

              {/* Card Body */}
              <div className="rounded-lg border bg-card p-3 shadow-xs space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <span>{act.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-normal">
                      {act.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {act.createdAt
                      ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })
                      : "Recently"}
                  </span>
                </div>

                {act.details && (
                  <p className="text-muted-foreground whitespace-pre-wrap text-[11px] leading-relaxed">
                    {act.details}
                  </p>
                )}

                {act.createdBy && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                    <Avatar className="h-3.5 w-3.5">
                      <AvatarImage src={act.createdBy.avatar} alt={act.createdBy.name} />
                      <AvatarFallback className="text-[8px]">
                        {act.createdBy.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>Logged by {act.createdBy.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
