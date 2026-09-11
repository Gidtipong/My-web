"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  formatDateBangkok,
  isOverdue,
  getPriorityStyles,
  getTaskTypeStyles,
  getTaskStatusStyles,
  cn,
} from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@prisma/client";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Server,
  Building2,
  ExternalLink,
} from "lucide-react";
import { bulkUpdateTasks, updateTaskStatus } from "@/app/actions/tasks";
import { IncidentDoneModal } from "@/components/tasks/incident-done-modal";

interface TaskItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate: Date | string | null;
  ticketRef?: string | null;
  site?: { id: string; name: string } | null;
  device?: { id: string; hostname: string; model: string; ipAddress: string } | null;
  checklists?: Array<{ id: string; done: boolean }>;
}

interface TaskTableProps {
  tasks: TaskItem[];
  onRefresh: () => void;
  onOpenNewTask: () => void;
}

export function TaskTable({ tasks, onRefresh, onOpenNewTask }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "priority", desc: false }]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [incidentPromptTask, setIncidentPromptTask] = useState<TaskItem | null>(null);

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]);
  }, [rowSelection]);

  const handleBulkStatus = async (status: TaskStatus) => {
    if (selectedIds.length === 0) return;
    setIsBulkPending(true);
    await bulkUpdateTasks(selectedIds, { status });
    setRowSelection({});
    setIsBulkPending(false);
    onRefresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to soft-delete ${selectedIds.length} tasks?`)) return;
    setIsBulkPending(true);
    await bulkUpdateTasks(selectedIds, { delete: true });
    setRowSelection({});
    setIsBulkPending(false);
    onRefresh();
  };

  const handleInlineStatusChange = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (newStatus === "DONE" && task && task.type === "INCIDENT") {
      setIncidentPromptTask(task);
    }
    await updateTaskStatus(id, newStatus);
    onRefresh();
  };

  const columns = useMemo<ColumnDef<TaskItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-mono uppercase"
          >
            <span>Priority</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const p = row.original.priority;
          const styles = getPriorityStyles(p);
          return (
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-mono font-bold border",
                styles.bg
              )}
            >
              {p}
            </span>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type;
          const styles = getTaskTypeStyles(type);
          return (
            <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium border", styles.bg)}>
              {styles.label}
            </span>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title & Details",
        cell: ({ row }) => {
          const task = row.original;
          const totalChecklists = task.checklists?.length || 0;
          const doneChecklists = task.checklists?.filter((c) => c.done).length || 0;

          return (
            <div className="space-y-0.5">
              <Link
                href={`/tasks/${task.id}`}
                className="font-medium text-zinc-100 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
              >
                <span>{task.title}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                {task.ticketRef && (
                  <span className="text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded border border-zinc-700/60">
                    {task.ticketRef}
                  </span>
                )}
                {totalChecklists > 0 && (
                  <span
                    className={cn(
                      doneChecklists === totalChecklists ? "text-emerald-400" : "text-zinc-400"
                    )}
                  >
                    ✓ {doneChecklists}/{totalChecklists} SOP
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "device",
        header: "Device / Site",
        cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="space-y-0.5 text-xs">
              {task.device && (
                <div className="flex items-center gap-1 font-mono text-zinc-300">
                  <Server className="h-3 w-3 text-purple-400" />
                  <span>{task.device.hostname}</span>
                </div>
              )}
              {task.site && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Building2 className="h-3 w-3 text-zinc-500" />
                  <span className="truncate max-w-[130px]">{task.site.name}</span>
                </div>
              )}
              {!task.device && !task.site && <span className="text-zinc-600">-</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-mono uppercase"
          >
            <span>Due Date</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const task = row.original;
          const overdue = isOverdue(task.dueDate, task.status);
          return (
            <div className="text-xs font-mono">
              {task.dueDate ? (
                <span className={cn(overdue ? "text-red-400 font-bold flex items-center gap-1" : "text-zinc-300")}>
                  {overdue && <AlertTriangle className="h-3 w-3" />}
                  {formatDateBangkok(task.dueDate, "dd MMM yyyy")}
                </span>
              ) : (
                <span className="text-zinc-600">-</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const task = row.original;
          const statusStyles = getTaskStatusStyles(task.status);
          return (
            <select
              value={task.status}
              onChange={(e) => handleInlineStatusChange(task.id, e.target.value as TaskStatus)}
              className={cn(
                "rounded border px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none",
                statusStyles.bg
              )}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-12 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">No tasks found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No tasks match your current filter criteria or tab view. Try clearing filters or create a new task.
        </p>
        <button
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 text-xs font-semibold hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          Create First Task
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedIds.length} tasks selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus("DONE")}
              disabled={isBulkPending}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold cursor-pointer"
            >
              Mark Done
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkPending}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white font-semibold cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800/80 text-zinc-400 font-mono text-[11px]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {table.getRowModel().rows.map((row) => {
                const overdue = isOverdue(row.original.dueDate, row.original.status);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-900/60",
                      // Overdue rows get subtle red background tint
                      overdue
                        ? "bg-red-950/20 hover:bg-red-950/30 border-l-2 border-red-500"
                        : "border-l-2 border-transparent"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5 text-xs text-zinc-400 font-mono">
          <div>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1} (
            {tasks.length} total)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Incident Done Auto-Prompt Dialog */}
      <IncidentDoneModal
        task={incidentPromptTask}
        isOpen={!!incidentPromptTask}
        onClose={() => setIncidentPromptTask(null)}
      />
    </div>
  );
}
