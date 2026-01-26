-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AlertRuleType" AS ENUM ('CONTRACT_EXPIRING', 'MEASUREMENT_PENDING', 'DOCUMENT_OVERDUE', 'SLA_BREACH');

-- CreateEnum
CREATE TYPE "ContractEventType" AS ENUM ('CONTRACT_CREATED', 'CONTRACT_UPDATED', 'MEASUREMENT_CREATED', 'MEASUREMENT_CLOSED', 'MEASUREMENT_APPROVED', 'DOCUMENT_UPLOADED', 'DOCUMENT_STATUS_CHANGED', 'GRD_SENT', 'TASK_CREATED', 'TASK_COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE 'SLA_BREACH';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_ASSIGNED';

-- AlterTable
ALTER TABLE "measurement_approvals" ADD COLUMN     "signatureHash" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "contract_approval_flows" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_approval_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_approval_steps" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "approvalLevelId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contract_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "contractId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AlertRuleType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "thresholdDays" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_events" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "ContractEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "contract_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_approval_flows_contractId_isActive_idx" ON "contract_approval_flows"("contractId", "isActive");

-- CreateIndex
CREATE INDEX "contract_approval_steps_flowId_idx" ON "contract_approval_steps"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_approval_steps_flowId_approvalLevelId_key" ON "contract_approval_steps"("flowId", "approvalLevelId");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_status_idx" ON "tasks"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "tasks_contractId_idx" ON "tasks"("contractId");

-- CreateIndex
CREATE INDEX "alert_rules_type_isActive_idx" ON "alert_rules"("type", "isActive");

-- CreateIndex
CREATE INDEX "contract_events_contractId_createdAt_idx" ON "contract_events"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "contract_events_type_idx" ON "contract_events"("type");

-- AddForeignKey
ALTER TABLE "contract_approval_flows" ADD CONSTRAINT "contract_approval_flows_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_approval_steps" ADD CONSTRAINT "contract_approval_steps_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "contract_approval_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_approval_steps" ADD CONSTRAINT "contract_approval_steps_approvalLevelId_fkey" FOREIGN KEY ("approvalLevelId") REFERENCES "approval_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
