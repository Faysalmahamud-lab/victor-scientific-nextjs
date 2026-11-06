import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import mariadb from "mariadb";
import {
  authorizeAdminApi,
  isSameOrigin,
} from "@/lib/admin-api-auth";
import { hasAdminPermission } from "@/lib/admin-rbac";

export const runtime = "nodejs";

const MODEL_TYPE = "App\\Models\\User";
type OperatorDbRow = {
  id: string | number | bigint;
  name: string;
  email: string;
  status: number | string;
  created_at: Date | string | null;
  role_ids: string | null;
  role_names: string | null;
};

type RoleDbRow = {
  id: string | number | bigint;
  name: string;
};

function isDuplicateEntry(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    errno?: unknown;
    code?: unknown;
  };

  return candidate.errno === 1062 ||
    candidate.code === "ER_DUP_ENTRY";
}


function dbOptions() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Database unavailable");

  const u = new URL(raw);

  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.slice(1)),
    connectTimeout: 5000,
  };
}

function restrictedRole(name: string) {
  return ["admin", "super viser", "vendor", "reseller"]
    .includes(name.toLowerCase());
}

function allowedRole(name: string, isSuperAdmin: boolean) {
  if (["vendor", "reseller"].includes(name.toLowerCase())) return false;

  if (isSuperAdmin) return true;

  return ["salesman", "seo"].includes(name.toLowerCase());
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(12).max(72),
  roleId: z.string().regex(/^[0-9]+$/),
});

const updateSchema = z.object({
  id: z.string().regex(/^[0-9]+$/),
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  roleId: z.string().regex(/^[0-9]+$/),
  status: z.union([z.literal(0), z.literal(1)]),
});

