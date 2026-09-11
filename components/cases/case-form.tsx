"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Check,
  UploadCloud,
  FileText,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
  Eye,
  Edit3,
  Server,
  Building2,
  Paperclip,
} from "lucide-react";
import { CATEGORY_TEMPLATES } from "@/lib/case-templates";
import { createCase, updateCase, addCaseAttachment } from "@/app/actions/cases";
import { MarkdownView } from "@/components/cases/markdown-view";
import { cn } from "@/lib/utils";

interface CaseFormProps {
  initialData?: any;
  sites: Array<{ id: string; name: string }>;
  devices: Array<{ id: string; hostname: string; siteId?: string | null; vendor?: string }>;
  allTags: Array<{ tag: string; count: number }>;
}

export function CaseForm({ initialData, sites, devices, allTags }: CaseFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState(initialData?.category || "CONNECTIVITY");
  const [severity, setSeverity] = useState<"P1" | "P2" | "P3" | "P4">(initialData?.severity || "P3");
  const [vendor, setVendor] = useState(initialData?.vendor || "");
  const [symptom, setSymptom] = useState(initialData?.symptom || "");
  const [cause, setCause] = useState(initialData?.cause || "");
  const [solution, setSolution] = useState(initialData?.solution || "");
  const [prevention, setPrevention] = useState(initialData?.prevention || "");
  const [timeToFix, setTimeToFix] = useState(initialData?.timeToFix?.toString() || "30");
  const [siteId, setSiteId] = useState(initialData?.siteId || "");
  const [deviceId, setDeviceId] = useState(initialData?.deviceId || "");
  const [taskId, setTaskId] = useState(initialData?.taskId || "");
  const [isPinned, setIsPinned] = useState(initialData?.isPinned || false);

  // Tags state & autocomplete
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Tab switcher for Markdown Editor vs Live Preview
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  // Attachments state
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size: number; type: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Category Template Switch
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const template = CATEGORY_TEMPLATES[newCat];
    if (template && !isEditing) {
      if (!symptom) setSymptom(template.symptom);
      if (!cause) setCause(template.cause);
      if (!solution) setSolution(template.solution);
      if (!prevention) setPrevention(template.prevention);
      if (tags.length === 0) setTags(template.suggestedTags);
      setSeverity(template.defaultSeverity);
    }
  };

  // Tag Add
  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Tag Autocomplete Suggestions
  const tagSuggestions = tagInput.trim()
    ? allTags
        .filter((t) => t.tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t.tag))
        .slice(0, 5)
    : [];

  // Drag and Drop File Upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Simulate/support upload to Storage URL (using object URL for fast local test)
      const fakeUrl = URL.createObjectURL(file);
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          url: fakeUrl,
          size: file.size,
          type: file.type || "text/plain",
        },
      ]);
    }
    setIsUploading(false);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !symptom.trim() || !solution.trim()) {
      setError("Please fill in Title, Symptom, and Solution fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      category,
      severity,
      vendor: vendor.trim() || null,
      symptom: symptom.trim(),
      cause: cause.trim() || null,
      solution: solution.trim(),
      prevention: prevention.trim() || null,
      tags,
      timeToFix: timeToFix ? parseInt(timeToFix, 10) : null,
      siteId: siteId || null,
      deviceId: deviceId || null,
      taskId: taskId || null,
      isPinned,
    };

    try {
      const res = isEditing
        ? await updateCase(initialData.id, payload)
        : await createCase(payload);

      if (res.success && res.data) {
        // Save uploaded attachments if new
        if (attachments.length > 0) {
          for (const att of attachments) {
            await addCaseAttachment(res.data.id, {
              fileName: att.name,
              fileUrl: att.url,
              fileType: att.type,
              fileSize: att.size,
            });
          }
        }
        router.push(`/cases/${res.data.id}`);
      } else {
        setError(res.error || "Failed to save case");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isEditing ? `Edit Case (${initialData.caseNumber})` : "Document New Troubleshooting Case"}
          </h1>
          <p className="text-xs text-zinc-400">
            Store root causes and verified recovery steps for the team&apos;s knowledge base.
          </p>
        </div>

        {/* Edit / Preview Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPreviewTab("edit")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors",
              previewTab === "edit" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors",
              previewTab === "preview" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Metadata Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-mono text-zinc-400 mb-1">
            CASE TITLE <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Spanning Tree Loop on Access Switch BKK-ACC-02"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Category + Starter Template Selector */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center justify-between">
            <span>CATEGORY</span>
            <span className="text-[10px] text-emerald-400 font-normal">Auto Template</span>
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="CONNECTIVITY">Connectivity (STP, VLAN, Port)</option>
            <option value="WIRELESS">Wireless (Wi-Fi, Roaming, RF)</option>
            <option value="PERFORMANCE">Performance (MTU, MSS, QoS)</option>
            <option value="HARDWARE">Hardware (Fiber, SFP, PSU)</option>
            <option value="CONFIGURATION">Configuration (OSPF, BGP)</option>
            <option value="SECURITY">Security (Firewall, NAT, DoS)</option>
            <option value="ISP">ISP / WAN (Circuits, Flapping)</option>
            <option value="POWER">Power / UPS (Battery, Surge)</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Severity, Vendor, Time to Fix, Pin Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">SEVERITY</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="P1">P1 - Outage / Critical</option>
            <option value="P2">P2 - High Impact</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">VENDOR</label>
          <input
            type="text"
            placeholder="e.g. Cisco, Fortinet"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">TIME TO FIX (MIN)</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 25"
            value={timeToFix}
            onChange={(e) => setTimeToFix(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-zinc-300">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500"
            />
            <span>Pin this Case</span>
          </label>
        </div>
      </div>

      {/* Target Device & Site */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">SITE LOCATION</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">-- No specific site --</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">TARGET DEVICE</label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">-- No specific device --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.hostname}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tag Input with Autocomplete */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400">
          TAGS (Type and hit Enter or click suggestion)
        </label>
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-zinc-800 bg-zinc-900">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-zinc-800 text-emerald-400 border border-zinc-700"
            >
              #{t}
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="hover:text-red-400 p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add tag (e.g. OSPF, BGP)..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
            className="flex-1 min-w-[120px] bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>

        {/* Autocomplete Suggestions */}
        {tagSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono text-zinc-400">
            <span>Suggestions:</span>
            {tagSuggestions.map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => handleAddTag(item.tag)}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
              >
                +{item.tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FOUR MAIN TEXT AREAS WITH MARKDOWN EDITOR / LIVE PREVIEW */}
      <div className="space-y-5">
        {/* 1. Symptom */}
        <div className="p-4 rounded-xl border border-red-500/30 bg-zinc-950 space-y-2">
          <label className="block text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
            1. SYMPTOM (อาการที่ตรวจพบ) <span className="text-red-400">*</span>
          </label>
          {previewTab === "edit" ? (
            <textarea
              rows={4}
              required
              placeholder="Describe symptoms, console error codes, packet drop percentages..."
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
            />
          ) : (
            <div className="p-3 bg-zinc-900/50 rounded-lg">
              <MarkdownView content={symptom || "_No symptom entered_"} />
            </div>
          )}
        </div>

        {/* 2. Root Cause */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-2">
          <label className="block text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            2. ROOT CAUSE (สาเหตุที่แท้จริง — จะถูกนำไปแสดงเป็นการ์ดสรุปบนหน้าแรก)
          </label>
          {previewTab === "edit" ? (
            <textarea
              rows={3}
              placeholder="Exact reason for failure: MTU mismatch, dirty fiber, unmanaged switch loop..."
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <div className="p-3 bg-zinc-900/50 rounded-lg">
              <MarkdownView content={cause || "_No root cause entered_"} />
            </div>
          )}
        </div>

        {/* 3. Solution */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-zinc-950 space-y-2">
          <label className="block text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            3. SOLUTION (ขั้นตอนแก้ไข พร้อม CLI Commands) <span className="text-emerald-400">*</span>
          </label>
          {previewTab === "edit" ? (
            <textarea
              rows={5}
              required
              placeholder="1. Enter CLI command...&#10;2. Verify output..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          ) : (
            <div className="p-3 bg-zinc-900/50 rounded-lg">
              <MarkdownView content={solution || "_No solution entered_"} />
            </div>
          )}
        </div>

        {/* 4. Prevention */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-zinc-950 space-y-2">
          <label className="block text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
            4. PREVENTION (แนวทางการป้องกันในอนาคต)
          </label>
          {previewTab === "edit" ? (
            <textarea
              rows={3}
              placeholder="Commands to enable permanently, preventive maintenance schedules..."
              value={prevention}
              onChange={(e) => setPrevention(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <div className="p-3 bg-zinc-900/50 rounded-lg">
              <MarkdownView content={prevention || "_No prevention guidelines entered_"} />
            </div>
          )}
        </div>
      </div>

      {/* Drag & Drop File Upload */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-3">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
          ATTACHMENTS & CONFIGS (.PNG, .JPG, .LOG, .TXT, .CFG)
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-colors"
          onClick={() => document.getElementById("file-upload-input")?.click()}
        >
          <UploadCloud className="h-8 w-8 text-zinc-500 mx-auto" />
          <p className="text-xs text-zinc-400">
            Drag & drop files here, or <span className="text-emerald-400 underline">browse</span>
          </p>
          <input
            id="file-upload-input"
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.log,.txt,.cfg,.conf"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>

        {attachments.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300"
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{att.name}</span>
                  <span className="text-[10px] text-zinc-500">({Math.round(att.size / 1024)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                  className="text-zinc-500 hover:text-red-400 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Submission Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
        >
          <Check className="h-4 w-4 stroke-[3]" />
          <span>{isSubmitting ? "Saving..." : isEditing ? "Update Case" : "Save Knowledge Case"}</span>
        </button>
      </div>
    </form>
  );
}
