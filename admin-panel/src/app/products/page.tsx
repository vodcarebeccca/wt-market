import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { formatIdr } from "@/lib/money";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { stockItems: { where: { status: "AVAILABLE" } } } },
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Produk</h1>
            <p className="text-muted">{products.length} produk</p>
          </div>
          <Link href="/products/new" className="btn btn-primary">
            + Tambah produk
          </Link>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.titleId}</div>
                    <div className="text-xs text-muted">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">{formatIdr(p.priceIdr)}</td>
                  <td className="px-4 py-3">{p._count.stockItems}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.isActive ? "badge-success" : "badge-danger"}`}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/products/${p.id}`} className="text-accent hover:underline">
                      Edit
                    </Link>
                    {" · "}
                    <Link
                      href={`/products/${p.id}/stock`}
                      className="text-accent hover:underline"
                    >
                      Stok
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
