import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getCached<T>(
  contentHash: string,
  kind: string,
  model: string,
): Promise<T | null> {
  const row = await prisma.aiCache.findUnique({
    where: {
      contentHash_kind_model: { contentHash, kind, model },
    },
  });
  if (!row) return null;
  return row.value as T;
}

export async function setCached(
  contentHash: string,
  kind: string,
  model: string,
  value: unknown,
  projectId?: string | null,
) {
  await prisma.aiCache.upsert({
    where: {
      contentHash_kind_model: { contentHash, kind, model },
    },
    create: {
      contentHash,
      kind,
      model,
      value: value as Prisma.InputJsonValue,
      projectId: projectId ?? null,
    },
    update: {
      value: value as Prisma.InputJsonValue,
      projectId: projectId ?? null,
    },
  });
}
