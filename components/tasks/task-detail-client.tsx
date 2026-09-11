"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckSquare,
  AlertTriangle,
  Server,
  Building2,
  Trash2,
  Edit,
  ShieldAlert,
  BookOpenCheck,
  Send,
  User as UserIcon,
  Activity,
  CheckCircle2,
  Plus,
} from "lucide-react";
import {
  formatDateBangkok,
  formatRelativeBangkok,
  isOverdue,
  getPriorityStyles,
  getTaskTypeStyles,
  getTaskStatusStyles,
  cn,
} from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@prisma/client";
import {
  updateTaskStatus,
  toggleChecklist,
  createChecklist,
  createNote,
  deleteTask,
} from "@/app/actions/tasks";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";

interface TaskDetailProps {
  task: any;
  sites: Array<{ id: string; name: string }>;
  devices: Array<{ id: string; hostname: string; siteId?: string | null }>;
}

export function TaskDetailClient({ task: initialTask, sites, devices }: TaskDetailProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const overdue = isOverdue(task.dueDate, task.status);
  const priorityStyles = getPriorityStyles(task.priority);
  const typeStyles = getTaskTypeStyles(task.type);
  const statusStyles = getTaskStatusStyles(task.status);

  const totalChecklists = task.checklists?.length || 0;
  const doneChecklists = task.checklists?.filter((c: any) => c.done).length || 0;
  const progressPercent = totalChecklists > 0 ? Math.round((doneChecklists / totalChecklists) * 100) : 0;

  // Status Change
  const handleStatusChange = (newStatus: TaskStatus) => {
    setTask((prev: any) => ({ ...prev, status: newStatus }));
    startTransition(async () => {
      await updateTaskStatus(task.id, newStatus);
      router.refresh();
    });
  };

  // Checklist Toggle
  const handleToggleChecklist = (id: string, currentDone: boolean) => {
    const updated = task.checklists.map((c: any) =>
      c.id === id ? { ...c, done: !currentDone } : c
    );
    setTask((prev: any) => ({ ...prev, checklists: updated }));

    startTransition(async () => {
      await toggleChecklist(id, !currentDone);
      router.refresh();
    });
  };

  // Add Checklist
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    startTransition(async () => {
      const res = await createChecklist(task.id, newChecklistText);
      if (res.success && res.data) {
        setTask((prev: any) => ({
          ...prev,
          checklists: [...(prev.checklists || []), res.data],
        }));
        setNewChecklistText("");
        router.refresh();
      }
    });
  };

  // Add Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    startTransition(async () => {
      const res = await createNote(task.id, newNoteContent);
      if (res.success && res.data) {
        setTask((prev: any) => ({
          ...prev,
          notes: [res.data, ...(prev.notes || [])],
        }));
        setNewNoteContent("");
        router.refresh();
      }
    });
  };

  // Delete Task
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to soft-delete this task?")) return;
    await deleteTask(task.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nettask:refresh-badges"));
    }
    router.push("/tasks");
  };

  // Convert to Case
  const handleConvertToCase = () => {
    const params = new URLSearchParams({
      fromTaskId: task.id,
      title: task.title,
      symptom: task.description || task.title,
      vendor: task.device?.vendor || "",
      siteId: task.siteId || "",
      deviceId: task.deviceId || "",
    });
    router.push(`/cases/new?${params.toString()}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tasks Board</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Convert to Case Button */}
          <button
            type="button"
            onClick={handleConvertToCase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <BookOpenCheck className="h-3.5 w-3.5" />
            <span>Convert to Case (KB)</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-mono font-bold border",
              priorityStyles.bg
            )}
          >
            {priorityStyles.label}
          </span>

          {/* Type */}
          <span className={cn("px-2.5 py-0.5 rounded text-xs font-medium border", typeStyles.bg)}>
            {typeStyles.label}
          </span>

          {/* Ticket Ref */}
          {task.ticketRef && (
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {task.ticketRef}
            </span>
          )}

          {/* Status Switcher Dropdown */}
          <div className="ml-auto">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none",
                statusStyles.bg
              )}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {task.title}
        </h1>

        {/* Schedule & Due Date Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
          {task.dueDate && (
            <div className={cn("flex items-center gap-1.5", overdue ? "text-red-400 font-bold" : "")}>
              {overdue ? <AlertTriangle className="h-4 w-4 text-red-400" /> : <Calendar className="h-4 w-4" />}
              <span>Due: {formatDateBangkok(task.dueDate)}</span>
              {overdue && <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">OVERDUE</span>}
            </div>
          )}

          {(task.startAt || task.endAt) && (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Clock className="h-4 w-4" />
              <span>
                Window: {formatDateBangkok(task.startAt, "dd MMM HH:mm")} - {formatDateBangkok(task.endAt, "HH:mm")}
              </span>
            </div>
          )}

          {task.recurrence && (
            <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
              Repeats: {task.recurrence}
            </span>
          )}
        </div>
      </div>

      {/* 3. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description, Rollback Plan, Checklists, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-2">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Scope of Work / Description
              </h3>
              <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Rollback Plan Card (Highlights when type = CHANGE) */}
          {task.rollbackPlan && (
            <div
              className={cn(
                "rounded-xl border p-5 space-y-2",
                task.type === "CHANGE"
                  ? "bg-orange-950/20 border-orange-500/40"
                  : "bg-zinc-950 border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                <ShieldAlert className="h-4 w-4" />
                <span className="uppercase font-mono tracking-wider">Change Rollback Plan</span>
              </div>
              <p className="text-sm text-orange-200/90 whitespace-pre-line leading-relaxed font-mono text-xs">
                {task.rollbackPlan}
              </p>
            </div>
          )}

          {/* Interactive Checklist Widget */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">SOP Action Checklist</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {doneChecklists}/{totalChecklists} ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            {totalChecklists > 0 && (
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Checklist Items */}
            <div className="space-y-2">
              {task.checklists?.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id, item.done)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                    item.done
                      ? "bg-zinc-900/40 border-zinc-800/60 text-zinc-500 line-through"
                      : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono flex-1">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Inline Add Checklist Item */}
            <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add new checklist step..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim() || isPending}
                className="px-3 py-2 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Operational Notes Timeline */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span>Engineering Notes Timeline</span>
            </h3>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Log an engineering note or troubleshooting update..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteContent.trim() || isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3 pt-2">
              {task.notes && task.notes.length > 0 ? (
                task.notes.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>{formatDateBangkok(note.createdAt)}</span>
                      <span>{formatRelativeBangkok(note.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-600 font-mono py-2 text-center">
                  No notes recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Linked Device, Site, and Activity Log */}
        <div className="space-y-6">
          {/* Linked Device Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Server className="h-4 w-4 text-purple-400" />
              <span>LINKED DEVICE</span>
            </div>
            {task.device ? (
              <div className="space-y-2">
                <div className="font-mono font-bold text-sm text-zinc-100">
                  {task.device.hostname}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">IP ADDRESS</span>
                    <span className="text-emerald-400 font-semibold">{task.device.ipAddress}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">MODEL</span>
                    <span className="text-zinc-300">{task.device.vendor} {task.device.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ROLE</span>
                    <span className="text-zinc-300">{task.device.role}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">STATUS</span>
                    <span className="text-emerald-400">{task.device.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-600 font-mono">No target device assigned</div>
            )}
          </div>

          {/* Linked Site Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>LOCATION & SITE</span>
            </div>
            {task.site ? (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-zinc-100 text-sm">{task.site.name}</div>
                {task.site.location && (
                  <p className="text-zinc-400 leading-relaxed">{task.site.location}</p>
                )}
                {task.site.contactPerson && (
                  <div className="font-mono text-[11px] text-zinc-400 pt-1">
                    Contact: {task.site.contactPerson} ({task.site.phone || "N/A"})
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-600 font-mono">No specific site assigned</div>
            )}
          </div>

          {/* Audit Log (Activity Trail) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Activity className="h-4 w-4 text-zinc-500" />
              <span>ACTIVITY LOG</span>
            </div>
            <div className="space-y-2 text-[11px] font-mono">
              {task.auditLogs && task.auditLogs.length > 0 ? (
                task.auditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-1.5 border-b border-zinc-800/60 last:border-0 text-zinc-400"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
                      {log.action}
                    </span>
                    <span className="text-zinc-500">{formatRelativeBangkok(log.createdAt)}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 text-center py-2">No activity recorded</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TaskFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
        sites={sites}
        devices={devices}
        initialData={task}
      />
    </div>
  );
}
