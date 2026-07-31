import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cron job: runs every 5 minutes to release stale reservations
export const schedule = "every 5 minutes";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const CUTOFF_MINUTES = 30;
    const cutoff = new Date(Date.now() - CUTOFF_MINUTES * 60 * 1000);

    // Find all RESERVED stock items linked to stale PENDING orders
    const staleReservedStocks = await prisma.stockItem.findMany({
      where: {
        status: "RESERVED",
        orderItem: {
          order: {
            status: "PENDING",
            createdAt: { lt: cutoff },
          },
        },
      },
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    // Group by order to release stock and mark orders
    const orderMap = new Map<string, typeof staleReservedStocks>();
    for (const stock of staleReservedStocks) {
      const oid = stock.orderItem!.orderId;
      if (!orderMap.has(oid)) {
        orderMap.set(oid, []);
      }
      orderMap.get(oid)!.push(stock);
    }

    let processedCount = 0;

    for (const [orderId, stocks] of orderMap) {
      // Release stock back to AVAILABLE
      await prisma.stockItem.updateMany({
        where: {
          id: { in: stocks.map((s) => s.id) },
        },
        data: {
          status: "AVAILABLE",
          orderItemId: null,
        },
      });
      processedCount++;

      // Mark the order as FAILED
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({
      ok: true,
      processedOrders: processedCount,
      releasedStockItems: staleReservedStocks.length,
    });
  } catch (err) {
    console.error("Cron release-stale-reservations failed", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
