-- Baseline migration: existing schema already applied via prisma db push.
-- This migration is intentionally empty so prisma migrate deploy can
-- track history going forward without re-running DDL that already exists.
SELECT 1;
