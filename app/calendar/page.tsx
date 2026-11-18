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
    <div className="flex flex-col gap-4 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
      <CalendarWrapper tasks={tasks} />
    </div>
  );
}

