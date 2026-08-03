import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const products = await p.product.findMany({
    select: { slug: true, titleId: true, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("Count:", products.length);
  for (const x of products) {
    console.log(`  ${x.slug} | active=${x.isActive} | ${x.titleId}`);
  }
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });