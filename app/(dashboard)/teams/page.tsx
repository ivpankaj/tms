"use client";

import React, { useState } from "react";
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
import {
  Users2,
  Plus,
  FolderGit2,
  CheckSquare,
  Shield,
  Loader2,
  Mail,
} from "lucide-react";

export default function TeamsPage() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  // Fetch Teams
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/teams");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) return;
      const res = await fetch("/api/v1/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color,
          leaderId: user?.id,
          members: [user?.id],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to create team");
      return data.data;
    },
    onSuccess: () => {
      toast.success("Team created successfully");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setIsCreateOpen(false);
      setName("");
      setDescription("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }
    createTeamMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users2 className="h-6 w-6 text-primary" />
            Teams
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize departments, squads, and functional workgroups across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Team
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="p-12 text-center text-xs text-muted-foreground space-y-3">
          <Users2 className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-semibold text-sm text-foreground">No teams created yet</p>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Create Team
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team: any) => (
            <Card key={team._id} className="shadow-2xs p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
                    style={{ backgroundColor: team.color || "#6366f1" }}
                  >
                    {team.name ? team.name.slice(0, 2).toUpperCase() : "TM"}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">{team.description}</p>
                  </div>
                </div>
              </div>

              {/* Members Row */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Team Members ({team.members?.length || 0})</span>
                  <span>Leader: {team.leaderId?.name || "None"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {team.members?.map((m: any) => (
                    <Avatar key={m._id} className="h-7 w-7 border-2 border-background">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                        {m.name ? m.name.slice(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                  {team.taskCount ?? 0} active tasks
                </span>
                <span className="flex items-center gap-1.5">
                  <FolderGit2 className="h-3.5 w-3.5" />
                  {team.projectCount ?? 0} projects
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Team</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Group contributors into a shared functional squad.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Core Engineering, Product Design, Growth"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
                autoFocus
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                placeholder="Describe team mission, scope, or responsibility..."
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
                disabled={createTeamMutation.isPending}
                className="gap-1.5"
              >
                {createTeamMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
