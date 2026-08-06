"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  // Rate-limit per-IP + per-email to slow brute force
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipLimited = rateLimit(`admin-login:ip:${ip}`, 10, 60_000);
  const emailLimited = rateLimit(`admin-login:email:${email.toLowerCase()}`, 5, 60_000);
  if (!ipLimited.ok || !emailLimited.ok) {
    redirect("/admin/login?error=ratelimited");
  }

  const ok = await loginAdmin(email, password);
  if (!ok) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}
