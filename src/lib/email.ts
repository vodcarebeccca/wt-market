/**
 * Email notification utility.
 *
 * Configure by setting the following environment variables:
 *   RESEND_API_KEY  — Resend API key (https://resend.com)
 *   EMAIL_FROM      — Sender email (default: "WT Market <noreply@wtmarket.local>")
 *
 * If RESEND_API_KEY is not set, email will be logged to console instead.
 */

const EMAIL_FROM = process.env.EMAIL_FROM || "WT Market <noreply@wtmarket.local>";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[EMAIL] (no API key — log only)", {
      to: payload.to,
      subject: payload.subject,
    });
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL] Resend API error:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Send failed:", error);
    return false;
  }
}

export function orderConfirmationEmail(params: {
  orderCode: string;
  totalIdr: number;
  locale: string;
}) {
  const isId = params.locale === "id";
  return {
    subject: isId
      ? `WT Market — Order #${params.orderCode}`
      : `WT Market — Order #${params.orderCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${isId ? "Order Diterima" : "Order Received"}</h2>
        <p>${isId ? "Kode order:" : "Order code:"} <strong>${params.orderCode}</strong></p>
        <p>${isId ? "Total:" : "Total:"} <strong>Rp ${params.totalIdr.toLocaleString("id-ID")}</strong></p>
        <p>${isId ? "Silakan selesaikan pembayaran." : "Please complete your payment."}</p>
      </div>
    `,
  };
}

export function orderDeliveredEmail(params: {
  orderCode: string;
  locale: string;
}) {
  const isId = params.locale === "id";
  return {
    subject: isId
      ? `WT Market — Order #${params.orderCode} Terkirim`
      : `WT Market — Order #${params.orderCode} Delivered`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${isId ? "Kredensial Siap" : "Credentials Ready"}</h2>
        <p>${isId ? "Order Anda telah dikirim. Silakan buka link order untuk melihat kredensial." : "Your order has been delivered. Open your order link to view credentials."}</p>
      </div>
    `,
  };
}