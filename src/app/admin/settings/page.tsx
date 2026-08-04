import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getGoBizStatus } from "@/lib/gobiz";
import { GoBizSettings } from "./GoBizSettings";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const status = await getGoBizStatus();

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted">Konfigurasi integrasi GoBiz & QRIS</p>
        </div>

        <GoBizSettings initialStatus={status} />
      </div>
    </AdminShell>
  );
}
