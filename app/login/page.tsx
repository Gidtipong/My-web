"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Terminal,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"enter_email" | "verify_otp">("enter_email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Step 1: Send Magic Link & 6-digit OTP code to email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setStep("verify_otp");
        setMessage({
          type: "success",
          text: `We sent a login link and a 6-digit verification code to ${email}. Check your inbox!`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send login email." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit OTP code from email
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !email) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode.trim(),
        type: "email",
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Invalid or expired code. Please try again." });
      } else {
        setMessage({
          type: "success",
          text: "Verification successful! Accessing your operations console...",
        });
        window.location.href = "/";
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to verify code." });
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
            Email Authentication Required. Enter your email to securely log in to the operations console.
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-7 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-md space-y-5 transition-all">
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

          {step === "enter_email" ? (
            /* Step 1: Input Work Email */
            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1.5">
                  Work Email Address
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-semibold transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code & Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Input 6-Digit OTP Code or Click Link */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("enter_email");
                      setMessage(null);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-center font-mono text-base tracking-widest font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">
                  You can also click the sign-in button directly in the email you received.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !otpCode.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-semibold transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Access Console</span>
                  </>
                )}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendEmail}
                  className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition underline"
                >
                  Didn't receive the email? Click to resend.
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Secured via Supabase Email Authentication</span>
        </div>
      </div>
    </div>
  );
}
