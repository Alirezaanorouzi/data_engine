"use client";

import { useEffect, useState } from "react";
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold">{fa.delivery.title}</h2>
      <p className="mb-4 text-sm text-zinc-500">{fa.delivery.desc}</p>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {store && (
        <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <span className="text-zinc-500">{fa.delivery.chunks}: </span>
            {store.active_chunks}
          </div>
          <div>
            <span className="text-zinc-500">{fa.delivery.embeddings}: </span>
            {store.embeddings}
          </div>
          <div>
            <span className="text-zinc-500">{fa.delivery.indexedFiles}: </span>
            {store.indexed_files}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <EndpointRow
          method="GET"
          path={`/api/projects/${projectId}/vector-store`}
          label={fa.delivery.storeInfo}
          onCopy={() => copy(`${window.location.origin}/api/projects/${projectId}/vector-store`)}
        />
        <EndpointRow
          method="POST"
          path={searchUrl}
          label={fa.delivery.search}
          onCopy={() => copy(`${window.location.origin}${searchUrl}`)}
          body={EXAMPLE_BODY}
        />
      </div>

      <p className="mt-4 text-xs text-zinc-500">{fa.delivery.exportNote}</p>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  label,
  body,
  onCopy,
}: {
  method: string;
  path: string;
  label: string;
  body?: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-white">
            {method}
          </span>
          <span className="font-medium text-zinc-700">{label}</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs hover:bg-zinc-100"
        >
          {fa.delivery.copyUrl}
        </button>
      </div>
      <code dir="ltr" className="block text-left text-xs text-zinc-600">
        {path}
      </code>
      {body && (
        <pre
          dir="ltr"
          className="mt-2 overflow-x-auto rounded border border-zinc-200 bg-white p-2 text-left text-xs text-zinc-700"
        >
          {body}
        </pre>
      )}
    </div>
  );
}
