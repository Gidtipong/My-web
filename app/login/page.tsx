"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Terminal, Shield, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Check your email inbox! We sent you a secure magic link to sign in.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send magic link" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevBypass = () => {
    document.cookie = "nettask_dev_auth=authenticated; path=/; max-age=86400; SameSite=Lax";
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#09090b] relative overflow-hidden transition-colors">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 mb-2 ring-4 ring-emerald-500/10 hover:scale-105 transition-transform">
            <Terminal className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            NetTask Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            Network Operations, Inventory & Troubleshooting Console for Solo Engineers
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/80 p-7 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-md space-y-5 transition-all">
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleMagicLink} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
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
                  <span>Send Magic Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest absolute font-medium">
              or
            </span>
          </div>

          {/* Dev Bypass Button */}
          <button
            type="button"
            onClick={handleDevBypass}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white font-semibold text-xs border border-slate-200 dark:border-zinc-700/80 transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Direct Console Access (Dev / Solo Mode)
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500 dark:text-zinc-500">
          Protected by Supabase Auth. Session persisted locally.
        </p>
      </div>
    </div>
  );
}

