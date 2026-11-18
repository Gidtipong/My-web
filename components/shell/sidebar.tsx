"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BookOpenCheck,
  BarChart3,
  Settings,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  {
    name: "หน้าหลัก",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "รายการงาน",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "ปฏิทิน",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    name: "คลังแก้ปัญหา",
    href: "/cases",
    icon: BookOpenCheck,
  },
  {
    name: "รายงาน",
    href: "/reports",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<{
    tasks?: number;
    devices?: number;
    sites?: number;
    cases?: number;
  }>({});

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/badges", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCounts(data);
          }
        }
      } catch (err) {
        // silent
      }
    };

    fetchCounts();

    const handleRefresh = () => fetchCounts();
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("nettask:refresh-badges", handleRefresh);
    const interval = setInterval(fetchCounts, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("nettask:refresh-badges", handleRefresh);
      clearInterval(interval);
    };
  }, [pathname]);

  const getBadgeValue = (href: string) => {
    let count: number | undefined;
    if (href === "/tasks") count = counts.tasks;
    else if (href === "/cases") count = counts.cases;

    if (typeof count === "number" && count > 0) {
      return String(count);
    }
    return null;
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-40 bg-white dark:bg-zinc-950 border-r border-slate-200/60 dark:border-zinc-800/70 text-[#1E293B] dark:text-zinc-100 transition-colors">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight group">
          <div className="h-9 w-9 rounded-xl bg-[#52796F] flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Terminal className="h-4 w-4 text-white stroke-[2.2]" />
          </div>
          <span className="font-bold text-[#1E293B] dark:text-zinc-100 text-lg tracking-tight">NetTask</span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const badgeText = getBadgeValue(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "group flex items-center justify-between px-3.5 py-2.5 text-[15px] rounded-xl transition-colors duration-150",
                isActive
                  ? "bg-[#EAF2EF] text-[#2F5249] dark:bg-[#52796F]/20 dark:text-[#A3C4B8] font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-900/70 font-medium"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    isActive
                      ? "text-[#52796F] dark:text-[#A3C4B8]"
                      : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {badgeText && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full transition-colors ml-auto",
                    isActive
                      ? "bg-white/80 text-[#2F5249] dark:bg-zinc-900/60 dark:text-[#A3C4B8]"
                      : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  {badgeText}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at the bottom */}
      <div className="p-4 border-t border-slate-200/60 dark:border-zinc-800/70">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 px-3.5 py-2.5 text-[15px] rounded-xl transition-colors duration-150",
            pathname === "/settings"
              ? "bg-[#EAF2EF] text-[#2F5249] dark:bg-[#52796F]/20 dark:text-[#A3C4B8] font-semibold"
              : "text-slate-600 dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-900/70 font-medium"
          )}
        >
          <Settings
            className={cn(
              "h-[18px] w-[18px] transition-colors",
              pathname === "/settings"
                ? "text-[#52796F] dark:text-[#A3C4B8]"
                : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
            )}
          />
          <span>ตั้งค่า</span>
        </Link>
      </div>
    </aside>
  );
}
