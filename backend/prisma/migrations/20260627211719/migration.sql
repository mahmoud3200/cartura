-- AlterTable
ALTER TABLE "auth_accounts_better" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "auth_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "auth_two_factors" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "auth_verifications" ALTER COLUMN "id" DROP DEFAULT;
