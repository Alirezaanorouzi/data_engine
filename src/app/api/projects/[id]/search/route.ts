import { NextRequest, NextResponse } from "next/server";
import { performVectorSearch } from "@/lib/retrieval/search";
import type { QueryType } from "@/lib/retrieval/types";

/** Legacy alias — prefer POST /vector-store/search (Dex-style delivery API). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const body = (await req.json()) as {
    query?: string;
    topK?: number;
    top_k?: number;
    fileId?: string;
    file_id?: string;
    query_type?: QueryType;
  };

  try {
    const result = await performVectorSearch(projectId, {
      query: body.query ?? "",
      top_k: body.top_k ?? body.topK,
      file_id: body.file_id ?? body.fileId,
      query_type: body.query_type,
    });

    return NextResponse.json({
      query: result.query,
      query_type: result.query_type,
      results: result.chunks.map((c) => ({
        chunk_id: c.metadata?.chunk_id,
        content: c.content,
        file_id: c.file_id,
        parse_result_id: c.parse_result_id,
        filename: c.metadata?.filename,
        page: c.metadata?.page ?? null,
        score: c.score,
        blocks: c.blocks,
        metadata: c.metadata,
      })),
      chunks: result.chunks,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "query required" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
