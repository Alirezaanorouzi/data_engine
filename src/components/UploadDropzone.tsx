"use client";

import { useState } from "react";
import { fa } from "@/lib/i18n/fa";

export function UploadDropzone({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append("files", f);
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: form,
      });
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          throw new Error(
            res.ok ? fa.upload.uploadFailed : raw.slice(0, 200) || fa.upload.uploadFailed,
          );
        }
      }
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : fa.upload.uploadFailed,
        );
      }
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white px-6 py-16 transition hover:border-blue-400 hover:bg-blue-50/40 ${busy ? "opacity-60" : ""}`}
      >
        <input
          type="file"
          className="hidden"
          multiple
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => onFiles(e.target.files)}
        />
        <p className="text-sm font-medium">
          {busy ? fa.upload.uploading : fa.upload.dropPdf}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{fa.upload.documentHint}</p>
      </label>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {summary && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          <p className="font-medium">{fa.upload.summary}</p>
          <ul className="mt-2 space-y-1 text-zinc-600">
            <li>
              {fa.upload.accepted}: {String(summary.accepted ?? 0)}
            </li>
            <li>
              {fa.upload.duplicates}: {String(summary.duplicates ?? 0)}
            </li>
            <li>
              {fa.upload.rejected}: {String(summary.rejected ?? 0)}
            </li>
          </ul>
          {Number(summary.duplicates ?? 0) > 0 && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-amber-900">
              {fa.upload.duplicateHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
