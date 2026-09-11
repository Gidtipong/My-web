"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ReportMetrics, getReportsData } from "@/app/actions/reports";
import {
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  FolderSync,
  ExternalLink,
} from "lucide-react";

interface ReportsDashboardProps {
  initialData: ReportMetrics;
}

const TYPE_COLORS: Record<string, string> = {
  INCIDENT: "#ef4444",
  CHANGE: "#f97316",
  MAINTENANCE: "#3b82f6",
  AUDIT: "#a855f7",
  TASK: "#10b981",
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#eab308",
  P4: "#71717a",
};

export function ReportsDashboard({ initialData }: ReportsDashboardProps) {
  const [data, setData] = useState<ReportMetrics>(initialData);
  const [daysRange, setDaysRange] = useState<number>(30);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRangeChange = (days: number) => {
    setDaysRange(days);
    startTransition(async () => {
      const updated = await getReportsData(days);
      setData(updated);
    });
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const lines = [
      ["Metric", "Value"],
      ["Report Range", daysRange > 0 ? `Last ${daysRange} Days` : "All Time"],
      ["Total Tasks Created", data.totalCreated],
      ["Total Tasks Completed", data.totalCompleted],
      ["Completion Rate", `${data.completionRate}%`],
      ["Average Time to Close (hours)", data.averageCloseTimeHours],
      [],
      ["Top Repeated Cases"],
      ["Case Number", "Title", "Category", "Severity", "Recurrence Count", "Views"],
      ...data.topRepeatedCases.map((c) => [
        c.caseNumber,
        `"${c.title.replace(/"/g, '""')}"`,
        c.category,
        c.severity,
        c.recurrenceCount,
        c.viewCount,
      ]),
      [],
      ["Tasks by Site"],
      ["Site Name", "Total", "Completed", "Open"],
      ...data.siteBreakdown.map((s) => [
        `"${s.siteName}"`,
        s.total,
        s.completed,
        s.open,
      ]),
      [],
      ["Tasks by Type"],
      ["Type", "Count"],
      ...data.typeBreakdown.map((t) => [t.type, t.count]),
      [],
      ["Tasks by Priority"],
      ["Priority", "Count"],
      ...data.priorityBreakdown.map((p) => [p.priority, p.count]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      lines.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `nettask_report_${daysRange}d_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 backdrop-blur print:hidden">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {[
            { label: "7 Days", value: 7 },
            { label: "30 Days", value: 30 },
            { label: "90 Days", value: 90 },
            { label: "All Time", value: 0 },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleRangeChange(preset.value)}
              disabled={isPending}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                daysRange === preset.value
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Created Tasks</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.totalCreated}</div>
            <p className="text-xs text-zinc-500 mt-0.5">In selected period</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.totalCompleted}</div>
            <p className="text-xs text-emerald-400/80 mt-0.5">{data.completionRate}% completion rate</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average MTTR</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.averageCloseTimeHours} hrs</div>
            <p className="text-xs text-zinc-500 mt-0.5">Mean Time to Resolve</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Open Tasks</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{Math.max(0, data.totalCreated - data.totalCompleted)}</div>
            <p className="text-xs text-zinc-500 mt-0.5">Pending work orders</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Span 2) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Tasks Created vs Completed Trend</h2>
            <p className="text-xs text-zinc-400">Activity timeline across the selected timeframe</p>
          </div>
          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Type Breakdown Donut Chart */}
        <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Breakdown by Type</h2>
            <p className="text-xs text-zinc-400">Distribution of operational categories</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.typeBreakdown}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.typeBreakdown.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#71717a"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Site Bar Chart */}
        <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Tasks by Site</h2>
            <p className="text-xs text-zinc-400">Workload distribution across branches & data centers</p>
          </div>
          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.siteBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="siteName" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="open" name="Open" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Tasks by Priority</h2>
            <p className="text-xs text-zinc-400">Criticality volume from P1 Critical to P4 Low</p>
          </div>
          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.priorityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="priority" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {data.priorityBreakdown.map((entry) => (
                      <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || "#71717a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Repeated Troubleshooting Cases */}
      <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-emerald-400" />
              Top Repeated Network Cases
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Knowledge base incidents with highest recurrence count or view frequency
            </p>
          </div>
          <Link
            href="/cases"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
          >
            View all cases <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-3 font-medium">Case #</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Severity</th>
                <th className="pb-3 font-medium text-right">Recurrence</th>
                <th className="pb-3 font-medium text-right">Views</th>
                <th className="pb-3 font-medium text-right">MTTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data.topRepeatedCases.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 font-mono font-medium text-zinc-400">
                    <Link href={`/cases/${c.id}`} className="hover:text-emerald-400">
                      {c.caseNumber}
                    </Link>
                  </td>
                  <td className="py-3 text-white font-medium max-w-xs truncate">
                    <Link href={`/cases/${c.id}`} className="hover:text-emerald-400 transition-colors">
                      {c.title}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.severity === "P1"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : c.severity === "P2"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {c.severity}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-emerald-400">
                    {c.recurrenceCount}x
                  </td>
                  <td className="py-3 text-right text-zinc-400 font-mono">
                    {c.viewCount}
                  </td>
                  <td className="py-3 text-right text-zinc-400 font-mono">
                    {c.timeToFix ? `${c.timeToFix}m` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

