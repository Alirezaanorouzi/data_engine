import { NextRequest, NextResponse } from "next/server";
import {
  getPipelineData,
  isPipelineStage,
} from "@/lib/pipeline/query";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const url = new URL(req.url);
  const stageParam = url.searchParams.get("stage") || "overview";

  if (!isPipelineStage(stageParam)) {
    return NextResponse.json(
      {
        error: "Invalid stage",
        validStages: [
          "overview",
          "files",
          "parse",
          "chunk",
          "embed",
          "vector-store",
          "jobs",
          "export",
        ],
      },
      { status: 400 },
    );
  }

  const fileId = url.searchParams.get("fileId") ?? undefined;
  const jobId = url.searchParams.get("jobId") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;

  try {
    const data = await getPipelineData(projectId, stageParam, {
      fileId,
      jobId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("Record to find") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
