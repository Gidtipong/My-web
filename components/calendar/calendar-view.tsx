"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { updateTaskSchedule } from "@/app/actions/tasks";
import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";

interface CalendarViewProps {
  tasks: any[];
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const router = useRouter();
  const [notification, setNotification] = useState<string | null>(null);

  // Map tasks to FullCalendar event format
  const events = tasks
    .filter((t) => t.dueDate || t.startAt)
    .map((t) => {
      let color = "#10b981"; // Task (emerald)
      if (t.type === "INCIDENT") color = "#ef4444"; // Red
      else if (t.type === "CHANGE") color = "#f97316"; // Orange
      else if (t.type === "MAINTENANCE") color = "#3b82f6"; // Blue
      else if (t.type === "AUDIT") color = "#8b5cf6"; // Purple

      const isMaintenanceWindow = !!(t.startAt && t.endAt);
      
      let start: string | Date;
      let end: string | Date | undefined;

      if (isMaintenanceWindow) {
        start = new Date(t.startAt).toISOString();
        end = new Date(t.endAt).toISOString();
      } else {
        const d = new Date(t.dueDate);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        start = `${y}-${m}-${day}`;
      }

      return {
        id: t.id,
        title: `[${t.priority}] ${t.title}${t.device ? ` (${t.device.hostname})` : ""}${t.status === "DONE" ? " ✓" : ""}`,
        start,
        end,
        allDay: !isMaintenanceWindow,
        backgroundColor: color,
        borderColor: color,
        textColor: "#ffffff",
        extendedProps: {
          type: t.type,
          priority: t.priority,
          status: t.status,
          isMaintenanceWindow,
          deviceHostname: t.device?.hostname,
          siteName: t.site?.name,
        },
      };
    });

  // Handle Drag to Reschedule
  const handleEventDrop = async (info: any) => {
    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end;

    setNotification(`Rescheduled "${info.event.title.slice(0, 30)}..." to ${newStart.toLocaleDateString()}`);
    setTimeout(() => setNotification(null), 3000);

    const res = await updateTaskSchedule(taskId, newStart, newEnd);
    if (!res.success) {
      info.revert();
      alert("Failed to reschedule task: " + res.error);
    }
  };

  // Handle Resize of Maintenance Windows
  const handleEventResize = async (info: any) => {
    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end;

    setNotification(`Updated window for "${info.event.title.slice(0, 30)}..."`);
    setTimeout(() => setNotification(null), 3000);

    const res = await updateTaskSchedule(taskId, newStart, newEnd);
    if (!res.success) {
      info.revert();
      alert("Failed to update window: " + res.error);
    }
  };

  // Handle Click Event -> Navigate to Task Detail
  const handleEventClick = (info: any) => {
    router.push(`/tasks/${info.event.id}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Type Color Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Operations Calendar</h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Drag events to reschedule. Switch to Week View to check for overlapping Maintenance Windows.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" /> Incident
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-orange-500/20" /> Change
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" /> Audit
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" /> Task
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 animate-in fade-in">
          {notification}
        </div>
      )}

      {/* FullCalendar Container */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin] as any}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          editable={true}
          droppable={true}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          events={events}
          height="auto"
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
        />
      </div>

      <style jsx global>{`
        /* FullCalendar Base & Light Mode */
        .fc {
          --fc-border-color: #e2e8f0;
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #f8fafc;
          --fc-list-event-hover-bg-color: #f1f5f9;
          --fc-today-bg-color: rgba(16, 185, 129, 0.08);
          font-family: inherit;
          color: #0f172a;
        }
        .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
        }
        .fc .fc-button-primary {
          background-color: #ffffff;
          border-color: #cbd5e1;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: capitalize;
          padding: 0.35rem 0.75rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .fc .fc-button-primary:hover {
          background-color: #f1f5f9;
          border-color: #94a3b8;
          color: #0f172a;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #10b981;
          border-color: #10b981;
          color: #ffffff;
          font-weight: 700;
        }
        .fc .fc-col-header-cell {
          background-color: #f8fafc;
          border-color: #e2e8f0;
        }
        .fc .fc-col-header-cell-cushion {
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: monospace;
          padding: 0.5rem 0;
          text-transform: uppercase;
        }
        .fc .fc-daygrid-day-number {
          color: #334155;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: monospace;
          padding: 0.35rem 0.5rem;
        }
        .fc .fc-daygrid-day {
          min-height: 100px;
        }
        .fc .fc-day-today {
          background-color: rgba(16, 185, 129, 0.06) !important;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          color: #059669;
          font-weight: 800;
        }
        .fc .fc-event {
          border-radius: 6px;
          border: none;
          cursor: pointer;
          margin-bottom: 2px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.08);
        }
        .fc .fc-more-link {
          color: #059669;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 1px 4px;
        }

        /* Dark Mode Overrides */
        .dark .fc {
          --fc-border-color: #27272a;
          --fc-page-bg-color: #09090b;
          --fc-neutral-bg-color: #18181b;
          --fc-list-event-hover-bg-color: #27272a;
          --fc-today-bg-color: rgba(16, 185, 129, 0.1);
          color: #f4f4f5;
        }
        .dark .fc .fc-toolbar-title {
          color: #f4f4f5;
        }
        .dark .fc .fc-button-primary {
          background-color: #27272a;
          border-color: #3f3f46;
          color: #e4e4e7;
        }
        .dark .fc .fc-button-primary:hover {
          background-color: #3f3f46;
          border-color: #52525b;
          color: #ffffff;
        }
        .dark .fc .fc-button-primary:not(:disabled).fc-button-active,
        .dark .fc .fc-button-primary:not(:disabled):active {
          background-color: #10b981;
          border-color: #10b981;
          color: #09090b;
        }
        .dark .fc .fc-col-header-cell {
          background-color: #18181b;
          border-color: #27272a;
        }
        .dark .fc .fc-col-header-cell-cushion {
          color: #a1a1aa;
        }
        .dark .fc .fc-daygrid-day-number {
          color: #a1a1aa;
        }
        .dark .fc .fc-day-today {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }
        .dark .fc .fc-day-today .fc-daygrid-day-number {
          color: #34d399;
        }
        .dark .fc .fc-more-link {
          color: #34d399;
        }
        .dark .fc .fc-timegrid-slot-label-cushion {
          color: #71717a;
        }
      `}</style>
    </div>
  );
}
