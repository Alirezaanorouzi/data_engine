/**
 * Test scanned Persian budget PDF: upload → parse (OCR) → chunk → search
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.APP_URL || "http://localhost:3000";
const PDF = path.join(ROOT, "persian_budget_scanned.pdf");
const WORKER = (process.env.PARSE_WORKER_URL || "http://localhost:8090").replace(/\/$/, "");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function json(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    throw new Error(
      `${opts.method || "GET"} ${url} → ${res.status}: ${data.error || data.detail || text.slice(0, 300)}`,
    );
  }
  return data;
}

async function waitForJobs(projectId, timeoutMs = 600000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { jobs } = await json(`${BASE}/api/projects/${projectId}/jobs`);
    const relevant = jobs.filter((j) =>
      ["PARSE", "CHUNK_EMBED", "QC"].includes(j.type),
    );
    const pending = relevant.filter(
      (j) => j.status === "PENDING" || j.status === "RUNNING",
    );
    const failed = relevant.filter((j) => j.status === "FAILED");
    if (failed.length) {
      throw new Error(
        `Job failed: ${failed.map((j) => `${j.type}: ${j.error}`).join("; ")}`,
      );
    }
    const parseDone = relevant.some(
      (j) => j.type === "PARSE" && j.status === "COMPLETED",
    );
    const chunkDone = relevant.some(
      (j) => j.type === "CHUNK_EMBED" && j.status === "COMPLETED",
    );
    const qcDone = relevant.some(
      (j) => j.type === "QC" && j.status === "COMPLETED",
    );
    if (parseDone && chunkDone && qcDone && pending.length === 0) return relevant;
    process.stdout.write(".");
    await sleep(3000);
  }
  throw new Error("Timed out waiting for parse/chunk/qc jobs");
}

async function testWorkerDirect(pdfBytes) {
  console.log("=== Direct parse worker test ===");
  const form = new FormData();
  form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "persian_budget_scanned.pdf");
  const t0 = Date.now();
  const parsed = await json(`${WORKER}/parse`, { method: "POST", body: form });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Worker parse: ${elapsed}s`);
  console.log(`  parser: ${parsed.parser_version}`);
  console.log(`  pages: ${parsed.page_count}`);
  console.log(`  ocr_pages: ${parsed.ocr_pages?.length ?? 0}`);
  console.log(`  ocr_model: ${parsed.ocr_model ?? "n/a"}`);
  console.log(`  language: ${parsed.language ?? "n/a"}`);
  const sample = parsed.pages?.[0]?.blocks?.[0]?.text?.slice(0, 120) ?? parsed.markdown?.slice(0, 120);
  console.log(`  page1 sample: ${sample}…\n`);
  return parsed;
}

async function main() {
  const pdfBytes = await readFile(PDF);
  console.log(`PDF: ${PDF} (${(pdfBytes.length / 1024).toFixed(0)} KB)\n`);

  const workerResult = await testWorkerDirect(pdfBytes);

  console.log("=== Full pipeline test ===");
  const { project } = await json(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Scanned Budget Test ${new Date().toISOString().slice(0, 16)}`,
      description: "Persian scanned budget PDF OCR test",
    }),
  });
  console.log(`projectId: ${project.id}`);

  const form = new FormData();
  form.append(
    "files",
    new Blob([pdfBytes], { type: "application/pdf" }),
    "persian_budget_scanned.pdf",
  );
  const upload = await json(`${BASE}/api/projects/${project.id}/upload`, {
    method: "POST",
    body: form,
  });
  console.log("upload:", JSON.stringify(upload));

  console.log("\nWaiting for jobs (OCR may take several minutes)");
  const jobs = await waitForJobs(project.id);
  console.log("\njobs:", jobs.map((j) => `${j.type}:${j.status}`).join(", "));

  const parseJob = jobs.find((j) => j.type === "PARSE");
  const summary = parseJob?.result?.summary;
  console.log("\nParse summary:", JSON.stringify(summary, null, 2));

  const { files } = await json(`${BASE}/api/projects/${project.id}/files`);
  const file = files[0];
  console.log(`\nFile: ${file.filename} status=${file.status} chunks=${file._count.chunks}`);

  const detail = await json(`${BASE}/api/projects/${project.id}/files?fileId=${file.id}`);
  const chunks = detail.file.chunks || [];
  if (chunks.length) {
    console.log(`First chunk: ${chunks[0].text.slice(0, 150)}…`);
  }

  console.log("\nSearch: بودجه…");
  const search = await json(`${BASE}/api/projects/${project.id}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "بودجه", topK: 3 }),
  });
  for (const r of search.results || []) {
    console.log(`  score=${r.score.toFixed(3)} page=${r.page} | ${r.content.slice(0, 80)}…`);
  }

  const report = {
    ok: true,
    projectId: project.id,
    fileId: file.id,
    fileStatus: file.status,
    chunkCount: chunks.length,
    workerPageCount: workerResult.page_count,
    workerOcrPages: workerResult.ocr_pages?.length ?? 0,
    parseSummary: summary,
    searchHits: search.results?.length ?? 0,
    topScore: search.results?.[0]?.score ?? null,
  };
  await writeFile(path.join(ROOT, "storage", "scanned-budget-report.json"), JSON.stringify(report, null, 2));
  console.log("\n✓ Scanned budget test done\n", JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("\n✗ Test failed:", err.message);
  process.exit(1);
});
