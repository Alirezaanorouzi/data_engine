import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ParsePage } from "@/lib/parseWorker";
import { runDeterministicQc } from "@/lib/qc/deterministic";
import { updateJobProgress } from "@/lib/jobs/progress";
import { pipelineUrl, wrapJobResult } from "@/lib/jobs/results";

export async function runQcJob(
  jobId: string,
  projectId: string,
  fileId: string,
) {
  const file = await prisma.sourceFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new Error("File not found");

  await updateJobProgress(jobId, 0, 1);

  const parseResult = await prisma.parseResult.findFirst({
    where: { fileId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });
  if (!parseResult) throw new Error("No completed parse result for file");

  const chunks = await prisma.chunk.findMany({
    where: { fileId },
    orderBy: { ordinal: "asc" },
    select: { text: true, pageNumber: true, status: true },
  });

  const structured = parseResult.structured as { pages?: ParsePage[] };
  const qc = runDeterministicQc({
    markdown: parseResult.markdown,
    pages: structured.pages || [],
    pageCount: file.pageCount,
    chunks,
  });

  const report = await prisma.qcReport.create({
    data: {
      fileId,
      jobId,
      score: qc.score,
      verdict: qc.verdict,
      checks: qc.checks as unknown as Prisma.InputJsonValue,
      summary: qc.summary as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.sourceFile.update({
    where: { id: fileId },
    data: {
      status: qc.fileStatus,
      error:
        qc.verdict === "FAIL"
          ? qc.checks
              .filter((c) => c.severity === "hard" && !c.pass)
              .map((c) => c.detail)
              .join("; ") || "QC failed"
          : null,
    },
  });

  await updateJobProgress(jobId, 1, 1);

  return wrapJobResult(
    projectId,
    "QC",
    {
      qcReportId: report.id,
      score: qc.score,
      verdict: qc.verdict,
      fileStatus: qc.fileStatus,
      coverage: qc.summary.coverage,
      ocrPageCount: qc.summary.ocrPageCount,
      checksPassed: qc.checks.filter((c) => c.pass).length,
      checksTotal: qc.checks.length,
      failedHard: qc.checks
        .filter((c) => c.severity === "hard" && !c.pass)
        .map((c) => c.id),
      failedSoft: qc.checks
        .filter((c) => c.severity === "soft" && !c.pass)
        .map((c) => c.id),
    },
    {
      fileId,
      artifacts: {
        qc: pipelineUrl(projectId, "qc", { fileId }),
        file: `/api/projects/${projectId}/files?fileId=${fileId}`,
      },
    },
  );
}
