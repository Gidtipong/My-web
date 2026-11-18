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
      aria-label="เพิ่มงานใหม่"
      className="hidden md:flex fixed bottom-8 right-8 z-40 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-semibold px-5 py-3 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 border border-emerald-400/30 cursor-pointer group"
    >
      <Plus className="h-5 w-5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      <span className="text-sm">เพิ่มงานใหม่</span>
    </button>
  );
}
