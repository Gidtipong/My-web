"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, CheckCircle2, X } from "lucide-react";

interface IncidentDoneModalProps {
  task: {
    id: string;
    title: string;
    type: string;
    description?: string | null;
    siteId?: string | null;
    deviceId?: string | null;
    site?: { id: string; name: string } | null;
    device?: { id: string; hostname: string } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentDoneModal({ task, isOpen, onClose }: IncidentDoneModalProps) {
  const router = useRouter();

  if (!isOpen || !task) return null;

  const handleConvert = () => {
    onClose();
    const params = new URLSearchParams({
      fromTaskId: task.id,
      title: task.title,
      symptom: task.description || task.title,
      siteId: task.siteId || task.site?.id || "",
      deviceId: task.deviceId || task.device?.id || "",
    });
    router.push(`/cases/new?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 text-zinc-100 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider">
                Incident Resolved
              </span>
              <h3 className="text-base font-bold text-white">Save this as a Case?</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Document the root cause and resolution steps into the Knowledge Base so future on-duty engineers can solve it instantly.
        </p>

        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs space-y-1 font-mono">
          <div className="text-zinc-200 font-semibold truncate">&ldquo;{task.title}&rdquo;</div>
          {task.device && (
            <div className="text-zinc-400 text-[11px]">Target Device: {task.device.hostname}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleConvert}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <BookOpenCheck className="h-4 w-4" />
            <span>Document Case</span>
          </button>
        </div>
      </div>
    </div>
  );
}
