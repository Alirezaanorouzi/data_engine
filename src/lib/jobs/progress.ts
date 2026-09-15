import { prisma } from "@/lib/db";

export async function updateJobProgress(
  jobId: string,
  progress: number,
  total?: number,
) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      progress,
      ...(typeof total === "number" ? { total } : {}),
    },
  });
}
