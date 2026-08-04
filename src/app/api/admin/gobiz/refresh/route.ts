/**
 * POST /api/admin/gobiz/refresh
 *
 * Force-refresh the GoBiz access token via refresh_token grant.
 * Only works when config is DB-backed (has refresh_token).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGoBizStatus } from "@/lib/gobiz";

const BASE_URL = "https://api.gobiz.co.id";
const CLIENT_ID = "go-biz-web-new";

export async function POST() {
  const config = await prisma.goBizConfig.findFirst();

  if (!config) {
    return NextResponse.json(
      { error: "GoBiz belum dikonfigurasi. Login dulu via OTP." },
      { status: 400 },
    );
  }

  if (!config.refreshToken) {
    return NextResponse.json(
      { error: "Tidak ada refresh_token. Silakan login ulang via OTP." },
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
        "x-uniqueid": config.uniqueId || "wt-market-auto-detect",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: config.refreshToken,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Refresh gagal (HTTP ${res.status}): ${text}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      return NextResponse.json(
        { error: "Tidak ada access_token di response refresh" },
        { status: 500 },
      );
    }

    await prisma.goBizConfig.update({
      where: { id: config.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || config.refreshToken,
        expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      status: await getGoBizStatus(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Refresh error: ${err}` },
      { status: 500 },
    );
  }
}
