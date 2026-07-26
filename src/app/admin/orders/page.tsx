import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatIdr } from "@/lib/money";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Order</h1>
          <p className="text-muted">100 order terbaru</p>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-mono text-xs">{o.code}</td>
                  <td className="px-4 py-3">{o.items[0]?.productTitle || "—"}</td>
                  <td className="px-4 py-3">{formatIdr(o.totalIdr)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        o.status === "DELIVERED"
                          ? "badge-success"
                          : o.status === "PENDING"
                            ? "badge-warn"
                            : "badge-danger"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {o.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-accent hover:underline">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
