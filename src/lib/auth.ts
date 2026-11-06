import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { redirect } from "next/navigation";
import { getAdminAccess, hasAdminPermission } from "@/lib/admin-rbac";

const COOKIE_NAME = "vsc_admin_session";
const secretValue = process.env.AUTH_SECRET || "";
const secret = new TextEncoder().encode(secretValue);

export async function createAdminSession(user: {
  id: bigint | number | string;
  email: string;
  name: string;
}) {
  if (secretValue.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  const token = await new SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const jar = await cookies();

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  if (secretValue.length < 32) return null;

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub) return null;

    return {
      id: payload.sub,
      email: String(payload.email || ""),
      name: String(payload.name || "Administrator"),
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(permission?: string | string[]) {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  const access = await getAdminAccess(session).catch(() => null);

  if (!access || !access.hasAdminAccess) {
    redirect("/admin/login");
  }

  if (permission && !hasAdminPermission(access, permission)) {
    redirect("/admin/forbidden");
  }

  return { ...session, ...access };
}
