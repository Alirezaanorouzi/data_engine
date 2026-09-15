import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { storageRoot } from "@/lib/storage";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".jsonl": "application/x-ndjson",
  ".json": "application/json",
  ".csv": "text/csv",
  ".zip": "application/zip",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  const relative = parts.join("/");
  const root = storageRoot();
  const full = path.resolve(root, relative);
  if (!full.startsWith(root)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const buf = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
