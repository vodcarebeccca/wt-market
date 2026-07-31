import { prisma } from "./prisma";

/**
 * Internal helper: assign stock items to order lines and update order status.
 * Shared by deliverOrder and markOrderPaidAndDeliver.
 */
async function assignStockAndFinalize(
  tx: Parameters<typeof prisma.$transaction>[0] extends (tx: infer T) => any ? T : never,
  order: { id: string; status: string; paidAt?: Date | null; adminNote?: string | null },
  items: Array<{ id: string; productId: string }>,
  now: Date,
): Promise<{ ok: boolean; status: string; message: string }> {
  let allAssigned = true;
  const notes: string[] = [];

  for (const item of items) {
    const existing = await tx.stockItem.findFirst({
      where: { orderItemId: item.id },
    });
    if (existing) {
      if (existing.status === "RESERVED") {
        await tx.stockItem.update({
          where: { id: existing.id },
          data: { status: "SOLD", soldAt: now },
        });
      }
      continue;
    }

    const stock = await tx.stockItem.findFirst({
      where: { productId: item.productId, status: "AVAILABLE" },
      orderBy: { createdAt: "asc" },
    });

    if (!stock) {
      allAssigned = false;
      notes.push(`OUT_OF_STOCK product=${item.productId}`);
      continue;
    }

    await tx.stockItem.update({
      where: { id: stock.id },
      data: { status: "SOLD", orderItemId: item.id, soldAt: now },
    });
  }

  if (allAssigned) {
    await tx.order.update({
      where: { id: order.id },
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
    where: { id: order.id },
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
}

/**
 * Atomic delivery: for each order line, assign one AVAILABLE stock item.
 * Idempotent if already DELIVERED.
 * Accepts PAID or PENDING status.
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
    return assignStockAndFinalize(tx, order, order.items, now);
  });
}

export async function markOrderPaidAndDeliver(input: {
  orderId: string;
  provider: "MIDTRANS" | "MANUAL";
  providerRef?: string;
  amountIdr?: number;
  rawNotification?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      return { ok: false, message: "Order not found", status: "NOT_FOUND" };
    }

    if (order.status === "DELIVERED") {
      return { ok: true, message: "Already delivered", status: "DELIVERED" };
    }

    const now = new Date();

    // Atomically update status to PAID if still PENDING or FAILED
    if (order.status === "PENDING" || order.status === "FAILED") {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: now },
      });
    }

    // Deduplicate payment by providerRef to prevent double payment records
    if (input.providerRef) {
      const existingPayment = await tx.payment.findFirst({
        where: {
          orderId: order.id,
          providerRef: input.providerRef,
        },
      });
      if (!existingPayment) {
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
      }
    } else {
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
    }

    return assignStockAndFinalize(tx, order, order.items, now);
  });
}
