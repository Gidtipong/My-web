"use client";

import React, { useState, useTransition, useMemo } from "react";
import { NaturalQuickAdd } from "@/components/tasks/natural-quick-add";
import { TaskFilters, FilterState } from "@/components/tasks/task-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Plus, CheckSquare, RefreshCw } from "lucide-react";
import { getTasks } from "@/app/actions/tasks";

interface TasksPageClientProps {
  initialTasks: any[];
  sites: Array<{ id: string; name: string }>;
  devices: Array<{ id: string; hostname: string; siteId?: string | null; model?: string; ipAddress?: string }>;
}

export function TasksPageClient({
  initialTasks,
  sites,
  devices,
}: TasksPageClientProps) {
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<FilterState>({
    tab: "all",
    search: "",
    status: "ALL",
    priority: "ALL",
    type: "ALL",
    siteId: "ALL",
    deviceId: "ALL",
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    startTransition(async () => {
      const res = await getTasks(updated);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    });
  };

  const refreshTasks = () => {
    startTransition(async () => {
      const res = await getTasks(filters);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Task Management
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Track incidents, scheduled changes, maintenance SOPs, and daily network operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshTasks}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewTaskOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Natural Language Quick Add (< 5s entry) */}
      <NaturalQuickAdd devices={devices} onTaskCreated={refreshTasks} />

      {/* 3. Filter Bar & Tab Navigation */}
      <TaskFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sites={sites}
        devices={devices}
        totalCount={tasks.length}
      />

      {/* 4. Main View: Table or Kanban */}
      {viewMode === "table" ? (
        <TaskTable
          tasks={tasks}
          onRefresh={refreshTasks}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
        />
      ) : (
        <TaskKanban tasks={tasks} onRefresh={refreshTasks} />
      )}

      {/* 5. Create / Edit Task Modal */}
      <TaskFormDialog
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSuccess={refreshTasks}
        sites={sites}
        devices={devices}
      />
    </div>
  );
}
