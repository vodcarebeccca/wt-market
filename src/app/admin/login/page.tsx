import { adminLoginAction } from "@/actions/admin-auth";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await requireAdmin();
  if (session) redirect("/admin");
  const sp = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form action={adminLoginAction} className="card w-full max-w-md space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">WT Market Admin</h1>
          <p className="text-sm text-muted">Masuk untuk kelola produk & order</p>
        </div>
        {sp.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300">
            Email atau password salah
          </p>
        )}
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Email</span>
          <input className="input" name="email" type="email" required defaultValue="admin@wtmarket.local" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Password</span>
          <input className="input" name="password" type="password" required />
        </label>
        <button className="btn btn-primary w-full" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
