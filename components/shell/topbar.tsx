"use client";

import React from "react";
import { Search, Moon, Sun, Bell, Terminal, Wifi, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenMobileMenu?: () => void;
}

export function Topbar({ onOpenCommandPalette }: TopbarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState("");
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const bkkTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      setCurrentTime(bkkTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const fetchUser = async () => {
      try {
        const { createClient } = await import("@/lib/supabase");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      } catch {
        // silent
      }
    };
    fetchUser();

    return () => clearInterval(interval);
  }, []);

  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "NE";
  const userDisplayName = userEmail ? userEmail.split("@")[0] : "Network Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-4 md:px-6 backdrop-blur-md transition-colors">
      {/* Left: Mobile Brand & Search Trigger */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex md:hidden items-center gap-2 font-bold text-slate-900 dark:text-zinc-100">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Terminal className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
          <span className="text-base tracking-tight font-semibold">NetTask</span>
        </div>

        {/* Global Command Palette search input / trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/90 px-3.5 py-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200 transition-all shadow-2xs group"
        >
          <Search className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors" />
          <span className="hidden sm:inline">Search tasks, cases, devices...</span>
          <span className="inline sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-white dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 shadow-2xs">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Telemetry, Clock, Theme Toggle & Engineer Profile */}
      <div className="flex items-center gap-3">
        {/* Bangkok Live Time Telemetry */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-xs text-slate-700 dark:text-zinc-300 shadow-2xs">
          <Wifi className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          <span className="text-slate-400 dark:text-zinc-500">BKK:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentTime || "--:--:--"}</span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">UTC+7</span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          aria-label="Toggle Theme"
          onClick={() => {
            const next = (resolvedTheme || theme) === "dark" ? "light" : "dark";
            setTheme(next);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-2xs hover:scale-105 active:scale-95"
          title={(resolvedTheme || theme) === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mounted && (resolvedTheme || theme) === "light" ? (
            <Moon className="h-4 w-4 text-slate-700" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </button>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-zinc-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center font-mono text-xs font-bold text-white border border-emerald-500/40 shadow-xs ring-2 ring-emerald-500/10">
            {userInitials}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 truncate max-w-[140px]" title={userEmail || "Network Admin"}>
              {userDisplayName}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              On Duty
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              const { createClient } = await import("@/lib/supabase");
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            title="ออกจากระบบ (Sign Out)"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition-all shadow-2xs cursor-pointer ml-1"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
