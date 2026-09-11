import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("⚡ Applying PostgreSQL Full-Text Search & pg_trgm migration to Supabase...");

  try {
    // 1. Enable pg_trgm extension for trigram similarity & fuzzy matching
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("✅ pg_trgm extension enabled.");

    // 2. Add generated tsvector column 'searchVector' using 'simple' configuration
    // Title has weight 'A', Symptom has weight 'B', Solution and Cause have weight 'C'
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" 
      ADD COLUMN IF NOT EXISTS "searchVector" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(symptom, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(solution, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(cause, '')), 'C')
      ) STORED;
    `);
    console.log("✅ 'searchVector' generated column added to 'cases'.");

    // 3. Create GIN index on searchVector for fast full-text queries
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS cases_search_vector_idx ON "cases" USING gin ("searchVector");
    `);
    console.log("✅ GIN index on 'searchVector' created.");

    // 4. Create Trigram GIN index on title for typo tolerance
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS cases_title_trgm_idx ON "cases" USING gin (title gin_trgm_ops);
    `);
    console.log("✅ Trigram index on 'title' created.");

    console.log("🎉 Search migration applied successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
