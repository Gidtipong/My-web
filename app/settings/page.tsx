import React from "react";
import { Metadata } from "next";
import { getSystemStats } from "@/app/actions/settings";
import { SettingsView } from "@/components/settings/settings-view";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Settings & System | NetTask",
  description: "Engineer profile, notifications, system health, and JSON database backup",
};

export default async function SettingsPage() {
  const stats = await getSystemStats();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Settings & System Administration
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage system configurations, test notification webhooks, and export full database backups.
        </p>
      </div>

      <SettingsView stats={stats} />
    </div>
  );
}

