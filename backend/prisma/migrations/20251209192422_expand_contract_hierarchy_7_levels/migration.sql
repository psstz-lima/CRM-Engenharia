/*
  Warnings:

  - The values [SUBITEM,SERVICE] on the enum `ContractItemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContractItemType_new" AS ENUM ('STAGE', 'SUBSTAGE', 'LEVEL', 'SUBLEVEL', 'GROUP', 'SUBGROUP', 'ITEM');
ALTER TABLE "contract_items" ALTER COLUMN "type" TYPE "ContractItemType_new" USING ("type"::text::"ContractItemType_new");
ALTER TYPE "ContractItemType" RENAME TO "ContractItemType_old";
ALTER TYPE "ContractItemType_new" RENAME TO "ContractItemType";
DROP TYPE "ContractItemType_old";
COMMIT;
