"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa, formatFaDateTime } from "@/lib/i18n/fa";

type ExportRow = {
  id: string;
  format: string;
  itemCount: number;
  filePath: string;
  createdAt: string;
};

export function ExportPanel({
  projectId,
  exports,
}: {
  projectId: string;
  exports: ExportRow[];
}) {
  const router = useRouter();
  const [includeEmb, setIncludeEmb] = useState(false);
  const [includeExcluded, setIncludeExcluded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeEmbeddings: includeEmb,
          includeExcluded,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.export.exportFailed);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">{fa.export.create}</h2>
        <p className="text-xs text-zinc-500">{fa.export.ragDesc}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeEmb}
            onChange={(e) => setIncludeEmb(e.target.checked)}
          />
          {fa.export.includeEmb}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeExcluded}
            onChange={(e) => setIncludeExcluded(e.target.checked)}
          />
          {fa.export.includeExcluded}
        </label>
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={busy}
          onClick={run}
        >
          {busy ? fa.export.exporting : fa.export.export}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">{fa.export.history}</h2>
        {exports.length === 0 ? (
          <p className="text-sm text-zinc-500">{fa.export.noExports}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {exports.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 px-3 py-2"
              >
                <div>
                  <div className="font-medium">
                    {e.format} · {e.itemCount} {fa.export.items}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatFaDateTime(e.createdAt)}
                  </div>
                </div>
                <a
                  className="text-blue-600 hover:underline"
                  href={`/api/files/${e.filePath}`}
                  download
                >
                  {fa.export.download}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
