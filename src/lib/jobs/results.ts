import type { JobType } from "@prisma/client";

export type PipelineStage =
  | "overview"
  | "files"
  | "parse"
  | "chunk"
  | "embed"
  | "vector-store"
  | "jobs"
  | "export";

export type JobResultEnvelope = {
  stage: JobType;
  version: 1;
  fileId?: string;
  summary: Record<string, unknown>;
  links: {
    detail: string;
    artifacts?: Record<string, string>;
  };
};

export function pipelineUrl(
  projectId: string,
  stage: PipelineStage,
  params?: Record<string, string | undefined>,
) {
  const q = new URLSearchParams({ stage });
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) q.set(k, v);
    }
  }
  return `/api/projects/${projectId}/pipeline?${q.toString()}`;
}

export function wrapJobResult(
  projectId: string,
  stage: JobType,
  summary: Record<string, unknown>,
  opts?: { fileId?: string; artifacts?: Record<string, string> },
): JobResultEnvelope {
  const fileId = opts?.fileId;
  const stageKey =
    stage === "PARSE"
      ? "parse"
      : stage === "CHUNK_EMBED"
        ? "chunk"
        : "export";

  return {
    stage,
    version: 1,
    ...(fileId ? { fileId } : {}),
    summary,
    links: {
      detail: pipelineUrl(projectId, stageKey as PipelineStage, { fileId }),
      ...(opts?.artifacts ? { artifacts: opts.artifacts } : {}),
    },
  };
}
