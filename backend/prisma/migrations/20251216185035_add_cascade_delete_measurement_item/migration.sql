-- DropForeignKey
ALTER TABLE "measurement_items" DROP CONSTRAINT "measurement_items_contractItemId_fkey";

-- AddForeignKey
ALTER TABLE "measurement_items" ADD CONSTRAINT "measurement_items_contractItemId_fkey" FOREIGN KEY ("contractItemId") REFERENCES "contract_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
