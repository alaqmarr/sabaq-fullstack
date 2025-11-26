-- AlterTable
ALTER TABLE "Sabaq" ADD COLUMN     "janabId" TEXT;

-- CreateIndex
CREATE INDEX "Sabaq_janabId_idx" ON "Sabaq"("janabId");

-- AddForeignKey
ALTER TABLE "Sabaq" ADD CONSTRAINT "Sabaq_janabId_fkey" FOREIGN KEY ("janabId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
