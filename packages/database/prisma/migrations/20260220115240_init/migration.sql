/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `messages` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "messages_expiresAt_idx";

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "expiresAt";

-- CreateIndex
CREATE INDEX "Room_expiresAt_idx" ON "Room"("expiresAt");
