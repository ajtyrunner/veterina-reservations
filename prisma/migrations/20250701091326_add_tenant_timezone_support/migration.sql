/*
  Warnings:

  - You are about to drop the column `room` on the `slots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[doctorId,startTime,endTime]` on the table `slots` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "slots_doctorId_startTime_endTime_roomId_key";

-- DropIndex
DROP INDEX "slots_doctorId_startTime_endTime_serviceTypeId_key";

-- AlterTable
ALTER TABLE "slots" DROP COLUMN "room",
ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Prague';

-- CreateIndex
CREATE UNIQUE INDEX "slots_doctorId_startTime_endTime_key" ON "slots"("doctorId", "startTime", "endTime");
