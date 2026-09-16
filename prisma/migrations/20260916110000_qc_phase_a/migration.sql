-- Phase A QC gate: NEEDS_REVIEW status, QC job type, QcReport table.

ALTER TYPE "FileStatus" ADD VALUE 'NEEDS_REVIEW';
ALTER TYPE "JobType" ADD VALUE 'QC';

CREATE TABLE "QcReport" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "jobId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "verdict" TEXT NOT NULL,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QcReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QcReport_fileId_createdAt_idx" ON "QcReport"("fileId", "createdAt");

ALTER TABLE "QcReport" ADD CONSTRAINT "QcReport_fileId_fkey"
  FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
