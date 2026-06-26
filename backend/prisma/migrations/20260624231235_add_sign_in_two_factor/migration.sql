-- AlterTable
ALTER TABLE "auth_users" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "auth_two_factors" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auth_two_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_two_factors_userId_idx" ON "auth_two_factors"("userId");

-- AddForeignKey
ALTER TABLE "auth_two_factors" ADD CONSTRAINT "auth_two_factors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
