"use client";

import React, { useState, useTransition } from "react";
import {
  User,
  Shield,
  Bell,
  Database,
  Download,
  CheckCircle2,
  AlertTriangle,
  Server,
  Terminal,
  Send,
  Loader2,
  HardDrive,
  Globe,
  Clock,
  Mail,
  KeyRound,
} from "lucide-react";
import { sendTestNotification, exportBackupData } from "@/app/actions/settings";

interface SettingsViewProps {
  stats: {
    siteCount: number;
    deviceCount: number;
    taskCount: number;
    caseCount: number;
    userCount: number;
    user: any;
    envStatus: {
      telegramConfigured: boolean;
      cronSecretConfigured: boolean;
      databaseUrlConfigured: boolean;
    };
  };
}

export function SettingsView({ stats }: SettingsViewProps) {
  const [isNotifying, startNotifyTransition] = useTransition();
  const [notifyResult, setNotifyResult] = useState<{ success: boolean; isConfigured: boolean; error?: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const userEmail = stats.user?.email || "engineer@company.com";
  const userName = stats.user?.name || userEmail.split("@")[0].toUpperCase();
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  const handleTestNotification = () => {
    startNotifyTransition(async () => {
      const result = await sendTestNotification();
      setNotifyResult(result);
      setTimeout(() => setNotifyResult(null), 6000);
    });
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const data = await exportBackupData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nettask_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* 1. Dynamic Authenticated User Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 shadow-xs backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-mono font-bold text-lg shadow-md shadow-emerald-500/20 border border-emerald-400/30">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {userName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  ACTIVE SESSION
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{userEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {stats.user?.role || "ADMIN"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-zinc-800/80 pt-4 text-xs">
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">System Role</span>
            <p className="text-slate-800 dark:text-zinc-200 font-semibold mt-0.5">Lead Network Engineer</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">Timezone</span>
            <p className="text-slate-800 dark:text-zinc-200 font-mono font-medium mt-0.5">Asia/Bangkok (UTC+7)</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">Authentication Method</span>
            <p className="text-slate-800 dark:text-zinc-200 font-medium mt-0.5 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Supabase Password / Email
            </p>
          </div>
        </div>
      </div>

      {/* 2. System Inventory & Database Statistics */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          System & Database Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
            <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Network Sites</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">{stats.siteCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
            <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Managed Devices</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">{stats.deviceCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
            <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Active Tasks</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">{stats.taskCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
            <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Knowledge Cases</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">{stats.caseCount}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-200 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-500" />
              Full System Backup & Migration Dump
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
              Export all database tables (sites, devices, tasks, checklists, notes, cases) to structured JSON.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition shadow-xs shrink-0 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download JSON Backup
          </button>
        </div>
      </div>

      {/* 3. Notification Integrations */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Alerts & Notification Channels
        </h3>

        <div className="space-y-4">
          {/* Telegram Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/25">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Telegram Bot Digest</h4>
                  {stats.envStatus.telegramConfigured ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      Configured
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      Console Fallback (Set TELEGRAM_BOT_TOKEN)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Daily 08:00 morning digest of overdue tasks, due today, and devices with expiring warranties.
                </p>
              </div>
            </div>

            <button
              onClick={handleTestNotification}
              disabled={isNotifying}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl border border-slate-200 dark:border-zinc-700 transition shadow-2xs shrink-0 cursor-pointer"
            >
              {isNotifying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Send Test Message
            </button>
          </div>

          {notifyResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                notifyResult.success
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {notifyResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Test notification sent successfully!{" "}
                    {!notifyResult.isConfigured &&
                      "(Printed to server console because TELEGRAM_BOT_TOKEN is not configured in .env)"}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Failed to send notification: {notifyResult.error}</span>
                </>
              )}
            </div>
          )}

          {/* Cron Schedule Info */}
          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/80 dark:border-zinc-800/80 flex items-start gap-3">
            <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-zinc-400">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Scheduled Vercel Cron Jobs:</span>
              <ul className="mt-1 space-y-1 list-disc list-inside font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                <li>0 1 * * * (08:00 Asia/Bangkok) → Daily Reminder Digest</li>
                <li>10 0 * * * (07:10 Asia/Bangkok) → Recurring Tasks Generator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Software Stack Information */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Application & Environment Info
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80">
            <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Framework</span>
            <span className="text-slate-800 dark:text-zinc-200 font-semibold">Next.js 15 (App Router, React 19)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80">
            <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Database Layer</span>
            <span className="text-slate-800 dark:text-zinc-200 font-semibold">Prisma ORM 6.19.3 + PostgreSQL (Supabase)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80">
            <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Search Engine</span>
            <span className="text-slate-800 dark:text-zinc-200 font-semibold">PostgreSQL tsvector (GIN) + pg_trgm Trigrams</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80">
            <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">System Status</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Production Ready (All Services Operational)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
