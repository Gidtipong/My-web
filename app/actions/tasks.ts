"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { taskSchema, checklistSchema, noteSchema } from "@/lib/validations";
import { TaskStatus, TaskPriority, TaskType, Prisma } from "@prisma/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export interface TaskFilterParams {
  tab?: "all" | "open" | "today" | "this_week" | "done";
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
  siteId?: string;
  deviceId?: string;
}

export async function getTasks(filters: TaskFilterParams = {}) {
  try {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    // 1. Tab Filter
    const now = new Date();
    if (filters.tab === "open") {
      where.status = {
        in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
      };
    } else if (filters.tab === "today") {
      where.dueDate = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      };
    } else if (filters.tab === "this_week") {
      where.dueDate = {
        gte: startOfWeek(now, { weekStartsOn: 1 }),
        lte: endOfWeek(now, { weekStartsOn: 1 }),
      };
    } else if (filters.tab === "done") {
      where.status = {
        in: [TaskStatus.DONE, TaskStatus.CANCELLED],
      };
    }

    // 2. Dropdown Filters
    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status as TaskStatus;
    }
    if (filters.priority && filters.priority !== "ALL") {
      where.priority = filters.priority as TaskPriority;
    }
    if (filters.type && filters.type !== "ALL") {
      where.type = filters.type as TaskType;
    }
    if (filters.siteId && filters.siteId !== "ALL") {
      where.siteId = filters.siteId;
    }
    if (filters.deviceId && filters.deviceId !== "ALL") {
      where.deviceId = filters.deviceId;
    }

    // 3. Search Filter
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { ticketRef: { contains: q, mode: "insensitive" } },
        { device: { hostname: { contains: q, mode: "insensitive" } } },
      ];
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        site: { select: { id: true, name: true } },
        device: { select: { id: true, hostname: true, model: true, ipAddress: true } },
        checklists: { select: { id: true, done: true } },
      },
      orderBy: [
        { priority: "asc" }, // P1 first
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return { success: true, data: tasks };
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return { success: false, error: error.message || "Failed to fetch tasks" };
  }
}

export async function getTaskById(id: string) {
  try {
    const task = await db.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        site: true,
        device: true,
        assignee: true,
        checklists: {
          orderBy: { order: "asc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
        children: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, priority: true },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Fetch Audit Logs for this task
    const auditLogs = await db.auditLog.findMany({
      where: { tableName: "tasks", recordId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return { success: true, data: { ...task, auditLogs } };
  } catch (error: any) {
    console.error("Error fetching task by ID:", error);
    return { success: false, error: error.message };
  }
}

export async function createTask(rawData: any) {
  try {
    const validated = taskSchema.parse(rawData);

    // Rule: Rollback plan is REQUIRED when type = CHANGE
    if (validated.type === "CHANGE" && (!validated.rollbackPlan || !validated.rollbackPlan.trim())) {
      return {
        success: false,
        error: "Rollback Plan is strictly required when Task Type is CHANGE",
      };
    }

    const task = await db.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        priority: validated.priority,
        status: validated.status,
        dueDate: validated.dueDate,
        startAt: validated.startAt,
        endAt: validated.endAt,
        siteId: validated.siteId,
        deviceId: validated.deviceId,
        assigneeId: validated.assigneeId,
        ticketRef: validated.ticketRef,
        rollbackPlan: validated.rollbackPlan,
        recurrence: validated.recurrence,
        parentId: validated.parentId,
      },
    });

    // Handle initial checklists if passed
    if (Array.isArray(rawData.checklists) && rawData.checklists.length > 0) {
      await db.checklist.createMany({
        data: rawData.checklists.map((text: string, index: number) => ({
          taskId: task.id,
          text: text.trim(),
          done: false,
          order: index + 1,
        })),
      });
    }

    // Create Audit Log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        tableName: "tasks",
        recordId: task.id,
        meta: { title: task.title, type: task.type, priority: task.priority },
      },
    });

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, data: task };
  } catch (error: any) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message || "Failed to create task" };
  }
}

export async function updateTask(id: string, rawData: any) {
  try {
    const validated = taskSchema.partial().parse(rawData);

    if (validated.type === "CHANGE" && (!validated.rollbackPlan || !validated.rollbackPlan.trim())) {
      return {
        success: false,
        error: "Rollback Plan is required when Task Type is CHANGE",
      };
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...validated,
        completedAt:
          validated.status === "DONE"
            ? new Date()
            : validated.status
            ? null
            : undefined,
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        tableName: "tasks",
        recordId: id,
        meta: validated,
      },
    });

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    return { success: true, data: task };
  } catch (error: any) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message || "Failed to update task" };
  }
}

export async function updateTaskStatus(id: string, newStatus: TaskStatus) {
  try {
    const isDone = newStatus === TaskStatus.DONE;
    const task = await db.task.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: isDone ? new Date() : null,
      },
    });

    await db.auditLog.create({
      data: {
        action: "STATUS_CHANGE",
        tableName: "tasks",
        recordId: id,
        meta: { newStatus },
      },
    });

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    return { success: true, data: task };
  } catch (error: any) {
    console.error("Error updating task status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTask(id: string) {
  try {
    // Soft delete
    const task = await db.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        action: "SOFT_DELETE",
        tableName: "tasks",
        recordId: id,
      },
    });

    revalidatePath("/tasks");
    return { success: true, data: task };
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkUpdateTasks(
  ids: string[],
  action: { status?: TaskStatus; priority?: TaskPriority; delete?: boolean }
) {
  try {
    if (action.delete) {
      await db.task.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
    } else if (action.status) {
      await db.task.updateMany({
        where: { id: { in: ids } },
        data: {
          status: action.status,
          completedAt: action.status === TaskStatus.DONE ? new Date() : null,
        },
      });
    } else if (action.priority) {
      await db.task.updateMany({
        where: { id: { in: ids } },
        data: { priority: action.priority },
      });
    }

    revalidatePath("/tasks");
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Error bulk updating tasks:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleChecklist(id: string, done: boolean) {
  try {
    const item = await db.checklist.update({
      where: { id },
      data: { done },
    });

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${item.taskId}`);
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error toggling checklist:", error);
    return { success: false, error: error.message };
  }
}

export async function createChecklist(taskId: string, text: string) {
  try {
    const count = await db.checklist.count({ where: { taskId } });
    const item = await db.checklist.create({
      data: {
        taskId,
        text: text.trim(),
        order: count + 1,
      },
    });

    revalidatePath(`/tasks/${taskId}`);
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error creating checklist item:", error);
    return { success: false, error: error.message };
  }
}

export async function createNote(taskId: string, content: string) {
  try {
    const note = await db.note.create({
      data: {
        taskId,
        content: content.trim(),
      },
    });

    revalidatePath(`/tasks/${taskId}`);
    return { success: true, data: note };
  } catch (error: any) {
    console.error("Error creating note:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTaskSchedule(id: string, start: Date, end?: Date | null) {
  try {
    const task = await db.task.update({
      where: { id },
      data: {
        dueDate: start,
        startAt: end ? start : undefined,
        endAt: end || undefined,
      },
    });

    revalidatePath("/tasks");
    revalidatePath("/calendar");
    return { success: true, data: task };
  } catch (error: any) {
    console.error("Error updating task schedule:", error);
    return { success: false, error: error.message };
  }
}
