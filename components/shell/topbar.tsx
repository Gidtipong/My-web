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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/70 bg-[#F8FAFC]/90 dark:bg-zinc-950/90 px-4 md:px-8 backdrop-blur-md transition-colors">
      {/* Left: Mobile Brand & Search Trigger */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex md:hidden items-center gap-2 font-bold text-[#1E293B] dark:text-zinc-100">
          <div className="h-8 w-8 rounded-xl bg-[#52796F] flex items-center justify-center text-white">
            <Terminal className="h-4 w-4 text-white stroke-[2.2]" />
          </div>
          <span className="text-lg tracking-tight font-bold">NetTask</span>
        </div>

        {/* Flat Search Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 px-4 py-2 text-sm text-slate-500 dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.04)] group cursor-pointer"
        >
          <Search className="h-4 w-4 text-slate-400 dark:text-zinc-500 group-hover:text-[#52796F] transition-colors" />
          <span className="hidden sm:inline">ค้นหางาน, ปัญหา...</span>
          <span className="inline sm:hidden">ค้นหา...</span>
        </button>
      </div>

      {/* Right: Flat Minimal Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          type="button"
          aria-label="สลับโหมดสี"
          onClick={() => {
            const next = (resolvedTheme || theme) === "dark" ? "light" : "dark";
            setTheme(next);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title={(resolvedTheme || theme) === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
        >
          {mounted && (resolvedTheme || theme) === "light" ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px] text-amber-400" />
          )}
        </button>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="h-8 w-8 rounded-full bg-[#EAF2EF] dark:bg-[#52796F]/25 flex items-center justify-center text-xs font-bold text-[#2F5249] dark:text-[#A3C4B8]">
            {userInitials}
          </div>
          <span
            className="hidden xl:inline text-sm font-medium text-[#1E293B] dark:text-zinc-200 truncate max-w-[160px]"
            title={userEmail || "ผู้ใช้งาน"}
          >
            {userDisplayName}
          </span>

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
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-slate-500 hover:text-rose-700 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออก</span>
          </button>
        </div>
      </div>
    </header>
  );
}
