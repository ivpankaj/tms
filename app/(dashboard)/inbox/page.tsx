"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Inbox,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function InboxPage() {
  const router = useRouter();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications-inbox", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: Boolean(user),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const filtered = notifications.filter((n: any) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" />
            Inbox & Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on task assignments, comments, mentions, and due date alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="gap-1.5 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="h-8 text-xs cursor-pointer"
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
          className="h-8 text-xs cursor-pointer"
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="shadow-2xs divide-y divide-border/50">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
            <p className="font-semibold text-foreground text-sm">You are all caught up!</p>
            <p>No new notifications right now.</p>
          </div>
        ) : (
          filtered.map((n: any) => (
            <div
              key={n._id}
              onClick={() => {
                if (n.link) router.push(n.link);
              }}
              className={`p-4 hover:bg-muted/40 transition-colors flex items-start justify-between gap-4 cursor-pointer text-xs ${
                !n.isRead ? "bg-muted/20 font-medium" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-start gap-3 truncate">
                <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-xs">{n.title}</span>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground">
                <span>
                  {n.createdAt
                    ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                    : "recently"}
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-50" />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
