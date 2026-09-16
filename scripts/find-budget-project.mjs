import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const files = await p.sourceFile.findMany({
  where: { filename: { contains: "budget" } },
  select: { id: true, projectId: true, filename: true, status: true },
  orderBy: { createdAt: "desc" },
  take: 3,
});
console.log(JSON.stringify(files, null, 2));
await p.$disconnect();
