import { prisma } from "@/lib/db";
import { getProjectVectorStore } from "@/lib/retrieval/vectorStore";
import { pipelineUrl, type PipelineStage } from "@/lib/jobs/results";

const STAGES: PipelineStage[] = [
  "overview",
  "files",
  "parse",
  "chunk",
  "embed",
  "vector-store",
  "jobs",
  "export",
];

export function isPipelineStage(v: string): v is PipelineStage {
  return (STAGES as string[]).includes(v);
}

function truncate(text: string, max = 2000) {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, max)}…`, truncated: true };
}

export async function getPipelineData(
  projectId: string,
  stage: PipelineStage,
  opts?: { fileId?: string; jobId?: string; limit?: number },
) {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
  const fileId = opts?.fileId;
  const jobId = opts?.jobId;

  await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  switch (stage) {
    case "overview": {
      const [files, parseResults, chunks, embeddings, jobs, exports] =
        await Promise.all([
          prisma.sourceFile.count({ where: { projectId } }),
          prisma.parseResult.count({
            where: { file: { projectId }, status: "COMPLETED" },
          }),
          prisma.chunk.count({ where: { file: { projectId } } }),
          prisma.embedding.count({
            where: { chunk: { file: { projectId } } },
          }),
          prisma.job.count({ where: { projectId } }),
          prisma.export.count({ where: { projectId } }),
        ]);

      return {
        stage: "overview",
        version: 1,
        projectId,
        counts: { files, parseResults, chunks, embeddings, jobs, exports },
        stages: STAGES.filter((s) => s !== "overview").map((s) => ({
          stage: s,
          api: pipelineUrl(projectId, s),
        })),
      };
    }

    case "files": {
      const files = await prisma.sourceFile.findMany({
        where: { projectId, ...(fileId ? { id: fileId } : {}) },
        orderBy: { createdAt: "desc" },
        take: fileId ? 1 : limit,
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          storagePath: true,
          contentHash: true,
          pageCount: true,
          status: true,
          error: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { chunks: true, parseResults: true, jobs: true } },
        },
      });
      return {
        stage: "files",
        version: 1,
        count: files.length,
        files,
        api: pipelineUrl(projectId, "files"),
      };
    }

    case "parse": {
      const results = await prisma.parseResult.findMany({
        where: {
          file: { projectId, ...(fileId ? { id: fileId } : {}) },
        },
        orderBy: { createdAt: "desc" },
        take: fileId ? 1 : limit,
        select: {
          id: true,
          fileId: true,
          parserVersion: true,
          language: true,
          status: true,
          error: true,
          createdAt: true,
          markdown: true,
          structured: true,
          file: { select: { filename: true, pageCount: true, status: true } },
        },
      });

      const parseResults = results.map((r) => {
        const structured = r.structured as {
          pages?: unknown[];
          tables?: unknown[];
        };
        const md = truncate(r.markdown);
        return {
          id: r.id,
          fileId: r.fileId,
          filename: r.file.filename,
          fileStatus: r.file.status,
          parserVersion: r.parserVersion,
          language: r.language,
          status: r.status,
          error: r.error,
          pageCount: r.file.pageCount,
          blockCount: (structured.pages ?? []).reduce<number>(
            (n, p) =>
              n + ((p as { blocks?: unknown[] }).blocks?.length ?? 0),
            0,
          ),
          tableCount: structured.tables?.length ?? 0,
          markdown: md.text,
          markdownTruncated: md.truncated,
          structuredPreview: {
            pageCount: structured.pages?.length ?? 0,
            pages: (structured.pages || []).slice(0, 2),
          },
          createdAt: r.createdAt,
          links: {
            full: pipelineUrl(projectId, "parse", { fileId: r.fileId }),
            file: `/api/projects/${projectId}/files?fileId=${r.fileId}`,
          },
        };
      });

      return {
        stage: "parse",
        version: 1,
        count: parseResults.length,
        parseResults,
        api: pipelineUrl(projectId, "parse", { fileId }),
      };
    }

    case "chunk": {
      const chunks = await prisma.chunk.findMany({
        where: {
          file: { projectId, ...(fileId ? { id: fileId } : {}) },
        },
        orderBy: [{ fileId: "asc" }, { ordinal: "asc" }],
        take: fileId ? 500 : limit,
        select: {
          id: true,
          fileId: true,
          parseResultId: true,
          ordinal: true,
          text: true,
          pageNumber: true,
          blockTypes: true,
          status: true,
          createdAt: true,
          file: { select: { filename: true } },
          embedding: { select: { id: true, model: true } },
        },
      });

      return {
        stage: "chunk",
        version: 1,
        count: chunks.length,
        chunks: chunks.map((c) => {
          const t = truncate(c.text, 500);
          return {
            id: c.id,
            fileId: c.fileId,
            filename: c.file.filename,
            ordinal: c.ordinal,
            pageNumber: c.pageNumber,
            blockTypes: c.blockTypes,
            status: c.status,
            text: t.text,
            textTruncated: t.truncated,
            hasEmbedding: !!c.embedding,
            embeddingModel: c.embedding?.model ?? null,
            createdAt: c.createdAt,
          };
        }),
        api: pipelineUrl(projectId, "chunk", { fileId }),
      };
    }

    case "vector-store": {
      const store = await getProjectVectorStore(projectId);
      return {
        stage: "vector-store",
        version: 1,
        ...store,
        api: `/api/projects/${projectId}/vector-store`,
        searchApi: `/api/projects/${projectId}/vector-store/search`,
      };
    }

    case "embed": {
      const rows = await prisma.embedding.findMany({
        where: {
          chunk: { file: { projectId, ...(fileId ? { id: fileId } : {}) } },
        },
        orderBy: { createdAt: "desc" },
        take: fileId ? 500 : limit,
        select: {
          id: true,
          model: true,
          createdAt: true,
          chunk: {
            select: {
              id: true,
              fileId: true,
              ordinal: true,
              pageNumber: true,
              status: true,
              file: { select: { filename: true } },
            },
          },
        },
      });

      const byFile = new Map<
        string,
        { fileId: string; filename: string; embedded: number; active: number }
      >();
      for (const r of rows) {
        const key = r.chunk.fileId;
        const cur = byFile.get(key) ?? {
          fileId: key,
          filename: r.chunk.file.filename,
          embedded: 0,
          active: 0,
        };
        cur.embedded++;
        if (r.chunk.status === "ACTIVE") cur.active++;
        byFile.set(key, cur);
      }

      return {
        stage: "embed",
        version: 1,
        count: rows.length,
        model: rows[0]?.model ?? null,
        byFile: [...byFile.values()],
        embeddings: rows.map((r) => ({
          id: r.id,
          chunkId: r.chunk.id,
          fileId: r.chunk.fileId,
          filename: r.chunk.file.filename,
          ordinal: r.chunk.ordinal,
          pageNumber: r.chunk.pageNumber,
          chunkStatus: r.chunk.status,
          model: r.model,
          dimensions: 1536,
          createdAt: r.createdAt,
        })),
        api: pipelineUrl(projectId, "embed", { fileId }),
      };
    }

    case "jobs": {
      const fileMeta = fileId
        ? await prisma.sourceFile.findFirst({
            where: { id: fileId, projectId },
            select: { id: true, filename: true, status: true },
          })
        : null;

      const jobs = await prisma.job.findMany({
        where: {
          projectId,
          ...(jobId ? { id: jobId } : {}),
          ...(fileId ? { fileId } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: jobId ? 1 : fileId ? 50 : limit,
        select: {
          id: true,
          type: true,
          status: true,
          fileId: true,
          progress: true,
          total: true,
          result: true,
          error: true,
          createdAt: true,
          startedAt: true,
          finishedAt: true,
        },
      });

      return {
        stage: "jobs",
        version: 1,
        scope: fileId ? "file" : "project",
        ...(fileMeta
          ? {
              file_id: fileMeta.id,
              filename: fileMeta.filename,
              file_status: fileMeta.status,
            }
          : {}),
        count: jobs.length,
        jobs: jobs.map((j) => ({
          ...j,
          links: {
            detail: pipelineUrl(projectId, "jobs", {
              jobId: j.id,
              fileId: j.fileId ?? undefined,
            }),
            ...(j.fileId
              ? {
                  file: `/api/projects/${projectId}/files?fileId=${j.fileId}`,
                }
              : {}),
          },
        })),
        api: pipelineUrl(projectId, "jobs", { jobId, fileId }),
      };
    }

    case "export": {
      const exports = await prisma.export.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        stage: "export",
        version: 1,
        count: exports.length,
        exports: exports.map((e) => ({
          ...e,
          downloadUrl: `/api/files/${e.filePath}`,
        })),
        api: pipelineUrl(projectId, "export"),
      };
    }

    default:
      throw new Error(`Unknown pipeline stage: ${String(stage)}`);
  }
}
