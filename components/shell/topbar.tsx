"use client";

import React from "react";
import { Search, Moon, Sun, Bell, Terminal, Wifi } from "lucide-react";
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
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile Brand & Search Trigger */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex md:hidden items-center gap-2 font-bold text-zinc-100">
          <div className="h-7 w-7 rounded-md bg-emerald-500 flex items-center justify-center text-zinc-950">
            <Terminal className="h-4 w-4 text-zinc-950 stroke-[2.5]" />
          </div>
          <span className="text-base tracking-tight">NetTask</span>
        </div>

        {/* Global Command Palette search input / trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Search tasks, cases, devices...</span>
          <span className="inline sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Telemetry, Clock, Theme Toggle & Engineer Profile */}
      <div className="flex items-center gap-3">
        {/* Bangkok Live Time Telemetry */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300">
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-zinc-400">BKK:</span>
          <span className="font-semibold text-emerald-400">{currentTime || "--:--:--"}</span>
          <span className="text-[10px] text-zinc-400">UTC+7</span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          aria-label="Toggle Theme"
          onClick={() => {
            const next = (resolvedTheme || theme) === "dark" ? "light" : "dark";
            setTheme(next);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          title={(resolvedTheme || theme) === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mounted && (resolvedTheme || theme) === "light" ? (
            <Moon className="h-4 w-4 text-zinc-700" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center font-mono text-xs font-bold text-white border border-emerald-500/40 shadow-sm">
            NE
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium text-zinc-200">Network Admin</span>
            <span className="text-[10px] text-emerald-400 font-mono">On Duty</span>
          </div>
        </div>
      </div>
    </header>
  );
}
