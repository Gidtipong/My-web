import React from "react";
import { db } from "@/lib/db";
import { getAllTags } from "@/app/actions/cases";
import { CasesExplorer } from "@/components/cases/cases-explorer";
import { guardApprovedPage } from "@/lib/auth-guard";

export const metadata = {
  title: "Knowledge Base — NetTask",
  description: "Network troubleshooting knowledge base with weighted full-text search.",
};

export const revalidate = 15;

export default async function CasesPage() {
  await guardApprovedPage();
  const [cases, tagsRes, sites] = await Promise.all([
    db.case.findMany({
      where: { deletedAt: null },
      include: {
        site: { select: { id: true, name: true } },
        device: { select: { id: true, hostname: true } },
      },
      orderBy: [
        { isPinned: "desc" },
        { occurredAt: "desc" },
      ],
      take: 50,
    }),
    getAllTags(),
    db.site.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const vendors = ["Cisco", "Fortinet", "Ubiquiti", "APC"];

  return (
    <CasesExplorer
      initialCases={cases}
      allTags={tagsRes.data || []}
      sites={sites}
      vendors={vendors}
    />
  );
}
