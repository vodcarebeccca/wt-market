import { prisma } from "./prisma";

export async function validateDiscountCode(code: string, totalIdr: number) {
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount) {
    return { valid: false, message: "Invalid discount code" };
  }

  if (!discount.isActive) {
    return { valid: false, message: "Discount code is inactive" };
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return { valid: false, message: "Discount code has expired" };
  }

  if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
    return { valid: false, message: "Discount code usage limit reached" };
  }

  if (totalIdr < discount.minPurchaseIdr) {
    return { valid: false, message: `Minimum purchase of Rp ${discount.minPurchaseIdr.toLocaleString("id-ID")} required` };
  }

  let discountAmount = 0;
  if (discount.type === "PERCENT") {
    discountAmount = Math.round(totalIdr * discount.value / 100);
    if (discount.maxDiscountIdr != null && discountAmount > discount.maxDiscountIdr) {
      discountAmount = discount.maxDiscountIdr;
    }
  } else {
    discountAmount = discount.value;
  }

  if (discountAmount > totalIdr) {
    discountAmount = totalIdr;
  }

  return {
    valid: true,
    discountId: discount.id,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    discountAmount,
    finalTotal: totalIdr - discountAmount,
  };
}

export async function applyDiscountCode(code: string) {
  return prisma.discountCode.update({
    where: { code: code.toUpperCase() },
    data: { usedCount: { increment: 1 } },
  });
}