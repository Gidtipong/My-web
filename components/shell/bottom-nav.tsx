"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Plus, CalendarDays, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onQuickAdd: () => void;
}

export function BottomNav({ onQuickAdd }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 border-t border-slate-200 dark:border-zinc-800/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {/* 1. Dashboard */}
      <Link
        href="/"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-xs font-medium transition-colors",
          pathname === "/"
            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
        )}
      >
        <LayoutDashboard className="h-5 w-5 mb-0.5" />
        <span>หน้าหลัก</span>
      </Link>

      {/* 2. Tasks */}
      <Link
        href="/tasks"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-xs font-medium transition-colors",
          pathname.startsWith("/tasks")
            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
        )}
      >
        <CheckSquare className="h-5 w-5 mb-0.5" />
        <span>งาน</span>
      </Link>

      {/* 3. Center [+] Quick Add Action */}
      <div className="flex flex-1 justify-center -mt-5">
        <button
          type="button"
          onClick={onQuickAdd}
          aria-label="เพิ่มงานใหม่"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all border-2 border-white dark:border-zinc-950"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Calendar */}
      <Link
        href="/calendar"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-xs font-medium transition-colors",
          pathname.startsWith("/calendar")
            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
        )}
      >
        <CalendarDays className="h-5 w-5 mb-0.5" />
        <span>ปฏิทิน</span>
      </Link>

      {/* 5. Cases */}
      <Link
        href="/cases"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-xs font-medium transition-colors",
          pathname.startsWith("/cases")
            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
        )}
      >
        <BookOpenCheck className="h-5 w-5 mb-0.5" />
        <span>แก้ปัญหา</span>
      </Link>
    </nav>
  );
}
