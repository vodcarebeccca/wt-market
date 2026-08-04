import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_WHATSAPP_NUMBER } from "@/lib/payment-config";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted">Konfigurasi pembayaran manual WhatsApp</p>
        </div>

        <section className="space-y-4 rounded-xl border border-border bg-black/30 p-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Pembayaran lewat admin</h2>
            <p className="text-sm text-muted">
              Customer diarahkan ke WhatsApp admin setelah order dibuat. Admin cek pembayaran manual lalu mark paid di halaman order admin.
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-muted">Nomor WhatsApp</dt>
            <dd className="font-mono text-foreground">+{ADMIN_WHATSAPP_NUMBER}</dd>
            <dt className="text-muted">Link wa.me</dt>
            <dd>
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline-offset-4 hover:underline"
              >
                wa.me/{ADMIN_WHATSAPP_NUMBER}
              </a>
            </dd>
          </dl>
        </section>
      </div>
    </AdminShell>
  );
}
