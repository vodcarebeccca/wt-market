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
  await prisma.product.deleteMany();

  // Harga JUAL (IDR) - sudah include margin profit
  // Target: beli ~$0.10-3.50, jual Rp 3.000 - 100.000
  // Margin ~3-5x cost untuk absorb risk (chargeback, ban, refund)

  const products = [
    // ===== ENTRY TIER (Rp 3.000 - 5.000) =====
    {
      slug: "wt-starter-1-100-gift3",
      titleId: "War Thunder Starter Pack — Level 1–100 + 3 Gift",
      titleEn: "War Thunder Starter Pack — Level 1–100 + 3 Gifts",
      descId: "Akun fresh level 1–100 + 3 gift in-game. Cocok pemula mau coba semua nation.",
      descEn: "Fresh account level 1–100 + 3 in-game gifts. Perfect for beginners to try all nations.",
      minLevel: 1,
      maxLevel: 100,
      category: "GIFT",
      nation: "ANY",
      priceIdr: 4_900, // ~$0.21 — beli ~$0.10, margin ~2x
      stock: [
        "starter_gift3_001@mail.test:StartGift3!",
        "starter_gift3_002@mail.test:StartGift3!",
        "starter_gift3_003@mail.test:StartGift3!",
        "starter_gift3_004@mail.test:StartGift3!",
        "starter_gift3_005@mail.test:StartGift3!",
      ],
    },
    {
      slug: "wt-tundra-11-100-gift",
      titleId: "WT Tundra Account — Level 11–100 + Gift",
      titleEn: "WT Tundra Account — Level 11–100 + Gift",
      descId: "Akun Tundra (bypass launcher) level 11–100 + gift. Langsung main tanpa verifikasi tambahan.",
      descEn: "Tundra launcher account level 11–100 + gift. Play directly without extra verification.",
      minLevel: 11,
      maxLevel: 100,
      category: "GIFT",
      nation: "ANY",
      priceIdr: 5_900, // ~$0.25 — beli ~$0.12, margin ~2x
      stock: [
        "tundra_l11_100_001@mail.test:TundraL11Gift!",
        "tundra_l11_100_002@mail.test:TundraL11Gift!",
        "tundra_l11_100_003@mail.test:TundraL11Gift!",
      ],
    },
    {
      slug: "wt-skip-grind-20-100-gift",
      titleId: "Skip The Grind — Level 20–100 + Gift",
      titleEn: "Skip The Grind — Level 20–100 + Gift",
      descId: "Lewati early game. Level 20–100 + gift. Siap unlock rank IV-V vehicles.",
      descEn: "Skip early game. Level 20–100 + gift. Ready to unlock rank IV-V vehicles.",
      minLevel: 20,
      maxLevel: 100,
      category: "GIFT",
      nation: "ANY",
      priceIdr: 9_900, // ~$0.42 — beli ~$0.18, margin ~2.3x
      stock: [
        "skipgrind_l20_100_001@mail.test:SkipGrind20!",
        "skipgrind_l20_100_002@mail.test:SkipGrind20!",
        "skipgrind_l20_100_003@mail.test:SkipGrind20!",
        "skipgrind_l20_100_004@mail.test:SkipGrind20!",
      ],
    },

    // ===== MID TIER (Rp 15.000 - 35.000) =====
    {
      slug: "wt-midtier-30-40",
      titleId: "Mid-Tier Ready — Level 30–40",
      titleEn: "Mid-Tier Ready — Level 30–40",
      descId: "Level 30–40. Unlock rank III-IV ground/air. Cocok grind silver lions.",
      descEn: "Level 30–40. Unlock rank III-IV ground/air. Good for silver lions grind.",
      minLevel: 30,
      maxLevel: 40,
      category: "LEVEL",
      nation: "ANY",
      priceIdr: 14_900, // ~$0.63 — beli ~$0.20, margin ~3.1x
      stock: [
        "midtier_l30_40_001@mail.test:MidTier30_40!",
        "midtier_l30_40_002@mail.test:MidTier30_40!",
        "midtier_l30_40_003@mail.test:MidTier30_40!",
        "midtier_l30_40_004@mail.test:MidTier30_40!",
        "midtier_l30_40_005@mail.test:MidTier30_40!",
      ],
    },
    {
      slug: "wt-midtier-40-50",
      titleId: "Mid-Tier Plus — Level 40–50",
      titleEn: "Mid-Tier Plus — Level 40–50",
      descId: "Level 40–50. Akses rank IV solid. Siap event & battle pass.",
      descEn: "Level 40–50. Solid rank IV access. Ready for events & battle pass.",
      minLevel: 40,
      maxLevel: 50,
      category: "LEVEL",
      nation: "ANY",
      priceIdr: 19_900, // ~$0.85 — beli ~$0.28, margin ~3x
      stock: [
        "midtier_l40_50_001@mail.test:MidTier40_50!",
        "midtier_l40_50_002@mail.test:MidTier40_50!",
        "midtier_l40_50_003@mail.test:MidTier40_50!",
      ],
    },
    {
      slug: "wt-hightier-50-60",
      titleId: "High-Tier Entry — Level 50–60",
      titleEn: "High-Tier Entry — Level 50–60",
      descId: "Level 50–60. Unlock rank V vehicles. Mulai jasad top-tier jets/tanks.",
      descEn: "Level 50–60. Unlock rank V vehicles. Start accessing top-tier jets/tanks.",
      minLevel: 50,
      maxLevel: 60,
      category: "LEVEL",
      nation: "ANY",
      priceIdr: 24_900, // ~$1.06 — beli ~$0.35, margin ~3x
      stock: [
        "hightier_l50_60_001@mail.test:HighTier50_60!",
        "hightier_l50_60_002@mail.test:HighTier50_60!",
        "hightier_l50_60_003@mail.test:HighTier50_60!",
      ],
    },
    {
      slug: "wt-hightier-51-100",
      titleId: "High-Tier Flex — Level 51–100",
      titleEn: "High-Tier Flex — Level 51–100",
      descId: "Level 51–100 random. Bisa dapat level 80+. Value for money.",
      descEn: "Random level 51–100. Chance to get 80+. Best value for money.",
      minLevel: 51,
      maxLevel: 100,
      category: "LEVEL",
      nation: "ANY",
      priceIdr: 29_900, // ~$1.27 — beli ~$0.45, margin ~2.8x
      stock: [
        "hightier_l51_100_001@mail.test:HighTierFlex!",
        "hightier_l51_100_002@mail.test:HighTierFlex!",
        "hightier_l51_100_003@mail.test:HighTierFlex!",
      ],
    },

    // ===== PREMIUM TIER (Rp 40.000 - 70.000) =====
    {
      slug: "wt-top-tier-60-70",
      titleId: "Top-Tier Ready — Level 60–70",
      titleEn: "Top-Tier Ready — Level 60–70",
      descId: "Level 60–70. Full rank V-VI access. Siap modern MBT & supersonic jets.",
      descEn: "Level 60–70. Full rank V-VI access. Ready for modern MBTs & supersonic jets.",
      minLevel: 60,
      maxLevel: 70,
      category: "LEVEL",
      nation: "ANY",
      priceIdr: 39_900, // ~$1.70 — beli ~$0.55, margin ~3.1x
      stock: [
        "toptier_l60_70_001@mail.test:TopTier60_70!",
        "toptier_l60_70_002@mail.test:TopTier60_70!",
        "toptier_l60_70_003@mail.test:TopTier60_70!",
      ],
    },
    {
      slug: "wt-top-tier-70-80",
      titleId: "Near Max — Level 70–80",
      titleEn: "Near Max — Level 70–80",
      descId: "Level 70–80. Hampir max level. Semua tree terbuka. Grind RP bonus maksimal.",
      descEn: "Level 70–80. Near max level. All trees open. Max RP bonus grinding.",
      minLevel: 70,
      maxLevel: 80,
      category: "LEVEL",
      nation: "ANY",
      priceIdr: 54_900, // ~$2.34 — beli ~$0.95, margin ~2.5x
      stock: [
        "nearmx_l70_80_001@mail.test:NearMax70_80!",
        "nearmx_l70_80_002@mail.test:NearMax70_80!",
        "nearmx_l70_80_003@mail.test:NearMax70_80!",
      ],
    },

    // ===== ELITE / GIFT TIER (Rp 75.000 - 120.000) =====
    {
      slug: "wt-gaijin-80-gift3",
      titleId: "[Gaijin] Elite Account — Level 80 + 3 Gifts",
      titleEn: "[Gaijin] Elite Account — Level 80 + 3 Gifts",
      descId: "Akun Gaijin resmi level 80 + 3 premium gift. Status clean, no warnings.",
      descEn: "Official Gaijin account level 80 + 3 premium gifts. Clean status, no warnings.",
      minLevel: 80,
      maxLevel: 80,
      category: "GIFT",
      nation: "ANY",
      priceIdr: 79_900, // ~$3.40 — beli ~$1.30, margin ~2.6x
      stock: [
        "gaijin_elite_l80_001@mail.test:GaijinElite80!",
        "gaijin_elite_l80_002@mail.test:GaijinElite80!",
      ],
    },
    {
      slug: "wt-gaijin-90-gift3",
      titleId: "[Gaijin] Veteran Account — Level 90 + 3 Gifts",
      titleEn: "[Gaijin] Veteran Account — Level 90 + 3 Gifts",
      descId: "Akun Gaijin veteran level 90 + 3 gift. Dekat max, histori bersih.",
      descEn: "Gaijin veteran account level 90 + 3 gifts. Near max, clean history.",
      minLevel: 90,
      maxLevel: 90,
      category: "GIFT",
      nation: "ANY",
      priceIdr: 99_900, // ~$4.25 — beli ~$1.50, margin ~2.8x
      stock: [
        "gaijin_vet_l90_001@mail.test:GaijinVet90!",
        "gaijin_vet_l90_002@mail.test:GaijinVet90!",
      ],
    },
    {
      slug: "wt-gaijin-100-gift3",
      titleId: "[Gaijin] MAX Account — Level 100 + 3 Gifts",
      titleEn: "[Gaijin] MAX Account — Level 100 + 3 Gifts",
      descId: "AKUN TERBAIK: Level 100 MAX + 3 premium gift. Semua vehicle terbuka. Instant end-game.",
      descEn: "BEST ACCOUNT: Max level 100 + 3 premium gifts. All vehicles unlocked. Instant end-game.",
      minLevel: 100,
      maxLevel: 100,
      category: "GIFT",
      nation: "ANY",
      priceIdr: 129_900, // ~$5.53 — beli ~$2.00, margin ~2.7x
      stock: [
        "gaijin_max_l100_001@mail.test:GaijinMax100!",
        "gaijin_max_l100_002@mail.test:GaijinMax100!",
      ],
    },

    // ===== RANK / TIER SPECIFIC (Rp 40.000 - 60.000) =====
    {
      slug: "wt-rank-10-0-tank",
      titleId: "WT Rank 10.0 Tank",
      titleEn: "WT Rank 10.0 Tank",
      descId: "Akun War Thunder tanpa email access. Rank 10.0 tank — full end-game MBT access. Siap battle modern.",
      descEn: "War Thunder account without email access. Rank 10.0 tank — full end-game MBT access. Ready for modern battles.",
      minRank: 10,
      maxRank: 10,
      category: "RANK",
      nation: "ANY",
      priceIdr: 40_000, // ~$2.22 — beli ~$1.00, margin ~2.2x
      stock: [
        "rank10_tank_001@noemail.test:Rank10Tank!",
        "rank10_tank_002@noemail.test:Rank10Tank!",
        "rank10_tank_003@noemail.test:Rank10Tank!",
        "rank10_tank_004@noemail.test:Rank10Tank!",
        "rank10_tank_005@noemail.test:Rank10Tank!",
      ],
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

  console.log("Seed OK");
  console.log(`Admin: ${email} / ${password}`);
  console.log(`Products: ${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });