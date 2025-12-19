-- CreateTable
CREATE TABLE "measurement_photos" (
    "id" TEXT NOT NULL,
    "measurementItemId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "measurement_photos" ADD CONSTRAINT "measurement_photos_measurementItemId_fkey" FOREIGN KEY ("measurementItemId") REFERENCES "measurement_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
