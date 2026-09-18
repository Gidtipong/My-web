import React from "react";
import { Metadata } from "next";
import { getReportsData } from "@/app/actions/reports";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { guardApprovedPage } from "@/lib/auth-guard";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Reports & Analytics | NetTask",
  description: "Network operations analytics, MTTR, and task completion metrics",
};

export default async function ReportsPage() {
  await guardApprovedPage();
  const initialData = await getReportsData(30);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Operations & Performance Reports
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Detailed metrics on task throughput, mean time to resolve (MTTR), and knowledge base recurrence.
        </p>
      </div>

      <ReportsDashboard initialData={initialData} />
    </div>
  );
}

