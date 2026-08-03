/**
 * GoBiz (GoPay Merchant) API client
 *
 * Polls GoPay transaction history to detect incoming payments.
 * Used by the cron job to auto-detect and process payments.
 *
 * API endpoints reverse-engineered from GoBiz web portal.
 */

const ANALYTICS_URL =
  "https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions";

const BASE_URL = "https://api.gobiz.co.id";

export interface GoBizTransaction {
  transaction_id: string;
  gross_amount: number; // in cents (divide by 100)
  transaction_time: string;
  settlement_time?: string;
  payment_type: string;
  status: string;
  order_id?: string;
}

interface AnalyticsResponse {
  transactions?: Array<Record<string, unknown>>;
}

function gobizHeaders(token: string): Record<string, string> {
  return {
    "accept": "application/json, text/plain, */*",
    "accept-language": "id",
    "authentication-type": "go-id",
    "authorization": `Bearer ${token}`,
    "cache-control": "no-cache",
    "content-type": "application/json",
    "gojek-country-code": "ID",
    "gojek-timezone": "Asia/Jakarta",
    "pragma": "no-cache",
    "x-appid": "go-biz-web-dashboard",
    "x-appversion": "platform-v3.113.0-e08d53fa",
    "x-deviceos": "Web",
    "x-phonemake": "Linux 64-bit",
    "x-phonemodel": "Chrome 149.0.0.0 on Linux 64-bit",
    "x-platform": "Web",
    "x-uniqueid": "wt-market-auto-detect",
    "x-user-locale": "en-US",
    "x-user-type": "merchant",
    "referrer": "https://portal.gofoodmerchant.co.id/",
    "origin": "https://portal.gofoodmerchant.co.id",
  };
}

/**
 * Fetch recent transactions from GoPay Merchant analytics API.
 * Returns transactions from the last `days` days.
 */
export async function fetchGoBizTransactions(params: {
  token: string;
  merchantId: string;
  days?: number;
  size?: number;
}): Promise<GoBizTransaction[]> {
  const { token, merchantId, days = 1, size = 50 } = params;

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - days * 86_400_000);

  const url = new URL(ANALYTICS_URL);
  url.searchParams.set("from", "0");
  url.searchParams.set("size", String(size));
  url.searchParams.set(
    "statuses",
    "SETTLEMENT,CAPTURE,REFUND,PARTIAL_REFUND",
  );
  url.searchParams.set(
    "payment_types",
    "QRIS,GOPAY,OFFLINE_CREDIT_CARD,OFFLINE_DEBIT_CARD,CREDIT_CARD",
  );
  url.searchParams.set("start_time", startTime.toISOString());
  url.searchParams.set("end_time", endTime.toISOString());
  url.searchParams.set("merchant_ids", merchantId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: gobizHeaders(token),
  });

  if (!res.ok) {
    console.error(
      `[GoBiz] Analytics API error: HTTP ${res.status} ${res.statusText}`,
    );
    return [];
  }

  const data = (await res.json()) as AnalyticsResponse;

  if (!data.transactions || !Array.isArray(data.transactions)) {
    return [];
  }

  return data.transactions.map((tx) => ({
    transaction_id: tx.transaction_id as string,
    gross_amount: (tx.gross_amount as number) ?? 0,
    transaction_time: tx.transaction_time as string,
    settlement_time: tx.settlement_time as string | undefined,
    payment_type: (tx.payment_type as string) ?? "unknown",
    status: (tx.status as string) ?? "unknown",
    order_id: tx.order_id as string | undefined,
  }));
}

/**
 * Check if the GoBiz token is still valid by calling the user endpoint.
 */
export async function isGoBizTokenValid(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/v1/users/me`, {
      method: "GET",
      headers: gobizHeaders(token),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get the GoBiz token from environment.
 * Returns null if not configured.
 */
export function getGoBizConfig(): {
  token: string;
  merchantId: string;
} | null {
  const token = process.env.GOBIZ_ACCESS_TOKEN;
  const merchantId = process.env.GOBIZ_MERCHANT_ID;

  if (!token || !merchantId) {
    return null;
  }

  return { token, merchantId };
}