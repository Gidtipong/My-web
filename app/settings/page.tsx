import React from "react";
import { Metadata } from "next";
import { getSystemStats } from "@/app/actions/settings";
import { SettingsView } from "@/components/settings/settings-view";
import { guardApprovedPage } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings & System | NetTask",
  description: "Engineer profile, notifications, system health, and JSON database backup",
};

export default async function SettingsPage() {
  await guardApprovedPage();
  const stats = await getSystemStats();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Settings & System Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Manage system configurations, test notification webhooks, and export full database backups.
        </p>
      </div>

      <SettingsView stats={stats} />
    </div>
  );
}

