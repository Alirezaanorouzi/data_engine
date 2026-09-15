import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.project.findFirst({
    where: { name: "نمونه اسناد حقوقی" },
  });
  if (existing) {
    console.log("Sample project already exists:", existing.id);
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "نمونه اسناد حقوقی",
      type: "DOCUMENT",
      description:
        "پروژه نمونه برای پایپ‌لاین PDF → پارس → چانک → جستجوی معنایی → خروجی RAG",
    },
  });

  console.log(`Seeded project ${project.id} (upload a PDF to start)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
