import { PrismaClient } from "@prisma/client";
import { encryptCredential, isEncrypted } from "../src/lib/crypto";

const prisma = new PrismaClient();

// One-time migration: encrypt any plaintext credentials already stored in the DB.
// Run with: npx tsx --env-file=.env scripts/encrypt-credentials.ts
async function main() {
  const all = await prisma.stockItem.findMany({
    select: { id: true, credential: true },
  });

  let encrypted = 0;
  let alreadyEncrypted = 0;

  for (const item of all) {
    if (isEncrypted(item.credential)) {
      alreadyEncrypted++;
      continue;
    }
    await prisma.stockItem.update({
      where: { id: item.id },
      data: { credential: encryptCredential(item.credential) },
    });
    encrypted++;
  }

  console.log(`Total stock items: ${all.length}`);
  console.log(`Encrypted now: ${encrypted}`);
  console.log(`Already encrypted: ${alreadyEncrypted}`);
}

main().finally(() => prisma.$disconnect());
