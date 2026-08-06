"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { markOrderPaidAndDeliver } from "@/lib/delivery";
import { prisma } from "@/lib/prisma";

export async function markPaidAction(orderId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  await markOrderPaidAndDeliver({
    orderId,
    provider: "MANUAL",
    providerRef: `manual:${session.email}:${Date.now()}`,
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?paid=1`);
}

export async function markFailedAction(orderId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "FAILED" },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}

export async function retryDeliverAction(orderId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const { deliverOrder } = await import("@/lib/delivery");
  // deliverOrder's internal guard already allows PAID / PENDING / FAILED
  await deliverOrder(orderId);

  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}
