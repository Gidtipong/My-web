"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { caseSchema } from "@/lib/validations";
import { CaseCategory, CaseSeverity, Prisma } from "@prisma/client";

export interface CaseSearchParams {
  query?: string;
  category?: string;
  severity?: string;
  vendor?: string;
  siteId?: string;
  tag?: string;
  limit?: number;
}

export async function searchCases(params: CaseSearchParams = {}) {
  try {
    const { query, category, severity, vendor, siteId, tag, limit = 50 } = params;
    const q = query ? query.trim() : "";

    // If search term is provided, utilize PostgreSQL Full-Text Search with ts_rank and pg_trgm
    if (q) {
      // Prepare sanitized query for tsquery
      const words = q.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(" & ");

      const cases = await db.$queryRaw<any[]>`
        SELECT 
          c.id,
          c."caseNumber",
          c.title,
          c.symptom,
          c.cause,
          c.solution,
          c.prevention,
          c.category,
          c.severity,
          c.vendor,
          c.tags,
          c."siteId",
          c."deviceId",
          c."taskId",
          c."timeToFix",
          c."occurredAt",
          c."resolvedAt",
          c."viewCount",
          c."recurrenceCount",
          c."isFavorite",
          c."isPinned",
          c."createdAt",
          s.name as "siteName",
          d.hostname as "deviceHostname",
          ts_rank(c."searchVector", to_tsquery('simple', ${words})) as rank,
          similarity(c.title, ${q}) as sim
        FROM "cases" c
        LEFT JOIN "sites" s ON c."siteId" = s.id
        LEFT JOIN "devices" d ON c."deviceId" = d.id
        WHERE c."deletedAt" IS NULL
          ${category && category !== "ALL" ? Prisma.sql`AND c.category = ${category}::"CaseCategory"` : Prisma.empty}
          ${severity && severity !== "ALL" ? Prisma.sql`AND c.severity = ${severity}::"CaseSeverity"` : Prisma.empty}
          ${vendor && vendor !== "ALL" ? Prisma.sql`AND c.vendor ILIKE ${'%' + vendor + '%'}` : Prisma.empty}
          ${siteId && siteId !== "ALL" ? Prisma.sql`AND c."siteId" = ${siteId}` : Prisma.empty}
          ${tag ? Prisma.sql`AND ${tag} = ANY(c.tags)` : Prisma.empty}
          AND (
            c."searchVector" @@ to_tsquery('simple', ${words})
            OR c.title % ${q}
            OR c.title ILIKE ${'%' + q + '%'}
            OR c.symptom ILIKE ${'%' + q + '%'}
            OR c.cause ILIKE ${'%' + q + '%'}
            OR c."caseNumber" ILIKE ${'%' + q + '%'}
          )
        ORDER BY 
          rank DESC,
          sim DESC,
          c."viewCount" DESC,
          c."occurredAt" DESC
        LIMIT ${limit};
      `;

      // Map raw SQL result to include site and device objects
      const formatted = cases.map(c => ({
        ...c,
        site: c.siteName ? { id: c.siteId, name: c.siteName } : null,
        device: c.deviceHostname ? { id: c.deviceId, hostname: c.deviceHostname } : null,
      }));

      return { success: true, data: formatted };
    }

    // Default query without full-text search string
    const where: Prisma.CaseWhereInput = {
      deletedAt: null,
    };

    if (category && category !== "ALL") where.category = category as CaseCategory;
    if (severity && severity !== "ALL") where.severity = severity as CaseSeverity;
    if (vendor && vendor !== "ALL") where.vendor = { contains: vendor, mode: "insensitive" };
    if (siteId && siteId !== "ALL") where.siteId = siteId;
    if (tag) where.tags = { has: tag };

    const cases = await db.case.findMany({
      where,
      include: {
        site: { select: { id: true, name: true } },
        device: { select: { id: true, hostname: true } },
      },
      orderBy: [
        { isPinned: "desc" },
        { occurredAt: "desc" },
      ],
      take: limit,
    });

    return { success: true, data: cases };
  } catch (error: any) {
    console.error("Error searching cases:", error);
    return { success: false, error: error.message || "Failed to search cases" };
  }
}

