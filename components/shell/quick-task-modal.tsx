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
    { value: "P1", label: "ด่วนมาก", active: "bg-red-600 text-white" },
    { value: "P2", label: "ด่วน", active: "bg-orange-500 text-white" },
    { value: "P3", label: "ปกติ", active: "bg-blue-600 text-white" },
    { value: "P4", label: "รอได้", active: "bg-slate-600 text-white" },
  ] as const;

  const typeOptions = [
    { value: "TASK", label: "งานทั่วไป" },
    { value: "INCIDENT", label: "แก้ปัญหา" },
    { value: "MAINTENANCE", label: "บำรุงรักษา" },
    { value: "AUDIT", label: "ตรวจสอบ" },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold">เพิ่มงานใหม่</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              ชื่องาน / สิ่งที่ต้องทำ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="เช่น เปลี่ยนสาย LAN ชั้น 2 หรือ เช็ก Switch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              ความสำคัญ
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all cursor-pointer",
                    priority === opt.value
                      ? opt.active + " border-transparent font-semibold shadow-xs"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              ประเภทงาน
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {typeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all cursor-pointer",
                    type === opt.value
                      ? "bg-emerald-600 text-white font-semibold border-emerald-600 shadow-xs"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              วันที่กำหนดส่ง (ไม่บังคับ)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>บันทึกงาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
