/**
 * API smoke test: vector-store delivery + pipeline stages
 */
const BASE = process.env.APP_URL || "http://localhost:3000";
const PROJECT_ID = process.argv[2];

async function json(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  let projectId = PROJECT_ID;

  console.log("1. List projects…");
  const list = await json(`${BASE}/api/projects`);
  assert(list.ok, `projects list failed: ${list.status} ${JSON.stringify(list.data)}`);
  assert(list.data.projects?.length, "no projects");
  if (!projectId) projectId = list.data.projects.find((p) => p._count.files > 0)?.id;
  assert(projectId, "no project with files — run e2e-test.mjs first");
  console.log(`   projectId: ${projectId}`);

  console.log("\n2. GET vector-store…");
  const store = await json(`${BASE}/api/projects/${projectId}/vector-store`);
  assert(store.ok, `vector-store failed: ${store.status} ${JSON.stringify(store.data)}`);
  assert(store.data.delivery === "api", "delivery should be api");
  assert(store.data.embeddings > 0, "expected embeddings > 0");
  console.log(`   chunks=${store.data.active_chunks} embeddings=${store.data.embeddings}`);

  console.log("\n3. POST vector-store/search…");
  const search = await json(`${BASE}/api/projects/${projectId}/vector-store/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "contract termination conditions",
      top_k: 3,
      query_type: "semantic",
    }),
  });
  if (!search.ok) {
    console.error("   ERROR:", JSON.stringify(search.data, null, 2));
    throw new Error(`search failed: ${search.status}`);
  }
  assert(search.data.chunks?.length > 0, "search returned no chunks");
  const top = search.data.chunks[0];
  assert(typeof top.score === "number", "missing score");
  assert(top.file_id, "missing file_id");
  assert(top.parse_result_id, "missing parse_result_id");
  assert(top.content, "missing content");
  console.log(`   hits=${search.data.chunks.length} topScore=${top.score.toFixed(3)}`);
  console.log(`   preview: ${top.content.slice(0, 80)}…`);

  console.log("\n4. POST legacy /search alias…");
  const legacy = await json(`${BASE}/api/projects/${projectId}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "sample contract", topK: 2 }),
  });
  assert(legacy.ok, `legacy search failed: ${legacy.status}`);
  assert(legacy.data.results?.length > 0, "legacy search no results");

  console.log("\n5. Pipeline stages…");
  for (const stage of ["overview", "parse", "chunk", "embed", "vector-store", "jobs"]) {
    const r = await json(`${BASE}/api/projects/${projectId}/pipeline?stage=${stage}`);
    assert(r.ok, `pipeline ${stage} failed: ${r.status}`);
    console.log(`   ${stage}: ok`);
  }

  console.log("\n6. GET files + DELETE check skipped");

  console.log("\n✓ API smoke test passed");
}

main().catch((e) => {
  console.error("\n✗ API test failed:", e.message);
  process.exit(1);
});
