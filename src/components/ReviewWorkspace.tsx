"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fa } from "@/lib/i18n/fa";

type FileOption = { id: string; filename: string; status: string };

type ChunkRow = {
  id: string;
  ordinal: number;
  text: string;
  pageNumber: number | null;
  status: string;
  blockTypes: unknown;
};

type ParseResult = {
  id: string;
  markdown: string;
  structured: { pages?: { page_number: number; blocks: { type: string; text: string }[] }[] };
};

export function ReviewWorkspace({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const initialFileId = searchParams.get("fileId") || "";

  const [files, setFiles] = useState<FileOption[]>([]);
  const [fileId, setFileId] = useState(initialFileId);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFiles() {
    const res = await fetch(`/api/projects/${projectId}/files`);
    const data = await res.json();
    const list = (data.files || []).map((f: FileOption) => ({
      id: f.id,
      filename: f.filename,
      status: f.status,
    }));
    setFiles(list);
    if (!fileId && list[0]) setFileId(list[0].id);
  }

  async function loadFile(id: string) {
    if (!id) return;
    const res = await fetch(`/api/projects/${projectId}/files?fileId=${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || fa.errors.failed);
    setChunks(data.file.chunks || []);
    setParse(data.file.parseResults?.[0] || null);
    const next: Record<string, string> = {};
    for (const c of data.file.chunks || []) next[c.id] = c.text;
    setDrafts(next);
  }

  useEffect(() => {
    loadFiles().catch((e) => setError(String(e)));
  }, [projectId]);

  useEffect(() => {
    if (!fileId) return;
    loadFile(fileId).catch((e) => setError(String(e)));
  }, [fileId, projectId]);

  const pagePreview = useMemo(() => {
    const pages = parse?.structured?.pages || [];
    return pages.slice(0, 3);
  }, [parse]);

  async function saveChunk(chunkId: string) {
    setBusy(chunkId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/chunks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunkId, text: drafts[chunkId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      setMessage(fa.review.saved);
      await loadFile(fileId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(chunkId: string, status: "ACTIVE" | "EXCLUDED") {
    setBusy(chunkId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/chunks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunkId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      await loadFile(fileId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function removeCurrentFile() {
    if (!fileId) return;
    const name = files.find((f) => f.id === fileId)?.filename || "";
    if (!window.confirm(`${fa.review.confirmDelete}\n\n${name}`)) return;
    setBusy("delete");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/files?fileId=${encodeURIComponent(fileId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      setFileId("");
      setChunks([]);
      setParse(null);
      setDrafts({});
      await loadFiles();
      setMessage(fa.files.deleted);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function fileAction(action: "mark_reviewed" | "rechunk") {
    if (!fileId) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      if (action === "rechunk") {
        setTimeout(() => loadFile(fileId), 2000);
      }
      setMessage(fa.review.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  if (files.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        {fa.review.noFile}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-500">{fa.review.selectFile}</span>
          <select
            className="rounded-md border border-zinc-300 bg-white px-3 py-2"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
          >
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.filename}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          disabled={!fileId || busy === "mark_reviewed"}
          onClick={() => fileAction("mark_reviewed")}
        >
          {fa.review.markReviewed}
        </button>
        <button
          type="button"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          disabled={!fileId || busy === "rechunk"}
          onClick={() => fileAction("rechunk")}
        >
          {fa.review.rechunk}
        </button>
        <button
          type="button"
          className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 disabled:opacity-50"
          disabled={!fileId || busy === "delete"}
          onClick={removeCurrentFile}
        >
          {busy === "delete" ? fa.files.deleting : fa.review.delete}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">{fa.review.parsePreview}</h2>
          {pagePreview.length === 0 ? (
            <p className="text-sm text-zinc-500">{fa.review.noChunks}</p>
          ) : (
            <div className="max-h-[28rem] space-y-4 overflow-auto text-sm">
              {pagePreview.map((p) => (
                <div key={p.page_number}>
                  <div className="mb-1 text-xs font-medium text-zinc-500">
                    {fa.review.page} {p.page_number}
                  </div>
                  {(p.blocks || []).slice(0, 8).map((b, i) => (
                    <p key={i} className="mb-2 leading-relaxed text-zinc-700">
                      <span className="text-xs text-zinc-400">[{b.type}] </span>
                      {b.text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">{fa.review.chunks}</h2>
          {chunks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
              {fa.review.noChunks}
            </p>
          ) : (
            chunks.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border bg-white p-3 ${
                  c.status === "EXCLUDED"
                    ? "border-amber-200 opacity-70"
                    : "border-zinc-200"
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    #{c.ordinal + 1}
                    {c.pageNumber != null
                      ? ` · ${fa.review.page} ${c.pageNumber}`
                      : ""}
                    {c.status === "EXCLUDED" ? " · excluded" : ""}
                  </span>
                </div>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
                  value={drafts[c.id] ?? c.text}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                  }
                  disabled={c.status === "EXCLUDED"}
                />
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    disabled={busy === c.id || c.status === "EXCLUDED"}
                    onClick={() => saveChunk(c.id)}
                    className="rounded-md bg-zinc-900 px-2.5 py-1 text-white disabled:opacity-50"
                  >
                    {busy === c.id ? fa.review.saving : fa.review.save}
                  </button>
                  {c.status === "EXCLUDED" ? (
                    <button
                      type="button"
                      disabled={busy === c.id}
                      onClick={() => setStatus(c.id, "ACTIVE")}
                      className="rounded-md border border-zinc-300 px-2.5 py-1"
                    >
                      {fa.review.restore}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === c.id}
                      onClick={() => setStatus(c.id, "EXCLUDED")}
                      className="rounded-md border border-zinc-300 px-2.5 py-1"
                    >
                      {fa.review.exclude}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
