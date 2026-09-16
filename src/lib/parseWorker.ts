import path from "node:path";
import { storageRoot } from "@/lib/storage";

export type ParseBlock = {
  type: string;
  text: string;
  bbox: unknown;
};

export type ParsePage = {
  page_number: number;
  blocks: ParseBlock[];
  ocr?: boolean;
};

export type ParseResponse = {
  markdown: string;
  pages: ParsePage[];
  tables: { page_number: number; text: string }[];
  page_count: number;
  language?: string | null;
  parser_version?: string;
  ocr_pages?: number[];
  ocr_model?: string | null;
};

export function parseWorkerUrl() {
  return (process.env.PARSE_WORKER_URL || "http://localhost:8090").replace(
    /\/$/,
    "",
  );
}

export async function parsePdfWithWorker(
  absolutePdfPath: string,
  filename: string,
): Promise<ParseResponse> {
  const root = storageRoot();
  const full = path.resolve(absolutePdfPath);
  if (!full.startsWith(root)) {
    throw new Error("PDF path outside storage root");
  }

  const buf = await import("node:fs/promises").then((fs) => fs.readFile(full));
  const form = new FormData();
  const bytes = new Uint8Array(buf);
  form.append(
    "file",
    new Blob([bytes], { type: "application/pdf" }),
    filename || "document.pdf",
  );

  const res = await fetch(`${parseWorkerUrl()}/parse`, {
    method: "POST",
    body: form,
  });

  const raw = await res.text();
  let data: ParseResponse & { detail?: string };
  try {
    data = JSON.parse(raw) as ParseResponse & { detail?: string };
  } catch {
    throw new Error(
      `Parse worker returned non-JSON (${res.status}): ${raw.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    throw new Error(
      data.detail || `Parse worker failed with status ${res.status}`,
    );
  }

  return {
    markdown: data.markdown || "",
    pages: Array.isArray(data.pages) ? data.pages : [],
    tables: Array.isArray(data.tables) ? data.tables : [],
    page_count: data.page_count || data.pages?.length || 0,
    language: data.language ?? null,
    parser_version: data.parser_version || "pymupdf+qwen-v1",
    ocr_pages: Array.isArray(data.ocr_pages) ? data.ocr_pages : [],
    ocr_model: data.ocr_model ?? null,
  };
}
