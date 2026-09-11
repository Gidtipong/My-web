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
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">NetTask System Access</h1>
          <p className="text-xs text-zinc-400">
            Network Engineer Operations, Inventory & Troubleshooting Console
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur space-y-5">
          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleMagicLink} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-300 font-medium block mb-1.5">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send Magic Link <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider absolute">
              or
            </span>
          </div>

          {/* Dev Bypass Button */}
          <button
            type="button"
            onClick={handleDevBypass}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs border border-zinc-700 transition"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            Direct Console Access (Dev / Solo Mode)
          </button>
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          Protected by Supabase Auth. Session persisted locally.
        </p>
      </div>
    </div>
  );
}

