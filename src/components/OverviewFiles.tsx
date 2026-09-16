"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AddFileButton } from "@/components/AddFileButton";
import { fa, fileStatusLabel, formatFaDateTime } from "@/lib/i18n/fa";

type QcSummary = {
  id: string;
  score: number;
  verdict: string;
};

type FileRow = {
  id: string;
  filename: string;
  status: string;
  pageCount: number | null;
  createdAt: string;
  _count: { chunks: number };
  qcReports?: QcSummary[];
};

export function OverviewFiles({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      setFiles(data.files || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            {fa.project.filesTitle}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {fa.project.filesHint}
          </p>
        </div>
        <AddFileButton projectId={projectId} onUploaded={load} />
      </div>

      {error && (
        <p className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {files.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-zinc-500">{fa.files.empty}</p>
          <div className="mt-4 flex justify-center">
            <AddFileButton
              projectId={projectId}
              size="md"
              onUploaded={load}
            />
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {files.map((f) => {
            const qc = f.qcReports?.[0];
            return (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900">
                    {f.filename}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <StatusPill status={f.status} />
                    {f.pageCount != null && (
                      <span>
                        {f.pageCount} {fa.files.pages}
                      </span>
                    )}
                    <span>
                      {f._count.chunks} {fa.files.chunks}
                    </span>
                    {qc && (
                      <span dir="ltr">
                        QC {(qc.score * 100).toFixed(0)}% · {qc.verdict}
                      </span>
                    )}
                    <span>{formatFaDateTime(f.createdAt)}</span>
                  </div>
                </div>
                <Link
                  href={`/projects/${projectId}/review?fileId=${f.id}`}
                  className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  {fa.files.openReview}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "INDEXED" || status === "REVIEWED"
      ? "bg-emerald-50 text-emerald-800"
      : status === "NEEDS_REVIEW"
        ? "bg-amber-50 text-amber-900"
        : status === "FAILED"
          ? "bg-red-50 text-red-800"
          : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`rounded px-1.5 py-0.5 font-medium ${tone}`}>
      {fileStatusLabel(status)}
    </span>
  );
}
