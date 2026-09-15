import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashText } from "@/lib/storage";
import { embedOne } from "@/lib/ai/embed";
import { upsertEmbedding } from "@/lib/vector";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await ctx.params;
  const body = (await req.json()) as {
    chunkId?: string;
    text?: string;
    status?: "ACTIVE" | "EXCLUDED";
  };

  if (!body.chunkId) {
    return NextResponse.json({ error: "chunkId required" }, { status: 400 });
  }

  const chunk = await prisma.chunk.findFirst({
    where: { id: body.chunkId, file: { projectId } },
  });
  if (!chunk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.chunk.update({
    where: { id: body.chunkId },
    data: {
      ...(typeof body.text === "string" ? { text: body.text } : {}),
      ...(body.status ? { status: body.status } : {}),
    },
  });

  if (
    typeof body.text === "string" &&
    body.text.trim() &&
    updated.status === "ACTIVE"
  ) {
    try {
      const vec = await embedOne(body.text, hashText(body.text), projectId);
      if (vec?.length) await upsertEmbedding(updated.id, vec);
    } catch (err) {
      console.error("Re-embed after chunk edit failed:", err);
    }
  }

  return NextResponse.json({ chunk: updated });
}
