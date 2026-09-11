import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { DevicesClient } from "@/components/devices/devices-client";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Devices Inventory | NetTask",
  description: "Network hardware inventory, IP management, and warranty tracking",
};

export default async function DevicesPage() {
  const [devices, sites] = await Promise.all([
    db.device.findMany({
      where: { deletedAt: null },
      include: {
        site: { select: { id: true, name: true } },
      },
      orderBy: { hostname: "asc" },
    }),
    db.site.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Network Hardware & Devices Inventory
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage physical switches, routers, firewalls, and access points across all network sites.
        </p>
      </div>

      <DevicesClient initialDevices={devices} sites={sites} />
    </div>
  );
}

