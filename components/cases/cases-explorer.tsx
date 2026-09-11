"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Filter, X, Pin, Flame, Clock, BookOpenCheck, Tag, Sparkles } from "lucide-react";
import { CaseCard } from "@/components/cases/case-card";
import { searchCases } from "@/app/actions/cases";
import { cn } from "@/lib/utils";

interface CasesExplorerProps {
  initialCases: any[];
  allTags: Array<{ tag: string; count: number }>;
  sites: Array<{ id: string; name: string }>;
  vendors: string[];
}

export function CasesExplorer({
  initialCases,
  allTags,
  sites,
  vendors,
}: CasesExplorerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cases, setCases] = useState<any[]>(initialCases);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [category, setCategory] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [vendor, setVendor] = useState("ALL");
  const [siteId, setSiteId] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // 300ms debounce on search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Perform search when filters or debounced query changes
  useEffect(() => {
    startTransition(async () => {
      const res = await searchCases({
        query: debouncedQuery,
        category,
        severity,
        vendor,
        siteId,
        tag: selectedTag || undefined,
      });
      if (res.success && res.data) {
        setCases(res.data);
      }
    });
  }, [debouncedQuery, category, severity, vendor, siteId, selectedTag]);

  // Section categorization (when not actively full-text searching)
  const isSearching = debouncedQuery.trim().length > 0 || selectedTag !== null;

  const pinnedCases = useMemo(() => cases.filter((c) => c.isPinned), [cases]);
  const mostViewedCases = useMemo(
    () => [...cases].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4),
    [cases]
  );
  const recentCases = useMemo(
    () =>
      [...cases]
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
        .slice(0, 6),
    [cases]
  );

  const resetFilters = () => {
    setQuery("");
    setSelectedTag(null);
    setCategory("ALL");
    setSeverity("ALL");
    setVendor("ALL");
    setSiteId("ALL");
  };

  const hasActiveFilters =
    category !== "ALL" ||
    severity !== "ALL" ||
    vendor !== "ALL" ||
    siteId !== "ALL" ||
    selectedTag !== null ||
    query.trim().length > 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. HERO ELEMENT: Full-Text Search Bar (Autofocused) */}
      <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-900/60 to-zinc-950 p-6 sm:p-10 shadow-lg text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs">
          <BookOpenCheck className="h-3.5 w-3.5" />
          <span>Troubleshooting Knowledge Base</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
          Instant Answers for Network Outages
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
          Full-text weighted search across symptoms, root causes, and CLI recovery solutions.
        </p>

        {/* Big Search Input with live spinner */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symptoms, error codes, protocols (e.g. 'STP loop', 'MTU mismatch', 'flapping')..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/90 pl-12 pr-12 py-3.5 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-3.5 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="absolute right-4 top-4 text-[10px] font-mono text-zinc-500 hidden sm:block">
              LIVE TSVECTOR
            </div>
          )}
        </div>

        {/* Top Action & Create Button */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Document New Case</span>
          </Link>
        </div>
      </div>

      {/* 2. Clickable Tag Cloud */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <span>POPULAR TROUBLESHOOTING TAGS</span>
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Clear tag filter</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allTags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer",
                  selectedTag === tag
                    ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 border-zinc-800"
                )}
              >
                #{tag} <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Filter className="h-3.5 w-3.5 text-blue-400" />
            <span>FILTER KB CASES</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <X className="h-3 w-3" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1">CATEGORY</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="CONNECTIVITY">Connectivity</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="HARDWARE">Hardware</option>
              <option value="CONFIGURATION">Configuration</option>
              <option value="SECURITY">Security</option>
              <option value="WIRELESS">Wireless</option>
              <option value="ISP">ISP / WAN</option>
              <option value="POWER">Power / UPS</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1">SEVERITY</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </select>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1">VENDOR</label>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Vendors</option>
              <option value="Cisco">Cisco</option>
              <option value="Fortinet">Fortinet</option>
              <option value="Ubiquiti">Ubiquiti</option>
              <option value="APC">APC</option>
            </select>
          </div>

          {/* Site */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1">SITE</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none truncate"
            >
              <option value="ALL">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Display Results */}
      {isSearching ? (
        /* Full-Text Search Ranked Results View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200 font-mono">
              SEARCH RESULTS ({cases.length})
            </h2>
            {isPending && <span className="text-xs text-emerald-400 font-mono animate-pulse">Searching tsvector...</span>}
          </div>

          {cases.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
              <p className="text-sm text-zinc-400">No knowledge base cases match your query.</p>
              <button
                onClick={resetFilters}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <CaseCard key={c.id} item={c} onTagClick={(t) => setSelectedTag(t)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default Categorized Sections: Pinned | Most Viewed | Recent */
        <div className="space-y-10">
          {/* Section 1: 📌 Pinned Cases */}
          {pinnedCases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400 font-mono">
                <Pin className="h-4 w-4 fill-amber-400" />
                <span>PINNED KB GUIDES</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedCases.map((c) => (
                  <CaseCard key={c.id} item={c} onTagClick={(t) => setSelectedTag(t)} />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: 🔥 Most Viewed Cases */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-orange-400 font-mono">
              <Flame className="h-4 w-4 fill-orange-400" />
              <span>MOST VIEWED TROUBLESHOOTING CASES</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mostViewedCases.map((c) => (
                <CaseCard key={c.id} item={c} onTagClick={(t) => setSelectedTag(t)} />
              ))}
            </div>
          </div>

          {/* Section 3: 🕐 Recent Cases */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-300 font-mono">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>RECENTLY LOGGED CASES</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentCases.map((c) => (
                <CaseCard key={c.id} item={c} onTagClick={(t) => setSelectedTag(t)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
