-- CreateEnum
CREATE TYPE "CommentTargetType" AS ENUM ('MEASUREMENT_ITEM', 'CONTRACT_ITEM', 'MEASUREMENT', 'CONTRACT');

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetType" "CommentTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_approvals" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "approvalLevelId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "approvedByName" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "measurement_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_targetType_targetId_idx" ON "comments"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_levels_name_key" ON "approval_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "approval_levels_level_key" ON "approval_levels"("level");

-- CreateIndex
CREATE INDEX "measurement_approvals_measurementId_idx" ON "measurement_approvals"("measurementId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_approvals_measurementId_approvalLevelId_key" ON "measurement_approvals"("measurementId", "approvalLevelId");

-- AddForeignKey
ALTER TABLE "measurement_approvals" ADD CONSTRAINT "measurement_approvals_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_approvals" ADD CONSTRAINT "measurement_approvals_approvalLevelId_fkey" FOREIGN KEY ("approvalLevelId") REFERENCES "approval_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
