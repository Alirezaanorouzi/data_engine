import type { ParseBlock, ParsePage } from "@/lib/parseWorker";

export type DraftChunk = {
  text: string;
  pageNumber: number | null;
  blockTypes: string[];
  metadata: Record<string, unknown>;
};

const TARGET_CHARS = 1000;
const OVERLAP_CHARS = 150;
const MAX_CHARS = 1400;

function recursiveSplit(text: string, target = TARGET_CHARS, overlap = OVERLAP_CHARS): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  if (cleaned.length <= MAX_CHARS) return [cleaned];

  const parts: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + target, cleaned.length);
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("۔ "),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(" "),
      );
      if (breakAt > target * 0.4) end = start + breakAt + 1;
    }
    const piece = cleaned.slice(start, end).trim();
    if (piece) parts.push(piece);
    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return parts;
}

/** Layout-aware chunking: group blocks, split on headings, recursive fallback. */
export function chunkParseResult(opts: {
  pages: ParsePage[];
  markdown?: string;
}): DraftChunk[] {
  const pages = opts.pages || [];
  const drafts: DraftChunk[] = [];

  type Accum = {
    texts: string[];
    pageNumber: number | null;
    blockTypes: Set<string>;
  };

  let acc: Accum | null = null;

  function flush() {
    if (!acc || acc.texts.length === 0) {
      acc = null;
      return;
    }
    const joined = acc.texts.join("\n\n").trim();
    const types = [...acc.blockTypes];
    const pageNumber = acc.pageNumber;
    acc = null;

    if (!joined) return;
    if (joined.length <= MAX_CHARS) {
      drafts.push({
        text: joined,
        pageNumber,
        blockTypes: types,
        metadata: { strategy: "layout" },
      });
      return;
    }
    for (const part of recursiveSplit(joined)) {
      drafts.push({
        text: part,
        pageNumber,
        blockTypes: types,
        metadata: { strategy: "layout+recursive" },
      });
    }
  }

  function pushBlock(pageNumber: number, block: ParseBlock) {
    const text = (block.text || "").trim();
    if (!text) return;
    const isHeading = block.type === "heading" || block.type === "title";

    if (isHeading) {
      flush();
      acc = {
        texts: [text],
        pageNumber,
        blockTypes: new Set([block.type]),
      };
      return;
    }

    if (!acc) {
      acc = {
        texts: [text],
        pageNumber,
        blockTypes: new Set([block.type]),
      };
    } else {
      const nextLen = acc.texts.join("\n\n").length + 2 + text.length;
      if (nextLen > TARGET_CHARS && acc.texts.length > 0) {
        flush();
        acc = {
          texts: [text],
          pageNumber,
          blockTypes: new Set([block.type]),
        };
      } else {
        acc.texts.push(text);
        acc.blockTypes.add(block.type);
        if (acc.pageNumber == null) acc.pageNumber = pageNumber;
      }
    }
  }

  for (const page of pages) {
    const pageNumber = page.page_number ?? 1;
    for (const block of page.blocks || []) {
      pushBlock(pageNumber, block);
    }
  }
  flush();

  if (drafts.length === 0 && opts.markdown?.trim()) {
    for (const part of recursiveSplit(opts.markdown)) {
      drafts.push({
        text: part,
        pageNumber: 1,
        blockTypes: ["paragraph"],
        metadata: { strategy: "markdown-fallback" },
      });
    }
  }

  return drafts;
}
