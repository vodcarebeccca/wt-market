"use server";

import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin } from "@/lib/auth";

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
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
