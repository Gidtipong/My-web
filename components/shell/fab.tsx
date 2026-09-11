"use client";

import React from "react";
import { Plus } from "lucide-react";

interface FabProps {
  onClick: () => void;
}

export function Fab({ onClick }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="New Task"
      className="hidden md:flex fixed bottom-8 right-8 z-40 items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-semibold px-4 py-3 shadow-xl shadow-emerald-500/25 transition-all duration-150 border border-emerald-400/40 cursor-pointer group"
    >
      <div className="rounded-full bg-zinc-950/20 p-1 group-hover:rotate-90 transition-transform duration-200">
        <Plus className="h-4 w-4 stroke-[3]" />
      </div>
      <span className="text-sm font-medium tracking-wide">New Task</span>
      <kbd className="hidden lg:inline-flex items-center rounded bg-emerald-600/30 px-1.5 py-0.5 text-[10px] font-mono text-zinc-950/80">
        N
      </kbd>
    </button>
  );
}
