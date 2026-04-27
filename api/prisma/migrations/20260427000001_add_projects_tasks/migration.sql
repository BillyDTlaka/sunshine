-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NEW_REQUEST', 'ESTIMATING', 'QUOTED', 'SUBMITTED', 'WON', 'EXECUTING', 'WAITING_CLIENT', 'COMPLETED', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum: add new values to ApprovalEntityType
ALTER TYPE "ApprovalEntityType" ADD VALUE 'PROJECT_QUOTE';
ALTER TYPE "ApprovalEntityType" ADD VALUE 'PURCHASE_REQUEST';
ALTER TYPE "ApprovalEntityType" ADD VALUE 'SUPPLIER_SELECTION';
ALTER TYPE "ApprovalEntityType" ADD VALUE 'FINAL_INVOICE';

-- CreateTable: Project
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestReference" TEXT,
    "title" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campus" TEXT,
    "department" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "deadline" TIMESTAMP(3),
    "ownerId" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NEW_REQUEST',
    "scopeOfWork" TEXT,
    "deliverables" TEXT,
    "notes" TEXT,
    "estimatedRevenue" DECIMAL(12,2),
    "estimatedMaterial" DECIMAL(12,2),
    "estimatedLabour" DECIMAL(12,2),
    "markupPct" DECIMAL(5,2),
    "plannedGrossMargin" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "actualMargin" DECIMAL(12,2),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectId_key" ON "Project"("projectId");

-- CreateTable: Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add projectId to Rfq
ALTER TABLE "Rfq" ADD COLUMN "projectId" TEXT;

-- AddForeignKey: Project.clientId -> Client
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Project.ownerId -> User
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Task.projectId -> Project
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Task.assigneeId -> User
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Task.createdById -> User
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Rfq.projectId -> Project
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
