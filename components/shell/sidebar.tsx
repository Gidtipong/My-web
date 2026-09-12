"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BookOpenCheck,
  Server,
  Building2,
  BarChart3,
  Settings,
  Activity,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    shortcut: "1",
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    shortcut: "2",
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    shortcut: "3",
  },
  {
    name: "Cases",
    href: "/cases",
    icon: BookOpenCheck,
    shortcut: "4",
  },
  {
    name: "Devices",
    href: "/devices",
    icon: Server,
    shortcut: "5",
  },
  {
    name: "Sites",
    href: "/sites",
    icon: Building2,
    shortcut: "6",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    shortcut: "7",
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

  const getBadgeValue = (name: string) => {
    let count: number | undefined;
    if (name === "Tasks") count = counts.tasks;
    else if (name === "Devices") count = counts.devices;
    else if (name === "Sites") count = counts.sites;
    else if (name === "Cases") count = counts.cases;

    // ถ้าไม่มีจำนวน หรือเป็น 0 ไม่ให้ใส่อะไรเลย
    if (typeof count === "number" && count > 0) {
      return String(count);
    }
    return null;
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-40 bg-white dark:bg-zinc-950 border-r border-slate-200/80 dark:border-zinc-800/80 text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-5 border-b border-slate-200/80 dark:border-zinc-800/80 justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm tracking-tight">NetTask</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                OPS
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">Network Operations</span>
          </div>
        </Link>
      </div>

      {/* System Status Banner */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs transition-colors">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-600 dark:text-zinc-400 font-mono text-[11px]">BKK DC Core: Up</span>
        </div>
        <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Navigation List (Exactly 7 items) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const badgeText = getBadgeValue(item.name);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150",
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white shadow-xs border border-slate-200/90 dark:border-zinc-700/60 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900/80"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {badgeText && (
                <span
                  className={cn(
                    "text-xs font-mono font-medium transition-colors ml-auto",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-slate-500 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300"
                  )}
                >
                  {badgeText}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider & Settings at the bottom */}
      <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800/80 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150",
            pathname === "/settings"
              ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white border border-slate-200/90 dark:border-zinc-700/60 font-semibold"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900/80"
          )}
        >
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors" />
            <span>Settings</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">v1.0</span>
        </Link>
      </div>
    </aside>
  );
}
