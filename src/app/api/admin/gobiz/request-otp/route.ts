/**
 * POST /api/admin/gobiz/request-otp
 *
 * Request OTP via email untuk login GoBiz.
 * Mengirim OTP ke email yang terdaftar di env GOBIZ_EMAIL.
 * Mengembalikan otp_token yang dipakai di step verify.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const BASE_URL = "https://api.gobiz.co.id";
const CLIENT_ID = "go-biz-web-new";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const emailToUse = email || process.env.GOBIZ_EMAIL || "";

  if (!emailToUse) {
    return NextResponse.json(
      { error: "GOBIZ_EMAIL tidak diatur di env vars" },
      { status: 400 },
    );
  }

  const uniqueId = randomUUID();

  try {
    const res = await fetch(`${BASE_URL}/goid/login/request`, {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "id",
        "authentication-type": "go-id",
        "content-type": "application/json",
        "gojek-country-code": "ID",
        "gojek-timezone": "Asia/Jakarta",
        "x-appid": CLIENT_ID,
        "x-platform": "Web",
        "x-uniqueid": uniqueId,
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        email: emailToUse,
      }),
    });

    const data = (await res.json()) as {
      errors?: Array<{ message: string }>;
      data?: { otp_token?: string };
    };

    if (!res.ok || data.errors?.length) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "Gagal request OTP" },
        { status: res.ok ? 400 : res.status },
      );
    }

    // Simpan uniqueId sementara di env (untuk step verify)
    // Karena Next.js stateless, uniqueId di-pass dari client
    return NextResponse.json({
      ok: true,
      otpToken: data.data?.otp_token,
      uniqueId,
      message: `OTP dikirim ke ${emailToUse}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Request OTP gagal: ${err}` },
      { status: 500 },
    );
  }
}
