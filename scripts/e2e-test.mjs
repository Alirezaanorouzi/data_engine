/**
 * End-to-end test: project → upload PDF → jobs → search → export
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.APP_URL || "http://localhost:3000";
const PDF = path.join(ROOT, "storage", "test-sample.pdf");

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
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    throw new Error(
      `${opts.method || "GET"} ${url} → ${res.status}: ${data.error || text.slice(0, 200)}`,
    );
  }
  return data;
}

async function waitForJobs(projectId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { jobs } = await json(`${BASE}/api/projects/${projectId}/jobs`);
    const relevant = jobs.filter((j) =>
      ["PARSE", "CHUNK_EMBED"].includes(j.type),
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
    if (relevant.some((j) => j.type === "PARSE" && j.status === "COMPLETED")) {
      const chunkDone = relevant.some(
        (j) => j.type === "CHUNK_EMBED" && j.status === "COMPLETED",
      );
      if (chunkDone && pending.length === 0) return relevant;
    }
    process.stdout.write(".");
    await sleep(2500);
  }
  throw new Error("Timed out waiting for parse/chunk jobs");
}

async function main() {
  const pdfBytes = await readFile(PDF);
  console.log(`PDF ready: ${PDF} (${pdfBytes.length} bytes)\n`);

  console.log("Creating project…");
  const { project } = await json(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `E2E Test ${new Date().toISOString().slice(0, 16)}`,
      description: "Automated pipeline test",
    }),
  });
  console.log(`projectId: ${project.id}\n`);

  console.log("Uploading PDF…");
  const form = new FormData();
  form.append(
    "files",
    new Blob([pdfBytes], { type: "application/pdf" }),
    "test-sample.pdf",
  );
  const upload = await json(`${BASE}/api/projects/${project.id}/upload`, {
    method: "POST",
    body: form,
  });
  console.log("upload:", JSON.stringify(upload), "\n");

  console.log("Waiting for jobs");
  const jobs = await waitForJobs(project.id);
  console.log("\njobs:", jobs.map((j) => `${j.type}:${j.status}`).join(", "));

  const { files } = await json(`${BASE}/api/projects/${project.id}/files`);
  const file = files[0];
  if (!file) throw new Error("No file record");
  console.log(`\nFile: ${file.filename} status=${file.status} chunks=${file._count.chunks}`);

  const detail = await json(
    `${BASE}/api/projects/${project.id}/files?fileId=${file.id}`,
  );
  const chunks = detail.file.chunks || [];
  if (!chunks.length) throw new Error("No chunks created");
  console.log(`First chunk: ${chunks[0].text.slice(0, 100)}…\n`);

  console.log("Search: termination conditions…");
  const search = await json(`${BASE}/api/projects/${project.id}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "conditions for contract termination",
      topK: 3,
    }),
  });
  for (const r of search.results || []) {
    console.log(`  score=${r.score.toFixed(3)} page=${r.page} | ${r.content.slice(0, 70)}…`);
  }
  if (!search.results?.length) throw new Error("Search returned no results");

  console.log("\nExport…");
  const exp = await json(`${BASE}/api/projects/${project.id}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  console.log(`Export: ${exp.export.itemCount} chunks → ${exp.export.filePath}`);

  const report = {
    ok: true,
    projectId: project.id,
    fileId: file.id,
    fileStatus: file.status,
    chunkCount: chunks.length,
    searchHits: search.results.length,
    topScore: search.results[0].score,
    exportPath: exp.export.filePath,
  };
  await writeFile(
    path.join(ROOT, "storage", "e2e-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("\n✓ E2E passed\n", JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("\n✗ E2E failed:", err.message);
  process.exit(1);
});
