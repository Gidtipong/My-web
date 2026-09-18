-- ==============================================================================
-- NETTASK DATABASE SECURITY HARDENING SCRIPT
-- Resolves: Broken Object Level Authorization (BOLA) & Missing RLS (CVSS 9.1)
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on ALL application tables
-- By default, enabling RLS without any policies completely BLOCKS direct PostgREST access.
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all direct PostgREST API permissions from 'anon' (unauthenticated) role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- 3. Revoke direct PostgREST API permissions from 'authenticated' role
-- (All application queries are handled securely server-side via Prisma with direct postgres credentials)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;

-- 4. Verify RLS status on all tables in public schema
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public';

