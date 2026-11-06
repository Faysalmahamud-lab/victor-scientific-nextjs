import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mariadb from "mariadb";

import {
  authorizeAdminApi,
  isSameOrigin,
} from "@/lib/admin-api-auth";

import { hasAdminPermission } from "@/lib/admin-rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbId = string | number | bigint;

type RoleRow = {
  id: DbId;
  name: string;
  permission_count: number | string;
  assigned_accounts: number | string;
};

type PermissionRow = {
  id: DbId;
  name: string;
};

type MappingRow = {
  role_id: DbId;
  permission_id: DbId;
};


const RESERVED_ROLES = new Set([
  "admin",
  "super viser",
  "vendor",
  "reseller",
]);

const ACTIONS = [
  "verification",
  "withdrawal",
  "disable",
  "create",
  "delete",
  "edit",
  "list",
  "manage",
  "report",
  "check",
  "send",
  "view",
  "info",
];

const idSchema = z.string().regex(/^[0-9]+$/);

const nameSchema = z.string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[\p{L}\p{N} _.-]+$/u);

const createSchema = z.object({
  name: nameSchema,
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rename"),
    roleId: idSchema,
    name: nameSchema,
  }),
  z.object({
    action: z.literal("permissions"),
    roleId: idSchema,
    permissionIds: z.array(idSchema).max(134),
  }),
]);

const deleteSchema = z.object({
  roleId: idSchema,
});

