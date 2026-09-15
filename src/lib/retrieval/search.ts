import { prisma } from "@/lib/db";
import { embedOne } from "@/lib/ai/embed";
import { hashText } from "@/lib/storage";
import { searchChunks } from "@/lib/vector";
import type {
  QueryType,
  VectorStoreSearchResponse,
} from "@/lib/retrieval/types";

export type SearchRequest = {
  query: string;
  top_k?: number;
  file_id?: string;
  query_type?: QueryType;
  filters?: { file_id?: string };
};

export async function performVectorSearch(
  projectId: string,
  body: SearchRequest,
): Promise<VectorStoreSearchResponse> {
  const query = body.query?.trim();
  if (!query) throw new Error("query required");

  const queryType = body.query_type ?? "semantic";
  if (queryType !== "semantic") {
    throw new Error(
      `query_type "${queryType}" is not supported in MVP; use "semantic"`,
    );
  }

  const fileId =
    body.file_id ?? body.filters?.file_id ?? undefined;
  const topK = Math.min(Math.max(body.top_k ?? 8, 1), 50);

  await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  const vector = await embedOne(query, hashText(`q:${query}`), projectId);
  if (!vector?.length) throw new Error("embedding failed");

  const rows = await searchChunks({
    projectId,
    vector,
    limit: topK,
    fileId,
  });

  const chunks = rows.map((r) => {
    const types = Array.isArray(r.blockTypes)
      ? (r.blockTypes as string[])
      : [];
    return {
      content: r.text,
      score: 1 - Number(r.distance),
      file_id: r.fileId,
      parse_result_id: r.parseResultId,
      metadata: {
        ...(typeof r.metadata === "object" && r.metadata
          ? (r.metadata as Record<string, unknown>)
          : {}),
        chunk_id: r.id,
        ordinal: r.ordinal,
        filename: r.filename,
        page: r.pageNumber,
      },
      blocks: types.map((type) => ({
        type,
        page_number: r.pageNumber,
      })),
    };
  });

  return {
    vector_store_id: projectId,
    project_id: projectId,
    query,
    query_type: queryType,
    top_k: topK,
    chunks,
  };
}
