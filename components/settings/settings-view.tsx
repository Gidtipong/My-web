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
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  sendTestNotification,
  exportBackupData,
  approveUser,
  rejectUser,
  updateUserRole,
} from "@/app/actions/settings";

interface SettingsViewProps {
  stats: {
    siteCount: number;
    deviceCount: number;
    taskCount: number;
    caseCount: number;
    userCount: number;
    user: any;
    usersList?: any[];
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

  // User Management State
  const [users, setUsers] = useState<any[]>(stats.usersList || []);
  const [userFilter, setUserFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(null);

  const isAdmin =
    stats.user?.role === "ADMIN" ||
    stats.user?.role === "admin" ||
    stats.user?.email === "aom.7325@gmail.com" ||
    stats.user?.email === "gidtipong@comnet.in.th";
  const pendingCount = users.filter((u) => u.status === "PENDING").length;

  const handleApprove = async (userId: string, targetEmail: string) => {
    setActionLoadingId(userId);
    try {
      const res = await approveUser(userId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "APPROVED" } : u))
        );
        setUserActionFeedback(`อนุมัติผู้ใช้ ${targetEmail} สำเร็จแล้ว`);
        setTimeout(() => setUserActionFeedback(null), 5000);
      } else {
        alert("ไม่สามารถอนุมัติได้: " + res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId: string, targetEmail: string) => {
    if (!confirm(`ยืนยันการปฏิเสธ / ระงับสิทธิ์บัญชี ${targetEmail}?`)) return;
    setActionLoadingId(userId);
    try {
      const res = await rejectUser(userId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "REJECTED" } : u))
        );
        setUserActionFeedback(`ระงับสิทธิ์ผู้ใช้ ${targetEmail} แล้ว`);
        setTimeout(() => setUserActionFeedback(null), 5000);
      } else {
        alert("ไม่สามารถดำเนินการได้: " + res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (userId: string, newRole: "ADMIN" | "USER") => {
    setActionLoadingId(userId);
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setUserActionFeedback(`เปลี่ยนตำแหน่งเป็น ${newRole} สำเร็จ`);
        setTimeout(() => setUserActionFeedback(null), 5000);
      } else {
        alert("ไม่สามารถเปลี่ยนตำแหน่งได้: " + res.error);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (userFilter === "PENDING") return u.status === "PENDING";
    if (userFilter === "APPROVED") return u.status === "APPROVED";
    return true;
  });

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

      {/* 2. User Access & Approval Management (Admin Only) */}
      {isAdmin && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                การจัดการสมาชิกและอนุมัติผู้ใช้งาน (User Access & Approvals)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                ระบบรออนุมัติ: ผู้ที่สมัครใหม่จะไม่สามารถเข้าถึงระบบได้จนกว่า Admin จะกดยืนยันอนุมัติ
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-zinc-700/60 text-xs">
              <button
                onClick={() => setUserFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  userFilter === "ALL"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                ทั้งหมด ({users.length})
              </button>
              <button
                onClick={() => setUserFilter("PENDING")}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  userFilter === "PENDING"
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>รออนุมัติ</span>
                {pendingCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      userFilter === "PENDING"
                        ? "bg-white text-amber-600 font-bold"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setUserFilter("APPROVED")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  userFilter === "APPROVED"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                อนุมัติแล้ว ({users.filter((u) => u.status === "APPROVED").length})
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {userActionFeedback && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{userActionFeedback}</span>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-400 dark:text-zinc-500">
                {userFilter === "PENDING" ? "ไม่มีผู้ใช้ที่รอการอนุมัติในขณะนี้" : "ไม่พบรายชื่อผู้ใช้งาน"}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-xl bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-zinc-200 shrink-0">
                      {u.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {u.name || u.email.split("@")[0]}
                        </span>
                        {/* Status Badge */}
                        {u.status === "PENDING" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 animate-pulse" />
                            รออนุมัติ
                          </span>
                        )}
                        {u.status === "APPROVED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            อนุมัติแล้ว
                          </span>
                        )}
                        {u.status === "REJECTED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                            ถูกปฏิเสธ/ระงับ
                          </span>
                        )}
                        {/* Role Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            u.role === "ADMIN"
                              ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/25"
                              : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {u.status === "PENDING" && (
                      <>
                        <button
                          disabled={actionLoadingId === u.id}
                          onClick={() => handleApprove(u.id, u.email)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>อนุมัติ</span>
                        </button>
                        <button
                          disabled={actionLoadingId === u.id}
                          onClick={() => handleReject(u.id, u.email)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>ปฏิเสธ</span>
                        </button>
                      </>
                    )}

                    {u.status === "APPROVED" && (
                      <>
                        <button
                          disabled={actionLoadingId === u.id || u.email === stats.user?.email}
                          onClick={() =>
                            handleToggleRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-zinc-400 bg-slate-200/60 dark:bg-zinc-800/80 hover:bg-slate-300 dark:hover:bg-zinc-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            u.email === stats.user?.email
                              ? "ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้"
                              : "สลับสิทธิ์ Admin / User"
                          }
                        >
                          {u.role === "ADMIN" ? "เปลี่ยนเป็น User" : "ตั้งเป็น Admin"}
                        </button>
                        {u.email !== stats.user?.email && (
                          <button
                            disabled={actionLoadingId === u.id}
                            onClick={() => handleReject(u.id, u.email)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            ระงับสิทธิ์
                          </button>
                        )}
                      </>
                    )}

                    {u.status === "REJECTED" && (
                      <button
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleApprove(u.id, u.email)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อนุมัติใหม่</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. System Inventory & Database Statistics */}
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
