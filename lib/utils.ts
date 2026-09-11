import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { th } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date in Asia/Bangkok timezone with Thai locale
 */
export function formatDateBangkok(
  date: Date | string | number | null | undefined,
  formatStr = "dd MMM yyyy HH:mm"
): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return format(d, formatStr, { locale: th });
}

/**
 * Format relative time in Thai (e.g. "3 นาทีที่แล้ว")
 */
export function formatRelativeBangkok(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return formatDistanceToNow(d, { addSuffix: true, locale: th });
}

/**
 * Check if a date is within `days` days from now (warning state e.g. warranty/license)
 */
export function isExpiringSoon(date: Date | string | null | undefined, days = 30): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  const future = addDays(now, days);
  return isAfter(d, now) && isBefore(d, future);
}

/**
 * Check if a due date is overdue
 */
export function isOverdue(dueDate: Date | string | null | undefined, status?: string): boolean {
  if (!dueDate) return false;
  if (status === "DONE" || status === "CANCELLED") return false;
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (isNaN(d.getTime())) return false;

  return isBefore(d, new Date());
}

/**
 * Color System mapping:
 * Red    → P1 / overdue / INCIDENT
 * Orange → P2 / CHANGE
 * Blue   → P3 / MAINTENANCE / IN_PROGRESS
 * Gray   → P4 / DONE
 * Green  → healthy / completed
 * Yellow → warning (expiring within 30 days)
 */

export function getPriorityStyles(priority: string) {
  switch (priority) {
    case "P1":
      return {
        bg: "bg-red-500/15 text-red-400 border-red-500/30",
        badge: "bg-red-500 text-white",
        dot: "bg-red-500",
        label: "P1 - Critical",
      };
    case "P2":
      return {
        bg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        badge: "bg-orange-500 text-white",
        dot: "bg-orange-500",
        label: "P2 - High",
      };
    case "P3":
      return {
        bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        badge: "bg-blue-500 text-white",
        dot: "bg-blue-500",
        label: "P3 - Medium",
      };
    case "P4":
    default:
      return {
        bg: "bg-gray-500/15 text-gray-400 border-gray-500/30",
        badge: "bg-gray-500 text-white",
        dot: "bg-gray-500",
        label: "P4 - Low",
      };
  }
}

export function getTaskTypeStyles(type: string) {
  switch (type) {
    case "INCIDENT":
      return {
        bg: "bg-red-500/15 text-red-400 border-red-500/30",
        label: "Incident",
      };
    case "CHANGE":
      return {
        bg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        label: "Change",
      };
    case "MAINTENANCE":
      return {
        bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        label: "Maintenance",
      };
    case "AUDIT":
      return {
        bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        label: "Audit",
      };
    case "TASK":
    default:
      return {
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        label: "General Task",
      };
  }
}

export function getTaskStatusStyles(status: string) {
  switch (status) {
    case "TODO":
      return {
        bg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
        dot: "bg-slate-400",
        label: "To Do",
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        dot: "bg-blue-500",
        label: "In Progress",
      };
    case "BLOCKED":
      return {
        bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        dot: "bg-amber-500",
        label: "Blocked",
      };
    case "DONE":
      return {
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-500",
        label: "Completed",
      };
    case "CANCELLED":
      return {
        bg: "bg-gray-500/15 text-gray-400 border-gray-500/30",
        dot: "bg-gray-500",
        label: "Cancelled",
      };
    default:
      return {
        bg: "bg-gray-500/15 text-gray-400 border-gray-500/30",
        dot: "bg-gray-400",
        label: status,
      };
  }
}

export function getDeviceStatusStyles(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-500",
        label: "Active (Healthy)",
      };
    case "MAINTENANCE":
      return {
        bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        dot: "bg-blue-500",
        label: "Maintenance",
      };
    case "RETIRED":
      return {
        bg: "bg-gray-500/15 text-gray-400 border-gray-500/30",
        dot: "bg-gray-500",
        label: "Retired",
      };
    default:
      return {
        bg: "bg-gray-500/15 text-gray-400 border-gray-500/30",
        dot: "bg-gray-400",
        label: status,
      };
  }
}
