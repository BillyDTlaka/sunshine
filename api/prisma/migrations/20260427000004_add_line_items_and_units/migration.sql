-- Add labour fields to Project
ALTER TABLE "Project" ADD COLUMN "labourRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "labourScope" TEXT;

-- Remove deliverables column (replaced by line items)
ALTER TABLE "Project" DROP COLUMN IF EXISTS "deliverables";

-- CreateTable: ProjectLineItem
CREATE TABLE "ProjectLineItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectLineItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectLineItem" ADD CONSTRAINT "ProjectLineItem_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Unit
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- Seed default units
INSERT INTO "Unit" ("id", "name", "status", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), 'Each',  'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'm',     'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'm²',    'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'm³',    'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'kg',    'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'Roll',  'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'Box',   'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'Set',   'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'Lot',   'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'Hour',  'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), 'Day',   'ACTIVE', NOW(), NOW());
