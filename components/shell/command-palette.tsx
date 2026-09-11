"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckSquare,
  BookOpenCheck,
  Server,
  Building2,
  Plus,
  ArrowRight,
  Terminal,
  X,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { searchCases } from "@/app/actions/cases";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickTask: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenQuickTask }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [caseResults, setCaseResults] = useState<any[]>([]);
  const [isSearchingCases, startSearch] = useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setCaseResults([]);
    }
  }, [isOpen]);

  // Live query cases when typing in command palette
  useEffect(() => {
    if (!query.trim()) {
      setCaseResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearch(async () => {
        const res = await searchCases({ query, limit: 3 });
        if (res.success && res.data) {
          setCaseResults(res.data);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: "new-task",
      title: "Create New Task (N)",
      desc: "Fast entry (<10s) with priority and tags",
      icon: Plus,
      badge: "N",
      action: () => {
        onClose();
        onOpenQuickTask();
      },
    },
    {
      id: "new-case",
      title: "Log Troubleshooting Case (C)",
      desc: "Record symptom, cause, solution to KB",
      icon: BookOpenCheck,
      badge: "C",
      action: () => {
        onClose();
        router.push("/cases/new");
      },
    },
    {
      id: "nav-tasks",
      title: "Go to Tasks",
      desc: "View task board & active incident tickets",
      icon: CheckSquare,
      badge: "G T",
      action: () => {
        onClose();
        router.push("/tasks");
      },
    },
    {
      id: "nav-cases",
      title: "Go to Knowledge Base (Cases)",
      desc: "Search network troubleshooting guides",
      icon: BookOpenCheck,
      badge: "G C",
      action: () => {
        onClose();
        router.push("/cases");
      },
    },
    {
      id: "nav-devices",
      title: "Go to Device Inventory",
      desc: "Cisco, Fortinet, Ubiquiti hardware & IPs",
      icon: Server,
      badge: "G D",
      action: () => {
        onClose();
        router.push("/devices");
      },
    },
    {
      id: "nav-sites",
      title: "Go to Sites & Branches",
      desc: "Locations, racks, and site contacts",
      icon: Building2,
      badge: "G S",
      action: () => {
        onClose();
        router.push("/sites");
      },
    },
  ];

  const filteredActions = query.trim()
    ? quickActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.desc.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl shadow-emerald-950/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="relative flex items-center border-b border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search KB solutions, commands, tasks, devices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm placeholder:text-zinc-500 text-zinc-100 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") {
                if (caseResults.length > 0) {
                  onClose();
                  router.push(`/cases/${caseResults[0].id}`);
                } else if (filteredActions.length > 0) {
                  filteredActions[0].action();
                }
              }
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Top Group: Knowledge Base Cases (Top Result Group as required!) */}
          {caseResults.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold">
                <span className="flex items-center gap-1.5">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  <span>Knowledge Base Cases (Top Results)</span>
                </span>
                <span className="text-zinc-500">Press Enter</span>
              </div>
              {caseResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onClose();
                    router.push(`/cases/${c.id}`);
                  }}
                  className="w-full flex flex-col items-start px-3 py-2 rounded-lg text-left bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-blue-500/40 transition-colors group cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {c.caseNumber}
                      </span>
                      <span className="text-xs font-semibold text-zinc-100 group-hover:text-blue-300 transition-colors">
                        {c.title}
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-zinc-600 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {c.cause && (
                    <div className="text-[11px] text-amber-300/80 line-clamp-1 font-sans pl-1 border-l-2 border-amber-500/40">
                      Cause: {c.cause.replace(/^###.*\n/, "").slice(0, 80)}...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions & Navigation Group */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Quick Actions & Navigation
            </div>
            {filteredActions.length === 0 && caseResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-zinc-900 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200 group-hover:text-emerald-300">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-500">{item.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {item.badge}
                        </kbd>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/50 px-4 py-2 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd> Select
            </span>
            <span>
              <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[10px]">Esc</kbd> Close
            </span>
          </div>
          <div>NetTask Quick Search</div>
        </div>
      </div>
    </div>
  );
}
