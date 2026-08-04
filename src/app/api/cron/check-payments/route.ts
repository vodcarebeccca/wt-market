/**
 * Cron job: Check GoPay Merchant for incoming payments and auto-process them.
 *
 * Runs every 2 minutes via Vercel Cron.
 * Fetches recent GoPay transactions, matches them to PENDING orders by amount,
 * and auto-delivers matching orders.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGoBizTransactions, getGoBizConfig } from "@/lib/gobiz";
import { markOrderPaidAndDeliver } from "@/lib/delivery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getGoBizConfig();
  if (!config) {
    return NextResponse.json({
      ok: false,
      message: "GoBiz not configured",
    });
  }

  try {
    // Fetch recent transactions (last 2 hours to be safe)
    const transactions = await fetchGoBizTransactions({
      token: config.token,
      merchantId: config.merchantId,
      days: 1,
      size: 50,
      uniqueId: config.uniqueId,
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No transactions found",
        processed: 0,
      });
    }

    // Get all PENDING orders with their total amounts
    const pendingOrders = await prisma.order.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        code: true,
        totalIdr: true,
        paidAt: true,
      },
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No pending orders",
        processed: 0,
      });
    }

    // Match transactions to orders by amount
    // GoBiz returns amount in cents (gross_amount), we store in IDR
    const results: Array<{
      orderCode: string;
      amountIdr: number;
      matched: boolean;
      txId?: string;
    }> = [];

    let processed = 0;

    for (const order of pendingOrders) {
      // Find a transaction with matching amount (in IDR)
      const match = transactions.find((tx) => {
        const txAmountIdr = tx.gross_amount; // Analytics API returns in IDR already
        // Match with ±100 tolerance for rounding
        return Math.abs(txAmountIdr - order.totalIdr) <= 100;
      });

      if (match) {
        console.log(
          `[check-payments] Match found: order ${order.code} (Rp ${order.totalIdr}) ↔ tx ${match.transaction_id} (Rp ${match.gross_amount})`,
        );

        try {
          const result = await markOrderPaidAndDeliver({
            orderId: order.id,
            provider: "QRIS",
            providerRef: match.transaction_id,
            amountIdr: order.totalIdr,
            rawNotification: JSON.stringify(match),
          });

          results.push({
            orderCode: order.code,
            amountIdr: order.totalIdr,
            matched: true,
            txId: match.transaction_id,
          });

          if (result.ok) {
            processed++;
          }
        } catch (err) {
          console.error(
            `[check-payments] Failed to process order ${order.code}:`,
            err,
          );
          results.push({
            orderCode: order.code,
            amountIdr: order.totalIdr,
            matched: true,
            txId: match.transaction_id,
          });
        }
      } else {
        results.push({
          orderCode: order.code,
          amountIdr: order.totalIdr,
          matched: false,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Processed ${processed} payments`,
      processed,
      totalTransactions: transactions.length,
      totalPending: pendingOrders.length,
      results,
    });
  } catch (err) {
    console.error("[check-payments] Cron failed:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}