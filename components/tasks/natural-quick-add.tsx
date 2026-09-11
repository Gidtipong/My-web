"use client";

import React, { useState, useEffect, useTransition } from "react";
import { parseNaturalLanguageTask, ParsedTask } from "@/lib/nlp-task";
import { createTask } from "@/app/actions/tasks";
import { Sparkles, CornerDownLeft, Loader2, Calendar, Server, Tag, AlertCircle } from "lucide-react";
import { getPriorityStyles, getTaskTypeStyles } from "@/lib/utils";

interface NaturalQuickAddProps {
  devices: Array<{ id: string; hostname: string }>;
  onTaskCreated?: () => void;
}

export function NaturalQuickAdd({ devices, onTaskCreated }: NaturalQuickAddProps) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) {
      setParsed(null);
      return;
    }
    const result = parseNaturalLanguageTask(input, devices);
    setParsed(result);
  }, [input, devices]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsed || !parsed.title.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await createTask({
        title: parsed.title,
        priority: parsed.priority,
        type: parsed.type,
        dueDate: parsed.dueDate,
        deviceId: parsed.matchedDeviceId,
      });

      if (res.success) {
        setInput("");
        setParsed(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("nettask:refresh-badges"));
        }
        if (onTaskCreated) onTaskCreated();
      } else {
        setError(res.error || "Failed to create task");
      }
    });
  };

  const priorityStyles = parsed ? getPriorityStyles(parsed.priority) : null;
  const typeStyles = parsed ? getTaskTypeStyles(parsed.type) : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4 shadow-sm backdrop-blur-sm space-y-2.5">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 flex items-center gap-1.5 text-zinc-500">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Natural Quick Add: e.g. 'Replace SFP BKK-COR-SW01 tomorrow P2' (< 5s)..."
          disabled={isPending}
          className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/80 pl-9 pr-24 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-medium text-xs shadow-sm transition-all cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span>Add</span>
                <CornerDownLeft className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/15 border border-red-500/30 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Parsed Preview Chips */}
      {parsed && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs animate-in fade-in duration-150">
          <span className="text-[11px] font-mono text-zinc-500">Parsed:</span>

          {/* Title chip */}
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/70 font-medium max-w-[220px] truncate">
            &ldquo;{parsed.title}&rdquo;
          </span>

          {/* Priority chip */}
          <span
            className={`px-2 py-0.5 rounded font-mono font-bold border ${priorityStyles?.bg}`}
          >
            {parsed.priority}
          </span>

          {/* Type chip */}
          <span className={`px-2 py-0.5 rounded border ${typeStyles?.bg}`}>
            {typeStyles?.label}
          </span>

          {/* Due date chip */}
          {parsed.dueDateLabel && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
              <Calendar className="h-3 w-3" />
              <span>{parsed.dueDateLabel}</span>
            </span>
          )}

          {/* Device chip */}
          {parsed.detectedHostname && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-mono">
              <Server className="h-3 w-3" />
              <span>{parsed.detectedHostname}</span>
              {parsed.matchedDeviceId && <span className="text-emerald-400 text-[10px]">✓</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
