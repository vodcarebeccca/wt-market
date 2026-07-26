import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPaidTransactionStatus,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { markOrderPaidAndDeliver } from "@/lib/delivery";

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const orderId = String(body.order_id || "");
  const statusCode = String(body.status_code || "");
  const grossAmount = String(body.gross_amount || "");
  const signatureKey = String(body.signature_key || "");
  const transactionStatus = String(body.transaction_status || "");
  const fraudStatus = String(body.fraud_status || "");
  const transactionId = body.transaction_id ? String(body.transaction_id) : undefined;

  if (!orderId || !signatureKey) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const valid = verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
  });

  if (!valid) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ midtransOrderId: orderId }, { code: orderId }],
    },
  });

  if (!order) {
    // Acknowledge to stop retries for unknown ids
    return NextResponse.json({ message: "Order not found" }, { status: 200 });
  }

  if (isPaidTransactionStatus(transactionStatus, fraudStatus)) {
    await markOrderPaidAndDeliver({
      orderId: order.id,
      provider: "MIDTRANS",
      providerRef: transactionId,
      amountIdr: Math.round(Number(grossAmount)) || order.totalIdr,
      rawNotification: JSON.stringify(body),
    });
  } else if (["deny", "cancel", "expire"].includes(transactionStatus)) {
    if (order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: transactionStatus === "expire" ? "EXPIRED" : "FAILED",
        },
      });
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "MIDTRANS",
          providerRef: transactionId,
          amountIdr: order.totalIdr,
          status: "FAIL",
          rawNotification: JSON.stringify(body),
        },
      });
    }
  } else {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "MIDTRANS",
        providerRef: transactionId,
        amountIdr: order.totalIdr,
        status: "PENDING",
        rawNotification: JSON.stringify(body),
      },
    });
  }

  return NextResponse.json({ message: "OK" });
}
