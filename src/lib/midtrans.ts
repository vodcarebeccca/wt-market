import crypto from "crypto";
import midtransClient from "midtrans-client";

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

export function getSnapClient() {
  return new midtransClient.Snap({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
  });
}

export function getCoreApiClient() {
  return new midtransClient.CoreApi({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
  });
}

export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const payload = `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`;
  const expected = crypto.createHash("sha512").update(payload).digest("hex");
  return expected === params.signatureKey;
}

export async function createSnapTransaction(input: {
  orderId: string;
  amountIdr: number;
  itemName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}) {
  const snap = getSnapClient();
  const parameter = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.amountIdr,
    },
    item_details: [
      {
        id: input.orderId,
        price: input.amountIdr,
        quantity: 1,
        name: input.itemName.slice(0, 50),
      },
    ],
    customer_details: {
      email: input.customerEmail || undefined,
      phone: input.customerPhone || undefined,
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/id/order/pending`,
    },
  };

  const result = await snap.createTransaction(parameter);
  return {
    token: result.token as string,
    redirectUrl: result.redirect_url as string,
  };
}

export function isPaidTransactionStatus(transactionStatus: string, fraudStatus?: string) {
  if (transactionStatus === "settlement") return true;
  if (transactionStatus === "capture" && (fraudStatus === "accept" || !fraudStatus)) return true;
  return false;
}

export function hasValidMidtransKeys() {
  const key = process.env.MIDTRANS_SERVER_KEY || "";
  return key.length > 10 && !key.includes("CHANGE_ME");
}
