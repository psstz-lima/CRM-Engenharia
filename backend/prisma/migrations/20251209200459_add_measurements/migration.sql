-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_items" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "contractItemId" TEXT NOT NULL,
    "measuredQuantity" DECIMAL(15,3) NOT NULL,
    "accumulatedQuantity" DECIMAL(15,3) NOT NULL,
    "currentPrice" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "measurement_items_measurementId_contractItemId_key" ON "measurement_items"("measurementId", "contractItemId");

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_items" ADD CONSTRAINT "measurement_items_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_items" ADD CONSTRAINT "measurement_items_contractItemId_fkey" FOREIGN KEY ("contractItemId") REFERENCES "contract_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
