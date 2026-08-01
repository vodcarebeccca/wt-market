import sharp from "sharp";
import { join } from "path";

async function main() {
  const src = join(process.cwd(), "public", "images", "products", "wt-jet-aircraft.jpg");
  const out = join(process.cwd(), "public", "images", "products", "thumb", "wt-jet-aircraft.webp");
  await sharp(src).resize(800, 450, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
  console.log("✓ " + out);
}

main().catch((e) => { console.error(e); process.exit(1); });