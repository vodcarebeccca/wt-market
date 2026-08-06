"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { encryptCredential } from "@/lib/crypto";

function parseCredentials(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export async function importStockAction(productId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const paste = String(formData.get("paste") || "");
  const file = formData.get("file");

  let lines = parseCredentials(paste);

  if (file && typeof file !== "string" && "text" in file && file.size > 0) {
    const text = await (file as File).text();
    lines = [...lines, ...parseCredentials(text)];
  }

  // de-dupe within batch
  lines = [...new Set(lines)];

  if (!lines.length) {
    redirect(`/products/${productId}/stock?error=empty`);
  }

  // Encrypt each credential before persisting — DB never stores plaintext.
  await prisma.stockItem.createMany({
    data: lines.map((credential) => ({
      productId,
      credential: encryptCredential(credential),
      status: "AVAILABLE",
    })),
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/stock`);
  redirect(`/products/${productId}/stock?added=${lines.length}`);
}

export async function invalidateStockAction(stockId: string, productId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  await prisma.stockItem.update({
    where: { id: stockId },
    data: { status: "INVALID" },
  });

  revalidatePath(`/products/${productId}/stock`);
  redirect(`/products/${productId}/stock`);
}

export async function deleteStockAction(stockId: string, productId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const item = await prisma.stockItem.findUnique({ where: { id: stockId } });
  if (item && item.status === "AVAILABLE") {
    await prisma.stockItem.delete({ where: { id: stockId } });
  }

  revalidatePath(`/products/${productId}/stock`);
  redirect(`/products/${productId}/stock`);
}
