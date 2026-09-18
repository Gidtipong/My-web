-- ==============================================================================
-- Migration: Add UserStatus Enum and status column to users table
-- ==============================================================================

-- 1. Create UserStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add status column to users table with default PENDING
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- 3. Grandfather all existing users to APPROVED so current user / admin is NOT locked out
UPDATE "users" SET "status" = 'APPROVED';

-- 4. Ensure current admin retains ADMIN role
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" ILIKE '%@%' AND "status" = 'APPROVED';

