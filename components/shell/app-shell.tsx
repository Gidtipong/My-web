"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Fab } from "@/components/shell/fab";
import { CommandPalette } from "@/components/shell/command-palette";
import { QuickTaskModal } from "@/components/shell/quick-task-modal";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);

  const isAuthPage =
    pathname === "/login" ||
    pathname?.startsWith("/auth") ||
    pathname === "/pending-approval";

  // Global Keyboard Shortcuts Handler
  // Ctrl/Cmd + K : Open command palette
  // N : Open Quick New Task
  // C : Go to New Case
  // / : Open search / command palette
  useEffect(() => {
    if (isAuthPage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keys if user is typing inside an input/textarea/select
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (!isInput && !commandPaletteOpen && !quickTaskOpen) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          setQuickTaskOpen(true);
        } else if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          router.push("/cases/new");
        } else if (e.key === "/") {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, quickTaskOpen, router, isAuthPage]);

  // If on login/auth page, render clean full-screen view without dashboard chrome
  if (isAuthPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* 1. Desktop Sidebar (7 navigation items + Settings) */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Topbar with Bangkok time, search trigger, theme switcher */}
        <Topbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8 overflow-y-auto">
          {children}
        </main>

        {/* 3. Mobile Bottom Nav (4 items: Dashboard, Tasks, [+], Cases) */}
        <BottomNav onQuickAdd={() => setQuickTaskOpen(true)} />

        {/* 4. Floating Action Button "+ New Task" bottom-right on all pages */}
        <Fab onClick={() => setQuickTaskOpen(true)} />
      </div>

      {/* 5. Command Palette (Ctrl/Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenQuickTask={() => setQuickTaskOpen(true)}
      />

      {/* 6. Quick Add Task Modal (< 10s Fast Entry) */}
      <QuickTaskModal
        isOpen={quickTaskOpen}
        onClose={() => setQuickTaskOpen(false)}
      />
    </div>
  );
}
