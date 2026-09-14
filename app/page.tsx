"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "next-themes";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Sparkles,
  Zap,
  BellRing,
  Kanban,
  Timer,
  BarChart3,
  Shield,
  Users2,
  Calendar,
  Layers,
  Clock,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Star,
  ExternalLink,
  Laptop,
  CheckSquare,
  Flame,
} from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const workflows = [
    {
      title: "1. Plan Sprints",
      subtitle: "Organize backlogs and prioritize work with Kanban and List views.",
      badge: "Agile Workflow",
      details: [
        "Interactive drag-and-drop Kanban boards with custom status pipelines",
        "Tag tasks by urgency, priority (Urgent, High, Medium, Low), and team members",
        "Split epics into manageable subtasks with real-time completion tracking",
      ],
      mockPreview: {
        title: "Sprint 14: Core Engine Optimization",
        badge: "In Progress",
        items: [
          { text: "Implement WebSocket sync engine", status: "Done", tag: "Backend" },
          { text: "Design modern user dashboard metrics", status: "In Progress", tag: "UI/UX" },
          { text: "Configure Resend automated notification queues", status: "To Do", tag: "Infra" },
        ],
      },
    },
    {
      title: "2. Smart Reminders",
      subtitle: "Never drop the ball with automated deadline and email alerts.",
      badge: "Brand New",
      details: [
        "Custom reminder dates & exact trigger times for sensitive milestones",
        "Direct email alerts delivered to user inboxes powered by Resend",
        "Dedicated Reminders tab to review pending, overdue, and completed triggers",
      ],
      mockPreview: {
        title: "Automated Notification Schedule",
        badge: "Active Triggers",
        items: [
          { text: "Quarterly security audit review", status: "Scheduled for Today 6:00 PM", tag: "High" },
          { text: "Product launch staging deployment", status: "Email Sent Successfully", tag: "Urgent" },
          { text: "Renew production SSL certificates", status: "Scheduled in 3 days", tag: "System" },
        ],
      },
    },
    {
      title: "3. Workload Balancing",
      subtitle: "Prevent team burnout and ensure balanced sprint velocity.",
      badge: "Team Velocity",
      details: [
        "Visual capacity meters across all team engineers and designers",
        "One-click task re-allocation to keep deliverables on track",
        "Burn-down charts and weekly velocity analytics calculated automatically",
      ],
      mockPreview: {
        title: "Team Capacity Overview",
        badge: "92% Velocity",
        items: [
          { text: "Pankaj (Super Admin) • 4 Active Tasks", status: "Optimal Load", tag: "Lead" },
          { text: "Frontend Team • 8 Active Tasks", status: "Balanced", tag: "Design" },
          { text: "DevOps Squad • 2 Active Tasks", status: "Available", tag: "Infra" },
        ],
      },
    },
  ];

  const faqs = [
    {
      q: "How does Cookmywork compare to tools like Jira or Trello?",
      a: "Cookmywork combines the speed and modern simplicity of modern tools with powerful project tracking, smart email reminders, and workload analytics. You get clean Kanban boards without the clunky configuration of legacy tools.",
    },
    {
      q: "How do the automated email reminders work?",
      a: "You can set exact date and time triggers on any task or reminder. Our background scheduler monitors these triggers and automatically delivers reminder notifications directly to your email inbox via our high-deliverability email service.",
    },
    {
      q: "Is there a free tier?",
      a: "Yes! The Starter tier is free forever and includes full access to Kanban boards, list views, task creation, project management, and essential email alerts for up to 5 team members.",
    },
    {
      q: "Can I invite team members and create multiple workspaces?",
      a: "Absolutely. You can invite team members with specific roles (Admin, Member, Viewer) and seamlessly switch between different organization workspaces from the sidebar.",
    },
    {
      q: "Can I access Cookmywork from mobile devices?",
      a: "Yes! Cookmywork is fully responsive and optimized for phones, tablets, and desktop displays with responsive touch drawers and adaptive layouts.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/20 selection:text-orange-500 overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[800px] right-[-200px] w-[500px] h-[500px] bg-orange-500/8 blur-[130px] rounded-full" />
        <div className="absolute top-[1600px] left-[-200px] w-[600px] h-[600px] bg-blue-500/5 blur-[160px] rounded-full" />
      </div>

      {/* ========================================================================= */}
      {/* STICKY TOP NAVBAR                                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={34} rounded="rounded-xl" priority className="transition-transform group-hover:scale-105 shadow-sm" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                Cookmywork
              </span>
              <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                PRO
              </Badge>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflows" className="hover:text-foreground transition-colors">
              Workflows
            </a>
            <a href="#reminders" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <span>Reminders</span>
              <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded-full">New</span>
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {!isLoading && user ? (
              <Link href="/dashboard">
                <Button className="h-9 gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-xs cursor-pointer">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link href="/login">
                  <Button variant="ghost" className="h-9 font-medium text-muted-foreground hover:text-foreground cursor-pointer">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="h-9 gap-1.5 font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/25 cursor-pointer">
                    <span>Get Started Free</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-9 w-9"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2 text-sm font-medium">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted"
              >
                Features
              </a>
              <a
                href="#workflows"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted"
              >
                Workflows
              </a>
              <a
                href="#reminders"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted flex items-center justify-between"
              >
                <span>Smart Reminders</span>
                <Badge className="bg-orange-500 text-white text-[10px]">New</Badge>
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-2 border-t border-border flex flex-col gap-2">
              {!isLoading && user ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Open Workspace Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                             */}
      {/* ========================================================================= */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold backdrop-blur-xs transition-all hover:bg-orange-500/15">
            <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            <span>Introducing Cookmywork 2.0 • Automated Reminders & Real-time Velocity</span>
            <ArrowRight className="h-3 w-3" />
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
              Cook Up High-Impact Work.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600">
                Delivered Faster.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
              The unified workspace for modern teams to plan sprints, track Kanban boards, automate smart email reminders, and measure ship velocity with zero clutter.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {!isLoading && user ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 gap-2 cursor-pointer">
                  <span>Open Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 gap-2 cursor-pointer">
                    <span>Start Free Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-12 px-7 text-base font-medium border-border/80 hover:bg-muted/80 cursor-pointer">
                    Sign In with Email
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Social Proof Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Instant 30-second setup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="font-semibold text-foreground">4.9/5 rating</span>
              <span>by 12,000+ teams</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HERO APP SHOWCASE / LIVE PREVIEW MOCKUP                                  */}
          {/* ========================================================================= */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-2xl shadow-orange-500/10 overflow-hidden ring-1 ring-border/40">
              {/* Window Header Dots */}
              <div className="h-11 border-b border-border/70 px-4 bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-muted-foreground hidden sm:inline-block">
                    app.cookmywork.com/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Workspace Sync
                  </span>
                </div>
              </div>

              {/* Mock App Body */}
              <div className="p-4 sm:p-6 text-left space-y-6 bg-gradient-to-b from-card to-background">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Sprint Velocity</span>
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold mt-1 tracking-tight text-foreground">94.8%</div>
                    <p className="text-[11px] text-emerald-500 font-medium mt-0.5">↑ +14% vs last week</p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Completed Tasks</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold mt-1 tracking-tight text-foreground">184 / 210</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">87% completion rate</p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Active Reminders</span>
                      <BellRing className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold mt-1 tracking-tight text-foreground">12 Alerts</div>
                    <p className="text-[11px] text-orange-500 font-medium mt-0.5">Next trigger in 45m</p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Team Health</span>
                      <Users2 className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold mt-1 tracking-tight text-foreground">Optimal</div>
                    <p className="text-[11px] text-emerald-500 font-medium mt-0.5">0 members overloaded</p>
                  </div>
                </div>

                {/* Mock Kanban Board Preview */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Kanban className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-sm">Sprint 12 Board Preview</span>
                      <Badge variant="outline" className="text-[10px] font-mono">14 Tasks</Badge>
                    </div>
                    <Link href="/dashboard" className="text-xs text-orange-500 hover:underline flex items-center gap-1 font-medium">
                      View Full Board <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Column 1: In Progress */}
                    <div className="space-y-2 p-3 rounded-lg bg-card/80 border border-border/60">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-amber-500">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          IN PROGRESS (3)
                        </span>
                      </div>
                      <div className="p-3 rounded-md bg-background border border-border/70 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[9px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none px-1.5 py-0">URGENT</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Today
                          </span>
                        </div>
                        <p className="text-xs font-semibold">Integrate Resend automated reminder webhook</p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 text-orange-500">
                            <BellRing className="h-3 w-3" /> 5:30 PM Alert
                          </span>
                          <span className="font-mono text-[10px]">#TTM-104</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Review */}
                    <div className="space-y-2 p-3 rounded-lg bg-card/80 border border-border/60">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-blue-500">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          IN REVIEW (2)
                        </span>
                      </div>
                      <div className="p-3 rounded-md bg-background border border-border/70 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none px-1.5 py-0">FEATURE</Badge>
                          <span className="text-[10px] text-muted-foreground">Sprint 12</span>
                        </div>
                        <p className="text-xs font-semibold">Workspace member role switcher & permissions</p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                          <span className="text-emerald-500 flex items-center gap-1">
                            <Check className="h-3 w-3" /> 2 Approvals
                          </span>
                          <span className="font-mono text-[10px]">#TTM-98</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Done */}
                    <div className="space-y-2 p-3 rounded-lg bg-card/80 border border-border/60">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          COMPLETED (8)
                        </span>
                      </div>
                      <div className="p-3 rounded-md bg-background border border-border/70 space-y-2 opacity-85 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-1.5 py-0">INFRA</Badge>
                          <span className="text-[10px] text-emerald-500 font-medium">Shipped</span>
                        </div>
                        <p className="text-xs font-semibold line-through text-muted-foreground">MongoDB Atlas indexing & replica connection</p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                          <span>Deployed to Prod</span>
                          <span className="font-mono text-[10px]">#TTM-92</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TRUSTED BY COMPANIES STRIP                                               */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Built for engineering teams, product managers, and agile startups worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
            <span className="text-sm font-bold tracking-wider font-mono">NEXT.JS</span>
            <span className="text-sm font-bold tracking-wider font-mono">REACT 19</span>
            <span className="text-sm font-bold tracking-wider font-mono">MONGODB</span>
            <span className="text-sm font-bold tracking-wider font-mono">RESEND</span>
            <span className="text-sm font-bold tracking-wider font-mono">TAILWIND</span>
            <span className="text-sm font-bold tracking-wider font-mono">TYPESCRIPT</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE BENTO GRID SECTION (#features)                                   */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs">
            Engineered For Speed
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Everything your team needs to plan, track, and ship.
          </h2>
          <p className="text-muted-foreground text-base">
            Replace fragmented spreadsheets, clunky ticket systems, and missed deadlines with one unified agile platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1 (2 cols wide): Smart Reminders */}
          <div id="reminders" className="md:col-span-2 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-card via-card to-orange-500/5 p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden group hover:border-orange-500/50 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <BellRing className="h-48 w-48 text-orange-500" />
            </div>
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold">
                <Sparkles className="h-3 w-3" /> Brand New Feature
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Automated Smart Email Reminders</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Never lose track of a milestone. Schedule tasks with exact trigger dates and times. Our resilient background worker automatically dispatches notification emails straight to your inbox.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/80 border border-border/80">
                <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="block font-semibold text-foreground">Exact-Time Email Triggers</strong>
                  <span className="text-muted-foreground">Custom date & time triggers sent directly to email.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/80 border border-border/80">
                <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="block font-semibold text-foreground">Resend Email Delivery</strong>
                  <span className="text-muted-foreground">High inbox placement and instant notification status.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Kanban & Sprint Boards */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:border-border transition-all">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Kanban className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Kanban & Sprint Boards</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Visualize workflows with customizable columns (To Do, In Progress, In Review, Done). Drag and drop cards with zero lag.
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground pt-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Priority tags & urgency badges</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Quick inline task creation & editing</span>
              </li>
            </ul>
          </div>

          {/* Bento Card 3: Workload & Capacity */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:border-border transition-all">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Timer className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Team Workload Balance</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              See who is overloaded and who has availability in real time. Prevent burnout and maintain consistent sprint velocity.
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground pt-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Active task allocation meters</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Prevent deadline bottlenecks</span>
              </li>
            </ul>
          </div>

          {/* Bento Card 4: Real-time Analytics */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:border-border transition-all">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Productivity & Velocity</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Track project health with burn-down velocity charts, task completion ratios, and historical sprint trends.
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground pt-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>6-week productivity area charts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Overdue task radar and alerts</span>
              </li>
            </ul>
          </div>

          {/* Bento Card 5: Enterprise Organization & Roles */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:border-border transition-all">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Multi-Workspace & Roles</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Manage different client orgs or internal projects with role-based access control (Admin, Member, Viewer).
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground pt-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Granular permission levels</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Instant organization switcher</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* WORKFLOW SHOWCASE SECTION (#workflows)                                   */}
      {/* ========================================================================= */}
      <section id="workflows" className="py-20 border-y border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs">
              Workflow Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              How modern teams ship with Cookmywork.
            </h2>
          </div>

          {/* Tabs header */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {workflows.map((wf, idx) => (
              <button
                key={idx}
                onClick={() => setActiveWorkflowTab(idx)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeWorkflowTab === idx
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-card hover:bg-muted text-muted-foreground border border-border"
                }`}
              >
                {wf.title}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-card rounded-2xl border border-border/80 p-6 sm:p-10 shadow-lg">
            <div className="space-y-5">
              <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs">
                {workflows[activeWorkflowTab].badge}
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {workflows[activeWorkflowTab].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {workflows[activeWorkflowTab].subtitle}
              </p>
              <ul className="space-y-3 pt-2">
                {workflows[activeWorkflowTab].details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs sm:text-sm">
                    <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3">
                <Link href={user ? "/dashboard" : "/register"}>
                  <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    <span>Try This Workflow</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mock tab preview */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-sm">{workflows[activeWorkflowTab].mockPreview.title}</span>
                <Badge variant="outline" className="text-[10px] font-mono">{workflows[activeWorkflowTab].mockPreview.badge}</Badge>
              </div>
              <div className="space-y-2.5">
                {workflows[activeWorkflowTab].mockPreview.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/80 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="font-medium truncate">{item.text}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TESTIMONIALS                                                             */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs">
            User Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Loved by product teams everywhere.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border border-border/80 bg-card shadow-2xs space-y-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
              &quot;Cookmywork cut our sprint planning meetings in half. The automated email reminders alone saved our product launch from missing three critical staging deadlines.&quot;
            </p>
            <div className="pt-2 border-t border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-orange-500/20 text-orange-600 font-bold flex items-center justify-center text-xs">
                AS
              </div>
              <div>
                <strong className="block text-xs font-semibold text-foreground">Aarav Sharma</strong>
                <span className="text-[11px] text-muted-foreground">VP Engineering, CloudScale</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-orange-500/30 bg-gradient-to-b from-card to-orange-500/5 shadow-2xs space-y-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
              &quot;The cleanest task workspace we&apos;ve used. It strikes the perfect balance between high-speed Kanban responsiveness and enterprise workload analytics.&quot;
            </p>
            <div className="pt-2 border-t border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-600 font-bold flex items-center justify-center text-xs">
                PM
              </div>
              <div>
                <strong className="block text-xs font-semibold text-foreground">Priya Mehta</strong>
                <span className="text-[11px] text-muted-foreground">Principal PM, Orbit Labs</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-border/80 bg-card shadow-2xs space-y-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
              &quot;Moving from Trello was a no-brainer. Having Kanban, Reminders, and Workload analytics in one unified dashboard made our entire remote engineering squad 2x faster.&quot;
            </p>
            <div className="pt-2 border-t border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center text-xs">
                DC
              </div>
              <div>
                <strong className="block text-xs font-semibold text-foreground">David Chen</strong>
                <span className="text-[11px] text-muted-foreground">Founder & CTO, PulseApp</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRICING SECTION (#pricing)                                               */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-24 border-t border-border/60 bg-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs">
              Simple & Transparent Pricing
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Predictable plans for every stage.
            </h2>
            <p className="text-muted-foreground text-sm">
              Start free, upgrade as your team scales. No surprise charges.
            </p>

            {/* Monthly / Annual switch */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${!annualBilling ? "text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  annualBilling ? "bg-orange-500" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    annualBilling ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${annualBilling ? "text-foreground" : "text-muted-foreground"}`}>
                <span>Annual</span>
                <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0">Save 20%</Badge>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Tier 1: Starter */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Starter</h3>
                  <p className="text-xs text-muted-foreground">Essential project and task management for small teams.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">$0</span>
                  <span className="text-xs text-muted-foreground">/ month forever</span>
                </div>
                <ul className="text-xs space-y-2.5 pt-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Up to 5 team members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>3 active project workspaces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Kanban & list sprint boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>50 automated email reminders / mo</span>
                  </li>
                </ul>
              </div>
              <Link href="/register">
                <Button variant="outline" className="w-full font-semibold">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Tier 2: Pro (Featured) */}
            <div className="rounded-2xl border-2 border-orange-500 bg-gradient-to-b from-card via-card to-orange-500/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-bold text-[10px] px-3 py-0.5 tracking-wider uppercase shadow-sm">
                  Most Popular
                </Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Pro Workspace</h3>
                  <p className="text-xs text-muted-foreground">Advanced team collaboration, unlimited reminders & analytics.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">
                    ${annualBilling ? "9" : "12"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ user per month</span>
                </div>
                <ul className="text-xs space-y-2.5 pt-2 text-muted-foreground">
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span>Unlimited team members & projects</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span>Unlimited smart email reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span>Real-time workload & velocity analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span>Custom tags, urgency badges & subtasks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span>Priority email & chat support</span>
                  </li>
                </ul>
              </div>
              <Link href="/register">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md shadow-orange-500/25">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Enterprise</h3>
                  <p className="text-xs text-muted-foreground">Dedicated infrastructure, custom SLAs, and enterprise security.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">
                    ${annualBilling ? "24" : "29"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ user per month</span>
                </div>
                <ul className="text-xs space-y-2.5 pt-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Everything in Pro workspace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>SAML / SSO & custom domains</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Dedicated database cluster</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>99.99% uptime SLA & audit logs</span>
                  </li>
                </ul>
              </div>
              <Link href="/register">
                <Button variant="outline" className="w-full font-semibold">
                  Contact Enterprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQ SECTION (#faq)                                                       */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs">
            Got Questions?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm">
            Everything you need to know about getting started with Cookmywork.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-border/80 bg-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-semibold text-sm sm:text-base hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? "rotate-180 text-orange-500" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTTOM CTA BANNER                                                         */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/15 via-background to-orange-500/10 p-8 sm:p-14 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Ready to accelerate how your team ships?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Join thousands of modern developers, designers, and project managers using Cookmywork daily.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="h-12 px-8 font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 gap-2 cursor-pointer">
                <span>{user ? "Open Dashboard" : "Get Started For Free"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-7 font-medium border-border/80 hover:bg-muted/80 cursor-pointer">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-border/60 bg-muted/30 py-12 text-muted-foreground text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Logo size={28} rounded="rounded-lg" />
              <span className="font-extrabold text-base tracking-tight text-foreground">
                Cookmywork
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              The agile task, sprint, and project management workspace for high-performing product teams.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <strong className="block text-foreground font-semibold text-xs uppercase tracking-wider">Product</strong>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#workflows" className="hover:text-foreground transition-colors">Sprint Workflows</a></li>
              <li><a href="#reminders" className="hover:text-foreground transition-colors">Smart Reminders</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <strong className="block text-foreground font-semibold text-xs uppercase tracking-wider">Workspace</strong>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/tasks" className="hover:text-foreground transition-colors">Kanban Board</Link></li>
              <li><Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link></li>
              <li><Link href="/workload" className="hover:text-foreground transition-colors">Team Workload</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <strong className="block text-foreground font-semibold text-xs uppercase tracking-wider">Security & Legal</strong>
            <ul className="space-y-2">
              <li><span className="hover:text-foreground cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Security Overview</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Cookie Preferences</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Cookmywork, Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 text-muted-foreground">
            Built with Next.js 15, Tailwind CSS, and MongoDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
