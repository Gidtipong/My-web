"use client";

import React, { useState, useTransition } from "react";
import {
  Server,
  Search,
  Plus,
  Filter,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import { createDevice, deleteDevice } from "@/app/actions/devices";

interface Device {
  id: string;
  hostname: string;
  ipAddress: string;
  vendor: string;
  model: string;
  serialNumber?: string | null;
  role: string;
  status: string;
  warrantyEnd?: Date | string | null;
  licenseEnd?: Date | string | null;
  siteId?: string | null;
  site?: { id: string; name: string } | null;
}

interface Site {
  id: string;
  name: string;
}

interface DevicesClientProps {
  initialDevices: Device[];
  sites: Site[];
}

export function DevicesClient({ initialDevices, sites }: DevicesClientProps) {
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    hostname: "",
    ipAddress: "",
    vendor: "Cisco",
    model: "",
    role: "Access",
    status: "ACTIVE",
    siteId: sites[0]?.id || "",
    warrantyEnd: "",
    serialNumber: "",
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(id);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createDevice({
        ...formData,
        warrantyEnd: formData.warrantyEnd ? new Date(formData.warrantyEnd) : null,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to create device");
      } else {
        setIsDialogOpen(false);
        setFormData({
          hostname: "",
          ipAddress: "",
          vendor: "Cisco",
          model: "",
          role: "Access",
          status: "ACTIVE",
          siteId: sites[0]?.id || "",
          warrantyEnd: "",
          serialNumber: "",
        });
      }
    });
  };

  const handleDelete = async (id: string, hostname: string) => {
    if (!confirm(`Are you sure you want to soft-delete device "${hostname}"?`)) return;
    await deleteDevice(id);
  };

  // Filter devices
  const filteredDevices = initialDevices.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      d.hostname.toLowerCase().includes(q) ||
      d.ipAddress.toLowerCase().includes(q) ||
      d.vendor.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      (d.serialNumber && d.serialNumber.toLowerCase().includes(q));

    const matchVendor = vendorFilter === "ALL" || d.vendor.toLowerCase() === vendorFilter.toLowerCase();
    const matchRole = roleFilter === "ALL" || d.role === roleFilter;

    return matchSearch && matchVendor && matchRole;
  });

  // Unique vendors for filter
  const vendors = Array.from(new Set(initialDevices.map((d) => d.vendor)));

  const getWarrantyStatus = (dateStr?: Date | string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "EXPIRED", label: "Expired", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (diffDays <= 30) {
      return { status: "EXPIRING", label: `${diffDays}d left`, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    }
    return { status: "VALID", label: date.toISOString().split("T")[0], color: "bg-zinc-800 text-zinc-400 border-zinc-700" };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hostname, IP, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Roles</option>
            <option value="Core">Core</option>
            <option value="Distribution">Distribution</option>
            <option value="Access">Access</option>
            <option value="Firewall">Firewall</option>
            <option value="AP">AP</option>
            <option value="Router">Router</option>
            <option value="UPS">UPS</option>
          </select>
        </div>

        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      {/* Devices Inventory Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 font-medium">
                <th className="py-3 px-4">Hostname</th>
                <th className="py-3 px-4">Management IP</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Hardware</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs">
                    No devices match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const warranty = getWarrantyStatus(device.warrantyEnd);
                  return (
                    <tr key={device.id} className="hover:bg-zinc-800/30 transition-colors group">
                      {/* Hostname */}
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {device.hostname}
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <span>{device.ipAddress}</span>
                          <button
                            onClick={() => handleCopy(device.ipAddress, device.id)}
                            className="text-zinc-500 hover:text-zinc-300 transition"
                            title="Copy IP"
                          >
                            {copiedIp === device.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {device.role}
                        </span>
                      </td>

                      {/* Hardware */}
                      <td className="py-3 px-4 text-zinc-300">
                        <div className="font-medium text-white">{device.vendor}</div>
                        <div className="text-[11px] text-zinc-500">{device.model}</div>
                      </td>

                      {/* Site */}
                      <td className="py-3 px-4 text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-zinc-500" />
                          {device.site?.name || "Unassigned"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            device.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : device.status === "MAINTENANCE"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              device.status === "ACTIVE"
                                ? "bg-emerald-400 animate-pulse"
                                : device.status === "MAINTENANCE"
                                ? "bg-amber-400"
                                : "bg-zinc-500"
                            }`}
                          />
                          {device.status}
                        </span>
                      </td>

                      {/* Warranty */}
                      <td className="py-3 px-4">
                        {warranty ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${warranty.color}`}
                          >
                            {warranty.label}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(device.id, device.hostname)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                          title="Delete device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Add Network Device
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

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Hostname *</label>
                  <input
                    type="text"
                    required
                    placeholder="SW-HQ-4F-01"
                    value={formData.hostname}
                    onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Management IP *</label>
                  <input
                    type="text"
                    required
                    placeholder="10.10.40.15"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Vendor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Cisco, Fortinet, Ubiquiti"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="Catalyst 9300-48P"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Device Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Core">Core</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Access">Access</option>
                    <option value="Firewall">Firewall</option>
                    <option value="AP">AP</option>
                    <option value="Router">Router</option>
                    <option value="UPS">UPS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Assigned Site</label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="FOC2419S83N"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Warranty End Date</label>
                  <input
                    type="date"
                    value={formData.warrantyEnd}
                    onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
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
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

