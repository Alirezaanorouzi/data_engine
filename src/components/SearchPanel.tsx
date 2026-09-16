"use client";

import { useState } from "react";
import { fa } from "@/lib/i18n/fa";

type Result = {
  chunk_id: string;
  content: string;
  file_id: string;
  parse_result_id?: string;
  filename: string;
  page: number | null;
  score: number;
};

export function SearchPanel({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/vector-store/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, top_k: 8, query_type: "semantic" }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      setResults(
        (data.chunks || []).map(
          (c: {
            content: string;
            score: number;
            file_id: string;
            parse_result_id: string;
            metadata: { chunk_id?: string; filename?: string; page?: number };
          }) => ({
            chunk_id: String(c.metadata?.chunk_id ?? ""),
            content: c.content,
            file_id: c.file_id,
            parse_result_id: c.parse_result_id,
            filename: String(c.metadata?.filename ?? ""),
            page: c.metadata?.page ?? null,
            score: c.score,
          }),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="flex flex-wrap gap-2">
        <input
          className="min-w-[240px] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder={fa.search.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? fa.search.searching : fa.search.run}
        </button>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {searched && results.length === 0 && !error && (
        <p className="text-sm text-zinc-500">{fa.search.empty}</p>
      )}

      <ul className="space-y-3">
        {results.map((r) => (
          <li
            key={r.chunk_id || `${r.file_id}-${r.score}`}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-medium text-white">
                {fa.search.citation}
              </span>
              <span className="font-medium text-zinc-800">{r.filename}</span>
              {r.page != null && (
                <span className="text-zinc-500">
                  {fa.search.page} {r.page}
                </span>
              )}
              <span dir="ltr" className="text-zinc-500">
                {fa.search.score} {r.score.toFixed(3)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {r.content}
            </p>
            <div
              dir="ltr"
              className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-2 font-mono text-[10px] text-zinc-400"
            >
              <span title={fa.search.fileId}>file_id={r.file_id}</span>
              {r.parse_result_id && (
                <span>parse_result_id={r.parse_result_id}</span>
              )}
              {r.chunk_id && <span>chunk_id={r.chunk_id}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
