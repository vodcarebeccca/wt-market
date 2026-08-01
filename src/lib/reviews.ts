import { prisma } from "./prisma";

export async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductAverageRating(productId: string) {
  const result = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return {
    average: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
    count: result._count.rating,
  };
}

export async function createReview(input: {
  productId: string;
  orderId: string;
  buyerEmail?: string;
  rating: number;
  comment: string;
}) {
  return prisma.review.create({
    data: {
      productId: input.productId,
      orderId: input.orderId,
      buyerEmail: input.buyerEmail,
      rating: input.rating,
      comment: input.comment,
      status: "PENDING",
    },
  });
}