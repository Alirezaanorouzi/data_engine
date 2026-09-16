"use client";

import { useCallback, useEffect, useState } from "react";
import { fa, fileStatusLabel } from "@/lib/i18n/fa";

type StageKey =
  | "overview"
  | "files"
  | "parse"
  | "chunk"
  | "embed"
  | "qc"
  | "vector-store"
  | "jobs"
  | "export";

type FileOption = {
  id: string;
  filename: string;
  status: string;
};

/** Stages scoped to the selected document (not mixed across files). */
const FILE_SCOPED: StageKey[] = ["parse", "chunk", "embed", "qc", "jobs"];

const STAGES: { key: StageKey; label: string }[] = [
  { key: "overview", label: fa.pipelineStages.overview },
  { key: "files", label: fa.pipelineStages.files },
  { key: "parse", label: fa.pipelineStages.parse },
  { key: "chunk", label: fa.pipelineStages.chunk },
  { key: "embed", label: fa.pipelineStages.embed },
  { key: "qc", label: fa.pipelineStages.qc },
  { key: "vector-store", label: fa.pipelineStages.vectorStore },
  { key: "jobs", label: fa.pipelineStages.jobs },
  { key: "export", label: fa.pipelineStages.export },
];

function buildPipelineUrl(
  projectId: string,
  stage: StageKey,
  fileId: string,
) {
  const params = new URLSearchParams({ stage });
  if (fileId && (FILE_SCOPED.includes(stage) || stage === "files")) {
    params.set("fileId", fileId);
  }
  return `/api/projects/${projectId}/pipeline?${params.toString()}`;
}

export function PipelineStageButtons({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileOption[]>([]);
  const [fileId, setFileId] = useState("");
  const [active, setActive] = useState<StageKey | null>(null);
  const [data, setData] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    const json = await res.json();
    const list: FileOption[] = (json.files || []).map(
      (f: FileOption) => ({
        id: f.id,
        filename: f.filename,
        status: f.status,
      }),
    );
    setFiles(list);
    setFileId((prev) => {
      if (prev && list.some((f) => f.id === prev)) return prev;
      return list[0]?.id ?? "";
    });
  }, [projectId]);

  useEffect(() => {
    loadFiles();
    const t = setInterval(loadFiles, 5000);
    return () => clearInterval(t);
  }, [loadFiles]);

  async function load(stage: StageKey, selectedFileId = fileId) {
    if (FILE_SCOPED.includes(stage) && !selectedFileId) {
      setError(fa.pipelineStages.noFiles);
      return;
    }

    setActive(stage);
    setLoading(true);
    setError(null);
    try {
      const url = buildPipelineUrl(projectId, stage, selectedFileId);
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || fa.errors.failed);
      setData(json);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(nextId: string) {
    setFileId(nextId);
    if (active && (FILE_SCOPED.includes(active) || active === "files")) {
      void load(active, nextId);
    }
  }

  const selectedFile = files.find((f) => f.id === fileId);
  const apiUrl =
    active != null
      ? buildPipelineUrl(projectId, active, fileId)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">
            {fa.pipelineStages.selectFile}
          </span>
          <select
            className="min-w-[220px] rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
            value={fileId}
            onChange={(e) => onFileChange(e.target.value)}
            disabled={files.length === 0}
          >
            {files.length === 0 ? (
              <option value="">{fa.pipelineStages.noFiles}</option>
            ) : (
              files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.filename} · {fileStatusLabel(f.status)}
                </option>
              ))
            )}
          </select>
        </label>
        {selectedFile && (
          <p className="text-xs text-zinc-500">
            {fa.pipelineStages.perFileScope}:{" "}
            <span className="font-medium text-zinc-700">
              {selectedFile.filename}
            </span>
          </p>
        )}
      </div>

      <p className="text-xs text-zinc-500">{fa.pipelineStages.unifiedSearchNote}</p>

      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const needsFile = FILE_SCOPED.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => load(s.key)}
              disabled={
                (loading && active === s.key) || (needsFile && !fileId)
              }
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                active === s.key
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              } disabled:opacity-50`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {(loading || data) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
            <span className="text-xs font-medium text-zinc-600">
              {loading ? fa.pipelineStages.loading : fa.pipelineStages.result}
              {active
                ? ` · ${STAGES.find((s) => s.key === active)?.label}`
                : ""}
              {selectedFile &&
              active &&
              FILE_SCOPED.includes(active) ? (
                <span className="text-zinc-400"> · {selectedFile.filename}</span>
              ) : null}
            </span>
            {apiUrl && (
              <a
                href={apiUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                {fa.pipelineStages.openApi}
              </a>
            )}
          </div>
          <pre
            dir="ltr"
            className="max-h-80 overflow-auto p-3 text-left text-xs leading-relaxed text-zinc-800"
          >
            {loading ? "…" : JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
