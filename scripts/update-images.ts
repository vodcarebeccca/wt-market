import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const map: Record<string, string> = {
    "wt-starter-1-100-gift3": "/images/products/thumb/wt-tank-battle.webp",
    "wt-tundra-11-100-gift": "/images/products/thumb/wt-sherman.webp",
    "wt-skip-grind-20-100-gift": "/images/products/thumb/wt-reddit1.webp",
    "wt-midtier-30-40": "/images/products/thumb/wt-abrams.webp",
    "wt-midtier-40-50": "/images/products/thumb/wt-reddit2.webp",
    "wt-hightier-50-60": "/images/products/thumb/wt-jet.webp",
    "wt-hightier-51-100": "/images/products/thumb/wt-reddit1.webp",
    "wt-top-tier-60-70": "/images/products/thumb/wt-jet.webp",
    "wt-top-tier-70-80": "/images/products/thumb/wt-abrams.webp",
    "wt-rank-10-0-tank": "/images/products/thumb/wt-tank-battle.webp",
  };

  for (const [slug, url] of Object.entries(map)) {
    await prisma.product.update({ where: { slug }, data: { imageUrl: url } });
    console.log(slug + " → " + url);
  }

  console.log("\nDone! All 10 products updated.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });