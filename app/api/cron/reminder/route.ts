import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDailyDigest } from "@/lib/notify";
import { startOfDay, endOfDay, addDays, differenceInDays } from "date-fns";

export async function GET(req: NextRequest) {
  // 1. Verify CRON_SECRET bearer token
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const token = authHeader?.replace("Bearer ", "");
    const querySecret = req.nextUrl.searchParams.get("secret");
    if (token !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const in30Days = addDays(now, 30);

    // 2. Fetch Overdue Tasks
    const overdueTasks = await db.task.findMany({
      where: {
        deletedAt: null,
        status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
        dueDate: { lt: todayStart },
      },
      select: { title: true, priority: true, dueDate: true },
      orderBy: { priority: "asc" },
      take: 10,
    });

    // 3. Fetch Tasks Due Today
    const todayTasks = await db.task.findMany({
      where: {
        deletedAt: null,
        status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      select: { title: true, priority: true },
      orderBy: { priority: "asc" },
      take: 10,
    });

    // 4. Fetch Devices Expiring within 30 days (licenseEnd or warrantyEnd)
    const devices = await db.device.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        OR: [
          { licenseEnd: { gte: now, lte: in30Days } },
          { warrantyEnd: { gte: now, lte: in30Days } },
        ],
      },
      select: { hostname: true, model: true, licenseEnd: true, warrantyEnd: true },
    });

    const expiringDevices = devices.map((d) => {
      const expDate = (d.licenseEnd && d.licenseEnd <= in30Days ? d.licenseEnd : d.warrantyEnd)!;
      const daysLeft = Math.max(0, differenceInDays(expDate, now));
      return {
        hostname: d.hostname,
        model: d.model,
        daysLeft,
      };
    });

    // 5. Send Digest via Telegram / Notifier
    const sendResult = await sendDailyDigest({
      overdueTasks,
      todayTasks,
      expiringDevices,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      digest: {
        overdueCount: overdueTasks.length,
        todayCount: todayTasks.length,
        expiringCount: expiringDevices.length,
      },
      sendResult,
    });
  } catch (error: any) {
    console.error("[Cron Reminder] Error executing digest:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
