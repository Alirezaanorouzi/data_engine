import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAndStartJob, executeJob } from "@/lib/jobs/runner";
import { JobType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const jobs = await prisma.job.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ jobs });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const body = (await req.json()) as {
    type?: JobType;
    fileId?: string;
    resumeJobId?: string;
  };

  if (body.resumeJobId) {
    const job = await executeJob(body.resumeJobId);
    return NextResponse.json({ job });
  }

  if (!body.type) {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  if (
    (body.type === JobType.PARSE || body.type === JobType.CHUNK_EMBED) &&
    !body.fileId
  ) {
    return NextResponse.json(
      { error: "fileId required for PARSE and CHUNK_EMBED" },
      { status: 400 },
    );
  }

  const job = await createAndStartJob(projectId, body.type, {
    fileId: body.fileId,
  });
  return NextResponse.json({ job });
}
