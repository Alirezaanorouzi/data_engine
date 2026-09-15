import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ExportPanel } from "@/components/ExportPanel";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const exports = await prisma.export.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      <h1 className="mb-1 text-xl font-semibold">{fa.export.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">{fa.export.desc}</p>
      <ExportPanel
        projectId={id}
        exports={exports.map((e) => ({
          id: e.id,
          format: e.format,
          itemCount: e.itemCount,
          filePath: e.filePath,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
