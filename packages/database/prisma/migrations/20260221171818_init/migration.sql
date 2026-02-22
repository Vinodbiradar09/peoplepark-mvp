/*
  Warnings:

  - Made the column `offset` on table `messages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "offset" SET NOT NULL,
ALTER COLUMN "offset" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "messages_roomId_offset_idx" ON "messages"("roomId", "offset");
