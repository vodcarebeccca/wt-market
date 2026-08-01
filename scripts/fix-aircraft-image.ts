import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const r = await p.product.update({
    where: { slug: "wt-rank-10-0-aircraft" },
    data: { imageUrl: "/images/products/thumb/wt-jet-aircraft.webp" },
  });
  console.log("Updated to:", r.imageUrl);
  await p.$disconnect();
}
main();