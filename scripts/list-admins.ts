import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminUser.findMany({
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Admin count: ${admins.length}`);
  for (const a of admins) {
    console.log(`- ${a.email} (created ${a.createdAt.toISOString().slice(0, 10)})`);
  }
}

main().finally(() => prisma.$disconnect());
