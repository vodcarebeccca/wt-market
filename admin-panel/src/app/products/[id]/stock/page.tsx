import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteStockAction,
  importStockAction,
  invalidateStockAction,
} from "@/actions/admin-stock";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/crypto";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; error?: string }>;
};

export default async function ProductStockPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const stocks = await prisma.stockItem.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const importAction = importStockAction.bind(null, id);
  const available = stocks.filter((s) => s.status === "AVAILABLE").length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <Link href={`/products/${id}`} className="text-sm text-muted hover:text-accent">
            ← Kembali
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Stok: {product.titleId}</h1>
          <p className="text-muted">{available} available / {stocks.length} total (max 200 tampil)</p>
        </div>

        {sp.added && (
          <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-green-300">
            +{sp.added} kredensial ditambahkan
          </p>
        )}
        {sp.error === "empty" && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300">
            Tidak ada baris kredensial
          </p>
        )}

        <form action={importAction} className="card space-y-4 p-5">
          <h2 className="font-semibold">Import stok</h2>
          <p className="text-xs text-muted">Satu baris = satu akun. Format: email:password</p>
          <textarea
            className="input min-h-32 font-mono text-sm"
            name="paste"
            placeholder={"user1@mail.com:pass1\nuser2@mail.com:pass2"}
          />
          <label className="block space-y-1 text-sm">
            <span className="text-muted">Atau upload .txt / .csv</span>
            <input className="input" type="file" name="file" accept=".txt,.csv,text/plain" />
          </label>
          <button className="btn btn-primary" type="submit">
            Import
          </button>
        </form>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3">Credential</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const invalidate = invalidateStockAction.bind(null, s.id, id);
                const remove = deleteStockAction.bind(null, s.id, id);
                return (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-mono text-xs">
                      {s.status === "AVAILABLE"
                        ? decryptCredential(s.credential)
                        : decryptCredential(s.credential).slice(0, 18) + "…"}
                    </td>
                    <td className="px-4 py-3">{s.status}</td>
                    <td className="px-4 py-3 text-muted">
                      {s.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right">
                      {s.status === "AVAILABLE" && (
                        <>
                          <form action={invalidate} className="inline">
                            <button className="text-amber-300 hover:underline" type="submit">
                              Invalid
                            </button>
                          </form>
                          <form action={remove} className="inline">
                            <button className="text-danger hover:underline" type="submit">
                              Hapus
                            </button>
                          </form>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
