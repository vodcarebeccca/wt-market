import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.create({
    data: {
      slug: "wt-rank-10-0-aircraft",
      titleId: "WT Rank 10.0 Aircraft",
      titleEn: "WT Rank 10.0 Aircraft",
      descId: "Akun War Thunder Rank 10.0 aircraft — full end-game jet access. TANPA email access (no email). GARANSI: jika login pertama gagal, langsung ganti akun baru tanpa biaya tambahan.",
      descEn: "War Thunder account Rank 10.0 aircraft — full end-game jet access. NO email access. GUARANTEE: if first login fails, free replacement with a new account.",
      minRank: 10,
      maxRank: 10,
      category: "RANK",
      nation: "ANY",
      priceIdr: 35000,
      imageUrl: "/images/products/thumb/wt-jet.webp",
    },
  });
  console.log("Created: " + p.slug);
  await prisma.$disconnect();
}
main();