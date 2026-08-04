import Link from "next/link";
import { notFound } from "next/navigation";
import {
  markFailedAction,
  markPaidAction,
  retryDeliverAction,
} from "@/actions/admin-orders";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatIdr } from "@/lib/money";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
};

export default async function AdminOrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { stockItem: true, product: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const markPaid = markPaidAction.bind(null, id);
  const markFailed = markFailedAction.bind(null, id);
  const retry = retryDeliverAction.bind(null, id);
  const deliveryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${order.locale}/order/${order.code}?token=${order.accessToken}`;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <Link href="/admin/orders" className="text-sm text-muted hover:text-accent">
            ← Semua order
          </Link>
          <h1 className="mt-2 text-3xl font-bold font-mono">{order.code}</h1>
          <p className="text-muted">Status: {order.status}</p>
        </div>

        {sp.paid && (
          <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-green-300">
            Mark paid dijalankan
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card space-y-2 p-5 text-sm">
            <p>
              <span className="text-muted">Total:</span> {formatIdr(order.totalIdr)}
            </p>
            <p>
              <span className="text-muted">Email:</span> {order.buyerEmail || "—"}
            </p>
            <p>
              <span className="text-muted">WhatsApp:</span> {order.buyerWhatsapp || "—"}
            </p>
            <p>
              <span className="text-muted">Locale:</span> {order.locale}
            </p>
            <p>
              <span className="text-muted">Order ref:</span> {order.code || "—"}
            </p>
            {order.adminNote && (
              <p>
                <span className="text-muted">Admin note:</span> {order.adminNote}
              </p>
            )}
          </div>

          <div className="card space-y-3 p-5">
            <h2 className="font-semibold">Aksi</h2>
            <div className="flex flex-wrap gap-2">
              {(order.status === "PENDING" || order.status === "FAILED") && (
                <form action={markPaid}>
                  <button className="btn btn-primary" type="submit">
                    Mark paid + deliver
                  </button>
                </form>
              )}
              {order.status === "PAID" && (
                <form action={retry}>
                  <button className="btn btn-primary" type="submit">
                    Retry deliver
                  </button>
                </form>
              )}
              {order.status === "PENDING" && (
                <form action={markFailed}>
                  <button className="btn btn-danger" type="submit">
                    Mark failed
                  </button>
                </form>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">Link delivery buyer</p>
              <code className="block break-all rounded-lg bg-black/40 p-3 text-xs">{deliveryUrl}</code>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Item & kredensial</h2>
          <ul className="space-y-3 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{item.productTitle}</p>
                <p className="text-muted">{formatIdr(item.unitPriceIdr)}</p>
                {item.stockItem ? (
                  <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-2 font-mono text-xs">
                    {item.stockItem.credential}
                  </pre>
                ) : (
                  <p className="mt-2 text-amber-300">Belum di-assign stok</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Payment log</h2>
          {order.payments.length === 0 ? (
            <p className="text-sm text-muted">Belum ada payment</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {order.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-border/50 py-2">
                  <span>
                    {p.provider} · {p.status}
                  </span>
                  <span className="text-muted">{p.providerRef || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
