import { aiEnv } from "./env";

function envModel(name: string, fallback: string) {
  return (aiEnv(name) || fallback).replace(/^["']|["']$/g, "").trim();
}

export const AI_CONFIG = {
  embeddingModel: envModel(
    "OPENAI_EMBEDDING_MODEL",
    "text-embedding-3-small",
  ),
  embeddingDims: 1536,
  maxConcurrency: 4,
  embedBatchSize: 64,
} as const;
