"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createReview } from "@/lib/reviews";

const schema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  buyerEmail: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(3).max(500),
});

export async function submitReview(input: {
  productId: string;
  orderId: string;
  buyerEmail?: string;
  rating: number;
  comment: string;
}) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid review data" };
  }

  // Ownership check: the order must exist, be DELIVERED, and actually contain
  // this product. Prevents rating spam / reviews for products never purchased.
  const order = await prisma.order.findFirst({
    where: {
      id: parsed.data.orderId,
      status: "DELIVERED",
      items: { some: { productId: parsed.data.productId } },
    },
    select: { id: true },
  });

  if (!order) {
    return { ok: false, error: "Review not allowed: order must be delivered and include this product" };
  }

  try {
    await createReview(parsed.data);
    return { ok: true };
  } catch (error) {
    console.error("Review submission error:", error);
    return { ok: false, error: "Failed to submit review" };
  }
}