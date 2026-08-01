import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function generateSvg(slug: string, title: string, category: string, level: string, color1: string, color2: string, icon: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0f12"/>
      <stop offset="50%" style="stop-color:#18181b"/>
      <stop offset="100%" style="stop-color:#09090b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <circle cx="400" cy="160" r="220" fill="url(#glow)"/>
  <rect x="0" y="360" width="800" height="90" fill="rgba(0,0,0,0.6)"/>
  <text x="400" y="410" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="bold" fill="url(#accent)">${title}</text>
  <text x="400" y="440" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#a1a1aa">${level}</text>
  <g transform="translate(400,170)" opacity="0.8">
    ${icon}
  </g>
  <text x="400" y="90" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="${color1}" opacity="0.7">${category}</text>
</svg>`;
}

const icons: Record<string, string> = {
  starter: `<rect x="-70" y="-20" width="140" height="20" rx="4" fill="currentColor" opacity="0.4"/>
    <rect x="-50" y="-50" width="100" height="30" rx="6" fill="currentColor" opacity="0.6"/>
    <rect x="-12" y="-70" width="24" height="25" rx="4" fill="currentColor" opacity="0.8"/>
    <circle cx="-55" cy="5" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.5"/>
    <circle cx="55" cy="5" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.5"/>
    <circle cx="-55" cy="5" r="10" fill="currentColor" opacity="0.6"/>
    <circle cx="55" cy="5" r="10" fill="currentColor" opacity="0.6"/>`,
  gift: `<rect x="-60" y="-40" width="120" height="80" rx="8" fill="none" stroke="currentColor" stroke-width="3" opacity="0.5"/>
    <rect x="-60" y="-40" width="120" height="20" rx="8" fill="currentColor" opacity="0.3"/>
    <line x1="-60" y1="0" x2="60" y2="0" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <rect x="-10" y="-20" width="20" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
    <line x1="0" y1="-30" x2="0" y2="30" stroke="currentColor" stroke-width="2" opacity="0.6"/>
    <text x="0" y="55" text-anchor="middle" font-size="40" opacity="0.5">🎁</text>`,
  mid: `<rect x="-80" y="-30" width="160" height="25" rx="5" fill="currentColor" opacity="0.3"/>
    <polygon points="-60,-30 -40,-70 40,-70 60,-30" fill="currentColor" opacity="0.5"/>
    <rect x="-15" y="-85" width="30" height="20" rx="3" fill="currentColor" opacity="0.7"/>
    <circle cx="-65" cy="5" r="32" fill="none" stroke="currentColor" stroke-width="3" opacity="0.4"/>
    <circle cx="65" cy="5" r="32" fill="none" stroke="currentColor" stroke-width="3" opacity="0.4"/>
    <circle cx="-65" cy="5" r="12" fill="currentColor" opacity="0.5"/>
    <circle cx="65" cy="5" r="12" fill="currentColor" opacity="0.5"/>
    <text x="0" y="55" text-anchor="middle" font-size="16" font-weight="bold" opacity="0.6">⚡</text>`,
  high: `<rect x="-90" y="-35" width="180" height="30" rx="6" fill="currentColor" opacity="0.3"/>
    <polygon points="-70,-35 -45,-85 45,-85 70,-35" fill="currentColor" opacity="0.5"/>
    <rect x="-20" y="-100" width="40" height="22" rx="4" fill="currentColor" opacity="0.7"/>
    <circle cx="-75" cy="5" r="35" fill="none" stroke="currentColor" stroke-width="3" opacity="0.4"/>
    <circle cx="75" cy="5" r="35" fill="none" stroke="currentColor" stroke-width="3" opacity="0.4"/>
    <circle cx="-75" cy="5" r="14" fill="currentColor" opacity="0.5"/>
    <circle cx="75" cy="5" r="14" fill="currentColor" opacity="0.5"/>
    <text x="0" y="50" text-anchor="middle" font-size="18" font-weight="bold" opacity="0.6">🔥</text>`,
  top: `<rect x="-100" y="-40" width="200" height="35" rx="8" fill="currentColor" opacity="0.3"/>
    <polygon points="-80,-40 -50,-95 50,-95 80,-40" fill="currentColor" opacity="0.5"/>
    <rect x="-25" y="-115" width="50" height="25" rx="5" fill="currentColor" opacity="0.7"/>
    <circle cx="-85" cy="5" r="38" fill="none" stroke="currentColor" stroke-width="4" opacity="0.4"/>
    <circle cx="85" cy="5" r="38" fill="none" stroke="currentColor" stroke-width="4" opacity="0.4"/>
    <circle cx="-85" cy="5" r="15" fill="currentColor" opacity="0.5"/>
    <circle cx="85" cy="5" r="15" fill="currentColor" opacity="0.5"/>
    <text x="0" y="55" text-anchor="middle" font-size="20" font-weight="bold" opacity="0.6">💎</text>`,
  rank: `<rect x="-100" y="-40" width="200" height="35" rx="8" fill="currentColor" opacity="0.3"/>
    <polygon points="-80,-40 -50,-95 50,-95 80,-40" fill="currentColor" opacity="0.5"/>
    <rect x="-25" y="-115" width="50" height="25" rx="5" fill="currentColor" opacity="0.7"/>
    <circle cx="-85" cy="5" r="38" fill="none" stroke="currentColor" stroke-width="4" opacity="0.4"/>
    <circle cx="85" cy="5" r="38" fill="none" stroke="currentColor" stroke-width="4" opacity="0.4"/>
    <circle cx="-85" cy="5" r="15" fill="currentColor" opacity="0.5"/>
    <circle cx="85" cy="5" r="15" fill="currentColor" opacity="0.5"/>
    <text x="0" y="55" text-anchor="middle" font-size="20" font-weight="bold" opacity="0.6">🎯</text>`,
};

const products: Array<{slug: string; title: string; category: string; level: string; color1: string; color2: string; iconKey: string; imageName: string}> = [
  { slug: "wt-starter-1-100-gift3", title: "STARTER PACK", category: "GIFT", level: "Lv 1–100 · 3 Gifts · All Nations", color1: "#e94560", color2: "#f59e0b", iconKey: "starter", imageName: "wt-starter.svg" },
  { slug: "wt-tundra-11-100-gift", title: "TUNDRA ACCOUNT", category: "GIFT", level: "Lv 11–100 · Gift · All Nations", color1: "#3b82f6", color2: "#06b6d4", iconKey: "gift", imageName: "wt-tundra.svg" },
  { slug: "wt-skip-grind-20-100-gift", title: "SKIP THE GRIND", category: "GIFT", level: "Lv 20–100 · Gift · Rank IV–V Ready", color1: "#8b5cf6", color2: "#d946ef", iconKey: "gift", imageName: "wt-skip-grind.svg" },
  { slug: "wt-midtier-30-40", title: "MID-TIER READY", category: "LEVEL", level: "Lv 30–40 · Rank III–IV · All Nations", color1: "#10b981", color2: "#34d399", iconKey: "mid", imageName: "wt-midtier-30-40.svg" },
  { slug: "wt-midtier-40-50", title: "MID-TIER PLUS", category: "LEVEL", level: "Lv 40–50 · Rank IV · Events Ready", color1: "#14b8a6", color2: "#2dd4bf", iconKey: "mid", imageName: "wt-midtier-40-50.svg" },
  { slug: "wt-hightier-50-60", title: "HIGH-TIER ENTRY", category: "LEVEL", level: "Lv 50–60 · Rank V · Top-Tier Access", color1: "#f97316", color2: "#fb923c", iconKey: "high", imageName: "wt-hightier-50-60.svg" },
  { slug: "wt-hightier-51-100", title: "HIGH-TIER FLEX", category: "LEVEL", level: "Lv 51–100 · Random · Best Value", color1: "#ef4444", color2: "#f87171", iconKey: "high", imageName: "wt-hightier-51-100.svg" },
  { slug: "wt-top-tier-60-70", title: "TOP-TIER READY", category: "LEVEL", level: "Lv 60–70 · Rank V–VI · Modern MBT", color1: "#eab308", color2: "#facc15", iconKey: "top", imageName: "wt-top-tier-60-70.svg" },
  { slug: "wt-top-tier-70-80", title: "NEAR MAX", category: "LEVEL", level: "Lv 70–80 · All Trees · Max RP Bonus", color1: "#a855f7", color2: "#c084fc", iconKey: "top", imageName: "wt-top-tier-70-80.svg" },
  { slug: "wt-rank-10-0-tank", title: "RANK 10.0 TANK", category: "RANK", level: "Rank 10.0 · End-Game MBT · No Email", color1: "#dc2626", color2: "#ef4444", iconKey: "rank", imageName: "wt-rank-10-tank.svg" },
];

async function main() {
  const dir = join(process.cwd(), "public", "images", "products");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (const p of products) {
    const svg = generateSvg(p.slug, p.title, p.category, p.level, p.color1, p.color2, icons[p.iconKey]);
    const filepath = join(dir, p.imageName);
    writeFileSync(filepath, svg);
    const imageUrl = `/images/products/${p.imageName}`;
    await prisma.product.update({ where: { slug: p.slug }, data: { imageUrl } });
    console.log(`✓ ${p.slug} → ${imageUrl}`);
  }

  console.log("\nDone! All 10 products updated with images.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });