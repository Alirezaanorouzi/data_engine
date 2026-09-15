import { NextRequest, NextResponse } from "next/server";
import { createRagExport } from "@/lib/export/rag";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    includeEmbeddings?: boolean;
    includeExcluded?: boolean;
  };

  try {
    const record = await createRagExport(projectId, {
      includeEmbeddings: !!body.includeEmbeddings,
      includeExcluded: !!body.includeExcluded,
    });
    return NextResponse.json({ export: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
