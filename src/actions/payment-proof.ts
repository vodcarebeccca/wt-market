"use server";

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadPaymentProof(
  formData: FormData,
): Promise<{ ok: true; proofUrl: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  const orderCode = String(formData.get("orderCode") || "");
  const accessToken = String(formData.get("accessToken") || "");

  if (!file || !(file instanceof File)) {
    return { ok: false, error: "No file uploaded" };
  }

  if (!orderCode || !accessToken) {
    return { ok: false, error: "Invalid order" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Invalid file type. Use PNG, JPEG, WebP, or GIF." };
  }

  if (file.size > MAX_SIZE) {
    return { ok: false, error: "File too large. Max 5MB." };
  }

  // Validate order
  const order = await prisma.order.findUnique({ where: { code: orderCode } });
  if (!order || order.accessToken !== accessToken) {
    return { ok: false, error: "Order not found" };
  }

  if (order.status !== "PENDING") {
    return { ok: false, error: "Order is not pending payment" };
  }

  // Save file
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `payment-${nanoid(12)}.${ext}`;
  const uploadsDir = join(process.cwd(), "public", "uploads", "payments");

  await mkdir(uploadsDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(join(uploadsDir, filename), buffer);

  const proofUrl = `/uploads/payments/${filename}`;

  // Create payment record
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "QRIS",
      providerRef: `proof:${filename}`,
      amountIdr: order.totalIdr,
      status: "PENDING",
      rawNotification: JSON.stringify({ proofUrl }),
    },
  });

  // Update admin note
  const note = order.adminNote
    ? `${order.adminNote} | [Bukti bayar diupload]`
    : "[Bukti bayar diupload]";
  await prisma.order.update({
    where: { id: order.id },
    data: { adminNote: note },
  });

  return { ok: true, proofUrl };
}