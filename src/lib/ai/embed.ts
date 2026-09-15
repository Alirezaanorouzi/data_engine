import { getOpenAI } from "./provider";
import { AI_CONFIG } from "./config";
import { getCached, setCached } from "./cache";

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function embedTexts(
  texts: string[],
  opts?: { contentHashes?: string[]; projectId?: string },
): Promise<number[][]> {
  const openai = getOpenAI();
  const model = AI_CONFIG.embeddingModel;
  const hashes = opts?.contentHashes;
  const out: (number[] | null)[] = new Array(texts.length).fill(null);
  const toFetch: { index: number; text: string; hash?: string }[] = [];

  for (let i = 0; i < texts.length; i++) {
    const hash = hashes?.[i];
    if (hash) {
      const cached = await getCached<number[]>(hash, "embedding", model);
      if (cached) {
        out[i] = cached;
        continue;
      }
    }
    toFetch.push({ index: i, text: texts[i], hash });
  }

  for (let offset = 0; offset < toFetch.length; offset += AI_CONFIG.embedBatchSize) {
    const batch = toFetch.slice(offset, offset + AI_CONFIG.embedBatchSize);
    const res = await openai.embeddings.create({
      model,
      input: batch.map((b) => b.text.slice(0, 8000)),
    });
    for (let j = 0; j < batch.length; j++) {
      const vec = res.data[j].embedding;
      out[batch[j].index] = vec;
      if (batch[j].hash) {
        await setCached(
          batch[j].hash!,
          "embedding",
          model,
          vec,
          opts?.projectId,
        );
      }
    }
  }

  return out as number[][];
}

export async function embedOne(
  text: string,
  contentHash?: string,
  projectId?: string,
) {
  const [vec] = await embedTexts([text], {
    contentHashes: contentHash ? [contentHash] : undefined,
    projectId,
  });
  return vec;
}

export { mapPool };
