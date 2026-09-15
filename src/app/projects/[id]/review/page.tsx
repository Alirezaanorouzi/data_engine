import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      <h1 className="mb-1 text-xl font-semibold">{fa.review.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">{fa.review.desc}</p>
      <Suspense fallback={<p className="text-sm text-zinc-500">…</p>}>
        <ReviewWorkspace projectId={id} />
      </Suspense>
    </AppShell>
  );
}
