"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Plus, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onQuickAdd: () => void;
}

export function BottomNav({ onQuickAdd }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      active: pathname.startsWith("/tasks"),
    },
    {
      name: "Cases",
      href: "/cases",
      icon: BookOpenCheck,
      active: pathname.startsWith("/cases"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {/* 1. Dashboard */}
      <Link
        href="/"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-[11px] font-medium transition-colors",
          navItems[0].active ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        <LayoutDashboard className="h-5 w-5 mb-0.5" />
        <span>Dashboard</span>
      </Link>

      {/* 2. Tasks */}
      <Link
        href="/tasks"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-[11px] font-medium transition-colors",
          navItems[1].active ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        <CheckSquare className="h-5 w-5 mb-0.5" />
        <span>Tasks</span>
      </Link>

      {/* 3. Center [+] Quick Add Action */}
      <div className="flex flex-1 justify-center -mt-5">
        <button
          type="button"
          onClick={onQuickAdd}
          aria-label="Quick Add Task"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition-all border-2 border-zinc-950"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
        </button>
      </div>

      {/* 4. Cases (Knowledge Base) */}
      <Link
        href="/cases"
        prefetch={true}
        className={cn(
          "flex flex-1 flex-col items-center py-1 text-[11px] font-medium transition-colors",
          navItems[2].active ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        <BookOpenCheck className="h-5 w-5 mb-0.5" />
        <span>Cases</span>
      </Link>
    </nav>
  );
}
