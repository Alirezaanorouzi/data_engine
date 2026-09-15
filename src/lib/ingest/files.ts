import { prisma } from "@/lib/db";
import { hashBuffer, saveUpload } from "@/lib/storage";
import { createAndStartJob } from "@/lib/jobs/runner";
import { JobType } from "@prisma/client";

export async function ingestPdfFile(opts: {
  projectId: string;
  filename: string;
  mimeType?: string;
  data: Buffer;
}) {
  const contentHash = hashBuffer(opts.data);
  const existing = await prisma.sourceFile.findUnique({
    where: {
      projectId_contentHash: {
        projectId: opts.projectId,
        contentHash,
      },
    },
  });
  if (existing) {
    return { file: existing, duplicate: true as const, jobId: null as string | null };
  }

  const saved = await saveUpload(opts.projectId, contentHash, ".pdf", opts.data);
  const file = await prisma.sourceFile.create({
    data: {
      projectId: opts.projectId,
      filename: opts.filename,
      mimeType: opts.mimeType || "application/pdf",
      size: opts.data.length,
      storagePath: saved.relative,
      contentHash,
      status: "UPLOADED",
    },
  });

  const job = await createAndStartJob(opts.projectId, JobType.PARSE, {
    fileId: file.id,
  });

  return { file, duplicate: false as const, jobId: job.id };
}
