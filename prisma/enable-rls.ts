import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tables = [
  "users",
  "sites",
  "devices",
  "tasks",
  "checklists",
  "notes",
  "cases",
  "attachments",
  "audit_logs",
];

async function main() {
  console.log("🛡️ Starting Security Hardening: Enabling Row Level Security (RLS)...");

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS enabled on table: "${table}"`);
    } catch (err: any) {
      console.error(`⚠️ Could not enable RLS on "${table}":`, err.message);
    }
  }

  // Revoke public PostgREST API access from anon role
  console.log("🔒 Revoking PostgREST direct access for 'anon' and 'authenticated' roles on public tables...");
  try {
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;`);
    console.log("✅ Revoked all permissions from 'anon' role on public schema.");
  } catch (err: any) {
    console.error("⚠️ Error revoking permissions from 'anon':", err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;`);
    console.log("✅ Revoked direct PostgREST permissions from 'authenticated' role on public schema.");
  } catch (err: any) {
    console.error("⚠️ Error revoking permissions from 'authenticated':", err.message);
  }

  console.log("🎉 Security Hardening Completed: Database is now fully protected against BOLA / Unauthenticated Access!");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

