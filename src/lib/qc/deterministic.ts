import type { ParsePage } from "@/lib/parseWorker";

export type QcCheck = {
  id: string;
  pass: boolean;
  /** hard fail blocks INDEXED; soft only lowers score / routes to review */
  severity: "hard" | "soft";
  detail: string;
};

export type QcVerdict = "PASS" | "NEEDS_REVIEW" | "FAIL";

export type QcResult = {
  score: number;
  verdict: QcVerdict;
  fileStatus: "INDEXED" | "NEEDS_REVIEW" | "FAILED";
  checks: QcCheck[];
  summary: {
    pageCount: number;
    chunkCount: number;
    activeChunkCount: number;
    parseCharCount: number;
    chunkCharCount: number;
    coverage: number;
    ocrPageCount: number;
    tableCount: number;
    headingCount: number;
  };
};

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Drop markdown page banners so coverage compares content, not wrappers. */
function parseBodyForCoverage(markdown: string, blockText: string): string {
  const fromMd = markdown
    .replace(/^##\s*Page\s+\d+\s*$/gim, " ")
    .replace(/\n##\s*Page\s+\d+\s*\n/gi, "\n");
  return normalize(fromMd) || normalize(blockText);
}

function charCoverage(parseText: string, chunkTexts: string[]): number {
  const source = normalize(parseText);
  if (!source.length) return chunkTexts.some((t) => normalize(t).length) ? 0 : 1;

  // Count how many source chars are "explained" by chunk content via
  // unique word/token overlap against the parse string length.
  const chunkJoined = normalize(chunkTexts.join(" "));
  if (!chunkJoined.length) return 0;

  // Sliding window: for each chunk, measure longest contiguous presence
  // in source; fall back to char-set overlap for OCR noise.
  let covered = 0;
  const coveredRanges: Array<[number, number]> = [];

  for (const raw of chunkTexts) {
    const chunk = normalize(raw);
    if (!chunk) continue;
    const idx = source.indexOf(chunk);
    if (idx >= 0) {
      coveredRanges.push([idx, idx + chunk.length]);
      continue;
    }
    // Fuzzy: sample 40-char windows from chunk and count hits
    const win = Math.min(40, chunk.length);
    let hits = 0;
    let probes = 0;
    for (let i = 0; i + win <= chunk.length; i += Math.max(Math.floor(win / 2), 1)) {
      probes++;
      if (source.includes(chunk.slice(i, i + win))) hits++;
    }
    if (probes > 0) {
      covered += Math.round(chunk.length * (hits / probes));
    }
  }

  // Merge exact ranges
  coveredRanges.sort((a, b) => a[0] - b[0]);
  let lastEnd = -1;
  for (const [s, e] of coveredRanges) {
    if (s >= lastEnd) {
      covered += e - s;
      lastEnd = e;
    } else if (e > lastEnd) {
      covered += e - lastEnd;
      lastEnd = e;
    }
  }

  return Math.min(1, covered / source.length);
}

export function runDeterministicQc(input: {
  markdown: string;
  pages: ParsePage[];
  pageCount: number | null;
  chunks: { text: string; pageNumber: number | null; status: string }[];
}): QcResult {
  const pages = input.pages || [];
  const allChunks = input.chunks || [];
  const active = allChunks.filter((c) => c.status !== "EXCLUDED");
  const markdown = input.markdown || "";
  const parseFromBlocks = pages
    .flatMap((p) => (p.blocks || []).map((b) => b.text || ""))
    .join("\n\n");
  const parseText = parseBodyForCoverage(markdown, parseFromBlocks);

  const ocrPageCount = pages.filter((p) => p.ocr).length;
  const tableCount = pages.reduce(
    (n, p) =>
      n +
      (p.blocks || []).filter(
        (b) =>
          b.type === "table" ||
          ((b.text || "").includes("|") && (b.text || "").split("\n").length >= 2),
      ).length,
    0,
  );
  const headings = pages.flatMap((p) =>
    (p.blocks || []).filter((b) => b.type === "heading" && (b.text || "").trim()),
  );
  const pageCount =
    input.pageCount ??
    pages.length ??
    (pages.length ? Math.max(...pages.map((p) => p.page_number || 0)) : 0);

  const coverage = charCoverage(
    parseText,
    active.map((c) => c.text),
  );
  const chunkCharCount = active.reduce((n, c) => n + normalize(c.text).length, 0);

  const checks: QcCheck[] = [];

  // 1. Parse has content
  const hasParse = parseText.length > 0;
  checks.push({
    id: "parse_content",
    pass: hasParse,
    severity: "hard",
    detail: hasParse
      ? `Parse text present (${parseText.length} chars)`
      : "Parse produced empty text",
  });

  // 2. Page count
  const pagesOk = pageCount > 0;
  checks.push({
    id: "page_count",
    pass: pagesOk,
    severity: "hard",
    detail: pagesOk ? `${pageCount} page(s)` : "pageCount is 0",
  });

  // 3. Chunks exist when parse has text
  const chunksOk = !hasParse || active.length > 0;
  checks.push({
    id: "chunk_count",
    pass: chunksOk,
    severity: "hard",
    detail: chunksOk
      ? `${active.length} active chunk(s)`
      : "Parse has text but no active chunks",
  });

  // 4. Empty chunks
  const emptyChunks = active.filter((c) => !normalize(c.text));
  checks.push({
    id: "no_empty_chunks",
    pass: emptyChunks.length === 0,
    severity: "hard",
    detail:
      emptyChunks.length === 0
        ? "No empty chunks"
        : `${emptyChunks.length} empty chunk(s)`,
  });

  // 5. Duplicate chunks
  const seen = new Set<string>();
  let dupes = 0;
  for (const c of active) {
    const key = normalize(c.text);
    if (!key) continue;
    if (seen.has(key)) dupes++;
    else seen.add(key);
  }
  checks.push({
    id: "no_duplicate_chunks",
    pass: dupes === 0,
    severity: "soft",
    detail: dupes === 0 ? "No duplicate chunks" : `${dupes} duplicate chunk(s)`,
  });

  // 6. Coverage
  const coverageHard = coverage >= 0.9;
  const coverageSoft = coverage >= 0.98;
  checks.push({
    id: "coverage",
    pass: coverageHard,
    severity: "hard",
    detail: `Chunk coverage ${(coverage * 100).toFixed(1)}% of parse text${
      coverageSoft ? "" : " (below 98% soft target)"
    }`,
  });
  if (coverageHard && !coverageSoft) {
    checks.push({
      id: "coverage_soft",
      pass: false,
      severity: "soft",
      detail: `Coverage ${(coverage * 100).toFixed(1)}% is under 98% soft target`,
    });
  }

  // 7. Page metadata
  const badPages = active.filter(
    (c) =>
      c.pageNumber != null &&
      (c.pageNumber < 1 || (pageCount > 0 && c.pageNumber > pageCount)),
  );
  checks.push({
    id: "page_metadata",
    pass: badPages.length === 0,
    severity: "soft",
    detail:
      badPages.length === 0
        ? "Chunk page numbers in range"
        : `${badPages.length} chunk(s) with out-of-range pageNumber`,
  });

  // 8. Heading / section presence
  if (headings.length > 0) {
    const chunkBlob = normalize(active.map((c) => c.text).join(" "));
    const missing = headings.filter(
      (h) => !chunkBlob.includes(normalize(h.text).slice(0, 40)),
    );
    checks.push({
      id: "section_headers",
      pass: missing.length === 0,
      severity: "soft",
      detail:
        missing.length === 0
          ? `All ${headings.length} heading(s) present in chunks`
          : `${missing.length}/${headings.length} heading(s) missing from chunks`,
    });
  }

  // 9. Table structure hint
  const parseHasPipes = (markdown.match(/\|/g) || []).length >= 3;
  const chunksHavePipes = active.some(
    (c) => (c.text.match(/\|/g) || []).length >= 2,
  );
  if (tableCount > 0 || parseHasPipes) {
    checks.push({
      id: "table_structure",
      pass: chunksHavePipes || tableCount === 0,
      severity: "soft",
      detail: chunksHavePipes
        ? "Table-like structure retained in chunks"
        : "Parse suggests tables but chunks lost column separators",
    });
  }

  // 10. OCR flag (soft — routes to review)
  if (ocrPageCount > 0) {
    checks.push({
      id: "ocr_pages",
      pass: true,
      severity: "soft",
      detail: `${ocrPageCount} page(s) used OCR — recommend human review`,
    });
  }

  const hardFails = checks.filter((c) => c.severity === "hard" && !c.pass);
  const softFails = checks.filter((c) => c.severity === "soft" && !c.pass);
  // coverage_soft is informational only — don't force human review for it alone
  const reviewSoftFails = softFails.filter((c) => c.id !== "coverage_soft");
  const hardTotal = checks.filter((c) => c.severity === "hard").length || 1;
  const softTotal = checks.filter((c) => c.severity === "soft").length || 1;
  const hardScore = 1 - hardFails.length / hardTotal;
  const softScore = 1 - softFails.length / softTotal;
  const score = Math.round((0.75 * hardScore + 0.25 * softScore) * 1000) / 1000;

  let verdict: QcVerdict;
  let fileStatus: QcResult["fileStatus"];
  if (hardFails.length > 0) {
    verdict = "FAIL";
    fileStatus = "FAILED";
  } else if (ocrPageCount > 0 || reviewSoftFails.length > 0) {
    // OCR docs and structural soft fails → human review; clean digital PDFs → INDEXED
    verdict = "NEEDS_REVIEW";
    fileStatus = "NEEDS_REVIEW";
  } else {
    verdict = "PASS";
    fileStatus = "INDEXED";
  }

  return {
    score,
    verdict,
    fileStatus,
    checks,
    summary: {
      pageCount,
      chunkCount: allChunks.length,
      activeChunkCount: active.length,
      parseCharCount: parseText.length,
      chunkCharCount,
      coverage: Math.round(coverage * 1000) / 1000,
      ocrPageCount,
      tableCount,
      headingCount: headings.length,
    },
  };
}
