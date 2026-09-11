"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  Eye,
  Server,
  Pin,
  Flame,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatDateBangkok, getPriorityStyles, cn } from "@/lib/utils";

interface CaseCardProps {
  item: {
    id: string;
    caseNumber: string;
    title: string;
    category: string;
    severity: string;
    cause?: string | null;
    tags: string[];
    timeToFix?: number | null;
    viewCount: number;
    recurrenceCount?: number;
    occurredAt: Date | string;
    isPinned?: boolean;
    site?: { id: string; name: string } | null;
    device?: { id: string; hostname: string } | null;
  };
  onTagClick?: (tag: string) => void;
}

export function CaseCard({ item, onTagClick }: CaseCardProps) {
  const severityStyles = getPriorityStyles(item.severity);

  // Extract first 1-2 lines of cause for immediate solution preview
  const cleanCause = item.cause
    ? item.cause
        .replace(/^###.*\n/, "")
        .replace(/^[-*]\s+/, "")
        .split("\n")[0]
        .slice(0, 180)
    : "No root cause documented yet.";

  return (
    <div className="group rounded-xl border border-zinc-800/90 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all p-4 space-y-3 flex flex-col justify-between shadow-xs">
      <div className="space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Case Number */}
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {item.caseNumber}
            </span>

            {/* Severity Badge */}
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
                severityStyles.bg
              )}
            >
              {item.severity}
            </span>

            {/* Category */}
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.isPinned && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                <Pin className="h-3 w-3 fill-amber-400" />
                <span>Pinned</span>
              </span>
            )}
            {item.viewCount > 100 && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/30">
                <Flame className="h-3 w-3 fill-orange-400" />
                <span>Hot</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          href={`/cases/${item.id}`}
          className="block font-bold text-sm sm:text-base text-zinc-100 group-hover:text-emerald-400 transition-colors leading-snug"
        >
          {item.title}
        </Link>

        {/* THE CAUSE LINE (Prominent Highlight - Key Feature for Network Engineers!) */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            <AlertCircle className="h-3 w-3" />
            <span>Root Cause</span>
          </div>
          <p className="text-zinc-200 line-clamp-2 leading-relaxed font-sans text-xs">
            {cleanCause}
          </p>
        </div>
      </div>

      {/* Footer Info & Tags */}
      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
        {/* Device & Telemetry Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-3">
            {item.device && (
              <span className="flex items-center gap-1 text-zinc-300">
                <Server className="h-3 w-3 text-purple-400" />
                <span>{item.device.hostname}</span>
              </span>
            )}
            {item.timeToFix ? (
              <span className="flex items-center gap-1 text-blue-400">
                <Clock className="h-3 w-3" />
                <span>~{item.timeToFix} min</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-zinc-500">
              <Eye className="h-3 w-3" />
              <span>{item.viewCount}</span>
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDateBangkok(item.occurredAt, "dd MMM yyyy")}</span>
            </span>
          </div>
        </div>

        {/* Tags Cloud Row */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {item.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick && onTagClick(tag)}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800/90 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 border border-zinc-700/60 transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
