-- CreateTable
CREATE TABLE "measurement_revisions" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurement_revisions_measurementId_idx" ON "measurement_revisions"("measurementId");
