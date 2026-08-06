import { adminLoginAction } from "@/actions/admin-auth";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await requireAdmin();
  if (session) redirect("/");
  const sp = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form action={adminLoginAction} className="card w-full max-w-md space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">WT Market Admin</h1>
          <p className="text-sm text-muted">Masuk untuk kelola produk & order</p>
        </div>
        {sp.error === "ratelimited" && (
          <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-amber-300">
            Terlalu banyak percobaan login. Coba lagi beberapa saat.
          </p>
        )}
        {sp.error === "1" && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300">
            Email atau password salah
          </p>
        )}
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Email</span>
          <input
            className="input"
            name="email"
            type="email"
            required
            placeholder="vodcarebecca@gmail.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            defaultValue="vodcarebecca@gmail.com"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Password</span>
          <input
            className="input"
            name="password"
            type="password"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
        <p className="text-xs text-muted">
          Huruf kapital otomatis diubah ke huruf kecil saat login.
        </p>
        <button className="btn btn-primary w-full" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
