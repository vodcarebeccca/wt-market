import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

async function main() {
  const srcDir = join(process.cwd(), "public", "images", "products");
  const outDir = join(srcDir, "thumb");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".jpg"));
  console.log("Found " + files.length + " jpg files");

  for (const file of files) {
    const input = join(srcDir, file);
    const output = join(outDir, file.replace(".jpg", ".webp"));
    await sharp(input).resize(800, 450, { fit: "cover" }).webp({ quality: 80 }).toFile(output);
    console.log("✓ " + file + " → " + output);
  }
  console.log("Done!");
}

main().catch((e) => { console.error(e); process.exit(1); });