import { prisma } from "@/lib/db";
import { deleteStorageFile } from "@/lib/storage";

export async function deleteSourceFile(projectId: string, fileId: string) {
  const file = await prisma.sourceFile.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new Error("File not found");

  const { storagePath } = file;

  await prisma.job.updateMany({
    where: {
      fileId,
      status: { in: ["PENDING", "RUNNING"] },
    },
    data: { status: "CANCELLED" },
  });

  await prisma.sourceFile.delete({ where: { id: fileId } });

  const remaining = await prisma.sourceFile.count({
    where: { projectId, storagePath },
  });
  if (remaining === 0) {
    await deleteStorageFile(storagePath);
  }

  return { deleted: fileId, filename: file.filename };
}
