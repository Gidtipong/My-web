"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";
import { createTask, updateTask, updateTaskSchedule } from "@/app/actions/tasks";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  Plus,
  X,
} from "lucide-react";

interface CalendarViewProps {
  tasks: any[];
}

const TYPE_OPTIONS = [
  { value: "TASK", label: "งานทั่วไป", color: "#10b981", dotClass: "bg-emerald-500" },
  { value: "INCIDENT", label: "แก้ปัญหา / แจ้งซ่อม", color: "#ef4444", dotClass: "bg-red-500" },
  { value: "MAINTENANCE", label: "บำรุงรักษา", color: "#3b82f6", dotClass: "bg-blue-500" },
  { value: "AUDIT", label: "ตรวจสอบ", color: "#8b5cf6", dotClass: "bg-purple-500" },
] as const;

function toDateKey(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatThaiDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CalendarView({ tasks: initialTasks }: CalendarViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected date modal state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"TASK" | "INCIDENT" | "MAINTENANCE" | "AUDIT">("TASK");
  const [taskStatus, setTaskStatus] = useState<"DONE" | "TODO">("DONE");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Keep local list synced if server props refresh
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Map tasks to FullCalendar events
  const events = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate || t.startAt)
        .map((t) => {
          let color = "#10b981";
          if (t.type === "INCIDENT") color = "#ef4444";
          else if (t.type === "CHANGE") color = "#f97316";
          else if (t.type === "MAINTENANCE") color = "#3b82f6";
          else if (t.type === "AUDIT") color = "#8b5cf6";

          const isMaintenanceWindow = !!(t.startAt && t.endAt);
          const start = isMaintenanceWindow
            ? new Date(t.startAt).toISOString()
            : toDateKey(t.dueDate);
          const end = isMaintenanceWindow ? new Date(t.endAt).toISOString() : undefined;

          return {
            id: t.id,
            title: `${t.status === "DONE" ? "✓ " : ""}${t.title}${t.device ? ` (${t.device.hostname})` : ""}`,
            start,
            end,
            allDay: !isMaintenanceWindow,
            backgroundColor: t.status === "DONE" ? "#059669" : color,
            borderColor: t.status === "DONE" ? "#059669" : color,
            textColor: "#ffffff",
          };
        }),
    [tasks]
  );

  // Tasks belonging to the currently opened date modal
  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => {
      const target = t.dueDate || t.startAt;
      if (!target) return false;
      return toDateKey(target) === selectedDate;
    });
  }, [tasks, selectedDate]);

  const openDateModal = (dateStr: string) => {
    const todayKey = toDateKey(new Date());
    setSelectedDate(dateStr);
    setTitle("");
    setDescription("");
    setTaskType("TASK");
    setTaskStatus(dateStr <= todayKey ? "DONE" : "TODO");
    setFormError(null);
  };

  const handleDateClick = (info: any) => {
    const clickedKey = info.dateStr ? info.dateStr.slice(0, 10) : toDateKey(info.date);
    openDateModal(clickedKey);
  };

  const handleEventDrop = async (info: any) => {
    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end;

    showToast(`ย้าย "${info.event.title}" ไปวันที่ ${newStart.toLocaleDateString("th-TH")}`);
    const res = await updateTaskSchedule(taskId, newStart, newEnd);
    if (!res.success) {
      info.revert();
      alert("ไม่สามารถย้ายวันได้: " + res.error);
    } else {
      router.refresh();
    }
  };

  const handleEventResize = async (info: any) => {
    const taskId = info.event.id;
    const res = await updateTaskSchedule(taskId, info.event.start, info.event.end);
    if (!res.success) {
      info.revert();
      alert("ไม่สามารถปรับเวลาได้: " + res.error);
    } else {
      showToast("อัปเดตช่วงเวลาเรียบร้อย");
      router.refresh();
    }
  };

  const handleEventClick = (info: any) => {
    const task = tasks.find((t) => t.id === info.event.id);
    const target = task?.dueDate || task?.startAt || info.event.start;
    if (target) {
      openDateModal(toDateKey(target));
    } else {
      router.push(`/tasks/${info.event.id}`);
    }
  };

  const handleAddDayEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    if (!title.trim()) {
      setFormError("กรุณากรอกว่าวันนี้ทำอะไร หรือมีงานอะไร");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dueDate = new Date(y, m - 1, d, 12, 0, 0);

      const res = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        type: taskType,
        priority: "P3",
        status: taskStatus,
        dueDate,
      });

      if (!res.success || !res.data) {
        setFormError(res.error || "ไม่สามารถบันทึกข้อมูลได้");
      } else {
        setTasks((prev) => [...prev, res.data]);
        setTitle("");
        setDescription("");
        showToast(`บันทึก "${res.data.title}" ลงวันที่ ${formatThaiDate(selectedDate)} แล้ว`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("nettask:refresh-badges"));
        }
        router.refresh();
      }
    } catch (err: any) {
      setFormError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDone = async (task: any) => {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    setTogglingId(task.id);
    try {
      const res = await updateTask(task.id, { status: nextStatus });
      if (res.success) {
        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("nettask:refresh-badges"));
        }
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Unified Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              ปฏิทินบันทึกงาน
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            กดที่ช่องวันที่ใดก็ได้ เพื่อดูรายการหรือเพิ่มบันทึกว่าวันนั้นทำอะไรบ้าง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openDateModal(toDateKey(new Date()))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>บันทึกงานวันนี้</span>
          </button>
        </div>
      </div>

      {/* Simple Color Legend */}
      <div className="flex flex-wrap items-center gap-4 px-2 text-sm text-slate-700 dark:text-zinc-300">
        {TYPE_OPTIONS.map((opt) => (
          <span key={opt.value} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${opt.dotClass}`} />
            <span>{opt.label}</span>
          </span>
        ))}
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          {notification}
        </div>
      )}

      {/* FullCalendar Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-6 shadow-xs">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin] as any}
          locale={thLocale}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "วันนี้",
            month: "เดือน",
            week: "สัปดาห์",
            day: "วัน",
          }}
          editable={true}
          droppable={true}
          selectable={true}
          dateClick={handleDateClick}
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

      {/* Interactive Day Log & Activity Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-2xl p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  บันทึกประจำวัน
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatThaiDate(selectedDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="ปิดหน้าต่าง"
                className="rounded-xl p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Items for This Date */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                รายการในวันนี้ ({selectedDayTasks.length})
              </h3>

              {selectedDayTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 p-4 text-center text-sm text-slate-500 dark:text-zinc-400">
                  ยังไม่มีบันทึกในวันนี้ — เพิ่มรายการด้านล่างได้เลย
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedDayTasks.map((t) => {
                    const isDone = t.status === "DONE";
                    const typeInfo = TYPE_OPTIONS.find((opt) => opt.value === t.type);
                    return (
                      <div
                        key={t.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60"
                      >
                        <button
                          type="button"
                          disabled={togglingId === t.id}
                          onClick={() => handleToggleDone(t)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                          title={isDone ? "เปลี่ยนเป็นยังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                        >
                          {togglingId === t.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                          ) : isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-semibold ${
                                isDone
                                  ? "line-through text-slate-400 dark:text-zinc-500"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {t.title}
                            </span>
                            {typeInfo && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                {typeInfo.label}
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                        </div>

                        <Link
                          href={`/tasks/${t.id}`}
                          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition"
                          title="เปิดดูรายละเอียด"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Activity Form for This Date */}
            <form
              onSubmit={handleAddDayEntry}
              className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                เพิ่มบันทึกว่าวันนี้ทำอะไร
              </h3>

              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  สิ่งที่ทำ / ชื่อกิจกรรม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เช็กสาย LAN ชั้น 2, เปลี่ยน Switch, แก้เน็ตหลุด"
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Status Toggle: Done vs To Do */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTaskStatus("DONE")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                    taskStatus === "DONE"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>ทำเสร็จแล้ว</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskStatus("TODO")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                    taskStatus === "TODO"
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Circle className="h-4 w-4" />
                  <span>วางแผนไว้ (ยังไม่ทำ)</span>
                </button>
              </div>

              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  ประเภทงาน
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTaskType(opt.value)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer ${
                        taskType === opt.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                          : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.dotClass}`} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Details */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  รายละเอียดเพิ่มเติม (ไม่บังคับ)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="บันทึกหมายเหตุ จุดที่แก้ไข หรือผลลัพธ์..."
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>บันทึกลงวันที่นี้</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        .fc .fc-toolbar {
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }
        .fc .fc-button-primary {
          background-color: #ffffff;
          border-color: #cbd5e1;
          color: #334155;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.45rem 0.85rem;
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
          color: #334155;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.6rem 0;
        }
        .fc .fc-daygrid-day-number {
          color: #1e293b;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.4rem 0.55rem;
        }
        .fc .fc-daygrid-day {
          min-height: 105px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .fc .fc-daygrid-day:hover {
          background-color: rgba(16, 185, 129, 0.05);
        }
        .fc .fc-day-today {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          color: #059669;
          font-weight: 800;
        }
        .fc .fc-event {
          border-radius: 6px;
          border: none;
          cursor: pointer;
          margin-bottom: 3px;
          padding: 2px 5px;
          font-size: 0.8rem;
          font-weight: 500;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.08);
        }
        .fc .fc-more-link {
          color: #059669;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 2px 4px;
        }

        /* Dark Mode Overrides */
        .dark .fc {
          --fc-border-color: #27272a;
          --fc-page-bg-color: #09090b;
          --fc-neutral-bg-color: #18181b;
          --fc-list-event-hover-bg-color: #27272a;
          --fc-today-bg-color: rgba(16, 185, 129, 0.12);
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
          color: #d4d4d8;
        }
        .dark .fc .fc-daygrid-day-number {
          color: #e4e4e7;
        }
        .dark .fc .fc-daygrid-day:hover {
          background-color: rgba(16, 185, 129, 0.08);
        }
        .dark .fc .fc-day-today {
          background-color: rgba(16, 185, 129, 0.12) !important;
        }
        .dark .fc .fc-day-today .fc-daygrid-day-number {
          color: #34d399;
        }
        .dark .fc .fc-more-link {
          color: #34d399;
        }
        .dark .fc .fc-timegrid-slot-label-cushion {
          color: #a1a1aa;
        }
      `}</style>
    </div>
  );
}
