import Link from "next/link";
import { ReactNode } from "react";
import { fa } from "@/lib/i18n/fa";

export function AppShell({
  children,
  projectId,
  projectName,
}: {
  children: ReactNode;
  projectId?: string;
  projectName?: string;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              {fa.appName}
            </Link>
            {projectName && (
              <>
                <span className="text-zinc-300">/</span>
                <span className="text-sm text-zinc-600">{projectName}</span>
              </>
            )}
          </div>
          {projectId && (
            <nav className="flex flex-wrap gap-1 text-sm">
              {(
                [
                  [fa.nav.overview, ""],
                  [fa.nav.upload, "/upload"],
                  [fa.nav.files, "/files"],
                  [fa.nav.review, "/review"],
                  [fa.nav.search, "/search"],
                  [fa.nav.export, "/export"],
                ] as const
              ).map(([label, suffix]) => (
                <Link
                  key={label}
                  href={`/projects/${projectId}${suffix}`}
                  className="rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
