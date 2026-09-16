"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Copy,
  CheckSquare,
  List,
  Palette,
  RotateCcw,
  LayoutGrid,
  Layers,
  Sparkles,
  Download,
  Filter,
  Check,
  X,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Tag as TagIcon,
  Grid,
} from "lucide-react";

export interface StickyNoteItem {
  _id: string;
  title: string;
  content: string;
  color: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  zIndex: number;
  isPinned: boolean;
  isArchived: boolean;
  tags?: string[];
  checklist?: { id: string; text: string; completed: boolean }[];
  updatedAt?: string;
}

export const NOTE_COLORS = [
  {
    id: "yellow",
    name: "Classic Yellow",
    swatch: "#FEF08A",
    bgClass: "bg-amber-100/95 dark:bg-amber-950/80 border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-[0_10px_25px_rgba(245,158,11,0.15)]",
    headerClass: "bg-amber-200/80 dark:bg-amber-900/60 border-amber-300/60 dark:border-amber-700/50",
    accentClass: "text-amber-700 dark:text-amber-300",
  },
  {
    id: "peach",
    name: "Sunset Peach",
    swatch: "#FED7AA",
    bgClass: "bg-orange-100/95 dark:bg-orange-950/80 border-orange-300/80 dark:border-orange-700/60 text-orange-950 dark:text-orange-100 shadow-[0_10px_25px_rgba(249,115,22,0.15)]",
    headerClass: "bg-orange-200/80 dark:bg-orange-900/60 border-orange-300/60 dark:border-orange-700/50",
    accentClass: "text-orange-700 dark:text-orange-300",
  },
  {
    id: "pink",
    name: "Rose Pink",
    swatch: "#FBCFE8",
    bgClass: "bg-pink-100/95 dark:bg-pink-950/80 border-pink-300/80 dark:border-pink-700/60 text-pink-950 dark:text-pink-100 shadow-[0_10px_25px_rgba(236,72,153,0.15)]",
    headerClass: "bg-pink-200/80 dark:bg-pink-900/60 border-pink-300/60 dark:border-pink-700/50",
    accentClass: "text-pink-700 dark:text-pink-300",
  },
  {
    id: "purple",
    name: "Lavender",
    swatch: "#E9D5FF",
    bgClass: "bg-purple-100/95 dark:bg-purple-950/80 border-purple-300/80 dark:border-purple-700/60 text-purple-950 dark:text-purple-100 shadow-[0_10px_25px_rgba(168,85,247,0.15)]",
    headerClass: "bg-purple-200/80 dark:bg-purple-900/60 border-purple-300/60 dark:border-purple-700/50",
    accentClass: "text-purple-700 dark:text-purple-300",
  },
  {
    id: "blue",
    name: "Sky Blue",
    swatch: "#BAE6FD",
    bgClass: "bg-sky-100/95 dark:bg-sky-950/80 border-sky-300/80 dark:border-sky-700/60 text-sky-950 dark:text-sky-100 shadow-[0_10px_25px_rgba(14,165,233,0.15)]",
    headerClass: "bg-sky-200/80 dark:bg-sky-900/60 border-sky-300/60 dark:border-sky-700/50",
    accentClass: "text-sky-700 dark:text-sky-300",
  },
  {
    id: "green",
    name: "Mint Green",
    swatch: "#A7F3D0",
    bgClass: "bg-emerald-100/95 dark:bg-emerald-950/80 border-emerald-300/80 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.15)]",
    headerClass: "bg-emerald-200/80 dark:bg-emerald-900/60 border-emerald-300/60 dark:border-emerald-700/50",
    accentClass: "text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "teal",
    name: "Cyan Aqua",
    swatch: "#99F6E4",
    bgClass: "bg-teal-100/95 dark:bg-teal-950/80 border-teal-300/80 dark:border-teal-700/60 text-teal-950 dark:text-teal-100 shadow-[0_10px_25px_rgba(20,184,166,0.15)]",
    headerClass: "bg-teal-200/80 dark:bg-teal-900/60 border-teal-300/60 dark:border-teal-700/50",
    accentClass: "text-teal-700 dark:text-teal-300",
  },
  {
    id: "charcoal",
    name: "Velvet Dark",
    swatch: "#334155",
    bgClass: "bg-slate-900/95 border-slate-700 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
    headerClass: "bg-slate-800/90 border-slate-700/70",
    accentClass: "text-slate-400",
  },
];

