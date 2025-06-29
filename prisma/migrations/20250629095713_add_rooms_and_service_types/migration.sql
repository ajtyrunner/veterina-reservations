/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,startTime,endTime,roomId]` on the table `slots` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doctorId,startTime,endTime,serviceTypeId]` on the table `slots` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "slots_doctorId_startTime_endTime_key";

-- AlterTable
ALTER TABLE "slots" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "serviceTypeId" TEXT;

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "color" TEXT,
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_tenantId_name_key" ON "rooms"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_tenantId_name_key" ON "service_types"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "slots_doctorId_startTime_endTime_roomId_key" ON "slots"("doctorId", "startTime", "endTime", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "slots_doctorId_startTime_endTime_serviceTypeId_key" ON "slots"("doctorId", "startTime", "endTime", "serviceTypeId");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
