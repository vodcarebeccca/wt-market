"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateOrderCode } from "@/lib/order-code";
import { createSnapTransaction, hasValidMidtransKeys } from "@/lib/midtrans";

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
      snapToken: string | null;
      redirectUrl: string | null;
      manualPay: boolean;
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

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    include: {
      _count: { select: { stockItems: { where: { status: "AVAILABLE" } } } },
    },
  });

  if (!product || !product.isActive) {
    return { ok: false, error: "Product not found" };
  }
  if (product._count.stockItems < 1) {
    return { ok: false, error: "Out of stock" };
  }

  const code = generateOrderCode();
  const accessToken = generateAccessToken();
  const title = parsed.data.locale === "en" ? product.titleEn : product.titleId;

  const order = await prisma.order.create({
    data: {
      code,
      accessToken,
      buyerEmail: parsed.data.buyerEmail || null,
      buyerWhatsapp: parsed.data.buyerWhatsapp || null,
      locale: parsed.data.locale,
      status: "PENDING",
      totalIdr: product.priceIdr,
      midtransOrderId: code,
      items: {
        create: {
          productId: product.id,
          productTitle: title,
          unitPriceIdr: product.priceIdr,
          quantity: 1,
        },
      },
    },
  });

  let snapToken: string | null = null;
  let redirectUrl: string | null = null;
  let manualPay = false;

  if (hasValidMidtransKeys()) {
    try {
      const snap = await createSnapTransaction({
        orderId: code,
        amountIdr: product.priceIdr,
        itemName: title,
        customerEmail: parsed.data.buyerEmail,
        customerPhone: parsed.data.buyerWhatsapp,
      });
      snapToken = snap.token;
      redirectUrl = snap.redirectUrl;
      await prisma.order.update({
        where: { id: order.id },
        data: { midtransSnapToken: snapToken },
      });
    } catch (err) {
      console.error("Midtrans create failed", err);
      manualPay = true;
    }
  } else {
    manualPay = true;
  }

  return {
    ok: true,
    orderCode: code,
    accessToken,
    snapToken,
    redirectUrl,
    manualPay,
  };
}
