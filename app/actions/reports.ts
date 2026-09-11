"use server";

import { db } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { TaskStatus, TaskType, TaskPriority } from "@prisma/client";

export interface ReportMetrics {
  totalCreated: number;
  totalCompleted: number;
  completionRate: number;
  averageCloseTimeHours: number;
  trendData: {
    date: string;
    created: number;
    completed: number;
  }[];
  siteBreakdown: {
    siteName: string;
    total: number;
    completed: number;
    open: number;
  }[];
  typeBreakdown: {
    type: string;
    count: number;
  }[];
  priorityBreakdown: {
    priority: string;
    count: number;
  }[];
  topRepeatedCases: {
    id: string;
    caseNumber: string;
    title: string;
    category: string;
    severity: string;
    recurrenceCount: number;
    viewCount: number;
    timeToFix: number | null;
  }[];
}

export async function getReportsData(daysRange: number = 30): Promise<ReportMetrics> {
  const now = new Date();
  const startDate = daysRange > 0 ? startOfDay(subDays(now, daysRange)) : null;

  // 1. Fetch Tasks
  const taskWhere: any = {
    deletedAt: null,
  };
  if (startDate) {
    taskWhere.createdAt = { gte: startDate };
  }

  const tasks = await db.task.findMany({
    where: taskWhere,
    include: {
      site: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate totals
  const totalCreated = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE);
  const totalCompleted = completedTasks.length;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // Calculate Average Close Time (MTTR in hours)
  let totalCloseDurationHours = 0;
  let closeDurationCount = 0;
  completedTasks.forEach((t) => {
    if (t.completedAt) {
      const durationMs = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
      const hours = Math.max(0.1, durationMs / (1000 * 60 * 60));
      totalCloseDurationHours += hours;
      closeDurationCount++;
    }
  });
  const averageCloseTimeHours = closeDurationCount > 0 
    ? Math.round((totalCloseDurationHours / closeDurationCount) * 10) / 10 
    : 0;

  // 2. Trend Data (Created vs Completed over time)
  // Group by day (or weekly if > 60 days)
  const trendMap: Record<string, { date: string; created: number; completed: number }> = {};

  // If daysRange > 0, generate each day in range
  const daysToIterate = daysRange > 0 ? daysRange : 30;
  for (let i = daysToIterate - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, "yyyy-MM-dd");
    trendMap[key] = {
      date: format(d, "dd MMM"),
      created: 0,
      completed: 0,
    };
  }

  tasks.forEach((t) => {
    const createKey = format(t.createdAt, "yyyy-MM-dd");
    if (trendMap[createKey]) {
      trendMap[createKey].created++;
    }
    if (t.completedAt) {
      const completeKey = format(t.completedAt, "yyyy-MM-dd");
      if (trendMap[completeKey]) {
        trendMap[completeKey].completed++;
      }
    }
  });

  const trendData = Object.values(trendMap);

  // 3. Site Breakdown
  const siteMap: Record<string, { siteName: string; total: number; completed: number; open: number }> = {};
  tasks.forEach((t) => {
    const siteName = t.site ? t.site.name : "Unassigned / Remote";
    if (!siteMap[siteName]) {
      siteMap[siteName] = { siteName, total: 0, completed: 0, open: 0 };
    }
    siteMap[siteName].total++;
    if (t.status === TaskStatus.DONE) {
      siteMap[siteName].completed++;
    } else {
      siteMap[siteName].open++;
    }
  });
  const siteBreakdown = Object.values(siteMap).sort((a, b) => b.total - a.total);

  // 4. Type Breakdown
  const typeCount: Record<string, number> = {
    TASK: 0,
    INCIDENT: 0,
    CHANGE: 0,
    MAINTENANCE: 0,
    AUDIT: 0,
  };
  tasks.forEach((t) => {
    if (typeCount[t.type] !== undefined) {
      typeCount[t.type]++;
    } else {
      typeCount[t.type] = 1;
    }
  });
  const typeBreakdown = Object.entries(typeCount).map(([type, count]) => ({ type, count }));

  // 5. Priority Breakdown
  const priorityCount: Record<string, number> = {
    P1: 0,
    P2: 0,
    P3: 0,
    P4: 0,
  };
  tasks.forEach((t) => {
    if (priorityCount[t.priority] !== undefined) {
      priorityCount[t.priority]++;
    } else {
      priorityCount[t.priority] = 1;
    }
  });
  const priorityBreakdown = Object.entries(priorityCount).map(([priority, count]) => ({ priority, count }));

  // 6. Top Repeated Cases
  const topCases = await db.case.findMany({
    where: { deletedAt: null },
    orderBy: [
      { recurrenceCount: "desc" },
      { viewCount: "desc" },
    ],
    take: 6,
    select: {
      id: true,
      caseNumber: true,
      title: true,
      category: true,
      severity: true,
      recurrenceCount: true,
      viewCount: true,
      timeToFix: true,
    },
  });

  return {
    totalCreated,
    totalCompleted,
    completionRate,
    averageCloseTimeHours,
    trendData,
    siteBreakdown,
    typeBreakdown,
    priorityBreakdown,
    topRepeatedCases: topCases,
  };
}
