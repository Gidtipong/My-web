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
    name: "หน้าหลัก",
    key: "Tasks",
    href: "/",
    icon: LayoutDashboard,
    shortcut: "1",
  },
  {
    name: "รายการงาน",
    key: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    shortcut: "2",
  },
  {
    name: "ปฏิทิน",
    key: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    shortcut: "3",
  },
  {
    name: "คลังแก้ปัญหา",
    key: "Cases",
    href: "/cases",
    icon: BookOpenCheck,
    shortcut: "4",
  },
  {
    name: "อุปกรณ์",
    key: "Devices",
    href: "/devices",
    icon: Server,
    shortcut: "5",
  },
  {
    name: "สถานที่",
    key: "Sites",
    href: "/sites",
    icon: Building2,
    shortcut: "6",
  },
  {
    name: "รายงาน",
    key: "Reports",
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

  const getBadgeValue = (href: string) => {
    let count: number | undefined;
    if (href === "/tasks") count = counts.tasks;
    else if (href === "/devices") count = counts.devices;
    else if (href === "/sites") count = counts.sites;
    else if (href === "/cases") count = counts.cases;

    // ถ้าไม่มีจำนวน หรือเป็น 0 ไม่ให้ใส่อะไรเลย
    if (typeof count === "number" && count > 0) {
      return String(count);
    }
    return null;
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-40 bg-white dark:bg-zinc-950 border-r border-slate-200/80 dark:border-zinc-800/80 text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-5 border-b border-slate-200/80 dark:border-zinc-800/80">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-900 dark:text-zinc-100 text-lg tracking-tight">NetTask</span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
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
                "group flex items-center justify-between px-3.5 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-150",
                isActive
                  ? "bg-emerald-50/90 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-2xs border border-emerald-200/90 dark:border-emerald-500/25 font-semibold"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-900/80"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {badgeText && (
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ml-auto",
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
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
      <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800/80">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 px-3.5 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-150",
            pathname === "/settings"
              ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white border border-slate-200/90 dark:border-zinc-700/60 font-semibold"
              : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900/80"
          )}
        >
          <Settings className="h-5 w-5 text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors" />
          <span>ตั้งค่า</span>
        </Link>
      </div>
    </aside>
  );
}
