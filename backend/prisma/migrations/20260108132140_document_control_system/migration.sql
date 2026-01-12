-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('RECEIVED', 'IN_ANALYSIS', 'APPROVED', 'APPROVED_NOTES', 'REJECTED', 'DISTRIBUTED', 'RELEASED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AnalysisResult" AS ENUM ('APPROVED', 'REJECTED', 'APPROVED_NOTES');

-- CreateEnum
CREATE TYPE "GRDSendMethod" AS ENUM ('EMAIL', 'PHYSICAL', 'CLOUD', 'CD_DVD', 'PENDRIVE');

-- CreateEnum
CREATE TYPE "GRDReason" AS ENUM ('INITIAL', 'REVISION', 'REPLACEMENT', 'INFORMATION', 'APPROVAL');

-- CreateEnum
CREATE TYPE "GRDStatus" AS ENUM ('DRAFT', 'SENT', 'RECEIVED', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('CIRCLE', 'ARROW', 'TEXT', 'CLOUD', 'DIMENSION', 'STRIKEOUT', 'RECTANGLE', 'FREEHAND');

-- CreateTable
CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "categoryId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'R00',
    "revisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DocumentStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyzedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "uploadedByName" TEXT,
    "author" TEXT,
    "discipline" TEXT,
    "format" TEXT,
    "scale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "changes" TEXT,
    "uploadedById" TEXT,
    "uploadedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "critical_analyses" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewerName" TEXT,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "result" "AnalysisResult",
    "observations" TEXT,
    "pendencies" JSONB,
    "technicalNotes" TEXT,
    "deadline" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "critical_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grds" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientCompany" TEXT,
    "sendMethod" "GRDSendMethod" NOT NULL DEFAULT 'EMAIL',
    "reason" "GRDReason" NOT NULL DEFAULT 'INITIAL',
    "status" "GRDStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grd_items" (
    "id" TEXT NOT NULL,
    "grdId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grd_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_annotations" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "geometry" JSONB NOT NULL,
    "text" TEXT,
    "color" TEXT NOT NULL DEFAULT '#ff0000',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_code_key" ON "document_categories"("code");

-- CreateIndex
CREATE INDEX "project_documents_contractId_idx" ON "project_documents"("contractId");

-- CreateIndex
CREATE INDEX "project_documents_categoryId_idx" ON "project_documents"("categoryId");

-- CreateIndex
CREATE INDEX "project_documents_status_idx" ON "project_documents"("status");

-- CreateIndex
CREATE INDEX "project_documents_code_idx" ON "project_documents"("code");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");

-- CreateIndex
CREATE INDEX "critical_analyses_documentId_idx" ON "critical_analyses"("documentId");

-- CreateIndex
CREATE INDEX "critical_analyses_reviewerId_idx" ON "critical_analyses"("reviewerId");

-- CreateIndex
CREATE INDEX "critical_analyses_status_idx" ON "critical_analyses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "grds_number_key" ON "grds"("number");

-- CreateIndex
CREATE INDEX "grds_contractId_idx" ON "grds"("contractId");

-- CreateIndex
CREATE INDEX "grds_number_idx" ON "grds"("number");

-- CreateIndex
CREATE INDEX "grds_status_idx" ON "grds"("status");

-- CreateIndex
CREATE INDEX "grd_items_grdId_idx" ON "grd_items"("grdId");

-- CreateIndex
CREATE INDEX "grd_items_documentId_idx" ON "grd_items"("documentId");

-- CreateIndex
CREATE INDEX "document_annotations_documentId_idx" ON "document_annotations"("documentId");

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "critical_analyses" ADD CONSTRAINT "critical_analyses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grds" ADD CONSTRAINT "grds_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grd_items" ADD CONSTRAINT "grd_items_grdId_fkey" FOREIGN KEY ("grdId") REFERENCES "grds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grd_items" ADD CONSTRAINT "grd_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "project_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_annotations" ADD CONSTRAINT "document_annotations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
