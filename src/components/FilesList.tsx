"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fa, fileStatusLabel, formatFaDateTime } from "@/lib/i18n/fa";

type FileRow = {
  id: string;
  filename: string;
  status: string;
  pageCount: number | null;
  error: string | null;
  storagePath: string;
  createdAt: string;
  _count: { chunks: number };
};

export function FilesList({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${projectId}/files`);
    const data = await res.json();
    setFiles(data.files || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [projectId]);

  async function action(fileId: string, actionName: "rechunk" | "mark_reviewed") {
    setBusyId(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, action: actionName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(fileId: string, filename: string) {
    if (!window.confirm(`${fa.files.confirmDelete}\n\n${filename}`)) return;
    setBusyId(fileId);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/files?fileId=${encodeURIComponent(fileId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function reparse(fileId: string) {
    setBusyId(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PARSE", fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  if (files.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        {fa.files.empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {files.map((f) => (
        <div
          key={f.id}
          className="rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">{f.filename}</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {fileStatusLabel(f.status)}
                {f.pageCount != null ? ` · ${f.pageCount} ${fa.files.pages}` : ""}
                {` · ${f._count.chunks} ${fa.files.chunks}`}
                {` · ${formatFaDateTime(f.createdAt)}`}
              </p>
              {f.error && (
                <p className="mt-2 text-xs text-red-600">{f.error}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={`/projects/${projectId}/review?fileId=${f.id}`}
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50"
              >
                {fa.files.openReview}
              </Link>
              <a
                href={`/api/files/${f.storagePath}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50"
              >
                {fa.files.openPdf}
              </a>
              <button
                type="button"
                disabled={busyId === f.id}
                onClick={() => reparse(f.id)}
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50 disabled:opacity-50"
              >
                {fa.files.reparse}
              </button>
              <button
                type="button"
                disabled={busyId === f.id}
                onClick={() => action(f.id, "rechunk")}
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50 disabled:opacity-50"
              >
                {fa.files.rechunk}
              </button>
              <button
                type="button"
                disabled={busyId === f.id}
                onClick={() => action(f.id, "mark_reviewed")}
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50 disabled:opacity-50"
              >
                {fa.files.markReviewed}
              </button>
              <button
                type="button"
                disabled={busyId === f.id}
                onClick={() => remove(f.id, f.filename)}
                className="rounded-md border border-red-200 px-2.5 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {busyId === f.id ? fa.files.deleting : fa.files.delete}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
