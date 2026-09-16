import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parsePdfWithWorker } from "@/lib/parseWorker";
import { resolveStoragePath } from "@/lib/storage";
import { updateJobProgress } from "@/lib/jobs/progress";
import { pipelineUrl, wrapJobResult } from "@/lib/jobs/results";

export async function runParseJob(jobId: string, projectId: string, fileId: string) {
  const file = await prisma.sourceFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new Error("File not found");

  await prisma.sourceFile.update({
    where: { id: fileId },
    data: { status: "PARSING", error: null },
  });
  await updateJobProgress(jobId, 0, 1);

  try {
    const absolute = resolveStoragePath(file.storagePath);
    const parsed = await parsePdfWithWorker(absolute, file.filename);

    const structured = {
      pages: parsed.pages,
      tables: parsed.tables,
    } as Prisma.InputJsonValue;

    const parseResult = await prisma.parseResult.create({
      data: {
        fileId,
        parserVersion: parsed.parser_version || "pymupdf+qwen-v1",
        language: parsed.language || null,
        markdown: parsed.markdown,
        structured,
        status: "COMPLETED",
      },
    });

    await prisma.sourceFile.update({
      where: { id: fileId },
      data: {
        status: "PARSED",
        pageCount: parsed.page_count || parsed.pages.length || null,
        error: null,
      },
    });

    await updateJobProgress(jobId, 1, 1);

    const blockCount = (parsed.pages || []).reduce(
      (n, p) => n + (p.blocks?.length ?? 0),
      0,
    );

    return {
      ...wrapJobResult(
        projectId,
        "PARSE",
        {
          parseResultId: parseResult.id,
          pageCount: parsed.page_count ?? parsed.pages.length,
          language: parsed.language ?? null,
          parserVersion: parseResult.parserVersion,
          ocrPageCount: parsed.ocr_pages?.length ?? 0,
          ocrModel: parsed.ocr_model ?? null,
          blockCount,
          tableCount: parsed.tables?.length ?? 0,
        },
        {
          fileId,
          artifacts: {
            parse: pipelineUrl(projectId, "parse", { fileId }),
            file: `/api/projects/${projectId}/files?fileId=${fileId}`,
          },
        },
      ),
      autoChunk: true as const,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.sourceFile.update({
      where: { id: fileId },
      data: { status: "FAILED", error: message },
    });
    await prisma.parseResult.create({
      data: {
        fileId,
        status: "FAILED",
        error: message,
        markdown: "",
        structured: {},
      },
    });
    throw err;
  }
}
