import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [tasks, devices, sites, cases] = await Promise.all([
      db.task.count({ where: { deletedAt: null } }),
      db.device.count({ where: { deletedAt: null } }),
      db.site.count({ where: { deletedAt: null } }),
      db.case.count({ where: { deletedAt: null } }),
    ]);

    return NextResponse.json(
      { tasks, devices, sites, cases },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { tasks: null, devices: null, sites: null, cases: null },
      { status: 500 }
    );
  }
}

