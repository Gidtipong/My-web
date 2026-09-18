import React from "react";
import { notFound } from "next/navigation";
import { getCaseById } from "@/app/actions/cases";
import { CaseDetailView } from "@/components/cases/case-detail-view";
import { guardApprovedPage } from "@/lib/auth-guard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getCaseById(id);
  if (!res.success || !res.data) {
    return { title: "Case Not Found — NetTask" };
  }
  return {
    title: `[${res.data.caseNumber}] ${res.data.title} — NetTask`,
    description: res.data.cause || res.data.symptom || "Network case details",
  };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await guardApprovedPage();
  const { id } = await params;
  const res = await getCaseById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <CaseDetailView caseItem={res.data} />;
}
