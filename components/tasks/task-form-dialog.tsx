"use client";

import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Plus, Trash2, ShieldAlert, Calendar, Clock } from "lucide-react";
import { createTask, updateTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";

interface TaskFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sites: Array<{ id: string; name: string }>;
  devices: Array<{ id: string; hostname: string; siteId?: string | null }>;
  initialData?: any;
}

export function TaskFormDialog({
  isOpen,
  onClose,
  onSuccess,
  sites,
  devices,
  initialData,
}: TaskFormDialogProps) {
  const isEditing = !!initialData;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"TASK" | "INCIDENT" | "CHANGE" | "MAINTENANCE" | "AUDIT">("TASK");
  const [priority, setPriority] = useState<"P1" | "P2" | "P3" | "P4">("P3");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED">("TODO");
  const [dueDate, setDueDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [siteId, setSiteId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [rollbackPlan, setRollbackPlan] = useState("");
  const [recurrence, setRecurrence] = useState("NONE");
  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter devices based on chosen siteId (Cascading Select)
  const filteredDevices = siteId
    ? devices.filter((d) => d.siteId === siteId)
    : devices;

  // Initialize form
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setType(initialData.type || "TASK");
      setPriority(initialData.priority || "P3");
      setStatus(initialData.status || "TODO");
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : "");
      setStartAt(initialData.startAt ? new Date(initialData.startAt).toISOString().slice(0, 16) : "");
      setEndAt(initialData.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : "");
      setSiteId(initialData.siteId || "");
      setDeviceId(initialData.deviceId || "");
      setTicketRef(initialData.ticketRef || "");
      setRollbackPlan(initialData.rollbackPlan || "");
      setRecurrence(initialData.recurrence || "NONE");
    } else {
      setTitle("");
      setDescription("");
      setType("TASK");
      setPriority("P3");
      setStatus("TODO");
      setDueDate("");
      setStartAt("");
      setEndAt("");
      setSiteId("");
      setDeviceId("");
      setTicketRef("");
      setRollbackPlan("");
      setRecurrence("NONE");
      setChecklists([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    setChecklists([...checklists, newChecklistText.trim()]);
    setNewChecklistText("");
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify task title");
      return;
    }

    // Strict requirement: Rollback plan is REQUIRED when type = CHANGE
    if (type === "CHANGE" && (!rollbackPlan || !rollbackPlan.trim())) {
      setError("Rollback Plan is mandatory when Task Type is CHANGE (Change Management Policy)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      siteId: siteId || null,
      deviceId: deviceId || null,
      ticketRef: ticketRef.trim() || null,
      rollbackPlan: rollbackPlan.trim() || null,
      recurrence: recurrence !== "NONE" ? recurrence : null,
      checklists,
    };

    try {
      const res = isEditing
        ? await updateTask(initialData.id, payload)
        : await createTask(payload);

      if (res.success) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("nettask:refresh-badges"));
        }
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to save task");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl rounded-none md:rounded-2xl border-0 md:border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/90 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {isEditing ? "Edit Task" : "Create New Task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              TASK TITLE <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Replace SFP transceiver on BKK-COR-SW01 Te1/1/1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Type & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="TASK">General Task</option>
                <option value="INCIDENT">INCIDENT (Critical)</option>
                <option value="CHANGE">CHANGE (Change Request)</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="AUDIT">AUDIT & Security</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">PRIORITY</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="P1">P1 - Critical (Outage / High Risk)</option>
                <option value="P2">P2 - High (Degraded Performance)</option>
                <option value="P3">P3 - Medium (Standard Operations)</option>
                <option value="P4">P4 - Low (Informational / Minor)</option>
              </select>
            </div>
          </div>

          {/* Status & Ticket Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">TICKET REF</label>
              <input
                type="text"
                placeholder="e.g. INC-2026-0901 or CHG-088"
                value={ticketRef}
                onChange={(e) => setTicketRef(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Site → Device Cascading Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">SITE / LOCATION</label>
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setDeviceId(""); // Reset device on site change
                }}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- None / General --</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                TARGET DEVICE (CASCADED)
              </label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- None / Select Device --</option>
                {filteredDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.hostname}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">DUE DATE</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">RECURRENCE</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="NONE">None (One-time)</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          {/* Maintenance Window (Start / End) */}
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>Maintenance Window (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">WINDOW START</span>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">WINDOW END</span>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300"
                />
              </div>
            </div>
          </div>

          {/* Rollback Plan (REQUIRED if Type = CHANGE) */}
          <div
            className={cn(
              "p-3.5 rounded-lg border transition-all space-y-1.5",
              type === "CHANGE"
                ? "bg-orange-950/20 border-orange-500/50"
                : "bg-zinc-900/40 border-zinc-800"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <ShieldAlert
                  className={cn(
                    "h-4 w-4",
                    type === "CHANGE" ? "text-orange-400" : "text-zinc-500"
                  )}
                />
                <span className={type === "CHANGE" ? "text-orange-300" : "text-zinc-300"}>
                  Rollback Plan {type === "CHANGE" && <span className="text-red-400">* (MANDATORY)</span>}
                </span>
              </div>
              {type === "CHANGE" && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold">
                  Change Policy
                </span>
              )}
            </div>
            <textarea
              rows={2}
              required={type === "CHANGE"}
              placeholder="Step-by-step procedure to revert configuration if change fails or introduces instability..."
              value={rollbackPlan}
              onChange={(e) => setRollbackPlan(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              DESCRIPTION / SCOPE OF WORK
            </label>
            <textarea
              rows={2}
              placeholder="Details about interfaces, VLANs, routing, or change justification..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Checklist Builder (For new tasks) */}
          {!isEditing && (
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
              <label className="block text-xs font-mono text-zinc-300">
                SOP CHECKLIST ITEMS
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add checklist step e.g. 'Backup running-config before reboot'..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChecklist();
                    }
                  }}
                  className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddChecklist}
                  className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {checklists.length > 0 && (
                <div className="space-y-1 pt-1">
                  {checklists.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <span className="text-zinc-300 font-mono">
                        {idx + 1}. {item}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklist(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
