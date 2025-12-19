/*
  Warnings:

  - You are about to drop the column `justification` on the `contract_addendums` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `contract_addendums` table. All the data in the column will be lost.
  - You are about to drop the `addendum_items` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `contract_addendums` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `number` on the `contract_addendums` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AddendumOperationType" AS ENUM ('SUPPRESS', 'ADD', 'MODIFY_QTY', 'MODIFY_PRICE', 'MODIFY_BOTH');

-- DropForeignKey
ALTER TABLE "addendum_items" DROP CONSTRAINT "addendum_items_addendumId_fkey";

-- AlterTable
ALTER TABLE "contract_addendums" DROP COLUMN "justification",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "netValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAddition" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalSuppression" DECIMAL(15,2) NOT NULL DEFAULT 0,
DROP COLUMN "number",
ADD COLUMN     "number" INTEGER NOT NULL;

-- DropTable
DROP TABLE "addendum_items";

-- CreateTable
CREATE TABLE "addendum_operations" (
    "id" TEXT NOT NULL,
    "addendumId" TEXT NOT NULL,
    "operationType" "AddendumOperationType" NOT NULL,
    "contractItemId" TEXT,
    "newItemType" TEXT,
    "newItemCode" TEXT,
    "newItemDescription" TEXT,
    "newItemParentId" TEXT,
    "newItemUnit" TEXT,
    "originalQuantity" DECIMAL(15,3),
    "originalPrice" DECIMAL(15,2),
    "newQuantity" DECIMAL(15,3),
    "newPrice" DECIMAL(15,2),
    "operationValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addendum_operations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "addendum_operations" ADD CONSTRAINT "addendum_operations_addendumId_fkey" FOREIGN KEY ("addendumId") REFERENCES "contract_addendums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addendum_operations" ADD CONSTRAINT "addendum_operations_contractItemId_fkey" FOREIGN KEY ("contractItemId") REFERENCES "contract_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