export async function GET() {
  const auth = await authorizeAdminApi("operator-list");
  if (!auth.ok) return auth.response;

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    const rows = await connection.query(
      `SELECT u.id,u.name,u.email,u.status,u.created_at,
       GROUP_CONCAT(DISTINCT r.id ORDER BY r.id) AS role_ids,
       GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS role_names
       FROM users u
       INNER JOIN model_has_roles m ON m.model_id=u.id
       INNER JOIN roles r ON r.id=m.role_id
       WHERE m.model_type=? AND u.role='admin'
       AND r.guard_name='admin'
       GROUP BY u.id,u.name,u.email,u.status,u.created_at
       ORDER BY u.id DESC LIMIT 200`,
      [MODEL_TYPE]
    );

    const allowlist = (process.env.ADMIN_ALLOWED_EMAILS || "")
      .split(",").map(v => v.trim().toLowerCase());

    const operators = rows.map((r: OperatorDbRow) => ({
      id: String(r.id),
      name: r.name,
      email: r.email,
      status: Number(r.status),
      createdAt: r.created_at,
      roleId: String(r.role_ids || "").split(",")[0],
      roleNames: r.role_names || "",
      isProtected: allowlist.includes(String(r.email).toLowerCase()),
    }));

    const roleRows = await connection.query(
      `SELECT id,name FROM roles
       WHERE guard_name='admin'
       AND LOWER(name) NOT IN ('vendor','reseller')
       ORDER BY name`
    );

    const roles = roleRows
      .filter((r: RoleDbRow) => allowedRole(r.name, auth.access.isSuperAdmin))
      .map((r: RoleDbRow) => ({
        id: String(r.id),
        name: r.name,
        restricted: restrictedRole(r.name),
      }));

    return NextResponse.json({
      currentUserId: auth.session.id,
      operators,
      roles,
      capabilities: {
        create: hasAdminPermission(auth.access, "operator-create"),
        edit: hasAdminPermission(auth.access, "operator-edit"),
        disable: hasAdminPermission(auth.access, "operator-disable"),
        assignRole: hasAdminPermission(auth.access, "operator-role-assign"),
      },
    });
  } catch (error) {
    console.error("[operators-get]", error);
    return NextResponse.json(
      { error: "Could not load operators." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const auth = await authorizeAdminApi("operator-create");
  if (!auth.ok) return auth.response;

  if (!hasAdminPermission(auth.access, "operator-role-assign")) {
    return NextResponse.json({ error: "Role assignment permission required." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid operator details. Password must contain at least 12 characters." }, { status: 400 });
  }

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    const roleRows = await connection.query(
      "SELECT id,name FROM roles WHERE id=? AND guard_name='admin' LIMIT 1",
      [parsed.data.roleId]
    );

    const role = roleRows[0];

    if (!role || !allowedRole(role.name, auth.access.isSuperAdmin)) {
      return NextResponse.json({ error: "This role cannot be assigned." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await connection.beginTransaction();

    const result = await connection.query(
      `INSERT INTO users
       (name,email,password,status,role,created_at,updated_at)
       VALUES (?,?,?,1,'admin',NOW(),NOW())`,
      [
        parsed.data.name,
        parsed.data.email.toLowerCase(),
        passwordHash,
      ]
    );

    const newId = String(result.insertId);

    await connection.query(
      `INSERT INTO model_has_roles (role_id,model_type,model_id)
       VALUES (?,?,?)`,
      [parsed.data.roleId, MODEL_TYPE, newId]
    );

    await connection.commit();

    return NextResponse.json({ ok: true, id: newId }, { status: 201 });
  } catch (error: unknown) {
    if (connection) await connection.rollback();

    if (isDuplicateEntry(error)) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    console.error("[operators-create]", error);

    return NextResponse.json({ error: "Operator creation failed." }, { status: 503 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const auth = await authorizeAdminApi("operator-edit");
  if (!auth.ok) return auth.response;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update information." }, { status: 400 });
  }

  const input = parsed.data;

  if (input.id === auth.session.id) {
    return NextResponse.json({ error: "You cannot modify your own operator account here." }, { status: 403 });
  }

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    const targetRows = await connection.query(
      "SELECT id,email,status FROM users WHERE id=? AND role='admin' LIMIT 1",
      [input.id]
    );

    const target = targetRows[0];

    if (!target) {
      return NextResponse.json({ error: "Operator not found." }, { status: 404 });
    }

    const allowlist = (process.env.ADMIN_ALLOWED_EMAILS || "")
      .split(",").map(v => v.trim().toLowerCase());

    if (allowlist.includes(String(target.email).toLowerCase())) {
      return NextResponse.json({ error: "Protected Super Admin accounts cannot be modified." }, { status: 403 });
    }

    const roleRows = await connection.query(
      "SELECT id,name FROM roles WHERE id=? AND guard_name='admin' LIMIT 1",
      [input.roleId]
    );

    const role = roleRows[0];

    if (!role || !allowedRole(role.name, auth.access.isSuperAdmin)) {
      return NextResponse.json({ error: "This role cannot be assigned." }, { status: 400 });
    }

    const oldRoleRows = await connection.query(
      "SELECT role_id FROM model_has_roles WHERE model_type=? AND model_id=?",
      [MODEL_TYPE, input.id]
    );

    const roleChanged =
      oldRoleRows.length !== 1 ||
      String(oldRoleRows[0]?.role_id) !== input.roleId;

    if (roleChanged && !hasAdminPermission(auth.access, "operator-role-assign")) {
      return NextResponse.json({ error: "Role assignment permission required." }, { status: 403 });
    }

    if (Number(target.status) === 1 && input.status === 0 &&
        !hasAdminPermission(auth.access, "operator-disable")) {
      return NextResponse.json({ error: "Operator disable permission required." }, { status: 403 });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE users SET name=?,email=?,status=?,updated_at=NOW()
       WHERE id=? AND role='admin'`,
      [input.name, input.email.toLowerCase(), input.status, input.id]
    );

    if (roleChanged) {
      await connection.query(
        "DELETE FROM model_has_roles WHERE model_type=? AND model_id=?",
        [MODEL_TYPE, input.id]
      );

      await connection.query(
        "INSERT INTO model_has_roles (role_id,model_type,model_id) VALUES (?,?,?)",
        [input.roleId, MODEL_TYPE, input.id]
      );
    }

    await connection.commit();

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (connection) await connection.rollback();

    if (isDuplicateEntry(error)) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    console.error("[operators-update]", error);

    return NextResponse.json({ error: "Operator update failed." }, { status: 503 });
  } finally {
    if (connection) await connection.end();
  }
}
