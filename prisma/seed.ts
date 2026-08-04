import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@wtmarket.local";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();

  // ===== 2 PRODUK — WT Rank 10.0 =====

  const products = [
    {
      slug: "wt-rank-10-0-tank",
      titleId: "WT Rank 10.0 Tank",
      titleEn: "WT Rank 10.0 Tank",
      descId: "Akun War Thunder tanpa email access. Rank 10.0 tank — full end-game MBT access. Siap battle modern.",
      descEn: "War Thunder account without email access. Rank 10.0 tank — full end-game MBT access. Ready for modern battles.",
      minRank: 10, maxRank: 10,
      category: "RANK", nation: "ANY",
      priceIdr: 40_000,
      imageUrl: "/images/products/thumb/wt-tank-battle.webp",
      stock: [
        "rank10_tank_001@noemail.test:Rank10Tank!",
        "rank10_tank_002@noemail.test:Rank10Tank!",
        "rank10_tank_003@noemail.test:Rank10Tank!",
        "rank10_tank_004@noemail.test:Rank10Tank!",
        "rank10_tank_005@noemail.test:Rank10Tank!",
      ],
    },
    {
      slug: "wt-rank-10-0-aircraft",
      titleId: "WT Rank 10.0 Aircraft",
      titleEn: "WT Rank 10.0 Aircraft",
      descId: "Akun War Thunder Rank 10.0 aircraft — full end-game jet access. TANPA email access (no email). GARANSI: jika login pertama gagal, langsung ganti akun baru tanpa biaya tambahan.",
      descEn: "War Thunder account Rank 10.0 aircraft — full end-game jet access. NO email access. GUARANTEE: if first login fails, free replacement with a new account.",
      minRank: 10, maxRank: 10,
      category: "RANK", nation: "ANY",
      priceIdr: 35_000,
      imageUrl: "/images/products/thumb/wt-jet-aircraft.webp",
      stock: [],
    },
  ];

  for (const p of products) {
    const { stock, ...data } = p;
    const product = await prisma.product.create({ data });
    if (stock.length) {
      await prisma.stockItem.createMany({
        data: stock.map((credential) => ({
          productId: product.id,
          credential,
          status: "AVAILABLE",
        })),
      });
    }
  }

  // Seed GoBiz config from env vars (if present and not already in DB)
  const gobizToken = process.env.GOBIZ_ACCESS_TOKEN;
  const gobizMerchantId = process.env.GOBIZ_MERCHANT_ID;
  const gobizRefresh = process.env.GOBIZ_REFRESH_TOKEN;
  const gobizEmail = process.env.GOBIZ_EMAIL;

  if (gobizToken && gobizMerchantId) {
    const existing = await prisma.goBizConfig.findFirst();
    if (!existing) {
      await prisma.goBizConfig.create({
        data: {
          accessToken: gobizToken,
          refreshToken: gobizRefresh || null,
          merchantId: gobizMerchantId,
          expiresAt: new Date(Date.now() + 86_400_000), // 24h from now
          email: gobizEmail || null,
          uniqueId: null,
        },
      });
      console.log("GoBiz config seeded from env vars");
    }
  }

  console.log("Seed OK");
  console.log(`Admin: ${email} / ${password}`);
  console.log(`Products: ${products.length}`);
  const totalStock = products.reduce((s, p) => s + p.stock.length, 0);
  console.log(`Stock items: ${totalStock}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });