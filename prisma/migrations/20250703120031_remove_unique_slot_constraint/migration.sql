/*
  Warnings:

  - A unique constraint covering the columns `[slotId,status]` on the table `reservations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "reservations_slotId_key";

-- CreateIndex
CREATE INDEX "reservations_slotId_status_idx" ON "reservations"("slotId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_slotId_status_key" ON "reservations"("slotId", "status");
