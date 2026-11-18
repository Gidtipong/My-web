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
    { value: "P1", label: "ด่วนมาก", active: "bg-[#FCECEC] text-[#7F2929] ring-1 ring-[#C96A6A]/40" },
    { value: "P2", label: "ด่วน", active: "bg-[#FDF3E7] text-[#664219] ring-1 ring-[#C28848]/40" },
    { value: "P3", label: "ปกติ", active: "bg-[#EBF2FA] text-[#24476E] ring-1 ring-[#5B82B0]/40" },
    { value: "P4", label: "รอได้", active: "bg-slate-200/80 text-slate-700 ring-1 ring-slate-400/40" },
  ] as const;

  const typeOptions = [
    { value: "TASK", label: "งานทั่วไป" },
    { value: "INCIDENT", label: "แก้ปัญหา" },
    { value: "MAINTENANCE", label: "บำรุงรักษา" },
    { value: "AUDIT", label: "ตรวจสอบ" },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[#1E293B] dark:text-zinc-100 shadow-[0_20px_50px_rgba(15,23,42,0.12)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold">เพิ่มงานใหม่</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-xl p-1.5 text-slate-400 hover:text-[#1E293B] dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FCECEC] text-sm text-[#7F2929]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              ชื่องาน / สิ่งที่ต้องทำ <span className="text-[#C96A6A]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="เช่น เปลี่ยนสาย LAN ชั้น 2 หรือ เช็ก Switch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-[#F8FAFC] dark:bg-zinc-900 px-3.5 py-2.5 text-base text-[#1E293B] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-[#52796F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#52796F]/15"
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
                    "py-2 px-2 rounded-xl text-xs sm:text-sm font-medium text-center transition-colors cursor-pointer",
                    priority === opt.value
                      ? opt.active + " font-semibold"
                      : "bg-[#F8FAFC] dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
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
                    "py-2 px-2 rounded-xl text-xs sm:text-sm font-medium text-center transition-colors cursor-pointer",
                    type === opt.value
                      ? "bg-[#EAF2EF] text-[#2F5249] ring-1 ring-[#52796F]/40 font-semibold"
                      : "bg-[#F8FAFC] dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
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
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-[#F8FAFC] dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-[#1E293B] dark:text-white focus:border-[#52796F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#52796F]/15"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
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
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#52796F] text-white hover:bg-[#43665D] transition-colors disabled:opacity-50 cursor-pointer"
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
