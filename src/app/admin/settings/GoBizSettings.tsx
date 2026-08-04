"use client";

import { useState } from "react";
import { formatIdr } from "@/lib/money";

type Status = {
  configured: boolean;
  valid: boolean;
  expiresAt: string | null;
  email: string | null;
  merchantId: string | null;
  source: "db" | "env" | null;
};

type Props = {
  initialStatus: Status;
};

export function GoBizSettings({ initialStatus }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [otpToken, setOtpToken] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const expiresAt = status.expiresAt
    ? new Date(status.expiresAt).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  async function handleRequestOtp() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gobiz/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal request OTP");

      setOtpToken(data.otpToken);
      setUniqueId(data.uniqueId);
      setOtpRequested(true);
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpToken || !otpCode || !uniqueId) {
      setMessage({ type: "error", text: "OTP token dan kode OTP wajib diisi" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gobiz/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken, otp: otpCode, uniqueId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verify gagal");

      setMessage({
        type: "success",
        text: `✅ Login berhasil! Merchant: ${data.merchantName || data.merchantId}. Auto-refresh aktif.`,
      });
      setOtpRequested(false);
      setOtpToken("");
      setOtpCode("");
      setUniqueId("");
      // Reload status
      const statusRes = await fetch("/api/admin/gobiz/status");
      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gobiz/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refresh gagal");
      setMessage({ type: "success", text: "Token berhasil di-refresh" });
      setStatus(data.status);
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-xl font-semibold">GoBiz (GoPay Merchant) — Auto-Detect Payment</h2>

      {/* Status */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                !status.configured
                  ? "bg-amber-500/20 text-amber-300"
                  : status.valid
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
              }`}
            >
              {!status.configured
                ? "Belum dikonfigurasi"
                : status.valid
                  ? "Aktif"
                  : "Expired"}
            </span>
            {status.source === "env" && (
              <span className="text-xs text-amber-300">(env var — tanpa auto-refresh)</span>
            )}
            {status.source === "db" && (
              <span className="text-xs text-green-300">(database — auto-refresh aktif)</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted">Merchant ID</p>
          <p className="mt-1 font-mono text-sm">{status.merchantId || "-"}</p>
        </div>

        <div>
          <p className="text-sm text-muted">Email</p>
          <p className="mt-1 text-sm">{status.email || "-"}</p>
        </div>

        <div>
          <p className="text-sm text-muted">Token expires</p>
          <p className="mt-1 text-sm">{expiresAt || "-"}</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Action: belum dikonfigurasi — login */}
      {!status.configured && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Login sekali dengan email OTP. Setelah itu, token akan auto-refresh tanpa perlu OTP lagi.
          </p>

          {!otpRequested ? (
            <button onClick={handleRequestOtp} disabled={loading} className="btn btn-primary">
              {loading ? "Mengirim OTP..." : "📧 Kirim OTP ke Email"}
            </button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm">Cek email untuk kode OTP, lalu masukkan di bawah:</p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Kode OTP (6 digit)"
                className="input w-full max-w-xs"
                maxLength={6}
              />
              <div className="flex gap-2">
                <button onClick={handleVerifyOtp} disabled={loading} className="btn btn-primary">
                  {loading ? "Memverifikasi..." : "✅ Verifikasi OTP"}
                </button>
                <button onClick={() => setOtpRequested(false)} className="btn btn-ghost">
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action: sudah dikonfigurasi — refresh / re-login */}
      {status.configured && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {status.source === "db" && (
              <button onClick={handleRefresh} disabled={refreshing} className="btn btn-ghost">
                {refreshing ? "Merefresh..." : "🔄 Refresh Token"}
              </button>
            )}
            <button onClick={handleRequestOtp} disabled={loading} className="btn btn-ghost">
              {loading ? "Mengirim..." : "🔑 Login Ulang (OTP)"}
            </button>
          </div>

          {otpRequested && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm">Masukkan kode OTP yang dikirim ke email:</p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Kode OTP"
                className="input w-full max-w-xs"
                maxLength={6}
              />
              <div className="flex gap-2">
                <button onClick={handleVerifyOtp} disabled={loading} className="btn btn-primary">
                  {loading ? "Memverifikasi..." : "✅ Verifikasi OTP"}
                </button>
                <button onClick={() => setOtpRequested(false)} className="btn btn-ghost">
                  Batal
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted">
            💡 Token tersimpan di database. Cron auto-detect payment akan otomatis refresh token
            sebelum expired. Tidak perlu login ulang kecuali refresh_token juga expired (~30 hari).
          </p>
        </div>
      )}
    </section>
  );
}
