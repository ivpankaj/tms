"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TimezoneCombobox } from "@/components/shared/timezone-combobox";
import { toast } from "sonner";
import {
  User,
  KeyRound,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "profile" | "password";
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  defaultTab = "profile",
}: AccountSettingsDialogProps) {
  const { user, authFetch, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Profile Form State
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && open) {
      setName(user.name || "");
      setAvatar(user.avatar || "");
      setTimezone(user.timezone || "Asia/Kolkata");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [user, open]);

  // Handle Avatar Upload via /api/v1/upload (Cloudinary supported)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP, GIF)");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      formData.append("resourceType", "image");

      const res = await authFetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to upload avatar");
      }

      const uploadedUrl = json.data.url;
      setAvatar(uploadedUrl);

      // Instantly save to user profile
      const patchRes = await authFetch("/api/v1/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: uploadedUrl }),
      });

      if (patchRes.ok) {
        await refreshSession();
        toast.success(
          json.data.isCloudinary
            ? "Avatar uploaded to Cloudinary & profile updated!"
            : "Avatar updated successfully!"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await authFetch("/api/v1/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar.trim(),
          timezone,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update profile");
      }

      await refreshSession();
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await authFetch("/api/v1/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getInitials = (n?: string) => {
    if (!n) return "U";
    const parts = n.trim().split(" ");
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[calc(100vw-1.5rem)] sm:w-full max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] p-0 flex flex-col overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="shrink-0 p-4 sm:p-5 pr-12 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <User className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span className="truncate">Account Settings & Security</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            Manage your personal profile, avatar photo, and account credentials.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
          <div className="shrink-0 px-3 sm:px-5 pt-2.5 pb-2 border-b bg-muted/10">
            <TabsList className="grid grid-cols-2 w-full h-8 sm:h-9">
              <TabsTrigger value="profile" className="gap-1.5 text-[11px] sm:text-xs font-medium">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-1.5 text-[11px] sm:text-xs font-medium">
                <KeyRound className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate">Password</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: PROFILE & AVATAR */}
          <TabsContent value="profile" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 m-0 scrollbar-thin">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3.5 sm:p-4 rounded-xl border bg-muted/20 text-center sm:text-left">
              <div className="relative group shrink-0">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-md">
                  <AvatarImage src={avatar} alt={name} className="object-cover" />
                  <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                    {getInitials(name || user?.name)}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-sm font-semibold">Profile Photo</h4>
                  {avatar && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image (PNG, JPG, WebP) to display across CookMyWork.
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-7 text-xs gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3 w-3" />
                    {isUploadingAvatar ? "Uploading..." : "Upload New Avatar"}
                  </Button>
                  {avatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setAvatar("")}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Input value={user?.email || ""} disabled className="bg-muted/50 text-muted-foreground flex-1 min-w-0" />
                  <Badge variant="secondary" className="text-[11px] shrink-0">
                    {user?.role || "Member"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Email is managed by your workspace authentication provider.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Preferred Timezone</Label>
                <TimezoneCombobox value={timezone} onValueChange={setTimezone} />
              </div>

              <div className="pt-3 pb-2 flex justify-end">
                <Button type="submit" disabled={isSavingProfile} className="gap-2 text-xs w-full sm:w-auto cursor-pointer">
                  {isSavingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: PASSWORD & SECURITY */}
          <TabsContent value="password" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 m-0 scrollbar-thin">
            <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground">Password Privacy & Protection</p>
                <p className="text-muted-foreground leading-relaxed">
                  Your password is securely encrypted with <strong>bcrypt (10 rounds)</strong> and stored in MongoDB. Passwords are never displayed or stored in plaintext. You can update your password below at any time.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Password (Min 8 characters)</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 pb-2 flex justify-end">
                <Button type="submit" disabled={isUpdatingPassword} className="gap-2 text-xs w-full sm:w-auto cursor-pointer">
                  {isUpdatingPassword ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  Update Password
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
