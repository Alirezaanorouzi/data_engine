"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

type StoreInfo = {
  vector_store_id: string;
  engine: string;
  embedding_model: string;
  active_chunks: number;
  embeddings: number;
  indexed_files: number;
  endpoints: { info: string; search: string };
};

const EXAMPLE_BODY = `{
  "query": "شرایط فسخ قرارداد چیست؟",
  "top_k": 5,
  "query_type": "semantic"
}`;

export function DeliveryApiPanel({ projectId }: { projectId: string }) {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/vector-store`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStore(d);
      })
      .catch((e) => setError(String(e)));
  }, [projectId]);

  const searchUrl = `/api/projects/${projectId}/vector-store/search`;

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-900/10 bg-zinc-900 text-zinc-50">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              {fa.delivery.title}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-400">
              {fa.delivery.desc}
            </p>
          </div>
          <Link
            href={`/projects/${projectId}/search`}
            className="shrink-0 rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-zinc-100 hover:bg-white/10"
          >
            {fa.delivery.trySearch}
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        {error && (
          <p className="mb-3 rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {store && (
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-white/5 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                {fa.delivery.indexedFiles}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {store.indexed_files}
              </div>
            </div>
            <div className="rounded-md bg-white/5 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                {fa.delivery.chunks}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {store.active_chunks}
              </div>
            </div>
            <div className="rounded-md bg-white/5 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                {fa.delivery.embeddings}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {store.embeddings}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <EndpointRow
            method="POST"
            path={searchUrl}
            label={fa.delivery.search}
            onCopy={() =>
              copy(`${window.location.origin}${searchUrl}`)
            }
            body={EXAMPLE_BODY}
            primary
          />
          <EndpointRow
            method="GET"
            path={`/api/projects/${projectId}/vector-store`}
            label={fa.delivery.storeInfo}
            onCopy={() =>
              copy(
                `${window.location.origin}/api/projects/${projectId}/vector-store`,
              )
            }
          />
        </div>

        <p className="mt-3 text-[11px] text-zinc-500">{fa.delivery.exportNote}</p>
      </div>
    </section>
  );
}

function EndpointRow({
  method,
  path,
  label,
  body,
  onCopy,
  primary,
}: {
  method: string;
  path: string;
  label: string;
  body?: string;
  onCopy: () => void;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        primary
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-900">
            {method}
          </span>
          <span className="font-medium text-zinc-100">{label}</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded border border-white/20 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-white/10"
        >
          {fa.delivery.copyUrl}
        </button>
      </div>
      <code dir="ltr" className="block text-left text-xs text-zinc-400">
        {path}
      </code>
      {body && (
        <pre
          dir="ltr"
          className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/30 p-2 text-left text-[11px] leading-relaxed text-zinc-300"
        >
          {body}
        </pre>
      )}
    </div>
  );
}
