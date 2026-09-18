"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Clock,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Mail,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

export default function PendingApprovalPage() {
  const [email, setEmail] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setEmail(user.email);
      } else {
        window.location.href = "/login";
      }
    }
    loadUser();
  }, []);

  const handleCheckStatus = () => {
    setIsChecking(true);
    setStatusMessage("กำลังตรวจสอบสถานะการอนุมัติล่าสุด...");
    setTimeout(() => {
      // Reloading root will trigger server auth guard check: if approved, will load dashboard, otherwise returns here
      window.location.href = "/";
    }, 800);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 backdrop-blur text-center relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 shadow-inner">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span>PENDING APPROVAL</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          บัญชีของคุณอยู่ระหว่างรอการอนุมัติ
        </h1>

        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">
          ระบบได้บันทึกการสมัครสมาชิกของคุณเรียบร้อยแล้ว เนื่องจากเป็นระบบจัดการเครือข่ายภายในองค์กร กรุณารอให้{" "}
          <strong className="text-slate-900 dark:text-zinc-200">ผู้ดูแลระบบ (Admin)</strong> ตรวจสอบและกดยืนยันอนุมัติสิทธิ์เข้าใช้งาน
        </p>

        {/* User Card */}
        {email && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 text-left mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 font-mono text-xs font-bold shrink-0">
              {email.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">บัญชีที่ลงทะเบียน</p>
              <p className="text-xs font-mono font-medium text-slate-900 dark:text-zinc-200 truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{email}</span>
              </p>
            </div>
          </div>
        )}

        {/* Status notice */}
        {statusMessage && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mb-4 animate-fade-in font-medium">
            {statusMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-[0.99] transition shadow-md shadow-amber-600/20 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span>{isChecking ? "กำลังตรวจสอบ..." : "ตรวจสอบสถานะการอนุมัติ (Refresh)"}</span>
          </button>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 active:scale-[0.99] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ (Sign Out)</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ระบบป้องกันสิทธิ์การเข้าถึงข้อมูล NetTask Enterprise</span>
        </div>
      </div>
    </div>
  );
}
