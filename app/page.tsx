import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CheckSquare,
  BookOpenCheck,
  Server,
  Building2,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Plus,
  Compass,
  FileCode2,
  Sparkles,
  ChevronRight,
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

  const isBrandNewWorkspace = activeTaskCount === 0 && caseCount === 0 && deviceCount === 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto w-full p-4 md:p-8">
      {/* 1. Modern Minimalist Hero Banner */}
      <div className="rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-teal-500/[0.03] to-slate-100/50 dark:from-emerald-950/40 dark:via-zinc-900/80 dark:to-zinc-950 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              NetTask Operations Console
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Network Operations & Knowledge Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Solo Network Engineer Command Center. Real-time task execution, hardware lifecycle tracking, and instant incident lookup.
            </p>
          </div>

          {/* Quick Action CTAs inside Hero */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-semibold shadow-sm shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Task</span>
            </Link>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
            >
              <BookOpenCheck className="w-4 h-4 text-blue-500" />
              <span>Log Solution</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Active Tasks */}
        <Link
          href="/tasks"
          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-zinc-400">Active Tasks</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="h-4 w-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{activeTaskCount}</div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 flex items-center gap-1.5">
              {overdueTaskCount > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-semibold">{overdueTaskCount} overdue</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">All tasks on schedule</span>
              )}
            </p>
          </div>
        </Link>

        {/* P1 Critical Incidents */}
        <Link
          href="/tasks?priority=P1"
          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-rose-500/40 dark:hover:border-rose-500/30 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-zinc-400">Critical P1</span>
            <div className={`p-2 rounded-xl ${p1TaskCount > 0 ? "bg-rose-50 dark:bg-rose-500/15 text-rose-600 animate-pulse" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"} group-hover:scale-110 transition-transform`}>
              <Flame className="h-4 w-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${p1TaskCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
              {p1TaskCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
              {p1TaskCount > 0 ? "Urgent outage in progress" : "Zero active P1 outages"}
            </p>
          </div>
        </Link>

        {/* Troubleshooting Cases */}
        <Link
          href="/cases"
          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-blue-500/40 dark:hover:border-blue-500/30 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-zinc-400">Knowledge Base</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <BookOpenCheck className="h-4 w-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{caseCount}</div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">Thai & English solutions</p>
          </div>
        </Link>

        {/* Managed Devices */}
        <Link
          href="/devices"
          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-violet-500/40 dark:hover:border-violet-500/30 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-zinc-400">Devices & Sites</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
              <Server className="h-4 w-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{deviceCount}</div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">Across {siteCount} physical sites</p>
          </div>
        </Link>
      </div>

      {/* 3. Quick-Start Onboarding Guide (Shown when workspace is newly set up or data is low) */}
      {isBrandNewWorkspace && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Quick Start Launchpad</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Follow these 3 steps to populate your network engineering operations:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Link
              href="/tasks"
              className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Step 1</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Create First Task</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">Schedule routine maintenance, BGP peering, or router configuration changes.</p>
            </Link>

            <Link
              href="/cases/new"
              className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">Step 2</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Record Incident Solution</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">Save past troubleshooting playbooks with causes and fixes for instant search.</p>
            </Link>

            <Link
              href="/devices"
              className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">Step 3</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Add Network Device</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">Track switches, routers, firewalls, IP management, and contract warranties.</p>
            </Link>
          </div>
        </div>
      )}

      {/* 4. Main Grid: Urgent Tasks & Knowledge Base */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent & Overdue Tasks (Span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Priority & Overdue Tasks</h2>
              </div>
              <Link
                href="/tasks"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
              >
                View all tasks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-zinc-400 text-xs flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-zinc-200">No overdue or high priority tasks</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500">Your network operations queue is clean.</p>
                </div>
                <Link
                  href="/tasks"
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-medium text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Task
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {urgentTasks.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < now;
                  return (
                    <div
                      key={t.id}
                      className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800/20 px-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              t.priority === "P1"
                                ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                                : "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                            }`}
                          >
                            {t.priority}
                          </span>
                          <Link
                            href={`/tasks/${t.id}`}
                            className="text-xs font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            {t.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                          {t.site && <span>{t.site.name}</span>}
                          {t.device && <span className="font-mono text-slate-400 dark:text-zinc-500">[{t.device.hostname}]</span>}
                          {isOverdue && (
                            <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono shrink-0 border border-slate-200 dark:border-zinc-700">
                        {t.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Knowledge Cases & Expiring Devices */}
        <div className="space-y-6">
          {/* Recent Troubleshooting Cases */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Solutions</h2>
              </div>
              <Link
                href="/cases"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Cases <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentCases.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-zinc-400 text-xs flex flex-col items-center gap-2.5">
                <p>No troubleshooting cases logged yet.</p>
                <Link
                  href="/cases/new"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs hover:bg-blue-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Record First Solution
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="block p-3 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-2xs hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-slate-500 dark:text-zinc-400">{c.caseNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                        {c.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.title}</h4>
                    {c.cause && (
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 truncate mt-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cause:</span> {c.cause}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Expiring Device Warranties */}
          {expiringDevices.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Expiring Warranties (30 Days)</h3>
              </div>
              <div className="space-y-2 text-xs">
                {expiringDevices.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between font-medium"
                  >
                    <span className="font-mono">{d.hostname}</span>
                    <span className="text-[11px]">
                      {d.warrantyEnd ? new Date(d.warrantyEnd).toLocaleDateString() : ""}
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
