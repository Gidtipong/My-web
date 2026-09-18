import React from "react";
import { db } from "@/lib/db";
import { getAllTags } from "@/app/actions/cases";
import { CaseForm } from "@/components/cases/case-form";
import { guardApprovedPage } from "@/lib/auth-guard";

export const metadata = {
  title: "New Knowledge Case — NetTask",
  description: "Document a new network troubleshooting case.",
};

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await guardApprovedPage();
  const params = await searchParams;

  const [sites, devices, tagsRes] = await Promise.all([
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

  const initialData = {
    title: params.title || "",
    symptom: params.symptom || "",
    deviceId: params.deviceId || "",
    siteId: params.siteId || "",
    taskId: params.fromTaskId || "",
    vendor: params.vendor || "",
  };

  return (
    <CaseForm
      initialData={initialData}
      sites={sites}
      devices={devices}
      allTags={tagsRes.data || []}
    />
  );
}
