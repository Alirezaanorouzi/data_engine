import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FilesList } from "@/components/FilesList";
import { JobProgress } from "@/components/JobProgress";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      <h1 className="mb-1 text-xl font-semibold">{fa.files.title}</h1>
      <p className="mb-4 text-sm text-zinc-500">{fa.files.desc}</p>
      <div className="mb-4">
        <JobProgress projectId={id} />
      </div>
      <FilesList projectId={id} />
    </AppShell>
  );
}
