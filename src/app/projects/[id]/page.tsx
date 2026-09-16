import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getProjectStats } from "@/lib/stats";
import { JobProgress } from "@/components/JobProgress";
import { PipelineStageButtons } from "@/components/PipelineStageButtons";
import { DeliveryApiPanel } from "@/components/DeliveryApiPanel";
import { AddFileButton } from "@/components/AddFileButton";
import { OverviewFiles } from "@/components/OverviewFiles";
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

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      {/* Header: title + compact add-file on the opposite edge */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            {fa.project.documentSubtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <AddFileButton projectId={id} />
          <div className="flex gap-2 text-xs">
            <Link
              href={`/projects/${id}/search`}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-zinc-700 hover:bg-zinc-50"
            >
              {fa.project.openSearch}
            </Link>
            <Link
              href={`/projects/${id}/files`}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-zinc-700 hover:bg-zinc-50"
            >
              {fa.project.openFiles}
            </Link>
          </div>
        </div>
      </div>

      {/* Heart of product: one unified retrieval API */}
      <div className="mb-6">
        <DeliveryApiPanel projectId={id} />
      </div>

      {/* Independent files → unified store */}
      <div className="mb-6">
        <OverviewFiles projectId={id} />
      </div>

      {/* Compact pulse metrics */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            [fa.project.stats.files, stats.files],
            [fa.project.stats.indexed, stats.indexed + stats.needsReview + stats.reviewed],
            [fa.project.stats.chunks, stats.activeChunks],
            [fa.project.stats.embeddings, stats.embeddings],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
          >
            <div className="text-[11px] text-zinc-500">{label}</div>
            <div className="mt-0.5 text-xl font-semibold tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <JobProgress projectId={id} />
      </div>

      <details className="rounded-xl border border-zinc-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-800 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            {fa.project.inspectPipeline}
            <span className="text-xs font-normal text-zinc-400">
              {fa.project.pipelineDetail}
            </span>
          </span>
        </summary>
        <div className="border-t border-zinc-100 px-4 py-4">
          <div className="mb-4 grid gap-2 text-xs text-zinc-600 sm:grid-cols-3">
            <div>
              {fa.project.parsing}: {stats.parsing}
            </div>
            <div>
              {fa.project.needsReview}: {stats.needsReview}
            </div>
            <div>
              {fa.project.failed}: {stats.failed}
            </div>
          </div>
          <PipelineStageButtons projectId={id} />
        </div>
      </details>
    </AppShell>
  );
}
