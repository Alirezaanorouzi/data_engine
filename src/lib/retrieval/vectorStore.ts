import { prisma } from "@/lib/db";
import { AI_CONFIG } from "@/lib/ai/config";
import type { VectorStoreInfo } from "@/lib/retrieval/types";

export async function getProjectVectorStore(
  projectId: string,
): Promise<VectorStoreInfo> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  const [indexedFiles, activeChunks, embeddings] = await Promise.all([
    prisma.sourceFile.count({
      where: {
        projectId,
        status: { in: ["INDEXED", "NEEDS_REVIEW", "REVIEWED"] },
      },
    }),
    prisma.chunk.count({
      where: { file: { projectId }, status: "ACTIVE" },
    }),
    prisma.embedding.count({
      where: { chunk: { file: { projectId } } },
    }),
  ]);

  const base = `/api/projects/${projectId}/vector-store`;

  return {
    vector_store_id: projectId,
    project_id: projectId,
    name: project.name,
    engine: "pgvector",
    embedding_model: AI_CONFIG.embeddingModel,
    embedding_dimensions: AI_CONFIG.embeddingDims,
    query_types: ["semantic"],
    delivery: "api",
    indexed_files: indexedFiles,
    active_chunks: activeChunks,
    embeddings,
    endpoints: {
      info: base,
      search: `${base}/search`,
      search_in_file: `${base}/search`,
    },
  };
}
