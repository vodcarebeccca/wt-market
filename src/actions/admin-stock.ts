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
  if (!session) redirect("/admin/login");

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
    redirect(`/admin/products/${productId}/stock?error=empty`);
  }

  // Encrypt each credential before persisting — DB never stores plaintext.
  await prisma.stockItem.createMany({
    data: lines.map((credential) => ({
      productId,
      credential: encryptCredential(credential),
      status: "AVAILABLE",
    })),
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/stock`);
  revalidatePath("/id/catalog");
  revalidatePath("/en/catalog");
  redirect(`/admin/products/${productId}/stock?added=${lines.length}`);
}

export async function invalidateStockAction(stockId: string, productId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  await prisma.stockItem.update({
    where: { id: stockId },
    data: { status: "INVALID" },
  });

  revalidatePath(`/admin/products/${productId}/stock`);
  redirect(`/admin/products/${productId}/stock`);
}

export async function deleteStockAction(stockId: string, productId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const item = await prisma.stockItem.findUnique({ where: { id: stockId } });
  if (item && item.status === "AVAILABLE") {
    await prisma.stockItem.delete({ where: { id: stockId } });
  }

  revalidatePath(`/admin/products/${productId}/stock`);
  redirect(`/admin/products/${productId}/stock`);
}
