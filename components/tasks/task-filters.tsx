"use client";

import React from "react";
import { Search, Table as TableIcon, Kanban, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  tab: "all" | "open" | "today" | "this_week" | "done";
  search: string;
  status: string;
  priority: string;
  type: string;
  siteId: string;
  deviceId: string;
}

interface TaskFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  viewMode: "table" | "kanban";
  onViewModeChange: (mode: "table" | "kanban") => void;
  sites: Array<{ id: string; name: string }>;
  devices: Array<{ id: string; hostname: string }>;
  totalCount: number;
}

export function TaskFilters({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sites,
  devices,
  totalCount,
}: TaskFiltersProps) {
  const tabs = [
    { id: "all", label: "All Tasks" },
    { id: "open", label: "Open" },
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "done", label: "Done" },
  ] as const;

  const hasActiveFilters =
    filters.status !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.type !== "ALL" ||
    filters.siteId !== "ALL" ||
    filters.deviceId !== "ALL" ||
    filters.search.trim().length > 0;

  const clearFilters = () => {
    onFilterChange({
      status: "ALL",
      priority: "ALL",
      type: "ALL",
      siteId: "ALL",
      deviceId: "ALL",
      search: "",
    });
  };

  return (
    <div className="space-y-3">
      {/* 1. Tabs Row & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ tab: tab.id })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                filters.tab === tab.id
                  ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: View Switcher (Table / Kanban) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-zinc-500 font-mono hidden md:inline">
            {totalCount} {totalCount === 1 ? "task" : "tasks"}
          </span>
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                viewMode === "table"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {/* Search */}
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search title, ref, device..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Priority: All</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Type: All</option>
            <option value="TASK">Task</option>
            <option value="INCIDENT">Incident</option>
            <option value="CHANGE">Change</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="AUDIT">Audit</option>
          </select>
        </div>

        {/* Site Filter */}
        <div>
          <select
            value={filters.siteId}
            onChange={(e) => onFilterChange({ siteId: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none truncate"
          >
            <option value="ALL">Site: All</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Device Filter */}
        <div>
          <select
            value={filters.deviceId}
            onChange={(e) => onFilterChange({ deviceId: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none truncate"
          >
            <option value="ALL">Device: All</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.hostname}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Filter className="h-3 w-3 text-emerald-400" />
          <span>Active filters applied</span>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
