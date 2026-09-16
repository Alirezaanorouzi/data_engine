import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FilesList } from "@/components/FilesList";
import { JobProgress } from "@/components/JobProgress";
import { AddFileButton } from "@/components/AddFileButton";
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{fa.files.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{fa.files.desc}</p>
        </div>
        <AddFileButton projectId={id} size="md" />
      </div>
      <div className="mb-4">
        <JobProgress projectId={id} />
      </div>
      <FilesList projectId={id} />
    </AppShell>
  );
}
