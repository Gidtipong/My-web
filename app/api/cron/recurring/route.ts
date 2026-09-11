import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, addMonths, addWeeks } from "date-fns";

export async function GET(req: NextRequest) {
  // 1. Verify CRON_SECRET
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

    // 2. Find tasks with recurrence pattern
    const recurringTasks = await db.task.findMany({
      where: {
        deletedAt: null,
        recurrence: { not: null },
      },
      include: {
        checklists: true,
      },
    });

    let generatedCount = 0;

    for (const task of recurringTasks) {
      // Calculate next due date
      let nextDue: Date | null = null;
      const baseDate = task.dueDate || task.createdAt;

      if (task.recurrence === "DAILY") {
        nextDue = addDays(baseDate, 1);
      } else if (task.recurrence === "WEEKLY") {
        nextDue = addWeeks(baseDate, 1);
      } else if (task.recurrence === "MONTHLY") {
        nextDue = addMonths(baseDate, 1);
      }

      if (!nextDue || nextDue <= now) continue;

      // Check if task for next occurrence already exists
      const existing = await db.task.findFirst({
        where: {
          title: task.title,
          dueDate: nextDue,
          deletedAt: null,
        },
      });

      if (!existing) {
        // Clone new task instance
        const newTask = await db.task.create({
          data: {
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            status: "TODO",
            dueDate: nextDue,
            siteId: task.siteId,
            deviceId: task.deviceId,
            assigneeId: task.assigneeId,
            ticketRef: task.ticketRef,
            rollbackPlan: task.rollbackPlan,
            recurrence: task.recurrence,
            parentId: task.id,
          },
        });

        // Copy checklists if any
        if (task.checklists.length > 0) {
          await db.checklist.createMany({
            data: task.checklists.map((c) => ({
              taskId: newTask.id,
              text: c.text,
              done: false,
              order: c.order,
            })),
          });
        }

        generatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      generatedRecurringTasks: generatedCount,
    });
  } catch (error: any) {
    console.error("[Cron Recurring] Error generating recurring tasks:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
