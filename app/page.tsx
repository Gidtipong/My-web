import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CheckSquare,
  BookOpenCheck,
  Server,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { guardApprovedPage } from "@/lib/auth-guard";

export const revalidate = 15;

export default async function HomePage() {
  await guardApprovedPage();
  const now = new Date();

  // Run 1 consolidated counts query + 3 selective queries in parallel
  const [countsRaw, urgentTasks, recentCases, expiringDevices] = await Promise.all([
    db.$queryRawUnsafe<any[]>(`
      SELECT 
        (SELECT count(*) FROM tasks WHERE "deletedAt" IS NULL AND status IN ('TODO', 'IN_PROGRESS', 'BLOCKED'))::int as active_tasks,
        (SELECT count(*) FROM tasks WHERE "deletedAt" IS NULL AND status IN ('TODO', 'IN_PROGRESS', 'BLOCKED') AND "dueDate" < NOW())::int as overdue_tasks,
        (SELECT count(*) FROM tasks WHERE "deletedAt" IS NULL AND priority = 'P1' AND status NOT IN ('DONE', 'CANCELLED'))::int as p1_tasks,
        (SELECT count(*) FROM cases WHERE "deletedAt" IS NULL)::int as case_count,
        (SELECT count(*) FROM devices WHERE "deletedAt" IS NULL)::int as device_count,
        (SELECT count(*) FROM sites WHERE "deletedAt" IS NULL)::int as site_count
    `).catch(() => [{ active_tasks: 0, overdue_tasks: 0, p1_tasks: 0, case_count: 0, device_count: 0, site_count: 0 }]),

    db.task.findMany({
      where: {
        deletedAt: null,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED] },
        OR: [{ priority: TaskPriority.P1 }, { priority: TaskPriority.P2 }, { dueDate: { lt: now } }],
      },
      take: 5,
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueDate: true,
        device: { select: { hostname: true } },
        site: { select: { name: true } },
      },
    }),
    db.case.findMany({
      where: { deletedAt: null },
      take: 4,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        severity: true,
        category: true,
        cause: true,
      },
    }),
    db.device.findMany({
      where: {
        deletedAt: null,
        warrantyEnd: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      take: 3,
      select: {
        id: true,
        hostname: true,
        vendor: true,
        model: true,
        warrantyEnd: true,
      },
    }),
  ]);

  const c = countsRaw?.[0] || {};
  const activeTaskCount = Number(c.active_tasks || 0);
  const overdueTaskCount = Number(c.overdue_tasks || 0);
  const p1TaskCount = Number(c.p1_tasks || 0);
  const caseCount = Number(c.case_count || 0);
  const deviceCount = Number(c.device_count || 0);
  const siteCount = Number(c.site_count || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full p-2 sm:p-4 md:p-6">
      {/* 1. Clean Hero Header */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-teal-500/[0.02] to-white dark:from-emerald-950/35 dark:via-zinc-900/80 dark:to-zinc-950 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              ภาพรวมการทำงาน
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400">
              ติดตามงานที่ต้องทำ บันทึกกิจกรรมรายวันในปฏิทิน และค้นหาวิธีแก้ปัญหาได้ง่ายๆ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>เปิดปฏิทินบันทึกงาน</span>
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-sm font-semibold shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>รายการงาน</span>
            </Link>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-sm font-semibold shadow-2xs transition-all"
            >
              <BookOpenCheck className="w-4 h-4 text-blue-500" />
              <span>บันทึกวิธีแก้ปัญหา</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/tasks"
          className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">งานที่ค้างอยู่</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{activeTaskCount}</div>
            <p className="text-sm mt-1.5">
              {overdueTaskCount > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">เลยกำหนด {overdueTaskCount} งาน</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">ทุกงานตรงตามกำหนด</span>
              )}
            </p>
          </div>
        </Link>

        <Link
          href="/tasks?priority=P1"
          className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">งานด่วนมาก (P1)</span>
            <div className={`p-2 rounded-xl ${p1TaskCount > 0 ? "bg-rose-50 dark:bg-rose-500/15 text-rose-600" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className={`text-3xl sm:text-4xl font-bold ${p1TaskCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
              {p1TaskCount}
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5">
              {p1TaskCount > 0 ? "ต้องรีบดำเนินการ" : "ไม่มีงานด่วนค้างอยู่"}
            </p>
          </div>
        </Link>

        <Link
          href="/cases"
          className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">คลังแก้ปัญหา</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{caseCount}</div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5">เคสที่บันทึกไว้</p>
          </div>
        </Link>

        <Link
          href="/devices"
          className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-violet-500/40 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">อุปกรณ์ & สถานที่</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{deviceCount}</div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5">ทั้งหมด {siteCount} สถานที่</p>
          </div>
        </Link>
      </div>

      {/* 3. Main Content: Urgent Tasks & Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent & Overdue Tasks */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                งานด่วนและงานที่ต้องติดตาม
              </h2>
            </div>
            <Link
              href="/tasks"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-zinc-400 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800 dark:text-zinc-200">ไม่มีงานด่วนหรือเลยกำหนด</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">ทุกอย่างเรียบร้อยดี</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {urgentTasks.map((t) => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < now;
                return (
                  <div
                    key={t.id}
                    className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            t.priority === "P1"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400"
                              : "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                          }`}
                        >
                          {t.priority}
                        </span>
                        <Link
                          href={`/tasks/${t.id}`}
                          className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {t.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                        {t.site && <span>{t.site.name}</span>}
                        {t.device && <span>[{t.device.hostname}]</span>}
                        {isOverdue && (
                          <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            เลยกำหนด
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium shrink-0">
                      {t.status === "TODO" ? "รอดำเนินการ" : t.status === "IN_PROGRESS" ? "กำลังทำ" : t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Cases & Warranties */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-blue-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">วิธีแก้ปัญหาล่าสุด</h2>
              </div>
              <Link
                href="/cases"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                ทั้งหมด <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentCases.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-zinc-400 text-sm flex flex-col items-center gap-3">
                <p>ยังไม่มีข้อมูลวิธีแก้ปัญหา</p>
                <Link
                  href="/cases/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 transition"
                >
                  <Plus className="w-4 h-4" /> บันทึกเคสแรก
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="block p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-zinc-400">{c.caseNumber}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                        {c.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.title}</h4>
                    {c.cause && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 truncate mt-1">
                        สาเหตุ: {c.cause}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {expiringDevices.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  อุปกรณ์ใกล้หมดประกัน (30 วัน)
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                {expiringDevices.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between font-medium"
                  >
                    <span>{d.hostname}</span>
                    <span className="text-xs">
                      {d.warrantyEnd ? new Date(d.warrantyEnd).toLocaleDateString("th-TH") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
