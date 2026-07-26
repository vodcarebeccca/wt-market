import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export type AdminSessionData = {
  isLoggedIn: boolean;
  adminId?: string;
  email?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "wt_market_admin",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.isLoggedIn || !session.adminId) {
    return null;
  }
  return session;
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return false;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return false;

  const session = await getAdminSession();
  session.isLoggedIn = true;
  session.adminId = admin.id;
  session.email = admin.email;
  await session.save();
  return true;
}

export async function logoutAdmin() {
  const session = await getAdminSession();
  session.destroy();
}
