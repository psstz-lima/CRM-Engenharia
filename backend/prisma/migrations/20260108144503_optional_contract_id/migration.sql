-- DropForeignKey
ALTER TABLE "project_documents" DROP CONSTRAINT "project_documents_contractId_fkey";

-- AlterTable
ALTER TABLE "project_documents" ALTER COLUMN "contractId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
