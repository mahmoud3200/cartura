-- AlterTable
ALTER TABLE "users"
ADD COLUMN "account_status_reason" TEXT,
ADD COLUMN "suspended_until" TIMESTAMP(3);
