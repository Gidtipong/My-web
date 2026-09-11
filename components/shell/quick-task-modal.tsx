"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTask } from "@/app/actions/tasks";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTaskModal({ isOpen, onClose }: QuickTaskModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"P1" | "P2" | "P3" | "P4">("P3");
  const [type, setType] = useState<"TASK" | "INCIDENT" | "CHANGE" | "MAINTENANCE" | "AUDIT">("TASK");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createTask({
        title,
        priority,
        type,
        dueDate: dueDate ? new Date(dueDate) : null,
      });

      if (!res.success) {
        setError(res.error || "Failed to create task");
      } else {
        setTitle("");
        onClose();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("nettask:refresh-badges"));
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: "P1", label: "P1 - Critical", color: "hover:border-red-500 active:bg-red-500/20", active: "bg-red-500 text-white" },
    { value: "P2", label: "P2 - High", color: "hover:border-orange-500 active:bg-orange-500/20", active: "bg-orange-500 text-white" },
    { value: "P3", label: "P3 - Medium", color: "hover:border-blue-500 active:bg-blue-500/20", active: "bg-blue-500 text-white" },
    { value: "P4", label: "P4 - Low", color: "hover:border-zinc-500 active:bg-zinc-500/20", active: "bg-zinc-600 text-white" },
  ] as const;

  const typeOptions = [
    { value: "TASK", label: "Task" },
    { value: "INCIDENT", label: "Incident" },
    { value: "CHANGE", label: "Change" },
    { value: "MAINTENANCE", label: "Maint" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <h3 className="text-base font-semibold">Quick Add Task (&lt; 10s)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-red-500/15 border border-red-500/30 text-xs text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">
              TITLE / ACTION <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Replace SFP transceiver on BKK-COR-SW01 Te1/1/1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Priority selector (P1-P4) */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">PRIORITY</label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-all",
                    priority === opt.value
                      ? opt.active + " border-transparent font-bold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 " + opt.color
                  )}
                >
                  {opt.value}
                </button>
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">TYPE</label>
            <div className="grid grid-cols-4 gap-2">
              {typeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-all",
                    type === opt.value
                      ? "bg-zinc-100 text-zinc-950 font-bold border-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">DUE DATE</label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
