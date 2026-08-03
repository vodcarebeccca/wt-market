/**
 * Test GoBiz token refresh
 * Usage: npx tsx scripts/gobiz-refresh-test.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = "https://api.gobiz.co.id";
const CLIENT_ID = "go-biz-web-new";

// Manual .env loader
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
loadEnv();

const CACHE_FILE = path.join(process.cwd(), ".gobiz-session.json");

function loadSession() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function gobizHeaders(token?: string, uniqueId?: string): Record<string, string> {
  return {
    "accept": "application/json, text/plain, */*",
    "accept-language": "id",
    "authentication-type": "go-id",
    "authorization": token ? `Bearer ${token}` : "Bearer",
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
    "x-uniqueid": uniqueId || "wt-market-refresh-test",
    "x-user-locale": "en-US",
    "x-user-type": "merchant",
    "referrer": "https://portal.gofoodmerchant.co.id/",
    "origin": "https://portal.gofoodmerchant.co.id",
  };
}

async function testRefreshToken() {
  const session = loadSession();
  const accessToken = session.accessToken || process.env.GOBIZ_ACCESS_TOKEN;
  const refreshToken = process.env.GOBIZ_REFRESH_TOKEN;
  const uniqueId = session.uniqueId || "wt-market-refresh-test";

  if (!refreshToken) {
    console.log("❌ GOBIZ_REFRESH_TOKEN not found in .env");
    return;
  }

  console.log("🔄 Testing refresh token...");
  console.log(`   Refresh token: ${refreshToken.slice(0, 30)}...`);

  // Try OAuth2 refresh_token grant
  const res = await fetch(`${BASE_URL}/goid/token`, {
    method: "POST",
    headers: gobizHeaders(undefined, uniqueId),
    body: JSON.stringify({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json() as any;
  console.log(`HTTP ${res.status}:`, JSON.stringify(data, null, 2));

  if (data.access_token) {
    console.log("\n✅ REFRESH WORKS! No need to re-login with OTP.");
    console.log(`New Access Token: ${data.access_token.slice(0, 40)}...`);
    console.log(`New Refresh Token: ${data.refresh_token?.slice(0, 40) || "N/A"}...`);
    console.log(`Expires In: ${data.expires_in || "N/A"}`);

    // Save to session
    session.accessToken = data.access_token;
    if (data.refresh_token) {
      (session as any).refreshToken = data.refresh_token;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(session, null, 2));
    console.log("\n📋 Run this to update .env:");
    console.log(`   GOBIZ_ACCESS_TOKEN=${data.access_token}`);
    if (data.refresh_token) {
      console.log(`   GOBIZ_REFRESH_TOKEN=${data.refresh_token}`);
    }
  } else if (data.errors?.length) {
    console.log("\n❌ Refresh failed:", data.errors[0]?.message);
    console.log("   You'll need to re-login with OTP when token expires.");
  } else {
    console.log("\n⚠️  Unexpected response — refresh may not be supported.");
  }

  // Also verify if current token is still valid
  if (accessToken) {
    console.log("\n🔍 Checking if current token is still valid...");
    const checkRes = await fetch(`${BASE_URL}/v1/users/me`, {
      method: "GET",
      headers: gobizHeaders(accessToken, uniqueId),
    });
    console.log(`   /v1/users/me → HTTP ${checkRes.status}`);
    if (checkRes.ok) {
      console.log("   ✅ Current token is still valid");
    } else {
      console.log("   ❌ Current token is expired/invalid");
    }
  }
}

testRefreshToken().catch(console.error);