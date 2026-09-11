"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deviceSchema } from "@/lib/validations";

export async function getDevices() {
  return db.device.findMany({
    where: { deletedAt: null },
    include: {
      site: { select: { id: true, name: true } },
    },
    orderBy: { hostname: "asc" },
  });
}

export async function createDevice(data: any) {
  try {
    const validated = deviceSchema.parse(data);
    const existing = await db.device.findUnique({
      where: { hostname: validated.hostname },
    });

    if (existing && !existing.deletedAt) {
      return { success: false, error: `Device with hostname "${validated.hostname}" already exists.` };
    }

    const device = await db.device.create({
      data: validated as any,
    });

    revalidatePath("/devices");
    revalidatePath("/tasks");
    return { success: true, device };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create device" };
  }
}

export async function updateDevice(id: string, data: any) {
  try {
    const validated = deviceSchema.partial().parse(data);
    const device = await db.device.update({
      where: { id },
      data: validated as any,
    });

    revalidatePath("/devices");
    return { success: true, device };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update device" };
  }
}

export async function deleteDevice(id: string) {
  try {
    await db.device.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/devices");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete device" };
  }
}

