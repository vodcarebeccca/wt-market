/**
 * GoBiz (GoPay Merchant) API client
 *
 * Polls GoPay transaction history to detect incoming payments.
 * Used by the cron job to auto-detect and process payments.
 *
 * Token management:
 * - Tokens are stored in the database (GoBizConfig model).
 * - getValidToken() returns a valid token, auto-refreshing via refresh_token
 *   grant when expired. Falls back to env var (GOBIZ_ACCESS_TOKEN) when
 *   no DB config exists yet (first-run / pre-seed).
 *
 * API endpoints reverse-engineered from GoBiz web portal.
 */

import { prisma } from "./prisma";

const ANALYTICS_URL =
  "https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions";

const BASE_URL = "https://api.gobiz.co.id";
const CLIENT_ID = "go-biz-web-new";

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

function gobizHeaders(token: string, uniqueId?: string): Record<string, string> {
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
    "x-uniqueid": uniqueId || "wt-market-auto-detect",
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
  uniqueId?: string;
}): Promise<GoBizTransaction[]> {
  const { token, merchantId, days = 1, size = 50, uniqueId } = params;

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
    headers: gobizHeaders(token, uniqueId),
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
 * Get the GoBiz config from the database (preferred) or fall back to env vars.
 * Returns null if neither is configured.
 */
export async function getGoBizConfig(): Promise<{
  token: string;
  merchantId: string;
  uniqueId?: string;
} | null> {
  // Prefer DB-stored config (auto-refresh aware)
  const config = await getValidToken();
  if (config) {
    return { token: config.token, merchantId: config.merchantId, uniqueId: config.uniqueId };
  }

  // Fallback: env var (legacy / pre-seed)
  const token = process.env.GOBIZ_ACCESS_TOKEN;
  const merchantId = process.env.GOBIZ_MERCHANT_ID;
  if (token && merchantId) {
    return { token, merchantId };
  }

  return null;
}

/**
 * Get a valid access token, auto-refreshing via refresh_token grant when expired.
 * Falls back to env var if no DB config exists yet.
 */
export async function getValidToken(): Promise<{
  token: string;
  merchantId: string;
  uniqueId?: string;
} | null> {
  try {
    const config = await prisma.goBizConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!config) return null;

    const now = new Date();
    const bufferMs = 60_000; // 1-minute refresh buffer

    if (config.expiresAt.getTime() > now.getTime() + bufferMs) {
      // Token still valid
      return { token: config.accessToken, merchantId: config.merchantId, uniqueId: config.uniqueId || undefined };
    }

    // Token expired — try to refresh
    if (config.refreshToken) {
      const refreshed = await refreshGoBizToken(config);
      if (refreshed) return refreshed;
    }

    // Refresh failed or no refresh token — return stale token anyway
    // (better than nothing; the API call will fail with 401 and alert admin)
    console.warn(
      `[GoBiz] Token expired and refresh failed. Returning stale token.`,
    );
    return { token: config.accessToken, merchantId: config.merchantId, uniqueId: config.uniqueId || undefined };
  } catch (err) {
    console.error("[GoBiz] getValidToken error:", err);
    return null;
  }
}

/**
 * Refresh the access token using the stored refresh_token grant.
 * Saves the new token to the database on success.
 */
async function refreshGoBizToken(config: {
  id: string;
  merchantId: string;
  refreshToken: string | null;
  uniqueId: string | null;
}): Promise<{ token: string; merchantId: string; uniqueId?: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/goid/token`, {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "gojek-country-code": "ID",
        "gojek-timezone": "Asia/Jakarta",
        "x-appid": CLIENT_ID,
        "x-platform": "Web",
        "x-uniqueid": config.uniqueId || "wt-market-auto-detect",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: config.refreshToken,
      }),
    });

    if (!res.ok) {
      console.error(
        `[GoBiz] Refresh token failed: HTTP ${res.status}`,
      );
      return null;
    }

    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      console.error("[GoBiz] No access_token in refresh response");
      return null;
    }

    const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000);

    await prisma.goBizConfig.update({
      where: { id: config.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || config.refreshToken,
        expiresAt,
      },
    });

    console.log("[GoBiz] Token refreshed successfully");
    return {
      token: data.access_token,
      merchantId: "",
      uniqueId: config.uniqueId || undefined,
    };
  } catch (err) {
    console.error("[GoBiz] refreshGoBizToken error:", err);
    return null;
  }
}

/**
 * Save a fresh GoBiz login (after OTP verification) to the database.
 * Replaces any existing config.
 */
export async function saveGoBizConfig(input: {
  accessToken: string;
  refreshToken?: string;
  merchantId: string;
  expiresInSeconds: number;
  email?: string;
  uniqueId?: string;
}): Promise<void> {
  await prisma.goBizConfig.deleteMany();
  await prisma.goBizConfig.create({
    data: {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken || null,
      merchantId: input.merchantId,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
      email: input.email || null,
      uniqueId: input.uniqueId || null,
    },
  });
  console.log("[GoBiz] Config saved to database");
}

/**
 * Get the current GoBiz config status for admin display.
 */
export async function getGoBizStatus(): Promise<{
  configured: boolean;
  valid: boolean;
  expiresAt: string | null;
  email: string | null;
  merchantId: string | null;
  source: "db" | "env" | null;
}> {
  // Check DB first
  const config = await prisma.goBizConfig.findFirst();
  if (config) {
    const now = new Date();
    const valid = config.expiresAt.getTime() > now.getTime();
    return {
      configured: true,
      valid,
      expiresAt: config.expiresAt.toISOString(),
      email: config.email,
      merchantId: config.merchantId,
      source: "db",
    };
  }

  // Fallback to env var
  const token = process.env.GOBIZ_ACCESS_TOKEN;
  const merchantId = process.env.GOBIZ_MERCHANT_ID;
  if (token && merchantId) {
    return {
      configured: true,
      valid: true, // unknown — assume valid
      expiresAt: null,
      email: null,
      merchantId,
      source: "env",
    };
  }

  return {
    configured: false,
    valid: false,
    expiresAt: null,
    email: null,
    merchantId: null,
    source: null,
  };
}