export async function getCaseById(id: string) {
  try {
    // 1. Increment view count atomically on load
    const caseItem = await db.case.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        site: true,
        device: true,
        task: {
          select: { id: true, title: true, status: true, priority: true, ticketRef: true },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!caseItem || caseItem.deletedAt) {
      return { success: false, error: "Case not found" };
    }

    // 2. Fetch related cases sharing any tags
    let relatedCases: any[] = [];
    if (caseItem.tags && caseItem.tags.length > 0) {
      relatedCases = await db.case.findMany({
        where: {
          id: { not: id },
          tags: { hasSome: caseItem.tags },
          deletedAt: null,
        },
        select: {
          id: true,
          caseNumber: true,
          title: true,
          category: true,
          severity: true,
          cause: true,
          tags: true,
        },
        take: 4,
      });
    }

    return {
      success: true,
      data: {
        ...caseItem,
        relatedCases,
      },
    };
  } catch (error: any) {
    console.error("Error fetching case by ID:", error);
    return { success: false, error: error.message };
  }
}

export async function createCase(rawData: any) {
  try {
    // Generate auto caseNumber: CASE-YYYY-NNNN
    const currentYear = new Date().getFullYear();
    const countThisYear = await db.case.count({
      where: {
        caseNumber: { startsWith: `CASE-${currentYear}-` },
      },
    });
    const nextSeq = String(countThisYear + 1).padStart(4, "0");
    const generatedCaseNumber = `CASE-${currentYear}-${nextSeq}`;

    const validated = caseSchema.parse({
      ...rawData,
      caseNumber: rawData.caseNumber || generatedCaseNumber,
    });

    const newCase = await db.case.create({
      data: {
        caseNumber: validated.caseNumber!,
        title: validated.title,
        symptom: validated.symptom,
        cause: validated.cause,
        solution: validated.solution,
        prevention: validated.prevention,
        category: validated.category,
        severity: validated.severity,
        vendor: validated.vendor,
        tags: validated.tags || [],
        siteId: validated.siteId,
        deviceId: validated.deviceId,
        taskId: validated.taskId,
        timeToFix: validated.timeToFix,
        occurredAt: validated.occurredAt || new Date(),
        isFavorite: validated.isFavorite || false,
        isPinned: validated.isPinned || false,
      },
    });

    await db.auditLog.create({
      data: {
        action: "CREATE",
        tableName: "cases",
        recordId: newCase.id,
        meta: { caseNumber: newCase.caseNumber, title: newCase.title },
      },
    });

    revalidatePath("/cases");
    return { success: true, data: newCase };
  } catch (error: any) {
    console.error("Error creating case:", error);
    return { success: false, error: error.message || "Failed to create case" };
  }
}

export async function updateCase(id: string, rawData: any) {
  try {
    const validated = caseSchema.partial().parse(rawData);

    const updated = await db.case.update({
      where: { id },
      data: validated,
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        tableName: "cases",
        recordId: id,
        meta: validated,
      },
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating case:", error);
    return { success: false, error: error.message || "Failed to update case" };
  }
}

export async function incrementRecurrence(id: string) {
  try {
    const updated = await db.case.update({
      where: { id },
      data: {
        recurrenceCount: { increment: 1 },
        occurredAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        action: "RECURRENCE_INCREMENT",
        tableName: "cases",
        recordId: id,
        meta: { recurrenceCount: updated.recurrenceCount },
      },
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error incrementing recurrence:", error);
    return { success: false, error: error.message };
  }
}

export async function togglePinCase(id: string, isPinned: boolean) {
  try {
    const updated = await db.case.update({
      where: { id },
      data: { isPinned },
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling pin:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllTags() {
  try {
    const cases = await db.case.findMany({
      where: { deletedAt: null },
      select: { tags: true },
    });

    const counts: Record<string, number> = {};
    for (const c of cases) {
      for (const t of c.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }

    const tagList = Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: tagList };
  } catch (error: any) {
    console.error("Error getting tags:", error);
    return { success: false, data: [] };
  }
}

export async function addCaseAttachment(
  caseId: string,
  attachmentData: { fileName: string; fileUrl: string; fileType: string; fileSize: number }
) {
  try {
    const item = await db.attachment.create({
      data: {
        caseId,
        fileName: attachmentData.fileName,
        fileUrl: attachmentData.fileUrl,
        fileType: attachmentData.fileType,
        fileSize: attachmentData.fileSize,
      },
    });

    revalidatePath(`/cases/${caseId}`);
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error adding attachment:", error);
    return { success: false, error: error.message };
  }
}
