import { prisma } from "@/lib/db";
import { AI_CONFIG } from "@/lib/ai/config";

function vectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

export async function upsertEmbedding(
  chunkId: string,
  vector: number[],
  model = AI_CONFIG.embeddingModel,
) {
  const lit = vectorLiteral(vector);
  await prisma.$executeRaw`
    INSERT INTO "Embedding" (id, "chunkId", vector, model, "createdAt")
    VALUES (${crypto.randomUUID()}, ${chunkId}, ${lit}::vector, ${model}, NOW())
    ON CONFLICT ("chunkId") DO UPDATE
    SET vector = EXCLUDED.vector, model = EXCLUDED.model, "createdAt" = NOW()
  `;
}

export async function searchChunks(opts: {
  projectId: string;
  vector: number[];
  limit?: number;
  fileId?: string;
}) {
  const lit = vectorLiteral(opts.vector);
  const limit = opts.limit ?? 10;

  type Row = {
    id: string;
    text: string;
    pageNumber: number | null;
    fileId: string;
    parseResultId: string;
    ordinal: number;
    blockTypes: unknown;
    metadata: unknown;
    filename: string;
    distance: number;
  };

  if (opts.fileId) {
    return prisma.$queryRaw<Row[]>`
      SELECT c.id, c.text, c."pageNumber", c."fileId", c."parseResultId",
             c.ordinal, c."blockTypes", c.metadata, f.filename,
             (e.vector <=> ${lit}::vector) AS distance
      FROM "Embedding" e
      JOIN "Chunk" c ON c.id = e."chunkId"
      JOIN "File" f ON f.id = c."fileId"
      WHERE f."projectId" = ${opts.projectId}
        AND c.status = 'ACTIVE'
        AND c."fileId" = ${opts.fileId}
      ORDER BY e.vector <=> ${lit}::vector
      LIMIT ${limit}
    `;
  }

  return prisma.$queryRaw<Row[]>`
    SELECT c.id, c.text, c."pageNumber", c."fileId", c."parseResultId",
           c.ordinal, c."blockTypes", c.metadata, f.filename,
           (e.vector <=> ${lit}::vector) AS distance
    FROM "Embedding" e
    JOIN "Chunk" c ON c.id = e."chunkId"
    JOIN "File" f ON f.id = c."fileId"
    WHERE f."projectId" = ${opts.projectId}
      AND c.status = 'ACTIVE'
    ORDER BY e.vector <=> ${lit}::vector
    LIMIT ${limit}
  `;
}

export async function getEmbeddingVector(chunkId: string) {
  const rows = await prisma.$queryRaw<{ vector: string }[]>`
    SELECT vector::text AS vector FROM "Embedding" WHERE "chunkId" = ${chunkId}
  `;
  if (!rows[0]?.vector) return null;
  return rows[0].vector
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((x) => Number(x));
}
