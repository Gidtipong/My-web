import React from "react";
import { notFound } from "next/navigation";
import { getTaskById } from "@/app/actions/tasks";
import { db } from "@/lib/db";
import { TaskDetailClient } from "@/components/tasks/task-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getTaskById(id);
  if (!res.success || !res.data) {
    return { title: "Task Not Found — NetTask" };
  }
  return {
    title: `${res.data.title} — NetTask`,
    description: res.data.description || "Network task details",
  };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [taskRes, sites, devices] = await Promise.all([
    getTaskById(id),
    db.site.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.device.findMany({
      where: { deletedAt: null },
      select: { id: true, hostname: true, siteId: true },
      orderBy: { hostname: "asc" },
    }),
  ]);

  if (!taskRes.success || !taskRes.data) {
    notFound();
  }

  return (
    <TaskDetailClient
      task={taskRes.data}
      sites={sites}
      devices={devices}
    />
  );
}
