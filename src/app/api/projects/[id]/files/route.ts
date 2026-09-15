import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteSourceFile } from "@/lib/files/delete";
import { createAndStartJob } from "@/lib/jobs/runner";
import { JobType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const fileId = new URL(req.url).searchParams.get("fileId");

  if (fileId) {
    const file = await prisma.sourceFile.findFirst({
      where: { id: fileId, projectId },
      include: {
        parseResults: { orderBy: { createdAt: "desc" }, take: 1 },
        chunks: { orderBy: { ordinal: "asc" } },
      },
    });
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ file });
  }

  const files = await prisma.sourceFile.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { chunks: true, parseResults: true } },
      parseResults: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, language: true, parserVersion: true, createdAt: true },
      },
    },
  });
  return NextResponse.json({ files });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const body = (await req.json()) as {
    fileId?: string;
    action?: "mark_reviewed" | "rechunk";
  };

  if (!body.fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const file = await prisma.sourceFile.findFirst({
    where: { id: body.fileId, projectId },
  });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "mark_reviewed") {
    await prisma.sourceFile.update({
      where: { id: body.fileId },
      data: { status: "REVIEWED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "rechunk") {
    const job = await createAndStartJob(projectId, JobType.CHUNK_EMBED, {
      fileId: body.fileId,
    });
    return NextResponse.json({ job });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const fileId = new URL(req.url).searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  try {
    const result = await deleteSourceFile(projectId, fileId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "File not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
