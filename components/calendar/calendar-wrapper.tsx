"use client";

import React from "react";
import dynamic from "next/dynamic";

const CalendarView = dynamic(
  () => import("./calendar-view").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[650px] rounded-xl border border-zinc-800 bg-zinc-950 p-8 flex items-center justify-center text-zinc-500 text-sm animate-pulse">
        Loading interactive maintenance calendar...
      </div>
    ),
  }
);

interface CalendarWrapperProps {
  tasks: any[];
}

export function CalendarWrapper({ tasks }: CalendarWrapperProps) {
  return <CalendarView tasks={tasks} />;
}

