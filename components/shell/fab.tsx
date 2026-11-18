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
      className="hidden md:flex fixed bottom-8 right-8 z-40 items-center gap-2 rounded-full bg-[#52796F] hover:bg-[#43665D] active:scale-[0.98] text-white font-semibold px-5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.12)] transition-all duration-150 cursor-pointer group"
    >
      <Plus className="h-4 w-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      <span className="text-sm">เพิ่มงานใหม่</span>
    </button>
  );
}
