import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAdminAccess, hasAdminPermission } from "@/lib/admin-rbac";

export async function authorizeAdminApi(permission: string) {
  const session = await getAdminSession();

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  let access;

  try {
    access = await getAdminAccess(session);
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Authorization service unavailable." },
        { status: 503 }
      ),
    };
  }

  if (!access.hasAdminAccess || !hasAdminPermission(access, permission)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "You do not have permission for this operation." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session, access };
}

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
      request.headers.get("host");

    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
}
