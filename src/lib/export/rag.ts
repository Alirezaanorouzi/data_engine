import { prisma } from "@/lib/db";
import { writeExportFile } from "@/lib/storage";
import { getEmbeddingVector } from "@/lib/vector";
import { Prisma } from "@prisma/client";

export async function createRagExport(
  projectId: string,
  opts: { includeEmbeddings?: boolean; includeExcluded?: boolean },
) {
  await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  const chunks = await prisma.chunk.findMany({
    where: {
      file: { projectId },
      ...(opts.includeExcluded ? {} : { status: "ACTIVE" }),
    },
    include: { file: true },
    orderBy: [{ fileId: "asc" }, { ordinal: "asc" }],
  });

  const rows: Record<string, unknown>[] = [];

  for (const chunk of chunks) {
    const row: Record<string, unknown> = {
      chunk_id: chunk.id,
      file_id: chunk.fileId,
      document_name: chunk.file.filename,
      page: chunk.pageNumber,
      page_count: chunk.file.pageCount,
      text: chunk.text,
      block_types: chunk.blockTypes,
      source_pdf: chunk.file.storagePath,
      status: chunk.status,
      metadata: {
        ...(chunk.metadata as object),
        ordinal: chunk.ordinal,
        pipeline: "data_engine_dex_mvp",
        exported_at: new Date().toISOString(),
      },
    };

    if (opts.includeEmbeddings) {
      row.embedding = await getEmbeddingVector(chunk.id);
    }

    rows.push(row);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonl = rows.map((c) => JSON.stringify(c)).join("\n");
  const saved = await writeExportFile(
    projectId,
    `rag-export-${stamp}.jsonl`,
    jsonl,
  );

  const record = await prisma.export.create({
    data: {
      projectId,
      format: "RAG_JSONL",
      options: opts as unknown as Prisma.InputJsonValue,
      itemCount: rows.length,
      filePath: saved.relative,
    },
  });

  return record;
}
