import { prisma } from "@/lib/db";

export async function getProjectStats(projectId: string) {
  const [
    files,
    uploaded,
    parsing,
    parsed,
    failed,
    reviewed,
    indexed,
    chunks,
    activeChunks,
    excludedChunks,
    embeddings,
    recentJobs,
  ] = await Promise.all([
    prisma.sourceFile.count({ where: { projectId } }),
    prisma.sourceFile.count({ where: { projectId, status: "UPLOADED" } }),
    prisma.sourceFile.count({ where: { projectId, status: "PARSING" } }),
    prisma.sourceFile.count({ where: { projectId, status: "PARSED" } }),
    prisma.sourceFile.count({ where: { projectId, status: "FAILED" } }),
    prisma.sourceFile.count({ where: { projectId, status: "REVIEWED" } }),
    prisma.sourceFile.count({ where: { projectId, status: "INDEXED" } }),
    prisma.chunk.count({ where: { file: { projectId } } }),
    prisma.chunk.count({ where: { file: { projectId }, status: "ACTIVE" } }),
    prisma.chunk.count({ where: { file: { projectId }, status: "EXCLUDED" } }),
    prisma.embedding.count({ where: { chunk: { file: { projectId } } } }),
    prisma.job.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    files,
    uploaded,
    parsing,
    parsed,
    failed,
    reviewed,
    indexed,
    chunks,
    activeChunks,
    excludedChunks,
    embeddings,
    recentJobs,
  };
}
