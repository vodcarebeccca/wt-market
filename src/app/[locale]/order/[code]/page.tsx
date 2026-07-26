import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatPricePair } from "@/lib/money";
import { rateLimit } from "@/lib/rate-limit";
import { SnapPayButton } from "@/components/checkout/SnapPayButton";

type Props = {
  params: Promise<{ locale: string; code: string }>;
  searchParams: Promise<{ token?: string }>;
};

function statusLabel(t: Awaited<ReturnType<typeof getTranslations>>, status: string) {
  switch (status) {
    case "PENDING":
      return t("order.pending");
    case "PAID":
      return t("order.paid");
    case "DELIVERED":
      return t("order.delivered");
    case "FAILED":
      return t("order.failed");
    case "EXPIRED":
      return t("order.expired");
    default:
      return status;
  }
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { locale, code } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = rateLimit(`order:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return <div className="card p-6 text-danger">Too many requests. Try again later.</div>;
  }

  if (!token) {
    return <div className="card p-6 text-danger">{t("order.invalidToken")}</div>;
  }

  const order = await prisma.order.findUnique({
    where: { code },
    include: {
      items: {
        include: {
          stockItem: true,
          product: true,
        },
      },
    },
  });

  if (!order || order.accessToken !== token) {
    return <div className="card p-6 text-danger">{t("order.notFound")}</div>;
  }

  const price = formatPricePair(order.totalIdr);
  const canShowCreds = order.status === "DELIVERED";
  const credentials = canShowCreds
    ? order.items.map((i) => i.stockItem?.credential).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">{t("order.title")}</h1>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("order.code")}</dt>
            <dd className="font-mono font-semibold">{order.code}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("order.status")}</dt>
            <dd>
              <span
                className={`badge ${
                  order.status === "DELIVERED"
                    ? "badge-success"
                    : order.status === "PENDING"
                      ? "badge-warn"
                      : "badge-danger"
                }`}
              >
                {statusLabel(t, order.status)}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("order.product")}</dt>
            <dd className="text-right">{order.items[0]?.productTitle}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("order.total")}</dt>
            <dd className="font-semibold text-accent">
              {price.idr} <span className="text-xs text-muted">≈ {price.usd}</span>
            </dd>
          </div>
        </dl>

        {order.status === "PENDING" && (
          <div className="space-y-3 rounded-xl border border-border bg-black/30 p-4">
            <p className="text-sm text-muted">{t("order.waitingPayment")}</p>
            {order.midtransSnapToken ? (
              <SnapPayButton
                snapToken={order.midtransSnapToken}
                orderCode={order.code}
                accessToken={order.accessToken}
                locale={locale}
                label={t("order.continuePay")}
              />
            ) : (
              <p className="text-xs text-amber-300">
                Midtrans belum aktif. Hubungi admin / tunggu mark paid manual.
              </p>
            )}
          </div>
        )}

        {order.status === "PAID" && (
          <p className="rounded-xl border border-border bg-black/30 p-4 text-sm text-amber-200">
            {t("order.paid")}
          </p>
        )}

        {canShowCreds && (
          <div className="space-y-2 rounded-xl border border-success/40 bg-success/10 p-4">
            <h2 className="font-semibold text-success">{t("order.credentials")}</h2>
            <p className="text-xs text-muted">{t("order.credentialsHint")}</p>
            <div className="space-y-2">
              {credentials.map((cred, idx) => (
                <pre
                  key={idx}
                  className="overflow-x-auto rounded-lg bg-black/50 p-3 font-mono text-sm text-foreground"
                >
                  {cred}
                </pre>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
