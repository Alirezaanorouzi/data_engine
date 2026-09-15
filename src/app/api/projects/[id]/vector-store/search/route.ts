import { NextRequest, NextResponse } from "next/server";
import { performVectorSearch } from "@/lib/retrieval/search";
import type { QueryType } from "@/lib/retrieval/types";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const body = (await req.json()) as {
    query?: string;
    top_k?: number;
    topK?: number;
    file_id?: string;
    fileId?: string;
    query_type?: QueryType;
    filters?: { file_id?: string };
  };

  try {
    const result = await performVectorSearch(projectId, {
      query: body.query ?? "",
      top_k: body.top_k ?? body.topK,
      file_id: body.file_id ?? body.fileId,
      query_type: body.query_type,
      filters: body.filters,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message === "query required" ||
      message.includes("query_type") ||
      message.includes("findUniqueOrThrow")
        ? message.includes("findUniqueOrThrow")
          ? 404
          : 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
