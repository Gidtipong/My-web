import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { SitesClient } from "@/components/sites/sites-client";
import { guardApprovedPage } from "@/lib/auth-guard";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Network Sites | NetTask",
  description: "Datacenter and branch site management and emergency contacts",
};

export default async function SitesPage() {
  await guardApprovedPage();
  const sites = await db.site.findMany({
    where: { deletedAt: null },
    include: {
      devices: {
        where: { deletedAt: null },
        select: {
          id: true,
          hostname: true,
          ipAddress: true,
          role: true,
          status: true,
        },
      },
      _count: {
        select: {
          devices: { where: { deletedAt: null } },
          tasks: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Network Sites & Data Centers
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Datacenter facilities, branch offices, rack locations, and on-site emergency contacts.
        </p>
      </div>

      <SitesClient initialSites={sites} />
    </div>
  );
}

