import { prisma } from "./prisma";

/**
 * Atomic delivery: for each order line, assign one AVAILABLE stock item.
 * Idempotent if already DELIVERED.
 */
export async function deliverOrder(orderId: string): Promise<{
  ok: boolean;
  status: string;
  message: string;
}> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { ok: false, status: "NOT_FOUND", message: "Order not found" };
    }

    if (order.status === "DELIVERED") {
      return { ok: true, status: "DELIVERED", message: "Already delivered" };
    }

    if (order.status !== "PAID" && order.status !== "PENDING") {
      return { ok: false, status: order.status, message: `Cannot deliver status ${order.status}` };
    }

    const now = new Date();
    let allAssigned = true;
    const notes: string[] = [];

    for (const item of order.items) {
      const existing = await tx.stockItem.findFirst({
        where: { orderItemId: item.id },
      });
      if (existing) continue;

      const stock = await tx.stockItem.findFirst({
        where: {
          productId: item.productId,
          status: "AVAILABLE",
        },
        orderBy: { createdAt: "asc" },
      });

      if (!stock) {
        allAssigned = false;
        notes.push(`OUT_OF_STOCK product=${item.productId}`);
        continue;
      }

      await tx.stockItem.update({
        where: { id: stock.id },
        data: {
          status: "SOLD",
          orderItemId: item.id,
          soldAt: now,
        },
      });
    }

    if (allAssigned) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          paidAt: order.paidAt ?? now,
          deliveredAt: now,
          adminNote: order.adminNote,
        },
      });
      return { ok: true, status: "DELIVERED", message: "Delivered" };
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: order.paidAt ?? now,
        adminNote: [...(order.adminNote ? [order.adminNote] : []), ...notes].join(" | "),
      },
    });

    return {
      ok: false,
      status: "PAID",
      message: "Paid but stock insufficient — needs admin",
    };
  });
}

export async function markOrderPaidAndDeliver(input: {
  orderId: string;
  provider: "MIDTRANS" | "MANUAL";
  providerRef?: string;
  amountIdr?: number;
  rawNotification?: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    return { ok: false, message: "Order not found" };
  }

  if (order.status === "DELIVERED") {
    return { ok: true, message: "Already delivered", status: "DELIVERED" };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (order.status === "PENDING" || order.status === "FAILED") {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: now },
      });
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: input.provider,
        providerRef: input.providerRef,
        amountIdr: input.amountIdr ?? order.totalIdr,
        status: "SUCCESS",
        rawNotification: input.rawNotification,
      },
    });
  });

  return deliverOrder(order.id);
}
