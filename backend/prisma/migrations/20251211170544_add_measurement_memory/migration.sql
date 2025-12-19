-- CreateTable
CREATE TABLE "measurement_memories" (
    "id" TEXT NOT NULL,
    "measurementItemId" TEXT NOT NULL,
    "description" TEXT,
    "startPoint" DECIMAL(15,3),
    "endPoint" DECIMAL(15,3),
    "length" DECIMAL(15,3),
    "width" DECIMAL(15,3),
    "height" DECIMAL(15,3),
    "quantity" DECIMAL(15,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurement_memories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "measurement_memories" ADD CONSTRAINT "measurement_memories_measurementItemId_fkey" FOREIGN KEY ("measurementItemId") REFERENCES "measurement_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
