"use server";

import { db } from "@/lib/db";
import { notifier } from "@/lib/notify";

export async function getSystemStats() {
  const [siteCount, deviceCount, taskCount, caseCount, userCount] = await Promise.all([
    db.site.count({ where: { deletedAt: null } }),
    db.device.count({ where: { deletedAt: null } }),
    db.task.count({ where: { deletedAt: null } }),
    db.case.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null } }),
  ]);

  const activeUser = await db.user.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return {
    siteCount,
    deviceCount,
    taskCount,
    caseCount,
    userCount,
    user: activeUser,
    envStatus: {
      telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      cronSecretConfigured: !!process.env.CRON_SECRET,
      databaseUrlConfigured: !!process.env.DATABASE_URL,
    },
  };
}

export async function sendTestNotification() {
  try {
    const result = await notifier.send({
      title: "System Test Notification",
      message: "This is a test notification from NetTask Network Management System.",
      items: [
        `Timestamp: ${new Date().toISOString()}`,
        "System: Online & Active",
        "Connection: Verified",
      ],
      level: "info",
    });

    return {
      success: result.success,
      isConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      error: result.error,
    };
  } catch (error: any) {
    return { success: false, isConfigured: false, error: error.message };
  }
}

export async function exportBackupData() {
  const [sites, devices, tasks, cases, users] = await Promise.all([
    db.site.findMany({ where: { deletedAt: null } }),
    db.device.findMany({ where: { deletedAt: null } }),
    db.task.findMany({
      where: { deletedAt: null },
      include: {
        checklists: true,
        notes: true,
      },
    }),
    db.case.findMany({ where: { deletedAt: null } }),
    db.user.findMany({ where: { deletedAt: null } }),
  ]);

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      system: "NetTask Network Management System",
      siteCount: sites.length,
      deviceCount: devices.length,
      taskCount: tasks.length,
      caseCount: cases.length,
    },
    sites,
    devices,
    tasks,
    cases,
    users,
  };
}
