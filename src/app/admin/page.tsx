import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatIdr } from "@/lib/money";

export default async function AdminDashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pendingCount, deliveredToday, revenueAgg, lowStock, recentOrders] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: "DELIVERED", deliveredAt: { gte: startOfDay } },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "DELIVERED"] }, paidAt: { gte: startOfDay } },
      _sum: { totalIdr: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { stockItems: { where: { status: "AVAILABLE" } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
  ]);

  const low = lowStock.filter((p) => p._count.stockItems <= 2).slice(0, 8);

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted">Ringkasan toko WT Market</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-muted">Order pending</p>
            <p className="mt-1 text-3xl font-bold text-accent">{pendingCount}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-muted">Delivered hari ini</p>
            <p className="mt-1 text-3xl font-bold">{deliveredToday}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-muted">Revenue hari ini</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {formatIdr(revenueAgg._sum.totalIdr || 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Stok menipis</h2>
              <Link href="/admin/products" className="text-sm text-accent">
                Semua produk
              </Link>
            </div>
            {low.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada produk low stock.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {low.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/products/${p.id}/stock`} className="hover:text-accent">
                      {p.titleId}
                    </Link>
                    <span className={p._count.stockItems === 0 ? "text-danger" : "text-amber-300"}>
                      {p._count.stockItems} ready
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Order terbaru</h2>
              <Link href="/admin/orders" className="text-sm text-accent">
                Semua order
              </Link>
            </div>
            <ul className="space-y-2 text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono hover:text-accent">
                    {o.code}
                  </Link>
                  <span className="text-muted">{o.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
