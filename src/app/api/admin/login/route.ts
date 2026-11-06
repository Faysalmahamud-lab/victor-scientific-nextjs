import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminSession } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-rbac";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await prisma.user.findFirst({
      where: { email, status: 1 },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid sign-in details." },
        { status: 401 }
      );
    }

    const hash = user.password.replace(/^\$2y\$/, "$2a$");

    if (!await bcrypt.compare(parsed.data.password, hash)) {
      return NextResponse.json(
        { error: "Invalid sign-in details." },
        { status: 401 }
      );
    }

    const access = await getAdminAccess({
      id: user.id,
      email: user.email,
    });

    if (!access.hasAdminAccess) {
      return NextResponse.json(
        { error: "This account does not have administrator access." },
        { status: 403 }
      );
    }

    await createAdminSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      ok: true,
      role: access.isSuperAdmin
        ? "Super Admin"
        : access.roles.join(", "),
    });
  } catch (error) {
    console.error("[admin-login] Authentication failed:", error);

    return NextResponse.json(
      { error: "Sign-in is not configured correctly on the server." },
      { status: 503 }
    );
  }
}
