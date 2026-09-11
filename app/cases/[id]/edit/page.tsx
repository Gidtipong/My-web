import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCaseById, getAllTags } from "@/app/actions/cases";
import { CaseForm } from "@/components/cases/case-form";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [caseRes, sites, devices, tagsRes] = await Promise.all([
    getCaseById(id),
    db.site.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.device.findMany({
      where: { deletedAt: null },
      select: { id: true, hostname: true, siteId: true, vendor: true },
      orderBy: { hostname: "asc" },
    }),
    getAllTags(),
  ]);

  if (!caseRes.success || !caseRes.data) {
    notFound();
  }

  return (
    <CaseForm
      initialData={caseRes.data}
      sites={sites}
      devices={devices}
      allTags={tagsRes.data || []}
    />
  );
}
