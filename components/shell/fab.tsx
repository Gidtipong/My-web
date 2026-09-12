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
      className="hidden md:flex fixed bottom-8 right-8 z-40 items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-medium px-4 py-2.5 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 border border-emerald-400/30 cursor-pointer group"
    >
      <div className="rounded-full bg-white/20 p-1 group-hover:rotate-90 transition-transform duration-200">
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
      </div>
      <span className="text-xs font-semibold tracking-wide">New Task</span>
      <kbd className="hidden lg:inline-flex items-center rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-100 border border-white/10">
        N
      </kbd>
    </button>
  );
}
