-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PLANNED', 'RUNNING', 'WAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'RUNNING', 'WAITING_REVIEW', 'COMPLETED', 'SKIPPED', 'FAILED');

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'EXPORT';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "workflowId" TEXT;

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PLANNED',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "tool" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "jobId" TEXT,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_projectId_status_idx" ON "Workflow"("projectId", "status");

-- CreateIndex
CREATE INDEX "Workflow_projectId_createdAt_idx" ON "Workflow"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_status_idx" ON "WorkflowStep"("workflowId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_workflowId_index_key" ON "WorkflowStep"("workflowId", "index");

-- CreateIndex
CREATE INDEX "Job_workflowId_idx" ON "Job"("workflowId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
