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
  {
    value: "TASK",
    label: "งานทั่วไป",
    bg: "#E8F3EE",
    text: "#234E42",
    dot: "#52796F",
    dotClass: "bg-[#52796F]",
  },
  {
    value: "INCIDENT",
    label: "แก้ปัญหา",
    bg: "#FCECEC",
    text: "#7F2929",
    dot: "#C96A6A",
    dotClass: "bg-[#C96A6A]",
  },
  {
    value: "MAINTENANCE",
    label: "บำรุงรักษา",
    bg: "#EBF2FA",
    text: "#24476E",
    dot: "#5B82B0",
    dotClass: "bg-[#5B82B0]",
  },
  {
    value: "AUDIT",
    label: "ตรวจสอบ",
    bg: "#F2EFFB",
    text: "#43326B",
    dot: "#8370B5",
    dotClass: "bg-[#8370B5]",
  },
] as const;

const EVENT_PALETTE: Record<string, { bg: string; text: string; dot: string }> = {
  TASK: { bg: "#E8F3EE", text: "#1E293B", dot: "#52796F" },
  INCIDENT: { bg: "#FCECEC", text: "#7F2929", dot: "#C96A6A" },
  MAINTENANCE: { bg: "#EBF2FA", text: "#24476E", dot: "#5B82B0" },
  AUDIT: { bg: "#F2EFFB", text: "#43326B", dot: "#8370B5" },
  CHANGE: { bg: "#FDF3E7", text: "#664219", dot: "#C28848" },
};

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

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Map tasks to soft pastel pill events
  const events = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate || t.startAt)
        .map((t) => {
          const palette =
            t.status === "DONE"
              ? { bg: "#EFF5F2", text: "#3B5E54", dot: "#6B9080" }
              : EVENT_PALETTE[t.type] || EVENT_PALETTE.TASK;

          const isMaintenanceWindow = !!(t.startAt && t.endAt);
          const start = isMaintenanceWindow
            ? new Date(t.startAt).toISOString()
            : toDateKey(t.dueDate);
          const end = isMaintenanceWindow ? new Date(t.endAt).toISOString() : undefined;

          return {
            id: t.id,
            title: `${t.status === "DONE" ? "✓ " : ""}${t.title}`,
            start,
            end,
            allDay: !isMaintenanceWindow,
            backgroundColor: palette.bg,
            borderColor: "transparent",
            textColor: palette.text,
            extendedProps: {
              dotColor: palette.dot,
              isDone: t.status === "DONE",
            },
          };
        }),
    [tasks]
  );

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
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Seamless Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B] dark:text-white">
            ปฏิทินบันทึกงาน
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            กดที่ช่องวันที่ใดก็ได้ เพื่อดูรายการหรือบันทึกว่าวันนั้นทำอะไรบ้าง
          </p>
        </div>

        <button
          type="button"
          onClick={() => openDateModal(toDateKey(new Date()))}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#52796F] hover:bg-[#43665D] text-white text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.2]" />
          <span>บันทึกงานวันนี้</span>
        </button>
      </div>

      {/* Subtle Pastel Legend */}
      <div className="flex flex-wrap items-center gap-5 px-1 text-sm text-slate-600 dark:text-zinc-400">
        {TYPE_OPTIONS.map((opt) => (
          <span key={opt.value} className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${opt.dotClass}`} />
            <span>{opt.label}</span>
          </span>
        ))}
      </div>

      {notification && (
        <div className="px-4 py-3 rounded-xl bg-[#EAF2EF] dark:bg-[#52796F]/20 text-sm font-medium text-[#2F5249] dark:text-[#A3C4B8]">
          {notification}
        </div>
      )}

      {/* Clean Airy FullCalendar Container */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
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
          eventContent={(arg) => {
            const dotColor = arg.event.extendedProps?.dotColor || "#52796F";
            const isDone = arg.event.extendedProps?.isDone;
            return (
              <div className="flex items-center gap-1.5 px-2 py-0.5 truncate">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className={`truncate text-xs font-medium ${isDone ? "opacity-75" : ""}`}>
                  {arg.event.title}
                </span>
              </div>
            );
          }}
          height="auto"
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
        />
      </div>

      {/* Interactive Day Log & Activity Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-150"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[#1E293B] dark:text-zinc-100 shadow-[0_20px_50px_rgba(15,23,42,0.12)] p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <p className="text-xs font-semibold text-[#52796F] dark:text-[#A3C4B8]">
                  บันทึกประจำวัน
                </p>
                <h2 className="text-xl font-bold text-[#1E293B] dark:text-white mt-0.5">
                  {formatThaiDate(selectedDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="ปิดหน้าต่าง"
                className="rounded-xl p-2 text-slate-400 hover:text-[#1E293B] dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Items for This Date */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                รายการในวันนี้ ({selectedDayTasks.length})
              </h3>

              {selectedDayTasks.length === 0 ? (
                <div className="rounded-xl bg-[#F8FAFC] dark:bg-zinc-900/50 p-5 text-center text-sm text-slate-500 dark:text-zinc-400">
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
                        className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900/60"
                      >
                        <button
                          type="button"
                          disabled={togglingId === t.id}
                          onClick={() => handleToggleDone(t)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-[#52796F] dark:hover:text-[#A3C4B8] transition-colors cursor-pointer"
                          title={isDone ? "เปลี่ยนเป็นยังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                        >
                          {togglingId === t.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[#52796F]" />
                          ) : isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-[#52796F] dark:text-[#A3C4B8]" />
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
                                  : "text-[#1E293B] dark:text-white"
                              }`}
                            >
                              {t.title}
                            </span>
                            {typeInfo && (
                              <span
                                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: typeInfo.bg,
                                  color: typeInfo.text,
                                }}
                              >
                                {typeInfo.label}
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                        </div>

                        <Link
                          href={`/tasks/${t.id}`}
                          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-[#52796F] dark:hover:text-[#A3C4B8] hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
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

            {/* Add New Activity Form */}
            <form
              onSubmit={handleAddDayEntry}
              className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-4"
            >
              <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#52796F]" />
                เพิ่มบันทึกว่าวันนี้ทำอะไร
              </h3>

              {formError && (
                <div className="p-3 rounded-xl bg-[#FCECEC] text-sm text-[#7F2929]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  สิ่งที่ทำ / ชื่อกิจกรรม <span className="text-[#C96A6A]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เช็กสาย LAN ชั้น 2, เปลี่ยน Switch, แก้เน็ตหลุด"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-[#F8FAFC] dark:bg-zinc-900 px-3.5 py-2.5 text-base text-[#1E293B] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-[#52796F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#52796F]/15"
                />
              </div>

              {/* Status Toggle: Done vs To Do */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTaskStatus("DONE")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    taskStatus === "DONE"
                      ? "bg-[#52796F] text-white"
                      : "bg-[#F8FAFC] dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>ทำเสร็จแล้ว</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskStatus("TODO")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    taskStatus === "TODO"
                      ? "bg-[#5B82B0] text-white"
                      : "bg-[#F8FAFC] dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
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
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        taskType === opt.value
                          ? "bg-[#EAF2EF] text-[#2F5249] ring-1 ring-[#52796F]/40 font-semibold"
                          : "bg-[#F8FAFC] dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotClass}`} />
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
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-[#F8FAFC] dark:bg-zinc-900 px-3.5 py-2 text-sm text-[#1E293B] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-[#52796F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#52796F]/15"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#52796F] hover:bg-[#43665D] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
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
        /* Ultra-Minimalist FullCalendar Light Mode */
        .fc {
          --fc-border-color: rgba(226, 232, 240, 0.75);
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #f8fafc;
          --fc-list-event-hover-bg-color: #f1f5f9;
          --fc-today-bg-color: rgba(82, 121, 111, 0.05);
          font-family: inherit;
          color: #1e293b;
        }
        .fc .fc-theme-standard td,
        .fc .fc-theme-standard th,
        .fc .fc-scrollgrid {
          border-color: rgba(226, 232, 240, 0.7) !important;
        }
        .fc .fc-toolbar {
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.25rem !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e293b;
        }
        .fc .fc-button-primary {
          background-color: #f1f5f9;
          border: none;
          border-radius: 0.65rem;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.45rem 0.9rem;
          box-shadow: none;
        }
        .fc .fc-button-primary:hover {
          background-color: #e2e8f0;
          color: #1e293b;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #52796f;
          color: #ffffff;
          font-weight: 600;
        }
        .fc .fc-col-header-cell {
          background-color: #f8fafc;
        }
        .fc .fc-col-header-cell-cushion {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.65rem 0;
        }
        .fc .fc-daygrid-day-number {
          color: #475569;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.5rem 0.6rem;
        }
        .fc .fc-daygrid-day {
          min-height: 110px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .fc .fc-daygrid-day:hover {
          background-color: rgba(82, 121, 111, 0.04);
        }
        .fc .fc-day-today {
          background-color: rgba(82, 121, 111, 0.05) !important;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          color: #2f5249;
          background-color: #eaf2ef;
          border-radius: 9999px;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 4px;
          padding: 0;
          font-weight: 700;
        }
        /* Soft, Modern Pill-Shaped Event Tags */
        .fc .fc-event {
          border-radius: 9999px !important;
          border: none !important;
          cursor: pointer;
          margin: 2px 4px !important;
          padding: 2px 6px !important;
          box-shadow: none !important;
        }
        .fc .fc-event:hover {
          filter: brightness(0.97);
        }
        .fc .fc-more-link {
          color: #52796f;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 2px 6px;
        }

        /* Dark Mode Overrides */
        .dark .fc {
          --fc-border-color: rgba(39, 39, 42, 0.8);
          --fc-page-bg-color: #09090b;
          --fc-neutral-bg-color: #18181b;
          --fc-list-event-hover-bg-color: #27272a;
          --fc-today-bg-color: rgba(82, 121, 111, 0.1);
          color: #f4f4f5;
        }
        .dark .fc .fc-theme-standard td,
        .dark .fc .fc-theme-standard th,
        .dark .fc .fc-scrollgrid {
          border-color: rgba(39, 39, 42, 0.8) !important;
        }
        .dark .fc .fc-toolbar-title {
          color: #f4f4f5;
        }
        .dark .fc .fc-button-primary {
          background-color: #18181b;
          color: #d4d4d8;
        }
        .dark .fc .fc-button-primary:hover {
          background-color: #27272a;
          color: #ffffff;
        }
        .dark .fc .fc-button-primary:not(:disabled).fc-button-active,
        .dark .fc .fc-button-primary:not(:disabled):active {
          background-color: #52796f;
          color: #ffffff;
        }
        .dark .fc .fc-col-header-cell {
          background-color: #18181b;
        }
        .dark .fc .fc-col-header-cell-cushion {
          color: #a1a1aa;
        }
        .dark .fc .fc-daygrid-day-number {
          color: #d4d4d8;
        }
        .dark .fc .fc-day-today .fc-daygrid-day-number {
          color: #a3c4b8;
          background-color: rgba(82, 121, 111, 0.25);
        }
      `}</style>
    </div>
  );
}
