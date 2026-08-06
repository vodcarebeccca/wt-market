import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProductAction, updateProductAction } from "@/actions/admin-products";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const update = updateProductAction.bind(null, id);
  const remove = deleteProductAction.bind(null, id);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Edit produk</h1>
            <p className="text-muted">{product.slug}</p>
          </div>
          <Link href={`/products/${id}/stock`} className="btn btn-ghost">
            Kelola stok
          </Link>
        </div>

        {sp.saved && (
          <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-green-300">
            Tersimpan
          </p>
        )}
        {sp.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300">
            Data tidak valid
          </p>
        )}

        <ProductForm action={update} values={product} submitLabel="Update produk" />

        <form action={remove}>
          <button className="btn btn-danger" type="submit">
            Hapus produk
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
