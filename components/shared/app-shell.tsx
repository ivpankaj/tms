"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { GlobalSearch } from "./global-search";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  Shield,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  FolderGit2,
  CheckCheck,
  Users2,
  ListOrdered,
  Kanban,
  CalendarDays,
  GitCommitHorizontal,
  Inbox,
  Calendar as CalendarIcon,
  Plus,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateTaskDialog } from "./create-task-dialog";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "My Tasks", href: "/my-tasks", icon: CheckSquare },
      { label: "Inbox", href: "/inbox", icon: Inbox },
      { label: "Calendar", href: "/calendar", icon: CalendarIcon },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Projects", href: "/projects", icon: FolderGit2 },
      { label: "Tasks", href: "/tasks", icon: CheckCheck },
      { label: "Teams", href: "/teams", icon: Users2 },
      { label: "Members", href: "/members", icon: Users },
      { label: "Workload", href: "/workload", icon: Timer },
    ],
  },
  {
    title: "Views",
    items: [
      { label: "List", href: "/views/list", icon: ListOrdered },
      { label: "Board", href: "/views/board", icon: Kanban },
      { label: "Calendar", href: "/views/calendar", icon: CalendarDays },
      { label: "Timeline", href: "/views/timeline", icon: GitCommitHorizontal },
    ],
  },
  {
    title: "Other",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Automations", href: "/automation", icon: Zap },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, organization, organizations, switchOrganization, logout } = useAuth();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Global 'C' shortcut to create task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "c" || e.key === "C") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        setIsCreateTaskOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", organization?.id],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: Boolean(user),
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

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
      queryClient.invalidateQueries({ queryKey: ["notifications", organization?.id] });
    },
  });

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const currentPlan = organization?.billingPlan || (organization as any)?.plan || "Pro";

  // Navigation Links Component
  const NavigationContent = ({
    collapsed = false,
    onLinkClick,
  }: {
    collapsed?: boolean;
    onLinkClick?: () => void;
  }) => (
    <div className="space-y-6 px-3 py-3">
      {NAV_GROUPS.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {!collapsed && (
            <h4 className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase select-none mb-1.5">
              {group.title}
            </h4>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const linkElement = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                } ${collapsed ? "justify-center px-0 py-2.5" : ""}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={50}>
                  <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkElement;
          })}
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      {/* Pinned Viewport Container - Prevents whole-page scrolling */}
      <div className="h-screen w-screen overflow-hidden flex bg-background text-foreground">
        {/* ========================================================================= */}
        {/* DESKTOP SIDEBAR (Pinned, Fixed Height, Independent Internal Scroll) */}
        {/* ========================================================================= */}
        <aside
          className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 border-r border-border/70 bg-card/95 backdrop-blur-md z-40 transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-[72px]" : "w-64 lg:w-72"
          }`}
        >
          {/* Top Brand Header & Collapse Action */}
          <div className="h-16 shrink-0 border-b border-border/70 px-3.5 flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-black text-sm shadow-sm ring-1 ring-primary/20 shrink-0">
                  N
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-foreground">Nexus Workspace</span>
                    <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0 uppercase">
                      Pro
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">Task & Project Platform</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto h-8 w-8 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                N
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Workspace Switcher */}
          {!isCollapsed && organizations.length > 0 && (
            <div className="p-3 border-b border-border/50 bg-muted/20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-between px-2.5 text-xs font-medium border-border/70 bg-background/60 hover:bg-background shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {organization?.name ? organization.name[0].toUpperCase() : "W"}
                      </div>
                      <span className="truncate">{organization?.name || "Workspace"}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0 capitalize">
                        {currentPlan}
                      </Badge>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Workspaces
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations.map((org) => {
                    const isSelected = org.id === organization?.id;
                    return (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => switchOrganization(org.id)}
                        className="flex items-center justify-between text-xs cursor-pointer py-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-[10px] font-semibold">
                            {org.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium truncate">{org.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/settings")} className="text-xs cursor-pointer">
                    <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span>Manage Workspaces</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Nav Links (Scrolls independently if screen height is small) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <NavigationContent collapsed={isCollapsed} />
          </div>

          {/* User Profile Footer (Fixed at the bottom of sidebar) */}
          <div className="shrink-0 p-3 border-t border-border/70 bg-muted/20">
            {!isCollapsed ? (
              <div className="flex items-center justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 overflow-hidden text-left p-1 rounded-lg hover:bg-muted/60 transition-colors flex-1 cursor-pointer">
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8 ring-1 ring-border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-semibold truncate leading-tight">{user?.name || "Alex Sterling"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.role || "Super Admin"}</p>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                    <DropdownMenuLabel className="font-normal text-xs">
                      <p className="font-semibold">{user?.name || "Admin"}</p>
                      <p className="text-muted-foreground text-[11px] truncate">{user?.email || "admin@nexus.io"}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/settings")} className="text-xs cursor-pointer">
                      <Settings className="h-3.5 w-3.5 mr-2" />
                      <span>Account Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-xs text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex justify-center">
                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => router.push("/settings")}
                      className="relative p-1 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-8 w-8 ring-1 ring-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium text-xs">{user?.name || "Admin"}</p>
                    <p className="text-[10px] text-muted-foreground">{user?.role || "Super Admin"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN APPLICATION CONTAINER (Fixed Header + Independently Scrollable Body) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
          {/* Top Sticky Navbar */}
          <header className="h-16 shrink-0 border-b border-border/70 bg-background/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
            {/* Left: Mobile Drawer Trigger + Global Search */}
            <div className="flex items-center gap-2.5">
              {/* Mobile Drawer (Sheet) */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden h-9 w-9 shrink-0">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 flex flex-col h-full bg-card">
                  {/* Mobile Drawer Header */}
                  <SheetHeader className="h-16 shrink-0 border-b border-border/70 px-4 flex justify-center text-left">
                    <SheetTitle className="flex items-center gap-2.5 text-base font-bold">
                      <div className="h-7 w-7 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-black text-sm">
                        N
                      </div>
                      <div className="flex flex-col">
                        <span>Nexus Workspace</span>
                        <span className="text-[10px] font-normal text-muted-foreground">Task & Project Management</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Mobile Navigation List */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <NavigationContent onLinkClick={() => setMobileMenuOpen(false)} />
                  </div>

                  {/* Mobile Drawer Footer */}
                  <div className="shrink-0 p-3 border-t border-border/70 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold truncate">{user?.name || "Admin"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@nexus.io"}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Sign Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Global Search Box (Adaptive on all screen sizes) */}
              <GlobalSearch />
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2">
              {/* Quick + New Task Action Button */}
              <Button
                size="sm"
                onClick={() => setIsCreateTaskOpen(true)}
                className="h-9 px-3 gap-1.5 font-medium shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Task</span>
                <kbd className="hidden lg:inline-flex pointer-events-none h-4 select-none items-center rounded bg-primary-foreground/20 px-1 font-mono text-[9px] font-semibold text-primary-foreground">
                  C
                </kbd>
              </Button>

              {/* Notification Center */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between p-3 border-b">
                    <span className="font-semibold text-xs">Notifications</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-muted-foreground"
                        onClick={() => markAllReadMutation.mutate()}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1 divide-y divide-border/50 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-xs">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (n.link) router.push(n.link);
                          }}
                          className={`p-2.5 rounded-lg hover:bg-muted/60 cursor-pointer space-y-1 transition-colors ${
                            !n.isRead ? "bg-muted/40 font-medium" : "text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-[11px]">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-[11px] leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dark / Light Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Quick Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 px-2 gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
                        {user?.name ? user.name[0] : "A"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium hidden sm:inline-block truncate max-w-[120px]">
                      {user?.name || "Admin"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none">{user?.name || "Nexus Admin"}</p>
                      <p className="text-[11px] leading-none text-muted-foreground">{user?.email || "admin@nexus.io"}</p>
                      <div className="pt-1">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          <Shield className="h-2.5 w-2.5 mr-1 text-primary" />
                          {user?.role || "Super Admin"}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/settings")} className="text-xs cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Workspace Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-xs text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* INDEPENDENTLY SCROLLABLE CONTENT BODY (Sidebar & Header remain locked) */}
          {/* ========================================================================= */}
          <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>

      {/* Global Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </TooltipProvider>
  );
}
