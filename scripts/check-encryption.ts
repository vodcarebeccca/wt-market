import { PrismaClient } from "@prisma/client";
import { isEncrypted, decryptCredential } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.stockItem.findMany({
    select: { id: true, credential: true, status: true },
    take: 10,
  });

  console.log(`Stock items: ${items.length}`);
  for (const it of items) {
    const enc = isEncrypted(it.credential);
    let sample = "—";
    if (enc) {
      try {
        const plain = decryptCredential(it.credential);
        sample = plain.slice(0, 12) + "...";
      } catch (e) {
        sample = `DECRYPT_FAILED: ${(e as Error).message}`;
      }
    }
    console.log(`${it.status.padEnd(10)} encrypted=${enc}  sample=${sample}  rawPrefix=${it.credential.slice(0, 8)}`);
  }
}

main().finally(() => prisma.$disconnect());
