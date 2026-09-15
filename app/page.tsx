"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

export default function CookmyworkHomePage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    teamSize: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(
        "Thank you! Your workspace inquiry has been received. Our team will get back to you within 24 hours."
      );
      setFormData({ name: "", email: "", teamSize: "", message: "" });
    }, 800);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const productShowcases = [
    {
      tag: "AGILE WORKFLOW",
      title: "Interactive Kanban & Sprint Engine",
      description:
        "Visualize progress with customizable drag-and-drop columns, subtask completion meters, priority urgency tags, and real-time sprint status updates.",
      features: ["Drag & Drop DND-Kit", "Custom Status Pipelines", "Subtask Tracking", "Agile Backlogs", "Instant Filter"],
      metrics: [
        { label: "Sprint Velocity", value: "94.8%" },
        { label: "Completed Tasks", value: "184 / 210" },
        { label: "Overdue Bottlenecks", value: "0" },
      ],
    },
    {
      tag: "AUTOMATION & ALERTS",
      title: "Automated Smart Email Reminders",
      description:
        "Never drop a critical milestone. Schedule tasks with exact date-time triggers and have automated reminder notifications delivered directly to your inbox via Resend.",
      features: ["Exact-Time Scheduling", "Direct Email Delivery", "Overdue Monitor", "Trigger Audit Logs", "Background Cron"],
      metrics: [
        { label: "Inbox Delivery Rate", value: "99.9%" },
        { label: "Trigger Precision", value: "<15s" },
        { label: "Missed Deadlines", value: "0" },
      ],
    },
    {
      tag: "CAPACITY BALANCING",
      title: "Real-Time Team Workload Matrix",
      description:
        "Prevent team burnout before it happens. View active task allocation meters across all engineers, re-balance assignments in one click, and track 6-week burn-downs.",
      features: ["Active Load Meters", "One-Click Re-allocation", "Capacity Warnings", "Burn-Down Charts", "Velocity Trends"],
      metrics: [
        { label: "Balanced Squads", value: "100%" },
        { label: "Burnout Risk", value: "Low" },
        { label: "Weekly Output", value: "+24%" },
      ],
    },
    {
      tag: "SECURITY & TEAMS",
      title: "Multi-Workspace & Role Access",
      description:
        "Manage multiple internal projects or client organizations from one unified account with strict role-based permissions (Super Admin, Member, Viewer).",
      features: ["Role-Based Access (RBAC)", "Instant Org Switcher", "Member Invitations", "Audit Trails", "Data Isolation"],
      metrics: [
        { label: "Active Workspaces", value: "250+" },
        { label: "Permission Levels", value: "3 Roles" },
        { label: "Sync Latency", value: "<40ms" },
      ],
    },
  ];

  const faqs = [
    {
      q: "How does Cookmywork compare to tools like Jira or Trello?",
      a: "Cookmywork eliminates the bloat and clunkiness of legacy tools. You get high-speed Kanban boards, automated smart email reminders, and workload capacity analytics out of the box with zero complex setup.",
    },
    {
      q: "How do the automated email reminders work?",
      a: "You can set custom date and exact trigger times on any task or reminder milestone. Our background worker monitors these schedules and delivers reminder alerts directly to user email inboxes.",
    },
    {
      q: "Is there a free tier for small teams?",
      a: "Yes! Cookmywork is free to get started. You get full access to Kanban boards, task tracking, list views, sprint planning, and automated email reminders for your team.",
    },
    {
      q: "Can I invite team members and create multiple workspaces?",
      a: "Yes. You can invite team members with specific roles (Admin, Member, Viewer) and seamlessly switch between multiple organization workspaces from the navigation sidebar.",
    },
    {
      q: "Can I access Cookmywork on mobile devices?",
      a: "Absolutely. Cookmywork is fully responsive and optimized for mobile screens, tablets, and desktop displays with responsive touch navigation and adaptive views.",
    },
  ];

  return (
    <div className="bg-white text-black min-h-screen font-mono flex flex-col selection:bg-black selection:text-white">
      {/* ========================================================================= */}
      {/* FIXED TOP NAVBAR                                                          */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black h-14 flex items-center">
        <nav
          aria-label="Main Navigation"
          className="w-full max-w-screen-xl mx-auto px-6 flex items-center justify-between"
        >
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            aria-label="Cookmywork Home"
          >
            <div className="h-10 w-10 relative bg-black border border-black overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt="Cookmywork Logo"
                width={40}
                height={40}
                priority
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight hidden sm:inline-block font-mono">
                COOKMYWORK
              </span>
              <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold uppercase tracking-wider">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-mono">
            <a href="#features" className="text-black hover:text-gray-600 transition-colors">
              Features
            </a>
            <a href="#showcase" className="text-black hover:text-gray-600 transition-colors">
              Showcase
            </a>
            <a href="#why-us" className="text-black hover:text-gray-600 transition-colors">
              Why Us
            </a>
            <a href="#process" className="text-black hover:text-gray-600 transition-colors">
              Process
            </a>
            <a href="#capabilities" className="text-black hover:text-gray-600 transition-colors">
              Capabilities
            </a>
            <a href="#faq" className="text-black hover:text-gray-600 transition-colors">
              FAQ
            </a>
            <a href="#contact" className="text-black hover:text-gray-600 transition-colors">
              Contact
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-black text-white text-xs uppercase tracking-widest px-5 py-2 border border-black hover:bg-white hover:text-black transition-colors duration-150 font-mono font-bold"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs uppercase tracking-widest px-4 py-2 hover:underline font-mono font-bold"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-black text-white text-xs uppercase tracking-widest px-5 py-2 border border-black hover:bg-white hover:text-black transition-colors duration-150 font-mono font-bold"
                >
                  Start Free →
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2 focus:outline-hidden focus:ring-2 focus:ring-black cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`block w-6 h-px bg-black transition-all duration-200 origin-center ${
                  mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block w-6 h-px bg-black transition-all duration-200 ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-6 h-px bg-black transition-all duration-200 origin-center ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-black p-6 space-y-4 shadow-xl font-mono">
          <div className="flex flex-col space-y-3 text-xs uppercase tracking-widest font-bold">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-100 hover:text-gray-600"
            >
              Features
            </a>
            <a
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-100 hover:text-gray-600"
            >
              Product Showcase
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-100 hover:text-gray-600"
            >
              Why Cookmywork
            </a>
            <a
              href="#process"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-100 hover:text-gray-600"
            >
              Agile Process
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-100 hover:text-gray-600"
            >
              Capabilities
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-100 hover:text-gray-600"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-gray-600"
            >
              Contact Team
            </a>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-black text-white py-3 text-xs uppercase tracking-widest font-bold border border-black hover:bg-white hover:text-black transition-colors"
              >
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-black py-3 text-xs uppercase tracking-widest font-bold hover:bg-gray-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-black text-white py-3 text-xs uppercase tracking-widest font-bold border border-black hover:bg-white hover:text-black transition-colors"
                >
                  Start Free Workspace →
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT                                                              */}
      {/* ========================================================================= */}
      <main id="main-content" className="flex-1 flex flex-col">
        {/* ======================================================================= */}
        {/* HERO SECTION                                                            */}
        {/* ======================================================================= */}
        <section className="pt-14 min-h-[calc(100vh-3.5rem)] border-b border-black flex flex-col bg-white text-black font-mono">
          <div className="flex-1 max-w-screen-xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-0 w-full">
            {/* Left Hero Column (8 cols) */}
            <div className="lg:col-span-8 lg:border-r border-black lg:pr-12 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest mb-8">
                  <span className="bg-black text-white px-2 py-0.5 mr-2 font-bold">
                    EST. 2026
                  </span>
                  Task &amp; Agile Project Management Platform
                </div>

                <h1 className="font-mono leading-none mb-8 font-black">
                  <span className="block text-[clamp(2rem,4.5vw,4.5rem)] tracking-tight mb-2">
                    COOK UP HIGH-IMPACT
                  </span>
                  <span className="block text-[clamp(1.8rem,4.1vw,4.1rem)] tracking-tighter bg-black inline-block px-3.5 py-1 mb-2 max-w-full">
                    <span style={{ color: "#FF453A" }}>P</span>
                    <span style={{ color: "#FF9F0A" }}>R</span>
                    <span style={{ color: "#FFD60A" }}>O</span>
                    <span style={{ color: "#30D158" }}>J</span>
                    <span style={{ color: "#00F5D4" }}>E</span>
                    <span style={{ color: "#64D2FF" }}>C</span>
                    <span style={{ color: "#0A84FF" }}>T</span>
                    <span style={{ color: "#5E5CE6" }}>S</span>
                  </span>
                  <span className="block text-[clamp(2rem,4.5vw,4.5rem)] tracking-tight">
                    DELIVERED FASTER.
                  </span>
                </h1>

                <p className="text-sm leading-relaxed max-w-xl text-gray-700 mb-8">
                  Cookmywork is the high-velocity task and project management workspace for
                  engineering and product teams. Plan agile sprints, track drag-and-drop Kanban
                  boards, automate smart email reminders, and balance workload capacity with zero
                  clutter.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 lg:mb-0">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="bg-black text-white text-xs uppercase tracking-widest px-8 py-4 border border-black hover:bg-white hover:text-black transition-colors duration-150 text-center font-bold"
                  >
                    Open Workspace Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="bg-black text-white text-xs uppercase tracking-widest px-8 py-4 border border-black hover:bg-white hover:text-black transition-colors duration-150 text-center font-bold"
                    >
                      Start Free Workspace →
                    </Link>
                    <Link
                      href="/login"
                      className="bg-white text-black text-xs uppercase tracking-widest px-8 py-4 border border-black hover:bg-black hover:text-white transition-colors duration-150 text-center font-bold"
                    >
                      Sign In with Email
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Hero Column (4 cols) */}
            <div className="lg:col-span-4 lg:pl-12 flex flex-col justify-end mt-12 lg:mt-0">
              {/* Currently Cooking Widget */}
              <div className="border border-black p-6 mb-6 bg-gray-50">
                <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold">
                  // Live Sprint Tracker
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Sprint 14: Core Engine</span>
                      <span className="font-bold text-black">94% VELOCITY</span>
                    </div>
                    <div
                      className="h-1.5 bg-gray-200"
                      role="progressbar"
                      aria-valuenow={94}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Sprint 14 progress"
                    >
                      <div className="h-full bg-black transition-all duration-500" style={{ width: "94%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Automated Email Reminders</span>
                      <span className="text-gray-600">12 ACTIVE</span>
                    </div>
                    <div
                      className="h-1.5 bg-gray-200"
                      role="progressbar"
                      aria-valuenow={78}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Email reminders active"
                    >
                      <div
                        className="h-full bg-black transition-all duration-500"
                        style={{ width: "78%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Q3 Milestone Deliverables</span>
                      <span className="font-bold text-black">SHIPPED</span>
                    </div>
                    <div
                      className="h-1.5 bg-gray-200"
                      role="progressbar"
                      aria-valuenow={100}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Milestone status"
                    >
                      <div className="h-full bg-black transition-all duration-500 w-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2x2 Stats Box */}
              <div className="grid grid-cols-2">
                <div className="p-5 border border-black bg-white">
                  <div className="text-2xl font-bold mb-1">10k+</div>
                  <div className="text-xs text-gray-600 leading-tight">Tasks Shipped</div>
                </div>
                <div className="p-5 border border-black bg-white ml-[-1px]">
                  <div className="text-2xl font-bold mb-1">&lt; 30s</div>
                  <div className="text-xs text-gray-600 leading-tight">Workspace Setup</div>
                </div>
                <div className="p-5 border border-black bg-white mt-[-1px]">
                  <div className="text-2xl font-bold mb-1">99.9%</div>
                  <div className="text-xs text-gray-600 leading-tight">Real-Time Sync</div>
                </div>
                <div className="p-5 border border-black bg-white ml-[-1px] mt-[-1px]">
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-xs text-gray-600 leading-tight">Free Forever Tier</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* TECH & CAPABILITIES MARQUEE TICKER                                      */}
        {/* ======================================================================= */}
        <aside
          aria-label="Key modules and technologies powering Cookmywork"
          className="overflow-hidden border-b border-black bg-white text-black py-3.5 font-mono"
        >
          <div className="marquee-track">
            <div className="flex items-center shrink-0">
              <ProductMarqueeItems />
            </div>
            <div className="flex items-center shrink-0">
              <ProductMarqueeItems />
            </div>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* CORE FEATURES SECTION (#features)                                       */}
        {/* ======================================================================= */}
        <section id="features" className="border-b border-black bg-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6 pb-16">
            <div className="py-16 border-b border-black flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                  Built For Engineering &amp; Product Teams
                </div>
                <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-none">
                  CORE FEATURES
                </h2>
              </div>
              <Link
                href="/register"
                className="inline-block bg-black text-white text-xs uppercase tracking-widest px-6 py-3 border border-black hover:bg-gray-800 transition-colors font-bold whitespace-nowrap"
              >
                Create Free Workspace →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Feature 01 */}
              <article className="p-8 border-b border-black flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-gray-400 font-mono">01</span>
                    <Link
                      href="/register"
                      className="text-xl group-hover:translate-x-1.5 transition-transform"
                      aria-label="Learn more about Kanban & Agile Sprints"
                    >
                      →
                    </Link>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    <Link href="/register" className="hover:underline">
                      Kanban &amp; Agile Sprints
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">
                    Interactive drag-and-drop Kanban boards with customizable status pipelines (To Do,
                    In Progress, In Review, Done), priority tags, subtask checklists, and zero lag.
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Built-in Capabilities:
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="border border-black px-2.5 py-1 bg-gray-50">DND-Kit Boards</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Sprint Backlogs</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Priority Urgency</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Subtask Lists</span>
                  </div>
                </div>
              </article>

              {/* Feature 02 */}
              <article className="p-8 border-b border-black flex flex-col justify-between group md:border-l md:ml-[-1px]">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-gray-400 font-mono">02</span>
                    <Link
                      href="/register"
                      className="text-xl group-hover:translate-x-1.5 transition-transform"
                      aria-label="Learn more about Automated Smart Email Reminders"
                    >
                      →
                    </Link>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    <Link href="/register" className="hover:underline">
                      Automated Email Reminders
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">
                    Schedule tasks with exact date-time triggers. Our background worker monitors
                    deadlines and automatically dispatches high-deliverability email alerts to your inbox.
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Built-in Capabilities:
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Exact-Time Alerts</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Resend Engine</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Overdue Monitor</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Direct-to-Inbox</span>
                  </div>
                </div>
              </article>

              {/* Feature 03 */}
              <article className="p-8 border-b border-black flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-gray-400 font-mono">03</span>
                    <Link
                      href="/register"
                      className="text-xl group-hover:translate-x-1.5 transition-transform"
                      aria-label="Learn more about Team Capacity & Workload Balance"
                    >
                      →
                    </Link>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    <Link href="/register" className="hover:underline">
                      Team Capacity &amp; Workload
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">
                    Real-time visibility into who is overloaded and who has availability. Re-allocate
                    deliverables with a click to prevent burnout and keep sprint velocity steady.
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Built-in Capabilities:
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Capacity Meters</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Burnout Warning</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">1-Click Balance</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Velocity Charts</span>
                  </div>
                </div>
              </article>

              {/* Feature 04 */}
              <article className="p-8 border-b border-black flex flex-col justify-between group md:border-l md:ml-[-1px]">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-gray-400 font-mono">04</span>
                    <Link
                      href="/register"
                      className="text-xl group-hover:translate-x-1.5 transition-transform"
                      aria-label="Learn more about Multi-Workspace & RBAC Roles"
                    >
                      →
                    </Link>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    <Link href="/register" className="hover:underline">
                      Multi-Workspace &amp; RBAC
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">
                    Organize different client companies or internal departments with granular
                    role-based access control (Admin, Member, Viewer) and instant workspace switching.
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Built-in Capabilities:
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Role Permissions</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Workspace Switcher</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">Audit Trails</span>
                    <span className="border border-black px-2.5 py-1 bg-gray-50">CSV Export/Import</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* WHY COOKMYWORK (#why-us) - SOLID BLACK CONTRAST                         */}
        {/* ======================================================================= */}
        <section id="why-us" className="border-b border-black bg-black text-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="lg:border-r border-gray-800 lg:pr-12">
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                  Why Cookmywork
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-8">
                  WE&#39;RE NOT BLOATED JIRA.
                  <br />
                  WE&#39;RE A HIGH-SPEED
                  <br />
                  <span className="text-gray-500">PRODUCTIVITY KITCHEN.</span>
                </h2>
                <p className="text-sm leading-loose text-gray-400 max-w-md">
                  Legacy issue trackers are bogged down by sluggish interfaces, confusing menus, and
                  endless configuration. Cookmywork gives agile squads an ultra-fast, intuitive
                  workspace designed for maximum ship velocity and clean execution.
                </p>
              </div>

              <div className="lg:pl-12 mt-12 lg:mt-0">
                <div className="flex gap-6 p-6 border-t border-gray-800 hover:border-gray-400 transition-colors duration-200 border-t-0">
                  <span className="text-gray-500 text-lg mt-0.5 shrink-0" aria-hidden="true">
                    ▲
                  </span>
                  <div>
                    <h3 className="font-bold mb-1 text-sm text-white">
                      Senior-Speed Execution
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Optimistic updates and keyboard-first simplicity. Tasks create and update in
                      milliseconds without slow reload spinners.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 p-6 border-t border-gray-800 hover:border-gray-400 transition-colors duration-200">
                  <span className="text-gray-500 text-lg mt-0.5 shrink-0" aria-hidden="true">
                    ■
                  </span>
                  <div>
                    <h3 className="font-bold mb-1 text-sm text-white">
                      Zero Configuration Clutter
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      No 50-field forms or complicated permission schemes. Start a project, invite
                      your team, and begin shipping immediately.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 p-6 border-t border-gray-800 hover:border-gray-400 transition-colors duration-200">
                  <span className="text-gray-500 text-lg mt-0.5 shrink-0" aria-hidden="true">
                    ●
                  </span>
                  <div>
                    <h3 className="font-bold mb-1 text-sm text-white">
                      Direct-to-Inbox Smart Reminders
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Set custom date-time notification triggers so milestone deadlines and sprint
                      reviews reach your inbox automatically.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 p-6 border-t border-gray-800 hover:border-gray-400 transition-colors duration-200">
                  <span className="text-gray-500 text-lg mt-0.5 shrink-0" aria-hidden="true">
                    ◆
                  </span>
                  <div>
                    <h3 className="font-bold mb-1 text-sm text-white">
                      Balanced Team Velocity
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Live capacity meters keep work distributed evenly across designers, frontend
                      engineers, and backend squads.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* AGILE METHODOLOGY & PROCESS (#process)                                  */}
        {/* ======================================================================= */}
        <section id="process" className="border-b border-black bg-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6 pb-16">
            <div className="py-16 border-b border-black">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Methodology &amp; Workflow
              </div>
              <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-none">
                THE SPRINT PROCESS
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-8 border-b border-black lg:border-r">
                <div className="font-mono text-5xl font-bold text-gray-200 mb-4 leading-none select-none">
                  01
                </div>
                <h3 className="font-bold text-lg mb-3 text-black">PLAN</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Break down epics into actionable tasks, assign story points, tag priorities, and
                  organize sprint backlogs.
                </p>
              </div>

              <div className="p-8 border-b border-black lg:border-r lg:ml-[-1px]">
                <div className="font-mono text-5xl font-bold text-gray-200 mb-4 leading-none select-none">
                  02
                </div>
                <h3 className="font-bold text-lg mb-3 text-black">ALLOCATE</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Review workload capacity across team members to prevent bottlenecks and ensure
                  optimal task distribution.
                </p>
              </div>

              <div className="p-8 border-b border-black lg:border-r lg:ml-[-1px]">
                <div className="font-mono text-5xl font-bold text-gray-200 mb-4 leading-none select-none">
                  03
                </div>
                <h3 className="font-bold text-lg mb-3 text-black">EXECUTE</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Move cards across Kanban columns, track subtask progress in real-time, and log
                  time spent on critical items.
                </p>
              </div>

              <div className="p-8 border-b border-black lg:ml-[-1px]">
                <div className="font-mono text-5xl font-bold text-gray-200 mb-4 leading-none select-none">
                  04
                </div>
                <h3 className="font-bold text-lg mb-3 text-black">AUTOMATE</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Automated email alerts ping assignees prior to deadlines, ensuring zero missed
                  milestones and transparent ship dates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* INTERACTIVE PRODUCT SHOWCASE (#showcase)                                */}
        {/* ======================================================================= */}
        <section id="showcase" className="border-b border-black bg-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-black gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                  Interactive Workspace Modules
                </div>
                <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-bold leading-none">
                  PRODUCT SHOWCASE
                </h2>
              </div>

              {/* Slider controls */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold font-mono tracking-widest mr-4">
                  0{currentSlide + 1} / 0{productShowcases.length}
                </span>
                <button
                  aria-label="Previous Slide"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? productShowcases.length - 1 : prev - 1
                    )
                  }
                  className="w-12 h-12 border border-black flex items-center justify-center text-lg hover:bg-black hover:text-white transition-colors duration-150 font-bold cursor-pointer"
                >
                  ←
                </button>
                <button
                  aria-label="Next Slide"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === productShowcases.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="w-12 h-12 border border-black flex items-center justify-center text-lg hover:bg-black hover:text-white transition-colors duration-150 font-bold cursor-pointer"
                >
                  →
                </button>
              </div>
            </div>

            {/* Showcase Card Display */}
            <div className="border border-black p-8 md:p-12 bg-gray-50 relative overflow-hidden transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="inline-block bg-black text-white text-xs px-3 py-1 uppercase tracking-widest font-bold mb-6">
                      {productShowcases[currentSlide].tag}
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-6 leading-tight">
                      {productShowcases[currentSlide].title}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed mb-8 max-w-xl">
                      {productShowcases[currentSlide].description}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-bold">
                      Core Mechanics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {productShowcases[currentSlide].features.map((item, i) => (
                        <span
                          key={i}
                          className="text-xs border border-black bg-white px-3 py-1 font-mono uppercase"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-black pt-8 lg:pt-0 lg:pl-8">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-500 mb-6 font-bold">
                      Live Sprint Metrics
                    </div>
                    <div className="space-y-4 mb-8">
                      {productShowcases[currentSlide].metrics.map((metric, i) => (
                        <div
                          key={i}
                          className="p-4 border border-black bg-white flex justify-between items-center"
                        >
                          <span className="text-xs text-gray-600 uppercase font-mono">
                            {metric.label}
                          </span>
                          <span className="text-xl font-bold text-black font-mono">
                            {metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 h-1.5 relative overflow-hidden">
                    <div
                      className="bg-black h-full transition-all duration-300 ease-out"
                      style={{
                        width: `${((currentSlide + 1) / productShowcases.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Slide dot indicator buttons */}
            <div className="flex justify-center gap-2 mt-6">
              {productShowcases.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 transition-all duration-200 cursor-pointer ${
                    currentSlide === idx ? "w-8 bg-black" : "w-2 bg-gray-300 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* CAPABILITIES & TOOLS GRID (#capabilities)                               */}
        {/* ======================================================================= */}
        <section id="capabilities" className="border-b border-black bg-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6 pb-16">
            <div className="py-16 border-b border-black grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                  Full Feature Suite
                </div>
                <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-none">
                  CAPABILITIES
                </h2>
              </div>
              <p className="text-sm text-gray-600 leading-loose max-w-md">
                Every tool your team needs to plan, execute, and deliver projects without paying
                for expensive enterprise software licenses.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
              {capabilitiesData.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-5 border-b border-black group hover:bg-black hover:text-white transition-colors duration-150 cursor-default ${
                    idx % 2 !== 0 ? "border-l ml-[-1px]" : ""
                  } ${idx % 4 !== 0 ? "sm:border-l sm:ml-[-1px]" : ""}`}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center justify-center h-8 w-8 text-black group-hover:text-white transition-all duration-150">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-widest leading-tight font-bold">
                        {item.name}
                      </h3>
                      <span className="sr-only">{item.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* SOLID BLACK CALL-TO-ACTION BANNER                                       */}
        {/* ======================================================================= */}
        <section
          className="border-b border-black bg-black text-white py-20 font-mono text-center"
          aria-label="Call to Action"
        >
          <div className="max-w-screen-xl mx-auto px-6">
            <h2 className="text-[clamp(2rem,8vw,6rem)] font-bold leading-none mb-8">
              <span className="block">READY TO COOK UP</span>
              <span className="block text-gray-500">YOUR BEST WORK?</span>
            </h2>
            <p className="text-sm text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
              Create your workspace in under 30 seconds. Plan sprints, track Kanban boards, and
              receive automated smart reminders without complex setup.
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-block bg-white text-black text-xs uppercase tracking-widest px-12 py-4 border border-white hover:bg-transparent hover:text-white transition-colors duration-150 font-bold"
              >
                Go to Workspace Dashboard →
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-block bg-white text-black text-xs uppercase tracking-widest px-12 py-4 border border-white hover:bg-transparent hover:text-white transition-colors duration-150 font-bold"
              >
                Start Free Workspace →
              </Link>
            )}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* FAQ ACCORDION SECTION (#faq)                                            */}
        {/* ======================================================================= */}
        <section id="faq" className="border-b border-black bg-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6 pb-16">
            <div className="py-16 border-b border-black">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Frequently Asked Questions
              </div>
              <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-none">
                QUESTIONS &amp; ANSWERS
              </h2>
            </div>

            <div className="divide-y divide-black border-b border-black">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={index} className="group">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full py-6 flex justify-between items-center text-left hover:bg-gray-50 px-4 transition-colors font-mono cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="font-bold text-lg pr-4 text-black">{faq.q}</span>
                      <span className="text-xl font-bold shrink-0">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-6 text-sm text-gray-600 leading-relaxed max-w-3xl animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* CONTACT & SUPPORT SECTION (#contact)                                    */}
        {/* ======================================================================= */}
        <section id="contact" className="border-b border-black bg-white font-mono">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="py-16 border-b border-black">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Get In Touch
              </div>
              <h2 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-none">
                CONTACT OUR TEAM
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Column: Form */}
              <div className="py-12 lg:pr-12 lg:border-r border-black">
                <form
                  onSubmit={handleFormSubmit}
                  aria-label="Contact Cookmywork Team"
                >
                  <div className="border border-black border-b-0">
                    <label
                      htmlFor="name"
                      className="block text-xs uppercase tracking-widest text-gray-500 px-4 pt-3 font-bold"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-transparent px-4 pb-3 pt-1 text-sm placeholder-gray-400 focus:bg-gray-50 focus:outline-hidden transition-colors"
                      required
                    />
                  </div>

                  <div className="border border-black border-b-0">
                    <label
                      htmlFor="email"
                      className="block text-xs uppercase tracking-widest text-gray-500 px-4 pt-3 font-bold"
                    >
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-transparent px-4 pb-3 pt-1 text-sm placeholder-gray-400 focus:bg-gray-50 focus:outline-hidden transition-colors"
                      required
                    />
                  </div>

                  <div className="border border-black border-b-0">
                    <label
                      htmlFor="teamSize"
                      className="block text-xs uppercase tracking-widest text-gray-500 px-4 pt-3 font-bold"
                    >
                      Team Size
                    </label>
                    <input
                      id="teamSize"
                      type="text"
                      placeholder="1-5, 6-20, 20-50, 50+ members"
                      value={formData.teamSize}
                      onChange={(e) =>
                        setFormData({ ...formData, teamSize: e.target.value })
                      }
                      className="w-full bg-transparent px-4 pb-3 pt-1 text-sm placeholder-gray-400 focus:bg-gray-50 focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div className="border border-black">
                    <label
                      htmlFor="message"
                      className="block text-xs uppercase tracking-widest text-gray-500 px-4 pt-3 font-bold"
                    >
                      Message / Questions <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your team and workflow requirements..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full bg-transparent px-4 pb-3 pt-1 text-sm placeholder-gray-400 resize-none focus:bg-gray-50 focus:outline-hidden transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white text-xs uppercase tracking-widest py-4 border border-black hover:bg-white hover:text-black transition-colors duration-150 mt-[-1px] font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Sending..." : "Send Inquiry →"}
                  </button>
                </form>
              </div>

              {/* Right Column: Direct Info & Workspace Links */}
              <div className="py-12 lg:pl-12 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-gray-600 leading-loose mb-10 max-w-sm">
                    Have questions about setting up your workspace, migrating tasks, or configuring
                    custom reminder webhooks? We respond within one business day.
                  </p>

                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-4 border-b border-black text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">
                        Support Email
                      </span>
                      <a
                        href="mailto:hello@cookmytech.in"
                        className="font-mono font-medium hover:underline"
                      >
                        hello@cookmytech.in
                      </a>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-black text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">
                        Workspace Setup
                      </span>
                      <span className="font-mono font-medium">Instant &bull; 30 Seconds</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-black text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">
                        Response SLA
                      </span>
                      <span className="font-mono font-medium">&lt; 24 hours</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-black text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">
                        Email Deliverability
                      </span>
                      <span className="font-mono font-medium">Powered by Resend</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-black text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-widest font-mono">
                        Availability
                      </span>
                      <span className="font-mono font-medium">Accepting Teams Worldwide</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap gap-0">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-3 border border-black hover:bg-black hover:text-white transition-colors duration-150"
                  >
                    Start Free
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-3 border border-black hover:bg-black hover:text-white transition-colors duration-150 ml-[-1px]"
                  >
                    Sign In
                  </Link>
                  <a
                    href="mailto:hello@cookmytech.in"
                    className="flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-3 border border-black hover:bg-black hover:text-white transition-colors duration-150 ml-[-1px]"
                  >
                    Direct Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* TECHNICAL FOOTER                                                          */}
      {/* ========================================================================= */}
      <footer className="bg-black text-white border-t border-black font-mono">
        <div className="max-w-screen-xl mx-auto px-6 pt-16 pb-12 border-b border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
            {/* Brand Bio */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 relative bg-black border border-white/20 p-1 shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Cookmywork Logo"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                </div>
                <span className="text-2xl tracking-tight font-extrabold text-white">
                  COOKMYWORK
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
                The high-velocity task and project management workspace for agile teams. Plan
                sprints, track drag-and-drop Kanban boards, automate smart email reminders, and
                measure velocity with zero clutter.
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <div>
                  <span className="text-white font-bold">Support:</span>{" "}
                  <a href="mailto:hello@cookmytech.in" className="hover:text-white underline">
                    hello@cookmytech.in
                  </a>
                </div>
                <div>
                  <span className="text-white font-bold">Status:</span>{" "}
                  <span className="text-emerald-400">All Systems Operational</span>
                </div>
              </div>
            </div>

            {/* Product Capabilities */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                // Product Capabilities
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Kanban Boards
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Sprint Planning
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Email Reminders
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Workload Balancing
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Subtask Tracking
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Multi-Workspace RBAC
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    Sprint Velocity
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors block py-0.5">
                    CSV Import / Export
                  </a>
                </li>
              </ul>
            </div>

            {/* Workspace Links */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                // Navigation
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>
                  <a href="#features" className="hover:text-white hover:underline transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-white hover:underline transition-colors">
                    Showcase
                  </a>
                </li>
                <li>
                  <a href="#why-us" className="hover:text-white hover:underline transition-colors">
                    Why Cookmywork
                  </a>
                </li>
                <li>
                  <a href="#process" className="hover:text-white hover:underline transition-colors">
                    The Process
                  </a>
                </li>
                <li>
                  <a href="#capabilities" className="hover:text-white hover:underline transition-colors">
                    Capabilities
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white hover:underline transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Account & Connect */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                // Account
              </h3>
              <div className="flex flex-col gap-2 text-xs text-gray-300">
                <Link
                  href="/register"
                  className="border border-gray-800 hover:border-gray-500 hover:text-white px-3 py-2 transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="border border-gray-800 hover:border-gray-500 hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                {user && (
                  <Link
                    href="/dashboard"
                    className="border border-gray-800 hover:border-gray-500 hover:text-white px-3 py-2 transition-colors"
                  >
                    Open Dashboard
                  </Link>
                )}
                <a
                  href="#contact"
                  className="border border-gray-800 hover:border-gray-500 hover:text-white px-3 py-2 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 Cookmywork. All rights reserved.</span>
            <span className="text-gray-800 font-bold">|</span>
            <Link href="/register" className="hover:text-white underline underline-offset-2">
              Get Started
            </Link>
            <span className="text-gray-800 font-bold">•</span>
            <Link href="/login" className="hover:text-white underline underline-offset-2">
              Sign In
            </Link>
            <span className="text-gray-800 font-bold">•</span>
            <a href="#contact" className="hover:text-white underline underline-offset-2">
              Support
            </a>
          </div>

          <div className="uppercase tracking-widest text-[11px] text-gray-400">
            Engineered for high-impact agile squads
            <span className="cursor-blink ml-0.5" aria-hidden="true">
              _
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="hover:text-white transition-colors border border-gray-800 hover:border-white px-3 py-1.5 uppercase tracking-widest text-[11px] cursor-pointer"
            aria-label="Scroll back to top"
          >
            Back to Top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}

// Sub-component: Marquee Product Ticker
function ProductMarqueeItems() {
  const items = [
    "Kanban Boards",
    "Agile Sprints",
    "Email Reminders",
    "Workload Balancing",
    "Subtask Tracking",
    "RBAC Multi-Workspace",
    "Resend Notifications",
    "Burn-Down Velocity",
    "CSV Import/Export",
    "Drag & Drop DND",
    "Real-Time Sync",
    "Zero Clutter",
  ];

  return (
    <>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-3 mx-5">
          <span className="h-2 w-2 rounded-full bg-black shrink-0" />
          <span className="text-xs uppercase tracking-widest font-mono font-bold">
            {item}
          </span>
          <span className="text-gray-400 ml-2" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </>
  );
}

// 16 Core Product Capabilities with Icons
const capabilitiesData = [
  {
    name: "Kanban",
    desc: "Drag and drop status board",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 7v10M16 7v6" />
      </svg>
    ),
  },
  {
    name: "Sprints",
    desc: "Agile sprint cycles",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    name: "Reminders",
    desc: "Automated email alerts",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
  {
    name: "Workload",
    desc: "Team capacity balancer",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "Subtasks",
    desc: "Nested checklist items",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    name: "Velocity",
    desc: "Burn-down rate charts",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    name: "Workspaces",
    desc: "Multi-tenant organizations",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    name: "RBAC",
    desc: "Role-based permissions",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    name: "Calendar",
    desc: "Milestone date views",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    name: "Time Logs",
    desc: "Effort & duration tracker",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    name: "Priorities",
    desc: "Urgent, High, Med, Low",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    name: "Tags",
    desc: "Custom project labeling",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    name: "CSV Export",
    desc: "Full data portability",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    name: "Audit Logs",
    desc: "Comprehensive activity history",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    name: "Search",
    desc: "Instant fuzzy task lookup",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    name: "REST API",
    desc: "Custom hooks & integrations",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];
