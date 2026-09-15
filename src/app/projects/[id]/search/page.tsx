import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SearchPanel } from "@/components/SearchPanel";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <AppShell projectId={project.id} projectName={project.name}>
      <h1 className="mb-1 text-xl font-semibold">{fa.search.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">{fa.search.desc}</p>
      <SearchPanel projectId={id} />
    </AppShell>
  );
}
