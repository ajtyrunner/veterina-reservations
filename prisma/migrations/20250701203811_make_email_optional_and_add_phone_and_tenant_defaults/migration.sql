-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "defaultEmail" TEXT,
ADD COLUMN     "defaultPhone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
