import React from "react";
import { db } from "@/lib/db";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";

export const metadata = {
  title: "Tasks — NetTask",
  description: "Manage network tasks, incidents, and maintenance windows.",
};

export const revalidate = 10;

export default async function TasksPage() {
  // Direct Server Component queries
  const [tasks, sites, devices] = await Promise.all([
    db.task.findMany({
      where: { deletedAt: null },
      include: {
        site: { select: { id: true, name: true } },
        device: { select: { id: true, hostname: true, model: true, ipAddress: true } },
        checklists: { select: { id: true, done: true } },
      },
      orderBy: [
        { priority: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    }),
    db.site.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.device.findMany({
      where: { deletedAt: null },
      select: { id: true, hostname: true, siteId: true, model: true, ipAddress: true },
      orderBy: { hostname: "asc" },
    }),
  ]);

  return <TasksPageClient initialTasks={tasks} sites={sites} devices={devices} />;
}
