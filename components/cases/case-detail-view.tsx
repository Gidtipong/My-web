"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pin,
  Copy,
  Check,
  Edit,
  RotateCcw,
  Tag,
  Server,
  Building2,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Lightbulb,
} from "lucide-react";
import { MarkdownView } from "@/components/cases/markdown-view";
import { formatDateBangkok, getPriorityStyles, cn } from "@/lib/utils";
import { incrementRecurrence, togglePinCase } from "@/app/actions/cases";

interface CaseDetailProps {
  caseItem: any;
}

export function CaseDetailView({ caseItem: initialCase }: CaseDetailProps) {
  const router = useRouter();
  const [caseItem, setCaseItem] = useState(initialCase);
  const [isCopiedMarkdown, setIsCopiedMarkdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  const severityStyles = getPriorityStyles(caseItem.severity);

  // 1. "Happened Again +1" Action
  const handleHappenedAgain = () => {
    startTransition(async () => {
      const res = await incrementRecurrence(caseItem.id);
      if (res.success && res.data) {
        setCaseItem((prev: any) => ({
          ...prev,
          recurrenceCount: res.data.recurrenceCount,
          occurredAt: res.data.occurredAt,
        }));
        router.refresh();
      }
    });
  };

  // 2. "Pin / Unpin" Action
  const handleTogglePin = () => {
    const nextPinState = !caseItem.isPinned;
    setCaseItem((prev: any) => ({ ...prev, isPinned: nextPinState }));
    startTransition(async () => {
      await togglePinCase(caseItem.id, nextPinState);
      router.refresh();
    });
  };

  // 3. "Copy as Markdown" Action
  const handleCopyAsMarkdown = async () => {
    const md = `# [${caseItem.caseNumber}] ${caseItem.title}
**Category:** ${caseItem.category} | **Severity:** ${caseItem.severity}
**Device:** ${caseItem.device?.hostname || "N/A"} | **Occurred:** ${formatDateBangkok(caseItem.occurredAt)}
**Tags:** ${caseItem.tags.map((t: string) => `#${t}`).join(" ")}

---

## 1. Symptom (อาการ)
${caseItem.symptom}

---

## 2. Root Cause (สาเหตุที่แท้จริง)
${caseItem.cause || "N/A"}

---

## 3. Solution (วิธีการแก้ไข)
${caseItem.solution}

---

## 4. Prevention (แนวทางการป้องกัน)
${caseItem.prevention || "N/A"}
`;
    try {
      await navigator.clipboard.writeText(md);
      setIsCopiedMarkdown(true);
      setTimeout(() => setIsCopiedMarkdown(false), 2000);
    } catch (err) {
      console.error("Failed to copy markdown", err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Knowledge Base</span>
        </Link>

        {/* Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Happened Again +1 */}
          <button
            type="button"
            onClick={handleHappenedAgain}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Happened Again +1 ({caseItem.recurrenceCount})</span>
          </button>

          {/* Copy as Markdown */}
          <button
            type="button"
            onClick={handleCopyAsMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            {isCopiedMarkdown ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied MD</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy as Markdown</span>
              </>
            )}
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={handleTogglePin}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
              caseItem.isPinned
                ? "border-amber-500/40 bg-amber-500/20 text-amber-300 font-semibold"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Pin className={cn("h-3.5 w-3.5", caseItem.isPinned && "fill-amber-400")} />
            <span>{caseItem.isPinned ? "Pinned" : "Pin"}</span>
          </button>

          {/* Edit */}
          <Link
            href={`/cases/${caseItem.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              {caseItem.caseNumber}
            </span>
            <span className={cn("px-2.5 py-1 rounded text-xs font-mono font-bold border", severityStyles.bg)}>
              {caseItem.severity}
            </span>
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              {caseItem.category}
            </span>
            {caseItem.vendor && (
              <span className="px-2.5 py-1 rounded text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30">
                {caseItem.vendor}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <span>Views: {caseItem.viewCount}</span>
            <span>Occurred: {formatDateBangkok(caseItem.occurredAt)}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
          {caseItem.title}
        </h1>

        {/* Linked Device & Site Badges */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-zinc-400 border-t border-zinc-800/80">
          {caseItem.device && (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Server className="h-4 w-4 text-purple-400" />
              <span>Target: {caseItem.device.hostname} ({caseItem.device.ipAddress})</span>
            </div>
          )}
          {caseItem.site && (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>Location: {caseItem.site.name}</span>
            </div>
          )}
          {caseItem.timeToFix && (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Clock className="h-4 w-4" />
              <span>Time-to-Fix: ~{caseItem.timeToFix} minutes</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {caseItem.tags && caseItem.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {caseItem.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FOUR CLEARLY SEPARATED SECTIONS */}
      <div className="space-y-6">
        {/* Section 1: 🩺 Symptom (อาการ) */}
        <div className="rounded-2xl border border-red-500/20 bg-zinc-950 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-sm font-bold text-red-400 font-mono">
            <Stethoscope className="h-4 w-4" />
            <span>1. SYMPTOM (อาการที่ตรวจพบ)</span>
          </div>
          <MarkdownView content={caseItem.symptom} />
        </div>

        {/* Section 2: 🔍 Root Cause (สาเหตุที่แท้จริง) */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-500/20 text-sm font-bold text-amber-400 font-mono">
            <AlertTriangle className="h-4 w-4" />
            <span>2. ROOT CAUSE (สาเหตุที่แท้จริง)</span>
          </div>
          <MarkdownView content={caseItem.cause || "No root cause documented."} />
        </div>

        {/* Section 3: 🛠️ Solution (วิธีการแก้ไข) */}
        <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-sm font-bold text-emerald-400 font-mono">
            <CheckCircle2 className="h-4 w-4" />
            <span>3. SOLUTION (วิธีการแก้ไขทีละขั้นตอน)</span>
          </div>
          <MarkdownView content={caseItem.solution} />
        </div>

        {/* Section 4: 🛡️ Prevention (แนวทางการป้องกัน) */}
        <div className="rounded-2xl border border-blue-500/20 bg-zinc-950 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-sm font-bold text-blue-400 font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>4. PREVENTION (แนวทางการป้องกันในอนาคต)</span>
          </div>
          <MarkdownView content={caseItem.prevention || "No prevention guidelines documented."} />
        </div>
      </div>

      {/* Attachment Gallery */}
      {caseItem.attachments && caseItem.attachments.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <Paperclip className="h-4 w-4 text-emerald-400" />
            <span>Attachments & Config Files ({caseItem.attachments.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {caseItem.attachments.map((att: any) => (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-xs group"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-zinc-400 group-hover:text-emerald-400 shrink-0" />
                  <span className="truncate text-zinc-200 font-mono">{att.fileName}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-zinc-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Cases (Sharing Tags) */}
      {caseItem.relatedCases && caseItem.relatedCases.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>Related Troubleshooting Cases</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {caseItem.relatedCases.map((rel: any) => (
              <Link
                key={rel.id}
                href={`/cases/${rel.id}`}
                className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-colors space-y-1.5 block group"
              >
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="text-emerald-400 font-bold">{rel.caseNumber}</span>
                  <span>•</span>
                  <span>{rel.category}</span>
                </div>
                <div className="font-semibold text-xs text-zinc-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {rel.title}
                </div>
                {rel.cause && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1 font-sans">
                    {rel.cause.replace(/^###.*\n/, "").slice(0, 90)}...
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
