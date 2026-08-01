"use server";

import { z } from "zod";
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

  try {
    await createReview(parsed.data);
    return { ok: true };
  } catch (error) {
    console.error("Review submission error:", error);
    return { ok: false, error: "Failed to submit review" };
  }
}