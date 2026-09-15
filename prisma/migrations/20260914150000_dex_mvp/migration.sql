-- Dex MVP greenfield schema: drop labeling-era tables, create File/Parse/Chunk spine.

DROP TABLE IF EXISTS "BatchItem" CASCADE;
DROP TABLE IF EXISTS "Batch" CASCADE;
DROP TABLE IF EXISTS "Slice" CASCADE;
DROP TABLE IF EXISTS "WorkflowStep" CASCADE;
DROP TABLE IF EXISTS "Workflow" CASCADE;
DROP TABLE IF EXISTS "RelationAnnotation" CASCADE;
DROP TABLE IF EXISTS "SpanAnnotation" CASCADE;
DROP TABLE IF EXISTS "Annotation" CASCADE;
DROP TABLE IF EXISTS "Proposal" CASCADE;
DROP TABLE IF EXISTS "Embedding" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "Label" CASCADE;
DROP TABLE IF EXISTS "Export" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "AiCache" CASCADE;
DROP TABLE IF EXISTS "Chunk" CASCADE;
DROP TABLE IF EXISTS "ParseResult" CASCADE;
DROP TABLE IF EXISTS "File" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;

DROP TYPE IF EXISTS "BatchStatus" CASCADE;
DROP TYPE IF EXISTS "BatchPurpose" CASCADE;
DROP TYPE IF EXISTS "StepStatus" CASCADE;
DROP TYPE IF EXISTS "WorkflowStatus" CASCADE;
DROP TYPE IF EXISTS "ExportFormat" CASCADE;
DROP TYPE IF EXISTS "JobStatus" CASCADE;
DROP TYPE IF EXISTS "JobType" CASCADE;
DROP TYPE IF EXISTS "ProposalStatus" CASCADE;
DROP TYPE IF EXISTS "ProposalAction" CASCADE;
DROP TYPE IF EXISTS "ProposalAgent" CASCADE;
DROP TYPE IF EXISTS "AnnotationSource" CASCADE;
DROP TYPE IF EXISTS "ItemStatus" CASCADE;
DROP TYPE IF EXISTS "LabelKind" CASCADE;
DROP TYPE IF EXISTS "ProjectType" CASCADE;
DROP TYPE IF EXISTS "FileStatus" CASCADE;
DROP TYPE IF EXISTS "ParseStatus" CASCADE;
DROP TYPE IF EXISTS "ChunkStatus" CASCADE;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "ProjectType" AS ENUM ('DOCUMENT');
CREATE TYPE "FileStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'FAILED', 'REVIEWED', 'INDEXED');
CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "ChunkStatus" AS ENUM ('ACTIVE', 'EXCLUDED');
CREATE TYPE "JobType" AS ENUM ('PARSE', 'CHUNK_EMBED', 'EXPORT');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "ExportFormat" AS ENUM ('RAG_JSONL');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL DEFAULT 'DOCUMENT',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "pageCount" INTEGER,
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParseResult" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL DEFAULT 'docling-v1',
    "language" TEXT,
    "markdown" TEXT NOT NULL DEFAULT '',
    "structured" JSONB NOT NULL DEFAULT '{}',
    "status" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParseResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "parseResultId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "blockTypes" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "ChunkStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "vector" vector(1536),
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileId" TEXT,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "itemCount" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiCache" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "contentHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "File_projectId_contentHash_key" ON "File"("projectId", "contentHash");
CREATE INDEX "File_projectId_status_idx" ON "File"("projectId", "status");
CREATE INDEX "File_projectId_createdAt_idx" ON "File"("projectId", "createdAt");

CREATE INDEX "ParseResult_fileId_status_idx" ON "ParseResult"("fileId", "status");

CREATE UNIQUE INDEX "Chunk_parseResultId_ordinal_key" ON "Chunk"("parseResultId", "ordinal");
CREATE INDEX "Chunk_fileId_status_idx" ON "Chunk"("fileId", "status");
CREATE INDEX "Chunk_fileId_ordinal_idx" ON "Chunk"("fileId", "ordinal");

CREATE UNIQUE INDEX "Embedding_chunkId_key" ON "Embedding"("chunkId");

CREATE INDEX "Job_projectId_status_idx" ON "Job"("projectId", "status");
CREATE INDEX "Job_projectId_type_idx" ON "Job"("projectId", "type");
CREATE INDEX "Job_fileId_idx" ON "Job"("fileId");

CREATE INDEX "Export_projectId_idx" ON "Export"("projectId");

CREATE UNIQUE INDEX "AiCache_contentHash_kind_model_key" ON "AiCache"("contentHash", "kind", "model");
CREATE INDEX "AiCache_projectId_idx" ON "AiCache"("projectId");

ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParseResult" ADD CONSTRAINT "ParseResult_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_parseResultId_fkey" FOREIGN KEY ("parseResultId") REFERENCES "ParseResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Export" ADD CONSTRAINT "Export_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiCache" ADD CONSTRAINT "AiCache_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
