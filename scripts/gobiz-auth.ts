/**
 * GoBiz Auth — request OTP via email, verify, get merchant info
 * Usage: npx tsx scripts/gobiz-auth.ts email-request
 *        npx tsx scripts/gobiz-auth.ts verify <OTP_TOKEN> <OTP_CODE>
 */

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = "https://api.gobiz.co.id";
const CLIENT_ID = "go-biz-web-new";
const EMAIL = "vodcarebecca@gmail.com";

const CACHE_FILE = path.join(process.cwd(), ".gobiz-session.json");

function loadSession(): { uniqueId: string; otpToken?: string } {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch {}
  return { uniqueId: randomUUID() };
}

function saveSession(data: Record<string, unknown>) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
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
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-appid": "go-biz-web-dashboard",
    "x-appversion": "platform-v3.113.0-e08d53fa",
    "x-deviceos": "Web",
    "x-phonemake": "Linux 64-bit",
    "x-phonemodel": "Chrome 149.0.0.0 on Linux 64-bit",
    "x-platform": "Web",
    "x-uniqueid": uniqueId || randomUUID(),
    "x-user-locale": "en-US",
    "x-user-type": "merchant",
    "referrer": "https://portal.gofoodmerchant.co.id/",
    "origin": "https://portal.gofoodmerchant.co.id",
  };
}

async function requestEmailOtp() {
  const session = loadSession();
  const uniqueId = session.uniqueId;
  saveSession(session);

  console.log(`📧 Requesting OTP via email: ${EMAIL}`);

  const res = await fetch(`${BASE_URL}/goid/login/request`, {
    method: "POST",
    headers: gobizHeaders(undefined, uniqueId),
    body: JSON.stringify({
      client_id: CLIENT_ID,
      email: EMAIL,
    }),
  });

  const data = await res.json() as any;
  console.log("Response:", JSON.stringify(data, null, 2));

  if (data.errors?.length) {
    console.error("❌ Error:", data.errors[0]?.message);
    return;
  }

  const otpToken = data.data?.otp_token;
  if (otpToken) {
    session.otpToken = otpToken;
    saveSession(session);
    console.log(`\n✅ OTP sent to email! Check your inbox.`);
    console.log(`\nThen run: npx tsx scripts/gobiz-auth.ts verify ${otpToken} <OTP_CODE>`);
  }
}

async function requestPhoneOtp() {
  const session = loadSession();
  const uniqueId = session.uniqueId;
  saveSession(session);

  const phone = "85767503449";
  console.log(`📱 Requesting OTP via phone: 62${phone}`);

  const res = await fetch(`${BASE_URL}/goid/login/request`, {
    method: "POST",
    headers: gobizHeaders(undefined, uniqueId),
    body: JSON.stringify({
      client_id: CLIENT_ID,
      phone_number: phone,
      country_code: "62",
    }),
  });

  const data = await res.json() as any;
  console.log("Response:", JSON.stringify(data, null, 2));

  if (data.errors?.length) {
    console.error("❌ Error:", data.errors[0]?.message);
    return;
  }

  const otpToken = data.data?.otp_token;
  if (otpToken) {
    session.otpToken = otpToken;
    saveSession(session);
    console.log(`\n✅ OTP sent! Check your SMS/WhatsApp.`);
    console.log(`\nThen run: npx tsx scripts/gobiz-auth.ts verify ${otpToken} <OTP_CODE>`);
  }
}

async function verifyOtp(otpToken: string, otp: string) {
  const session = loadSession();
  const uniqueId = session.uniqueId;

  console.log(`🔐 Verifying OTP: ${otp}...`);

  const res = await fetch(`${BASE_URL}/goid/token`, {
    method: "POST",
    headers: gobizHeaders(undefined, uniqueId),
    body: JSON.stringify({
      client_id: CLIENT_ID,
      grant_type: "otp",
      data: { otp, otp_token: otpToken },
    }),
  });

  const data = await res.json() as any;
  console.log("Response:", JSON.stringify(data, null, 2));

  if (data.access_token) {
    console.log("\n✅ LOGIN SUCCESS!");
    console.log(`Access Token: ${data.access_token}`);
    console.log(`Refresh Token: ${data.refresh_token}`);
    console.log(`Expires In: ${data.expires_in}s`);

    session.otpToken = undefined;
    (session as any).accessToken = data.access_token;
    saveSession(session);

    await getMerchantInfo(data.access_token, uniqueId);
  } else if (data.errors?.length) {
    console.error("❌ Error:", data.errors[0]?.message);
  }
}

async function getMerchantInfo(token: string, uniqueId: string) {
  console.log("\n🏪 Fetching merchant info...");

  const res = await fetch(`${BASE_URL}/v1/users/me`, {
    method: "GET",
    headers: gobizHeaders(token, uniqueId),
  });

  const data = await res.json() as any;
  console.log("Merchant:", JSON.stringify(data, null, 2));

  if (data.user?.merchant_id) {
    console.log(`\n✅ Merchant ID: ${data.user.merchant_id}`);
    console.log(`   Name: ${data.user.full_name || "N/A"}`);
    console.log(`\n📋 Add these to .env:`);
    console.log(`   GOBIZ_ACCESS_TOKEN=${token}`);
    console.log(`   GOBIZ_MERCHANT_ID=${data.user.merchant_id}`);
  }
}

// Main
const cmd = process.argv[2];

if (cmd === "email-request") {
  requestEmailOtp().catch(console.error);
} else if (cmd === "phone-request") {
  requestPhoneOtp().catch(console.error);
} else if (cmd === "verify") {
  const otpToken = process.argv[3];
  const otp = process.argv[4];
  if (!otpToken || !otp) {
    console.log("Usage: npx tsx scripts/gobiz-auth.ts verify <OTP_TOKEN> <OTP_CODE>");
    process.exit(1);
  }
  verifyOtp(otpToken, otp).catch(console.error);
} else {
  console.log("Usage:");
  console.log("  npx tsx scripts/gobiz-auth.ts email-request");
  console.log("  npx tsx scripts/gobiz-auth.ts phone-request");
  console.log("  npx tsx scripts/gobiz-auth.ts verify <OTP_TOKEN> <OTP_CODE>");
}