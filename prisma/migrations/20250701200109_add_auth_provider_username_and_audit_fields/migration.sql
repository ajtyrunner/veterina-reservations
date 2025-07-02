/*
  Warnings:

  - A unique constraint covering the columns `[email,authProvider,tenantId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username,tenantId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('INTERNAL', 'GOOGLE', 'FACEBOOK', 'APPLE', 'MICROSOFT');

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMPTZ,
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "loginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_authProvider_tenantId_key" ON "users"("email", "authProvider", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_tenantId_key" ON "users"("username", "tenantId");
