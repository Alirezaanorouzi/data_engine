import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { files: true } } },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    description?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const project = await prisma.project.create({
    data: {
      name: body.name.trim(),
      type: "DOCUMENT",
      description: body.description || "",
    },
  });
  return NextResponse.json({ project });
}