function dbOptions() {
  const raw = process.env.DATABASE_URL;

  if (!raw) throw new Error("Database unavailable.");

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

function isDuplicateEntry(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const e = error as {
    errno?: unknown;
    code?: unknown;
  };

  return e.errno === 1062 || e.code === "ER_DUP_ENTRY";
}

function isReservedRole(name: string) {
  return RESERVED_ROLES.has(name.trim().toLowerCase());
}

function groupPermissions(rows: PermissionRow[]) {
  const groups: Record<
    string,
    { module: string; permissions: {
      id: string;
      name: string;
      action: string;
    }[] }
  > = {};

  for (const row of rows) {
    const name = row.name;

    const action = ACTIONS.find(
      value => name.endsWith(`-${value}`)
    ) || "other";

    const moduleName = action === "other"
      ? name
      : name.slice(0, -(action.length + 1));

    if (!groups[moduleName]) {
      groups[moduleName] = {
        module: moduleName,
        permissions: [],
      };
    }

    groups[moduleName].permissions.push({
      id: String(row.id),
      name,
      action,
    });
  }

  return Object.values(groups).sort(
    (a, b) => a.module.localeCompare(b.module)
  );
}

async function writeAudit(
  connection: Awaited<ReturnType<typeof mariadb.createConnection>>,
  request: NextRequest,
  actorId: string,
  action: string,
  entityId: string,
  details: Record<string, unknown>
) {
  const ip =
    request.headers.get("x-forwarded-for")
      ?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const userAgent = request.headers
    .get("user-agent")
    ?.slice(0, 500) || null;

  await connection.query(
    `INSERT INTO admin_audit_logs
     (actor_user_id,action,entity_type,entity_id,
      details,ip_address,user_agent,created_at)
     VALUES (?,?,'role',?,?,?,?,NOW())`,
    [
      actorId,
      action,
      entityId,
      JSON.stringify(details),
      ip,
      userAgent,
    ]
  );
}

/* =========================
   GET: ROLES AND PERMISSIONS
========================= */

export async function GET() {
  const auth = await authorizeAdminApi("role-list");

  if (!auth.ok) return auth.response;

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    const roleRows = await connection.query(
      `SELECT
         r.id,
         r.name,
         COUNT(DISTINCT rp.permission_id) AS permission_count,
         COUNT(DISTINCT CONCAT(m.model_type, ':', m.model_id))
           AS assigned_accounts
       FROM roles r
       LEFT JOIN role_has_permissions rp
         ON rp.role_id = r.id
       LEFT JOIN model_has_roles m
         ON m.role_id = r.id
       WHERE r.guard_name = 'admin'
       GROUP BY r.id,r.name
       ORDER BY r.name`
    ) as RoleRow[];

    const canViewPermissions =
      auth.access.isSuperAdmin ||
      hasAdminPermission(auth.access, "permission-list");

    let permissions: PermissionRow[] = [];
    let mappings: MappingRow[] = [];

    if (canViewPermissions) {
      permissions = await connection.query(
        `SELECT id,name
         FROM permissions
         WHERE guard_name='admin'
         ORDER BY name`
      ) as PermissionRow[];

      mappings = await connection.query(
        `SELECT rp.role_id,rp.permission_id
         FROM role_has_permissions rp
         INNER JOIN roles r ON r.id=rp.role_id
         WHERE r.guard_name='admin'`
      ) as MappingRow[];
    }

    const rolePermissions: Record<string, string[]> = {};

    for (const role of roleRows) {
      const id = String(role.id);

      rolePermissions[id] = mappings
        .filter(m => String(m.role_id) === id)
        .map(m => String(m.permission_id));
    }

    const roles = roleRows.map(role => ({
      id: String(role.id),
      name: role.name,
      permissionCount: Number(role.permission_count),
      assignedAccounts: Number(role.assigned_accounts),
      isProtected: isReservedRole(role.name),
    }));

    return NextResponse.json({
      ok: true,
      currentUserId: auth.session.id,
      roles,
      permissions: permissions.map(p => ({
        id: String(p.id),
        name: p.name,
      })),
      permissionGroups: groupPermissions(permissions),
      grantablePermissionIds: auth.access.isSuperAdmin
        ? permissions.map(p => String(p.id))
        : permissions
            .filter(p => auth.access.permissions.includes(p.name))
            .map(p => String(p.id)),
      rolePermissions,
      capabilities: {
        create: hasAdminPermission(auth.access, "role-create"),
        rename: hasAdminPermission(auth.access, "role-edit"),
        delete: hasAdminPermission(auth.access, "role-delete"),
        assignPermissions:
          canViewPermissions &&
          hasAdminPermission(auth.access, "permission-edit"),
      },
    });

  } catch (error) {
    console.error("[admin-roles-get]", error);

    return NextResponse.json(
      { error: "Unable to load role management data." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* =========================
   POST: CREATE ROLE
========================= */

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const auth = await authorizeAdminApi("role-create");

  if (!auth.ok) return auth.response;

  const parsed = createSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role name." },
      { status: 400 }
    );
  }

  const name = parsed.data.name.trim();

  if (isReservedRole(name)) {
    return NextResponse.json(
      { error: "This is a reserved system role." },
      { status: 403 }
    );
  }

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    await connection.beginTransaction();

    const result = await connection.query(
      `INSERT INTO roles
       (name,guard_name,created_at,updated_at)
       VALUES (?,'admin',NOW(),NOW())`,
      [name]
    );

    const roleId = String(result.insertId);

    await writeAudit(
      connection,
      request,
      auth.session.id,
      "role.created",
      roleId,
      { name }
    );

    await connection.commit();

    return NextResponse.json(
      { ok: true, id: roleId },
      { status: 201 }
    );

  } catch (error) {
    if (connection) await connection.rollback();

    if (isDuplicateEntry(error)) {
      return NextResponse.json(
        { error: "This role already exists." },
        { status: 409 }
      );
    }

    console.error("[admin-roles-create]", error);

    return NextResponse.json(
      { error: "Role creation failed." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* =========================
   PATCH: RENAME OR PERMISSIONS
========================= */

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role update information." },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const requiredPermission =
    input.action === "rename"
      ? "role-edit"
      : "permission-edit";

  const auth = await authorizeAdminApi(requiredPermission);

  if (!auth.ok) return auth.response;

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    await connection.beginTransaction();

    const roleRows = await connection.query(
      `SELECT id,name FROM roles
       WHERE id=? AND guard_name='admin'
       LIMIT 1 FOR UPDATE`,
      [input.roleId]
    ) as Array<{ id: DbId; name: string }>;

    const role = roleRows[0];

    if (!role) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Role not found." },
        { status: 404 }
      );
    }

    if (input.action === "rename") {
      if (isReservedRole(role.name)) {
        await connection.rollback();

        return NextResponse.json(
          { error: "Reserved system roles cannot be renamed." },
          { status: 403 }
        );
      }

      const name = input.name.trim();

      if (isReservedRole(name)) {
        await connection.rollback();

        return NextResponse.json(
          { error: "Reserved system role names cannot be used." },
          { status: 403 }
        );
      }

      await connection.query(
        `UPDATE roles SET name=?,updated_at=NOW()
         WHERE id=? AND guard_name='admin'`,
        [name, input.roleId]
      );

      await writeAudit(
        connection,
        request,
        auth.session.id,
        "role.renamed",
        input.roleId,
        { oldName: role.name, newName: name }
      );

      await connection.commit();

      return NextResponse.json({ ok: true });
    }

    if (
      isReservedRole(role.name) &&
      !auth.access.isSuperAdmin
    ) {
      await connection.rollback();

      return NextResponse.json(
        { error: "This system role is protected." },
        { status: 403 }
      );
    }

    const permissionIds = [
      ...new Set(input.permissionIds),
    ];

    const placeholders = permissionIds.map(() => "?").join(",");

    const permissionRows: PermissionRow[] = permissionIds.length
      ? await connection.query(
          `SELECT id,name FROM permissions
           WHERE guard_name='admin'
           AND id IN (${placeholders})`,
          permissionIds
        ) as PermissionRow[]
      : [];

    if (permissionRows.length !== permissionIds.length) {
      await connection.rollback();

      return NextResponse.json(
        { error: "One or more permissions are invalid." },
        { status: 400 }
      );
    }

    if (!auth.access.isSuperAdmin) {
      const allowed = new Set(auth.access.permissions);

      const forbidden = permissionRows.some(
        permission => !allowed.has(permission.name)
      );

      if (forbidden) {
        await connection.rollback();

        return NextResponse.json(
          { error: "You cannot grant permissions you do not possess." },
          { status: 403 }
        );
      }
    }

    const previousRows = await connection.query(
      `SELECT permission_id
       FROM role_has_permissions
       WHERE role_id=?`,
      [input.roleId]
    ) as Array<{ permission_id: DbId }>;

    await connection.query(
      "DELETE FROM role_has_permissions WHERE role_id=?",
      [input.roleId]
    );

    for (const permissionId of permissionIds) {
      await connection.query(
        `INSERT INTO role_has_permissions
         (permission_id,role_id)
         VALUES (?,?)`,
        [permissionId, input.roleId]
      );
    }

    await writeAudit(
      connection,
      request,
      auth.session.id,
      "role.permissions.updated",
      input.roleId,
      {
        roleName: role.name,
        previousPermissionIds: previousRows.map(
          row => String(row.permission_id)
        ),
        newPermissionIds: permissionIds,
      }
    );

    await connection.commit();

    return NextResponse.json({
      ok: true,
      permissionCount: permissionIds.length,
    });

  } catch (error) {
    if (connection) await connection.rollback();

    if (isDuplicateEntry(error)) {
      return NextResponse.json(
        { error: "Duplicate role or permission mapping." },
        { status: 409 }
      );
    }

    console.error("[admin-roles-update]", error);

    return NextResponse.json(
      { error: "Role update failed." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* =========================
   DELETE: SAFE ROLE DELETION
========================= */

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const auth = await authorizeAdminApi("role-delete");

  if (!auth.ok) return auth.response;

  const parsed = deleteSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role identifier." },
      { status: 400 }
    );
  }

  let connection;

  try {
    connection = await mariadb.createConnection(dbOptions());

    await connection.beginTransaction();

    const roleRows = await connection.query(
      `SELECT id,name FROM roles
       WHERE id=? AND guard_name='admin'
       LIMIT 1 FOR UPDATE`,
      [parsed.data.roleId]
    ) as Array<{ id: DbId; name: string }>;

    const role = roleRows[0];

    if (!role) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Role not found." },
        { status: 404 }
      );
    }

    if (isReservedRole(role.name)) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Protected system roles cannot be deleted." },
        { status: 403 }
      );
    }

    const assignmentRows = await connection.query(
      `SELECT COUNT(*) AS total
       FROM model_has_roles
       WHERE role_id=?`,
      [parsed.data.roleId]
    );

    if (Number(assignmentRows[0].total) > 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            "This role is assigned to accounts. Reassign those accounts before deleting it.",
        },
        { status: 409 }
      );
    }

    await connection.query(
      "DELETE FROM role_has_permissions WHERE role_id=?",
      [parsed.data.roleId]
    );

    await writeAudit(
      connection,
      request,
      auth.session.id,
      "role.deleted",
      parsed.data.roleId,
      { name: role.name }
    );

    await connection.query(
      "DELETE FROM roles WHERE id=? AND guard_name='admin'",
      [parsed.data.roleId]
    );

    await connection.commit();

    return NextResponse.json({ ok: true });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("[admin-roles-delete]", error);

    return NextResponse.json(
      { error: "Role deletion failed." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
