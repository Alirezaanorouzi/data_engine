import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { UploadDropzone } from "@/components/UploadDropzone";
import { FilesList } from "@/components/FilesList";
import { JobProgress } from "@/components/JobProgress";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      <h1 className="mb-1 text-xl font-semibold">{fa.upload.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">{fa.upload.documentDesc}</p>
      <div className="mb-4">
        <JobProgress projectId={id} />
      </div>
      <UploadDropzone projectId={id} />
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">{fa.upload.existingFiles}</h2>
        <FilesList projectId={id} />
      </div>
    </AppShell>
  );
}
