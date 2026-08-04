"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateOrderCode } from "@/lib/order-code";

const schema = z.object({
  productId: z.string().min(1),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  buyerWhatsapp: z.string().max(30).optional().or(z.literal("")),
  locale: z.enum(["id", "en"]).default("id"),
  agree: z.literal(true),
});

export type CheckoutResult =
  | {
      ok: true;
      orderCode: string;
      accessToken: string;
    }
  | { ok: false; error: string };

export async function createCheckoutOrder(input: {
  productId: string;
  buyerEmail?: string;
  buyerWhatsapp?: string;
  locale?: string;
  agree: boolean;
}): Promise<CheckoutResult> {
  const parsed = schema.safeParse({
    ...input,
    agree: input.agree === true,
    locale: input.locale === "en" ? "en" : "id",
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid input / risk not accepted" };
  }

  const code = generateOrderCode();
  const accessToken = generateAccessToken();

  // Atomic reserve: cek stok + create order + reserve stock dalam 1 transaksi
  const reserveResult = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: parsed.data.productId },
    });

    if (!product || !product.isActive) {
      return { ok: false as const, error: "Product not found" };
    }

    const title = parsed.data.locale === "en" ? product.titleEn : product.titleId;

    // Cari & kunci 1 stok AVAILABLE
    const stock = await tx.stockItem.findFirst({
      where: {
        productId: parsed.data.productId,
        status: "AVAILABLE",
      },
      orderBy: { createdAt: "asc" },
    });

    if (!stock) {
      return { ok: false as const, error: "Out of stock" };
    }

    // Buat order + order item
    const order = await tx.order.create({
      data: {
        code,
        accessToken,
        buyerEmail: parsed.data.buyerEmail || null,
        buyerWhatsapp: parsed.data.buyerWhatsapp || null,
        locale: parsed.data.locale,
        status: "PENDING",
        totalIdr: product.priceIdr,
      },
    });

    const orderItem = await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        productTitle: title,
        unitPriceIdr: product.priceIdr,
        quantity: 1,
      },
    });

    // Reserve stok — link ke order item
    await tx.stockItem.update({
      where: { id: stock.id },
      data: {
        status: "RESERVED",
        orderItemId: orderItem.id,
      },
    });

    return {
      ok: true as const,
      orderId: order.id,
      orderItemId: orderItem.id,
      orderCode: code,
      accessToken,
      title,
      priceIdr: product.priceIdr,
    };
  });

  if (!reserveResult.ok) {
    return { ok: false, error: reserveResult.error };
  }

  return {
    ok: true,
    orderCode: code,
    accessToken,
  };
}
