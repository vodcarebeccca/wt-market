import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminLogoutAction } from "@/actions/admin-auth";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/admin" className="font-bold text-accent">
              WT Admin
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-muted">
              <Link href="/admin" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/products" className="hover:text-foreground">
                Produk
              </Link>
              <Link href="/admin/orders" className="hover:text-foreground">
                Order
              </Link>
              <Link href="/admin/settings" className="hover:text-foreground">
                Settings
              </Link>
              <Link href="/id" className="hover:text-foreground">
                Storefront
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{session.email}</span>
            <form action={adminLogoutAction}>
              <button className="btn btn-ghost px-3 py-1 text-xs" type="submit">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
