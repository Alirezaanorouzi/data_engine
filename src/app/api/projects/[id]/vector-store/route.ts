import { NextRequest, NextResponse } from "next/server";
import { getProjectVectorStore } from "@/lib/retrieval/vectorStore";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  try {
    const store = await getProjectVectorStore(projectId);
    return NextResponse.json(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("findUniqueOrThrow") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
