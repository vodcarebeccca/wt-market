import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const r = await p.product.findUnique({ where: { slug: "wt-rank-10-0-aircraft" } });
  console.log("imageUrl:", r?.imageUrl);
  const t = await p.product.findUnique({ where: { slug: "wt-rank-10-0-tank" } });
  console.log("tank imageUrl:", t?.imageUrl);
  await p.$disconnect();
}
main();