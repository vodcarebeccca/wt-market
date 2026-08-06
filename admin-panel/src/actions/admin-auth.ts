"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function adminLoginAction(formData: FormData) {
  // Normalize to lowercase — broken-keyboard users can only type uppercase.
  // Both email and password are lowercased before authentication.
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").toLowerCase();

  // Rate-limit per-IP + per-email to slow brute force
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipLimited = rateLimit(`admin-login:ip:${ip}`, 10, 60_000);
  const emailLimited = rateLimit(`admin-login:email:${email.toLowerCase()}`, 5, 60_000);
  if (!ipLimited.ok || !emailLimited.ok) {
    redirect("/login?error=ratelimited");
  }

  const ok = await loginAdmin(email, password);
  if (!ok) {
    redirect("/login?error=1");
  }
  redirect("/");
}

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect("/login");
}
