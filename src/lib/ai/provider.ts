import OpenAI from "openai";
import { aiEnv } from "./env";

/** Strip wrapping quotes; Sinox keys use sk- prefix (normalize SK- from dashboard). */
export function normalizeApiKey(key: string | undefined) {
  if (!key) return key;
  const trimmed = key.replace(/^["']|["']$/g, "").trim();
  if (trimmed.startsWith("SK-")) return `sk-${trimmed.slice(3)}`;
  return trimmed;
}

/** HTTPS required for Sinox; upgrade http:// automatically. */
export function normalizeBaseUrl(url: string | undefined) {
  if (!url) return undefined;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

let client: OpenAI | null = null;

export function getOpenAI() {
  const apiKey = normalizeApiKey(aiEnv("OPENAI_API_KEY"));
  const baseURL = normalizeBaseUrl(aiEnv("OPENAI_BASE_URL"));
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env before running embeddings.",
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return client;
}

export { AI_CONFIG } from "./config";
