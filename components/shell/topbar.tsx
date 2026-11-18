"use client";

import React from "react";
import { Search, Moon, Sun, Terminal, LogOut } from "lucide-react";
import { useTheme } from "next-themes";

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenMobileMenu?: () => void;
}

export function Topbar({ onOpenCommandPalette }: TopbarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);

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
  }, []);

  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";
  const userDisplayName = userEmail ? userEmail.split("@")[0] : "ผู้ใช้งาน";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 px-4 md:px-6 backdrop-blur-md transition-colors">
      {/* Left: Mobile Brand & Search Trigger */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex md:hidden items-center gap-2 font-bold text-slate-900 dark:text-zinc-100">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Terminal className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
          <span className="text-lg tracking-tight font-bold">NetTask</span>
        </div>

        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/90 px-4 py-2 text-sm text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200 transition-all shadow-2xs group"
        >
          <Search className="h-4 w-4 text-slate-400 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors" />
          <span className="hidden sm:inline">ค้นหางาน, ปัญหา, อุปกรณ์...</span>
          <span className="inline sm:hidden">ค้นหา...</span>
        </button>
      </div>

      {/* Right: Theme Toggle & User Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          aria-label="สลับโหมดสี"
          onClick={() => {
            const next = (resolvedTheme || theme) === "dark" ? "light" : "dark";
            setTheme(next);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-2xs"
          title={(resolvedTheme || theme) === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
        >
          {mounted && (resolvedTheme || theme) === "light" ? (
            <Moon className="h-4 w-4 text-slate-700" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </button>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-zinc-800">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-500/40 shadow-xs">
            {userInitials}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-200 truncate max-w-[160px]" title={userEmail || "ผู้ใช้งาน"}>
              {userDisplayName}
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              const [{ createClient }, { clearSessionMarker }] = await Promise.all([
                import("@/lib/supabase"),
                import("@/app/actions/auth-security"),
              ]);
              const supabase = createClient();
              await supabase.auth.signOut();
              await clearSessionMarker();
              window.location.href = "/login";
            }}
            title="ออกจากระบบ"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition-all shadow-2xs cursor-pointer text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออก</span>
          </button>
        </div>
      </div>
    </header>
  );
}
