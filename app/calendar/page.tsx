import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { CalendarWrapper } from "@/components/calendar/calendar-wrapper";
import { guardApprovedPage } from "@/lib/auth-guard";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Calendar | NetTask",
  description: "Task calendar and maintenance window planner",
};

export default async function CalendarPage() {
  await guardApprovedPage();
  const tasks = await db.task.findMany({
    where: {
      deletedAt: null,
      OR: [
        { dueDate: { not: null } },
        { startAt: { not: null } },
      ],
    },
    include: {
      site: { select: { id: true, name: true } },
      device: { select: { id: true, hostname: true, ipAddress: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          Maintenance & Task Calendar
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Interactive schedule of tasks and scheduled maintenance windows. Drag tasks to reschedule.
        </p>
      </div>

      <CalendarWrapper tasks={tasks} />
    </div>
  );
}

