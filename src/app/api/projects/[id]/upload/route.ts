import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingestPdfFile } from "@/lib/ingest/files";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await ctx.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const form = await req.formData();
    const files = form
      .getAll("files")
      .filter((f): f is File => typeof File !== "undefined" && f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];
    let accepted = 0;
    let duplicates = 0;
    let rejected = 0;

    for (const file of files) {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".pdf") && file.type !== "application/pdf") {
        rejected++;
        results.push({ filename: file.name, rejected: true, reason: "not_pdf" });
        continue;
      }
      const data = Buffer.from(await file.arrayBuffer());
      const outcome = await ingestPdfFile({
        projectId,
        filename: file.name,
        mimeType: file.type || "application/pdf",
        data,
      });
      if (outcome.duplicate) {
        duplicates++;
        results.push({
          filename: file.name,
          duplicate: true,
          fileId: outcome.file.id,
        });
      } else {
        accepted++;
        results.push({
          filename: file.name,
          fileId: outcome.file.id,
          jobId: outcome.jobId,
        });
      }
    }

    return NextResponse.json({
      files: results.length,
      accepted,
      duplicates,
      rejected,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PDF upload failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
