-- CreateEnum
CREATE TYPE "BatchPurpose" AS ENUM ('CLEAN', 'LABEL', 'EXPORT', 'EVAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Slice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "query" JSONB NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sliceId" TEXT,
    "name" TEXT NOT NULL,
    "purpose" "BatchPurpose" NOT NULL DEFAULT 'OTHER',
    "status" "BatchStatus" NOT NULL DEFAULT 'OPEN',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchItem" (
    "batchId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "BatchItem_pkey" PRIMARY KEY ("batchId","itemId")
);

-- CreateIndex
CREATE INDEX "Slice_projectId_createdAt_idx" ON "Slice"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Batch_projectId_createdAt_idx" ON "Batch"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "BatchItem_itemId_idx" ON "BatchItem"("itemId");

-- AddForeignKey
ALTER TABLE "Slice" ADD CONSTRAINT "Slice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_sliceId_fkey" FOREIGN KEY ("sliceId") REFERENCES "Slice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItem" ADD CONSTRAINT "BatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItem" ADD CONSTRAINT "BatchItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
