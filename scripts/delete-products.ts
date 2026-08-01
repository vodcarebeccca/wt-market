import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const keep = "wt-rank-10-0-tank";
  const toDelete = await prisma.product.findMany({
    where: { slug: { not: keep } },
    select: { id: true, slug: true, titleEn: true },
  });

  console.log("Deleting " + toDelete.length + " products:");
  for (const p of toDelete) {
    await prisma.stockItem.deleteMany({ where: { productId: p.id } });
    await prisma.orderItem.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
    console.log("  ✕ " + p.slug);
  }

  const remaining = await prisma.product.findMany();
  console.log("\nDone. " + remaining.length + " product(s) remaining:");
  for (const p of remaining) {
    console.log("  ✓ " + p.slug + " (" + p.titleEn + ")");
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });