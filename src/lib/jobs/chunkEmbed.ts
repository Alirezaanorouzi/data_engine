import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { chunkParseResult } from "@/lib/chunking";
import type { ParsePage } from "@/lib/parseWorker";
import { embedTexts } from "@/lib/ai/embed";
import { hashText } from "@/lib/storage";
import { upsertEmbedding } from "@/lib/vector";
import { updateJobProgress } from "@/lib/jobs/progress";
import { pipelineUrl, wrapJobResult } from "@/lib/jobs/results";

export async function runChunkEmbedJob(
  jobId: string,
  projectId: string,
  fileId: string,
) {
  const file = await prisma.sourceFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new Error("File not found");

  const parseResult = await prisma.parseResult.findFirst({
    where: { fileId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });
  if (!parseResult) throw new Error("No completed parse result for file");

  const structured = parseResult.structured as {
    pages?: ParsePage[];
  };
  const drafts = chunkParseResult({
    pages: structured.pages || [],
    markdown: parseResult.markdown,
  });

  // Replace existing chunks for this file
  await prisma.chunk.deleteMany({ where: { fileId } });

  await updateJobProgress(jobId, 0, Math.max(drafts.length, 1));

  const created = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const row = await prisma.chunk.create({
      data: {
        fileId,
        parseResultId: parseResult.id,
        ordinal: i,
        text: d.text,
        pageNumber: d.pageNumber,
        blockTypes: d.blockTypes as Prisma.InputJsonValue,
        metadata: d.metadata as Prisma.InputJsonValue,
        status: "ACTIVE",
      },
    });
    created.push(row);
  }

  if (created.length === 0) {
    return {
      ...wrapJobResult(
        projectId,
        "CHUNK_EMBED",
        { chunkCount: 0, embedded: 0, parseResultId: parseResult.id },
        {
          fileId,
          artifacts: {
            chunk: pipelineUrl(projectId, "chunk", { fileId }),
            embed: pipelineUrl(projectId, "embed", { fileId }),
          },
        },
      ),
      autoQc: true as const,
    };
  }

  const texts = created.map((c) => c.text);
  const hashes = texts.map((t) => hashText(t));
  const vectors = await embedTexts(texts, {
    contentHashes: hashes,
    projectId,
  });

  let embedded = 0;
  for (let i = 0; i < created.length; i++) {
    if (vectors[i]?.length) {
      await upsertEmbedding(created[i].id, vectors[i]);
      embedded++;
    }
    await updateJobProgress(jobId, i + 1, created.length);
  }

  return {
    ...wrapJobResult(
      projectId,
      "CHUNK_EMBED",
      {
        chunkCount: created.length,
        embedded,
        parseResultId: parseResult.id,
        chunkIds: created.slice(0, 5).map((c) => c.id),
      },
      {
        fileId,
        artifacts: {
          chunk: pipelineUrl(projectId, "chunk", { fileId }),
          embed: pipelineUrl(projectId, "embed", { fileId }),
        },
      },
    ),
    autoQc: true as const,
  };
}
