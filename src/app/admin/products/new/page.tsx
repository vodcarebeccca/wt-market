import { createProductAction } from "@/actions/admin-products";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tambah produk</h1>
        <ProductForm action={createProductAction} submitLabel="Simpan produk" />
      </div>
    </AdminShell>
  );
}
