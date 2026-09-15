import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import Link from "next/link";
import type { Project } from "@prisma/client";
import { fa, formatFaDate } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

type ProjectListItem = Project & {
  _count: { files: number };
};

export default async function HomePage() {
  let projects: ProjectListItem[] = [];
  let dbError: string | null = null;
  try {
    projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { files: true } } },
    });
  } catch (e) {
    dbError = e instanceof Error ? e.message : fa.errors.dbUnavailable;
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{fa.home.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{fa.tagline}</p>
      </div>

      {dbError && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">{fa.home.dbNotReady}</p>
          <p className="mt-1">{dbError}</p>
          <p className="mt-2 font-mono text-xs" dir="ltr">
            {fa.home.dbHint}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {projects.length === 0 && !dbError && (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
              {fa.home.noProjects}
            </p>
          )}
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{p.name}</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {fa.projectType.DOCUMENT}
                    {` · ${p._count.files} ${fa.home.files}`}
                  </p>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                      {p.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {formatFaDate(p.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <CreateProjectForm />
      </div>
    </AppShell>
  );
}
