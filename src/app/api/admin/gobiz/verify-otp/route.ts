/**
 * POST /api/admin/gobiz/verify-otp
 *
 * Verify OTP dan simpan token ke database.
 * Setelah ini, cron auto-refresh berjalan tanpa OTP.
 */

import { NextResponse } from "next/server";
import { saveGoBizConfig } from "@/lib/gobiz";

const BASE_URL = "https://api.gobiz.co.id";
const CLIENT_ID = "go-biz-web-new";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    otpToken: string;
    otp: string;
    uniqueId: string;
    email?: string;
  };

  const { otpToken, otp, uniqueId } = body;
  if (!otpToken || !otp || !uniqueId) {
    return NextResponse.json(
      { error: "otpToken, otp, dan uniqueId wajib diisi" },
      { status: 400 },
    );
  }

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
        "x-uniqueid": uniqueId,
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        grant_type: "otp",
        data: { otp, otp_token: otpToken },
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      errors?: Array<{ message: string }>;
    };

    if (!res.ok || data.errors?.length) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "OTP tidak valid" },
        { status: 400 },
      );
    }

    if (!data.access_token) {
      return NextResponse.json(
        { error: "Tidak ada access_token di response" },
        { status: 500 },
      );
    }

    // Ambil merchant info untuk dapat merchant_id
    const userRes = await fetch(`${BASE_URL}/v1/users/me`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${data.access_token}`,
        "authentication-type": "go-id",
        "gojek-country-code": "ID",
        "gojek-timezone": "Asia/Jakarta",
        "x-appid": CLIENT_ID,
        "x-platform": "Web",
        "x-uniqueid": uniqueId,
      },
    });

    const userData = (await userRes.json()) as {
      user?: { merchant_id?: string; full_name?: string };
    };

    const merchantId = userData.user?.merchant_id;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Tidak bisa ambil merchant_id" },
        { status: 500 },
      );
    }

    // Simpan ke database
    await saveGoBizConfig({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      merchantId,
      expiresInSeconds: data.expires_in || 86400,
      email: body.email || process.env.GOBIZ_EMAIL || undefined,
      uniqueId,
    });

    return NextResponse.json({
      ok: true,
      merchantId,
      merchantName: userData.user?.full_name || null,
      message: "GoBiz config tersimpan. Auto-refresh aktif.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Verify OTP gagal: ${err}` },
      { status: 500 },
    );
  }
}
