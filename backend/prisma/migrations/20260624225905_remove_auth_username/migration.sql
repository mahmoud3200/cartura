/*
  Warnings:

  - You are about to drop the column `displayUsername` on the `auth_users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `auth_users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "auth_users_username_key";

-- AlterTable
ALTER TABLE "auth_users" DROP COLUMN "displayUsername",
DROP COLUMN "username";
