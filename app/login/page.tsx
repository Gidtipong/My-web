"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Terminal,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UserPlus,
  LogIn,
} from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Switch between Sign In and Sign Up tabs
  const handleSwitchMode = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
  };

  // 1. Sign In with Email & Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "เข้าสู่ระบบสำเร็จ! กำลังนำท่านเข้าสู่หน้าคอนโซล...",
        });
        window.location.href = "/";
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Sign Up with Email & Set Password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 6) {
      setMessage({ type: "error", text: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data?.session) {
        setMessage({
          type: "success",
          text: "สมัครสมาชิกและเข้าสู่ระบบสำเร็จ! กำลังเข้าสู่หน้าคอนโซล...",
        });
        window.location.href = "/";
      } else {
        setMessage({
          type: "success",
          text: `สร้างบัญชีสำเร็จสำหรับ ${email}! หาก Supabase เปิดระบบยืนยันอีเมล โปรดตรวจสอบกล่องข้อความในอีเมลของคุณเพื่อยืนยัน แล้วกลับมาเข้าสู่ระบบได้ทันที`,
        });
        setMode("signin");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#09090b] relative overflow-hidden transition-colors">
      {/* Ambient Radial Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 mb-1 ring-4 ring-emerald-500/10 hover:scale-105 transition-transform">
            <Terminal className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            NetTask Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            {mode === "signin"
              ? "ระบบจัดการงานและฐานข้อมูลเน็ตเวิร์ก เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน"
              : "สมัครบัญชีใหม่ด้วยอีเมลและตั้งรหัสผ่านสำหรับเข้าใช้งาน"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-md space-y-5 transition-all">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSwitchMode("signin")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("signup")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครสมาชิก (Sign Up)</span>
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/25"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4 text-xs">
            {/* Email Field */}
            <div>
              <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1.5">
                อีเมลของคุณ (Work Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="engineer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-zinc-300 font-semibold block">
                  {mode === "signin" ? "รหัสผ่าน (Password)" : "ตั้งรหัสผ่าน (Set Password)"}
                </label>
                {mode === "signup" && (
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">อย่างน้อย 6 ตัวอักษร</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={mode === "signin" ? "••••••••" : "กำหนดรหัสผ่านอย่างน้อย 6 ตัว"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Only for Sign Up) */}
            {mode === "signup" && (
              <div>
                <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1.5">
                  ยืนยันรหัสผ่าน (Confirm Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="พิมพ์รหัสผ่านเดิมซ้ำอีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition shadow-2xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-semibold transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 cursor-pointer pt-2.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "signin" ? (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>สมัครสมาชิกและตั้งรหัสผ่าน (Sign Up)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Helper Link */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-zinc-400">
            {mode === "signin" ? (
              <p>
                ยังไม่มีบัญชีใช่หรือไม่?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signup")}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  สมัครสมาชิกและตั้งรหัสผ่าน
                </button>
              </p>
            ) : (
              <p>
                มีบัญชีอยู่แล้ว?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signin")}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>ระบบรักษาความปลอดภัยบัญชีด้วย Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
}
