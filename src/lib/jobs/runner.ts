import { prisma } from "@/lib/db";
import { JobType, JobStatus } from "@prisma/client";
import { runParseJob } from "@/lib/jobs/parse";
import { runChunkEmbedJob } from "@/lib/jobs/chunkEmbed";
import { runQcJob } from "@/lib/jobs/qc";
import { createRagExport } from "@/lib/export/rag";
import { updateJobProgress } from "@/lib/jobs/progress";
import { pipelineUrl, wrapJobResult } from "@/lib/jobs/results";

export { updateJobProgress };

const running = new Set<string>();

export async function createAndStartJob(
  projectId: string,
  type: JobType,
  opts?: { fileId?: string },
) {
  const job = await prisma.job.create({
    data: {
      projectId,
      type,
      status: JobStatus.PENDING,
      fileId: opts?.fileId ?? null,
    },
  });
  void executeJob(job.id);
  return job;
}

export async function createJob(
  projectId: string,
  type: JobType,
  opts?: { fileId?: string },
) {
  return prisma.job.create({
    data: {
      projectId,
      type,
      status: JobStatus.PENDING,
      fileId: opts?.fileId ?? null,
    },
  });
}

export async function executeJob(jobId: string) {
  if (running.has(jobId)) {
    return prisma.job.findUnique({ where: { id: jobId } });
  }
  running.add(jobId);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status === JobStatus.CANCELLED) {
    running.delete(jobId);
    return job;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      error: null,
    },
  });

  try {
    let result: unknown = null;
    switch (job.type) {
      case JobType.PARSE: {
        if (!job.fileId) throw new Error("PARSE job requires fileId");
        result = await runParseJob(jobId, job.projectId, job.fileId);
        break;
      }
      case JobType.CHUNK_EMBED: {
        if (!job.fileId) throw new Error("CHUNK_EMBED job requires fileId");
        result = await runChunkEmbedJob(jobId, job.projectId, job.fileId);
        break;
      }
      case JobType.QC: {
        if (!job.fileId) throw new Error("QC job requires fileId");
        result = await runQcJob(jobId, job.projectId, job.fileId);
        break;
      }
      case JobType.EXPORT: {
        const record = await createRagExport(job.projectId, {
          includeEmbeddings: false,
        });
        result = wrapJobResult(
          job.projectId,
          "EXPORT",
          {
            exportId: record.id,
            format: record.format,
            itemCount: record.itemCount,
            filePath: record.filePath,
          },
          {
            artifacts: {
              export: pipelineUrl(job.projectId, "export"),
              download: `/api/files/${record.filePath}`,
            },
          },
        );
        await updateJobProgress(jobId, 1, 1);
        break;
      }
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    const completed = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        finishedAt: new Date(),
        result: result as object,
      },
    });

    // After parse succeeds, auto-start chunk+embed for the same file
    if (
      job.type === JobType.PARSE &&
      job.fileId &&
      result &&
      typeof result === "object" &&
      "autoChunk" in result &&
      (result as { autoChunk?: boolean }).autoChunk
    ) {
      void createAndStartJob(job.projectId, JobType.CHUNK_EMBED, {
        fileId: job.fileId,
      });
    }

    // After chunk+embed, auto-start deterministic QC gate
    if (
      job.type === JobType.CHUNK_EMBED &&
      job.fileId &&
      result &&
      typeof result === "object" &&
      "autoQc" in result &&
      (result as { autoQc?: boolean }).autoQc
    ) {
      void createAndStartJob(job.projectId, JobType.QC, {
        fileId: job.fileId,
      });
    }

    return completed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        finishedAt: new Date(),
        error: message,
      },
    });
  } finally {
    running.delete(jobId);
  }
}
