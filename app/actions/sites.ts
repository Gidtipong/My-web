"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { siteSchema } from "@/lib/validations";

export async function getSites() {
  return db.site.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          devices: { where: { deletedAt: null } },
          tasks: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createSite(data: any) {
  try {
    const validated = siteSchema.parse(data);
    const site = await db.site.create({
      data: validated,
    });

    revalidatePath("/sites");
    revalidatePath("/devices");
    revalidatePath("/tasks");
    return { success: true, site };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create site" };
  }
}

export async function updateSite(id: string, data: any) {
  try {
    const validated = siteSchema.partial().parse(data);
    const site = await db.site.update({
      where: { id },
      data: validated,
    });

    revalidatePath("/sites");
    return { success: true, site };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update site" };
  }
}

export async function deleteSite(id: string) {
  try {
    await db.site.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/sites");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete site" };
  }
}

