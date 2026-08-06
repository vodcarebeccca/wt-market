import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const target = "admin@wtmarket.local";
  const result = await prisma.adminUser.deleteMany({ where: { email: target } });
  console.log(`Deleted ${result.count} admin with email ${target}`);
}

main().finally(() => prisma.$disconnect());
