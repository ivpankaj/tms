"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Users,
  FolderGit2,
  CheckSquare,
  Search,
  Loader2,
  Calendar,
  LayoutDashboard,
  Kanban,
  ListOrdered,
  Plus,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    tasks: any[];
    projects: any[];
    teams: any[];
    members: any[];
  }>({
    tasks: [],
    projects: [],
    teams: [],
    members: [],
  });

  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ tasks: [], projects: [], teams: [], members: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const onSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const hasResults =
    results.tasks.length > 0 ||
    results.projects.length > 0 ||
    results.teams.length > 0 ||
    results.members.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 hover:bg-muted border rounded-lg transition-all w-9 sm:w-56 md:w-64 justify-center sm:justify-between shadow-2xs cursor-pointer"
        title="Search tasks, projects, teams... (Cmd+K or /)"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="hidden sm:inline">Search workspace...</span>
        </span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tasks, projects, teams, members..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
            </div>
          )}
          {!loading && query.length >= 2 && !hasResults && (
            <CommandEmpty>No results found for &ldquo;{query}&rdquo;.</CommandEmpty>
          )}

          {/* Quick Navigation Shortcuts */}
          {!query && (
            <CommandGroup heading="Quick Navigation">
              <CommandItem
                onSelect={() => onSelect("/")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4 text-blue-500" />
                <span>Go to Dashboard</span>
              </CommandItem>
              <CommandItem
                onSelect={() => onSelect("/my-tasks")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                <span>Go to My Tasks</span>
              </CommandItem>
              <CommandItem
                onSelect={() => onSelect("/projects")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FolderGit2 className="h-4 w-4 text-amber-500" />
                <span>Browse Projects</span>
              </CommandItem>
              <CommandItem
                onSelect={() => onSelect("/views/board")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Kanban className="h-4 w-4 text-purple-500" />
                <span>Kanban Board View</span>
              </CommandItem>
              <CommandItem
                onSelect={() => onSelect("/views/notes")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <StickyNote className="h-4 w-4 text-amber-500" />
                <span>Sticky Notes Board</span>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {results.tasks.map((t) => (
                <CommandItem
                  key={t._id}
                  onSelect={() => onSelect(`/tasks?selected=${t._id}`)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckSquare className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="font-medium truncate">{t.title}</span>
                    {t.projectId && (
                      <span className="text-xs text-muted-foreground font-mono">
                        [{t.projectId.key}]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {t.status}
                    </Badge>
                    <Badge
                      variant={
                        t.priority === "Urgent" || t.priority === "High"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {t.priority}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Projects">
                {results.projects.map((p) => (
                  <CommandItem
                    key={p._id}
                    onSelect={() => onSelect(`/projects/${p._id}`)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderGit2 className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        [{p.key}]
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {p.status}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Teams Results */}
          {results.teams.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Teams">
                {results.teams.map((tm) => (
                  <CommandItem
                    key={tm._id}
                    onSelect={() => onSelect(`/teams`)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-medium">{tm.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{tm.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Members Results */}
          {results.members.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Team Members">
                {results.members.map((m) => (
                  <CommandItem
                    key={m._id}
                    onSelect={() => onSelect(`/members`)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground">({m.email})</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {m.role}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
