import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export type AdminSessionData = {
  isLoggedIn: boolean;
  adminId?: string;
  email?: string;
};

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var is required. Set it before starting the server.");
}

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
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
  // Normalize to lowercase — broken-keyboard users can only type uppercase.
  // The stored hash is lowercase, so compare against the lowercased value.
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (!admin) return false;
  const ok = await bcrypt.compare(normalizedPassword, admin.passwordHash);
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
