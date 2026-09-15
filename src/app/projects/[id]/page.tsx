import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getProjectStats } from "@/lib/stats";
import { JobProgress } from "@/components/JobProgress";
import { PipelineStageButtons } from "@/components/PipelineStageButtons";
import { DeliveryApiPanel } from "@/components/DeliveryApiPanel";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const stats = await getProjectStats(id);

  const statCards = [
    [fa.project.stats.files, stats.files],
    [fa.project.stats.indexed, stats.indexed],
    [fa.project.stats.chunks, stats.activeChunks],
    [fa.project.stats.embeddings, stats.embeddings],
  ] as const;

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {fa.project.documentSubtitle}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/projects/${id}/upload`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white"
          >
            {fa.project.upload}
          </Link>
          <Link
            href={`/projects/${id}/files`}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5"
          >
            {fa.project.openFiles}
          </Link>
          <Link
            href={`/projects/${id}/search`}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5"
          >
            {fa.project.openSearch}
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <DeliveryApiPanel projectId={id} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">{fa.project.pipeline}</h2>
        <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            {fa.project.parsing}: {stats.parsing}
          </div>
          <div>
            {fa.project.parsed}: {stats.parsed}
          </div>
          <div>
            {fa.project.failed}: {stats.failed}
          </div>
          <div>
            {fa.project.reviewed}: {stats.reviewed}
          </div>
          <div>
            {fa.project.excludedChunks}: {stats.excludedChunks}
          </div>
        </div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {fa.project.inspectPipeline}
        </h3>
        <PipelineStageButtons projectId={id} />
      </div>

      <JobProgress projectId={id} />
    </AppShell>
  );
}