export default function NotesViewPage() {
  const { organization, authFetch } = useAuth();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColorFilter, setSelectedColorFilter] = useState("ALL");
  const [canvasPattern, setCanvasPattern] = useState<"dots" | "grid" | "plain">("dots");

  // Dragging State
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Fetch Notes
  const { data: fetchedNotes, isLoading } = useQuery<StickyNoteItem[]>({
    queryKey: ["sticky-notes", organization?.id, selectedColorFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedColorFilter !== "ALL") params.set("color", selectedColorFilter);
      const res = await authFetch(`/api/v1/notes?${params.toString()}`);
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
  });

  // Local optimistic notes state for smooth drag
  const [localNotes, setLocalNotes] = useState<StickyNoteItem[]>([]);

  // Sync with fetched notes when query finishes or updates
  useEffect(() => {
    if (fetchedNotes && !draggingNoteId) {
      setLocalNotes(fetchedNotes);
    }
  }, [fetchedNotes, draggingNoteId]);

  // 2. Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: async (initial: { color?: string; posX?: number; posY?: number }) => {
      const res = await authFetch("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          content: "",
          color: initial.color || "yellow",
          posX: initial.posX ?? (60 + Math.floor(Math.random() * 100)),
          posY: initial.posY ?? (60 + Math.floor(Math.random() * 100)),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to create note");
      return json.data;
    },
    onSuccess: (newNote) => {
      setLocalNotes((prev) => [...prev, newNote]);
      queryClient.invalidateQueries({ queryKey: ["sticky-notes"] });
      toast.success("New sticky note added!");
    },
  });

  // 3. Update Note Mutation (Debounced for content/position)
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StickyNoteItem> }) => {
      const res = await authFetch(`/api/v1/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update note");
      return json.data;
    },
    onSuccess: (updated) => {
      setLocalNotes((prev) =>
        prev.map((n) => (n._id === updated._id ? { ...n, ...updated } : n))
      );
      queryClient.setQueryData(
        ["sticky-notes", organization?.id, selectedColorFilter],
        (old: StickyNoteItem[] | undefined) =>
          old ? old.map((n) => (n._id === updated._id ? updated : n)) : [updated]
      );
    },
  });

  // 4. Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/notes/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to delete note");
      return id;
    },
    onSuccess: (deletedId) => {
      setLocalNotes((prev) => prev.filter((n) => n._id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ["sticky-notes"] });
      toast.success("Sticky note deleted");
    },
  });

  // 5. Batch Update Positions (Auto arrange)
  const batchPositionsMutation = useMutation({
    mutationFn: async (positions: { id: string; posX: number; posY: number; zIndex?: number }[]) => {
      const res = await authFetch("/api/v1/notes/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to arrange notes");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sticky-notes"] });
      toast.success("Notes arranged successfully!");
    },
  });

  // Handle Drag Start
  const handleDragStart = (e: React.MouseEvent, note: StickyNoteItem) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - (canvasRect.left + note.posX);
    const offsetY = e.clientY - (canvasRect.top + note.posY);

    setDraggingNoteId(note._id);
    setDragOffset({ x: offsetX, y: offsetY });

    // Bring note to highest zIndex
    const maxZ = Math.max(...localNotes.map((n) => n.zIndex || 1), 1) + 1;
    setLocalNotes((prev) =>
      prev.map((n) => (n._id === note._id ? { ...n, zIndex: maxZ } : n))
    );
  };

  // Handle Live Drag Move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingNoteId || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft;
      const scrollTop = canvasRef.current.scrollTop;

      let newX = e.clientX - canvasRect.left + scrollLeft - dragOffset.x;
      let newY = e.clientY - canvasRect.top + scrollTop - dragOffset.y;

      // Keep inside reasonable bounds
      newX = Math.max(10, newX);
      newY = Math.max(10, newY);

      setLocalNotes((prev) =>
        prev.map((n) => (n._id === draggingNoteId ? { ...n, posX: newX, posY: newY } : n))
      );
    },
    [draggingNoteId, dragOffset]
  );

  // Handle Drag End
  const handleMouseUp = useCallback(() => {
    if (draggingNoteId) {
      const movedNote = localNotes.find((n) => n._id === draggingNoteId);
      if (movedNote) {
        updateNoteMutation.mutate({
          id: movedNote._id,
          updates: {
            posX: Math.round(movedNote.posX),
            posY: Math.round(movedNote.posY),
            zIndex: movedNote.zIndex,
          },
        });
      }
      setDraggingNoteId(null);
    }
  }, [draggingNoteId, localNotes, updateNoteMutation]);

  useEffect(() => {
    if (draggingNoteId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNoteId, handleMouseMove, handleMouseUp]);

  // Quick Auto Arrange (Grid Layout)
  const handleAutoArrangeGrid = () => {
    if (localNotes.length === 0) return;

    const gapX = 300;
    const gapY = 300;
    const startX = 40;
    const startY = 40;
    const cols = Math.max(1, Math.min(4, Math.floor((canvasRef.current?.clientWidth || 1000) / gapX)));

    const updated = localNotes.map((note, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...note,
        posX: startX + col * gapX,
        posY: startY + row * gapY,
        zIndex: index + 1,
      };
    });

    setLocalNotes(updated);
    batchPositionsMutation.mutate(
      updated.map((n) => ({ id: n._id, posX: n.posX, posY: n.posY, zIndex: n.zIndex }))
    );
  };

  // Cascade Stack
  const handleCascadeStack = () => {
    if (localNotes.length === 0) return;

    const offset = 35;
    const startX = 60;
    const startY = 60;

    const updated = localNotes.map((note, index) => ({
      ...note,
      posX: startX + (index % 12) * offset,
      posY: startY + (index % 12) * offset,
      zIndex: index + 1,
    }));

    setLocalNotes(updated);
    batchPositionsMutation.mutate(
      updated.map((n) => ({ id: n._id, posX: n.posX, posY: n.posY, zIndex: n.zIndex }))
    );
  };

  // Export Notes to Markdown
  const handleExportMarkdown = () => {
    if (localNotes.length === 0) {
      toast.error("No notes to export");
      return;
    }

    let md = `# Workspace Sticky Notes (${new Date().toLocaleDateString()})\n\n`;
    localNotes.forEach((n, i) => {
      md += `## ${n.title || `Note #${i + 1}`} [${n.color}]\n`;
      if (n.tags && n.tags.length > 0) {
        md += `Tags: ${n.tags.map((t) => `#${t}`).join(" ")}\n\n`;
      }
      if (n.content) {
        md += `${n.content}\n\n`;
      }
      if (n.checklist && n.checklist.length > 0) {
        n.checklist.forEach((item) => {
          md += `- [${item.completed ? "x" : " "}] ${item.text}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sticky-notes-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Notes exported as Markdown file!");
  };

  // Filter notes by search
  const filteredNotes = localNotes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const inTitle = (note.title || "").toLowerCase().includes(query);
    const inContent = (note.content || "").toLowerCase().includes(query);
    const inTags = (note.tags || []).some((t) => t.toLowerCase().includes(query));
    const inChecklist = (note.checklist || []).some((c) => c.text.toLowerCase().includes(query));
    return inTitle || inContent || inTags || inChecklist;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Top Header & Toolbar */}
      <div className="p-3 sm:px-6 sm:py-3.5 border-b bg-card/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
            <StickyNote className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Sticky Notes Board</h1>
              <Badge variant="outline" className="text-xs font-mono">
                {localNotes.length} {localNotes.length === 1 ? "note" : "notes"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Freeform drag-and-drop workspace canvas. Create, organize, color-code, and pin your ideas anywhere.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-36 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Color Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="capitalize">
                  {selectedColorFilter === "ALL" ? "All Colors" : selectedColorFilter}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuLabel className="text-xs">Filter by Color</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSelectedColorFilter("ALL")}
                className="cursor-pointer flex items-center justify-between"
              >
                <span>All Colors</span>
                {selectedColorFilter === "ALL" && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
              {NOTE_COLORS.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => setSelectedColorFilter(c.id)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.swatch }}
                    />
                    <span>{c.name}</span>
                  </div>
                  {selectedColorFilter === c.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Layout Presets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Arrange</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuLabel className="text-xs">Canvas Layouts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAutoArrangeGrid} className="cursor-pointer gap-2">
                <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                <span>Auto-Arrange Grid</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCascadeStack} className="cursor-pointer gap-2">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                <span>Cascade Stack</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
                Canvas Texture
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setCanvasPattern("dots")}
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Dot Matrix</span>
                {canvasPattern === "dots" && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCanvasPattern("grid")}
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Grid Lines</span>
                {canvasPattern === "grid" && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCanvasPattern("plain")}
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Plain Canvas</span>
                {canvasPattern === "plain" && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMarkdown}
            className="h-8 text-xs gap-1 px-2.5 text-muted-foreground hover:text-foreground"
            title="Export notes to Markdown"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* New Sticky Note Main Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Sticky Note</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs p-2">
              <DropdownMenuLabel className="text-xs px-2 py-1">Choose Initial Color</DropdownMenuLabel>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => createNoteMutation.mutate({ color: c.id })}
                    className="h-7 w-7 rounded-lg border border-black/10 hover:scale-110 transition-transform shadow-sm flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: c.swatch }}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Floating Quick Color Spawner (Bottom Center / Top bar) */}
      <div className="px-4 py-2 bg-muted/20 border-b flex items-center justify-between text-xs text-muted-foreground shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="font-medium flex items-center gap-1 text-[11px]">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Quick Spawn:
          </span>
          <div className="flex items-center gap-1.5">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => createNoteMutation.mutate({ color: c.id })}
                className="h-5 px-2 rounded-full text-[10px] font-semibold border border-black/10 hover:shadow-md hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: c.swatch, color: c.id === "charcoal" ? "#fff" : "#1e293b" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {c.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground hidden md:flex items-center gap-2">
          <span>💡 Tip: Drag top bar of any note to move anywhere on screen</span>
        </div>
      </div>

      {/* Freeform Infinite / Scrollable Canvas Area */}
      <div
        ref={canvasRef}
        className={`flex-1 relative w-full h-full overflow-auto p-6 transition-colors select-none ${
          canvasPattern === "dots"
            ? "bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]"
            : canvasPattern === "grid"
            ? "bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
            : "bg-background"
        }`}
        style={{ minHeight: "2000px", minWidth: "2400px" }}
      >
        {isLoading && localNotes.length === 0 ? (
          <div className="absolute top-20 left-20 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading sticky notes canvas...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="absolute top-24 left-24 p-8 rounded-2xl border-2 border-dashed border-muted-foreground/30 max-w-md text-center space-y-3 bg-card/60 backdrop-blur-sm">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <StickyNote className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold">No sticky notes found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No notes match "${searchQuery}". Try clearing search filter.`
                : "Your board is empty! Click below or select any color swatch to stick your first idea."}
            </p>
            <Button
              size="sm"
              onClick={() => createNoteMutation.mutate({ color: "yellow" })}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Yellow Note
            </Button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <StickyNoteCard
              key={note._id}
              note={note}
              isDragging={draggingNoteId === note._id}
              onDragStart={(e) => handleDragStart(e, note)}
              onUpdate={(updates) => updateNoteMutation.mutate({ id: note._id, updates })}
              onDelete={() => deleteNoteMutation.mutate(note._id)}
              onDuplicate={() =>
                createNoteMutation.mutate({
                  color: note.color,
                  posX: (note.posX || 40) + 30,
                  posY: (note.posY || 40) + 30,
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Sticky Note Card Component with Drag, Edit, and Color Controls
// ---------------------------------------------------------
interface StickyNoteCardProps {
  note: StickyNoteItem;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<StickyNoteItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function StickyNoteCard({
  note,
  isDragging,
  onDragStart,
  onUpdate,
  onDelete,
  onDuplicate,
}: StickyNoteCardProps) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [mode, setMode] = useState<"text" | "checklist">(
    note.checklist && note.checklist.length > 0 ? "checklist" : "text"
  );
  const [newChecklistText, setNewChecklistText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    setTitle(note.title || "");
  }, [note.title]);

  useEffect(() => {
    setContent(note.content || "");
  }, [note.content]);

  const colorConfig =
    NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];

  const handleTitleBlur = () => {
    if (title !== note.title) {
      onUpdate({ title: title.trim() });
    }
  };

  const handleContentBlur = () => {
    if (content !== note.content) {
      onUpdate({ content });
    }
  };

  const handleToggleChecklist = (id: string) => {
    const nextChecklist = (note.checklist || []).map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdate({ checklist: nextChecklist });
  };

  const handleAddChecklistItem = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newChecklistText.trim()) {
      e.preventDefault();
      const newItem = {
        id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: newChecklistText.trim(),
        completed: false,
      };
      const nextChecklist = [...(note.checklist || []), newItem];
      onUpdate({ checklist: nextChecklist });
      setNewChecklistText("");
    }
  };

  const handleDeleteChecklistItem = (id: string) => {
    const nextChecklist = (note.checklist || []).filter((item) => item.id !== id);
    onUpdate({ checklist: nextChecklist });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      const currentTags = note.tags || [];
      if (!currentTags.includes(clean)) {
        onUpdate({ tags: [...currentTags, clean] });
      }
      setTagInput("");
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const nextTags = (note.tags || []).filter((t) => t !== tag);
    onUpdate({ tags: nextTags });
  };

  const handleCopyNote = () => {
    let copyText = note.title ? `# ${note.title}\n\n` : "";
    if (note.content) copyText += `${note.content}\n`;
    if (note.checklist && note.checklist.length > 0) {
      note.checklist.forEach((item) => {
        copyText += `- [${item.completed ? "x" : " "}] ${item.text}\n`;
      });
    }
    navigator.clipboard.writeText(copyText);
    toast.success("Note copied to clipboard!");
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${note.posX}px`,
        top: `${note.posY}px`,
        width: `${note.width || 280}px`,
        minHeight: `${note.height || 260}px`,
        zIndex: isDragging ? 9999 : note.isPinned ? 500 : note.zIndex || 1,
      }}
      className={`rounded-2xl border transition-shadow duration-200 flex flex-col group ${
        colorConfig.bgClass
      } ${
        isDragging
          ? "shadow-2xl scale-[1.02] rotate-1 cursor-grabbing ring-2 ring-primary/40"
          : "hover:shadow-xl hover:-translate-y-0.5"
      }`}
    >
      {/* Draggable Note Header */}
      <div
        onMouseDown={onDragStart}
        className={`px-3 py-2 rounded-t-2xl border-b flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing select-none ${colorConfig.headerClass}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripHorizontal className="h-3.5 w-3.5 opacity-40 group-hover:opacity-80 shrink-0" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Note title..."
            className="h-6 px-1.5 text-xs font-bold border-transparent bg-transparent hover:bg-black/5 focus:bg-background/80 focus:border-border transition-colors truncate"
          />
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {/* Pin toggle */}
          <button
            type="button"
            title={note.isPinned ? "Unpin note" : "Pin note to top"}
            onClick={() => onUpdate({ isPinned: !note.isPinned })}
            className={`p-1 rounded-md hover:bg-black/10 transition-colors ${
              note.isPinned ? "text-red-500 font-bold" : "opacity-50 hover:opacity-100"
            }`}
          >
            {note.isPinned ? <Pin className="h-3.5 w-3.5 fill-current" /> : <Pin className="h-3.5 w-3.5" />}
          </button>

          {/* Color Switcher Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Change Color"
                className="p-1 rounded-md hover:bg-black/10 opacity-50 hover:opacity-100 transition-colors"
              >
                <Palette className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-auto p-1.5">
              <div className="grid grid-cols-4 gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => onUpdate({ color: c.id })}
                    className={`h-6 w-6 rounded-md border border-black/20 hover:scale-110 transition-transform ${
                      note.color === c.id ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                    style={{ backgroundColor: c.swatch }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Note Context Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-md hover:bg-black/10 opacity-50 hover:opacity-100 transition-colors"
              >
                <span className="text-xs font-bold leading-none">•••</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={handleCopyNote} className="cursor-pointer gap-2">
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Note</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer gap-2">
                <Plus className="h-3.5 w-3.5" />
                <span>Duplicate Note</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setMode(mode === "text" ? "checklist" : "text")}
                className="cursor-pointer gap-2"
              >
                {mode === "text" ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Switch to Checklist</span>
                  </>
                ) : (
                  <>
                    <List className="h-3.5 w-3.5 text-primary" />
                    <span>Switch to Text Note</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowTagInput(true)}
                className="cursor-pointer gap-2"
              >
                <TagIcon className="h-3.5 w-3.5 text-amber-500" />
                <span>Add Tag</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Note</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Note Body: Text Area or Checklist */}
      <div className="p-3 flex-1 flex flex-col space-y-2 select-text" onMouseDown={(e) => e.stopPropagation()}>
        {mode === "text" ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            placeholder="Type your note, thoughts, code snippets, or lists here..."
            className="flex-1 w-full text-xs font-medium bg-transparent border-none resize-none focus-visible:ring-0 p-0 shadow-none placeholder:text-current placeholder:opacity-40 min-h-[140px]"
          />
        ) : (
          <div className="flex-1 flex flex-col space-y-1.5 min-h-[140px]">
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {(note.checklist || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-1.5 text-xs group/chk"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggleChecklist(item.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span
                      className={`truncate ${
                        item.completed ? "line-through opacity-50" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="opacity-0 group-hover/chk:opacity-100 hover:text-destructive p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Checklist item input */}
            <div className="pt-1">
              <Input
                placeholder="+ Add checklist item (Enter)..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={handleAddChecklistItem}
                className="h-6 text-xs bg-black/5 dark:bg-white/5 border-transparent placeholder:text-current placeholder:opacity-40"
              />
            </div>
          </div>
        )}

        {/* Tags Section */}
        {((note.tags && note.tags.length > 0) || showTagInput) && (
          <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center gap-1">
            {(note.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/10 dark:bg-white/10"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}

            {showTagInput && (
              <Input
                placeholder="tag + Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                autoFocus
                className="h-5 w-20 text-[10px] px-1 bg-background"
                onBlur={() => setShowTagInput(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Note Footer with Mode Indicator & Last modified date */}
      <div className="px-3 py-1.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] opacity-60">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode(mode === "text" ? "checklist" : "text")}
            className="hover:underline flex items-center gap-1"
          >
            {mode === "text" ? <List className="h-2.5 w-2.5" /> : <CheckSquare className="h-2.5 w-2.5" />}
            <span>{mode === "text" ? "Text Note" : "Checklist"}</span>
          </button>
        </div>

        <div>
          {note.updatedAt ? new Date(note.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
        </div>
      </div>
    </div>
  );
}
