"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  MapPin,
  User,
  Phone,
  Server,
  CheckSquare,
  Plus,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { createSite, deleteSite } from "@/app/actions/sites";

interface SiteWithDetails {
  id: string;
  name: string;
  location?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  notes?: string | null;
  devices: {
    id: string;
    hostname: string;
    ipAddress: string;
    role: string;
    status: string;
  }[];
  _count: {
    tasks: number;
    devices: number;
  };
}

interface SitesClientProps {
  initialSites: SiteWithDetails[];
}

export function SitesClient({ initialSites }: SitesClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contactPerson: "",
    phone: "",
    notes: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createSite(formData);
      if (!res.success) {
        setFormError(res.error || "Failed to create site");
      } else {
        setIsDialogOpen(false);
        setFormData({
          name: "",
          location: "",
          contactPerson: "",
          phone: "",
          notes: "",
        });
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to soft-delete site "${name}"?`)) return;
    await deleteSite(id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          Showing {initialSites.length} primary data center & branch locations
        </p>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Site
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialSites.map((site) => (
          <div
            key={site.id}
            className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur hover:border-zinc-700 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{site.name}</h3>
                    {site.location && (
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                        {site.location}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(site.id, site.name)}
                  className="p-1 text-zinc-600 hover:text-red-400 transition"
                  title="Delete site"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact Info */}
              {(site.contactPerson || site.phone) && (
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 mb-4 text-xs space-y-1">
                  {site.contactPerson && (
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <User className="w-3 h-3 text-zinc-500" />
                      <span>{site.contactPerson}</span>
                    </div>
                  )}
                  {site.phone && (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      <a href={`tel:${site.phone}`} className="hover:text-emerald-400 transition font-mono">
                        {site.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {site.notes && (
                <p className="text-xs text-zinc-400 line-clamp-2 mb-4 italic">
                  "{site.notes}"
                </p>
              )}

              {/* Installed Devices Preview */}
              <div className="space-y-1.5 mb-4">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
                  Installed Devices ({site._count.devices})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {site.devices.slice(0, 6).map((dev) => (
                    <span
                      key={dev.id}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                    >
                      {dev.hostname}
                    </span>
                  ))}
                  {site.devices.length > 6 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500">
                      +{site.devices.length - 6} more
                    </span>
                  )}
                  {site.devices.length === 0 && (
                    <span className="text-xs text-zinc-600">No devices assigned yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
              <div className="flex items-center gap-3 text-zinc-400">
                <span className="flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  {site._count.devices} Devices
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  {site._count.tasks} Tasks
                </span>
              </div>

              <Link
                href={`/tasks?siteId=${site.id}`}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 text-xs transition"
              >
                Tasks <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Site Modal Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Add Network Site
              </h3>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-400 font-medium block mb-1">Site Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rayong Plant - Data Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-medium block mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="Amata City, Rayong Building B 2nd Fl"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Local IT / NOC"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="038-xxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-medium block mb-1">Access Notes / Rack Info</label>
                <textarea
                  rows={3}
                  placeholder="Keycard required at 1st floor security desk. Rack rows 04-06."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

