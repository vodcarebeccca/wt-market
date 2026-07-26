"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { markOrderPaidAndDeliver } from "@/lib/delivery";
import { prisma } from "@/lib/prisma";

export async function markPaidAction(orderId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  await markOrderPaidAndDeliver({
    orderId,
    provider: "MANUAL",
    providerRef: `manual:${session.email}:${Date.now()}`,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?paid=1`);
}

export async function markFailedAction(orderId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "FAILED" },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}

export async function retryDeliverAction(orderId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { deliverOrder } = await import("@/lib/delivery");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order && (order.status === "PAID" || order.status === "DELIVERED")) {
    if (order.status === "PAID") {
      await deliverOrder(orderId);
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}
