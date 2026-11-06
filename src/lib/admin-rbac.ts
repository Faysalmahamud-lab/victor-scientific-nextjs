import "server-only";
import mariadb from "mariadb";

export type AdminAccess = {
  isSuperAdmin: boolean;
  hasAdminAccess: boolean;
  roles: string[];
  permissions: string[];
};

function databaseOptions() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Database unavailable");

  const url = new URL(raw);

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectTimeout: 5000,
  };
}

export async function getAdminAccess(user: {
  id: string | number | bigint;
  email: string;
}): Promise<AdminAccess> {
  const empty: AdminAccess = {
    isSuperAdmin: false,
    hasAdminAccess: false,
    roles: [],
    permissions: [],
  };

  const connection = await mariadb.createConnection(databaseOptions());

  try {
    const accounts = await connection.query(
      "SELECT email,status,role FROM users WHERE id=? LIMIT 1",
      [String(user.id)]
    );

    const account = accounts[0];

    if (
      !account ||
      Number(account.status) !== 1 ||
      account.role !== "admin" ||
      String(account.email).toLowerCase() !== user.email.toLowerCase()
    ) {
      return empty;
    }

    const allowlist = (process.env.ADMIN_ALLOWED_EMAILS || "")
      .split(",")
      .map(v => v.trim().toLowerCase())
      .filter(Boolean);

    if (allowlist.includes(String(account.email).toLowerCase())) {
      return {
        isSuperAdmin: true,
        hasAdminAccess: true,
        roles: ["Super Admin"],
        permissions: [],
      };
    }

    const modelType = "App\\Models\\User";

    const roleRows = await connection.query(
      `SELECT DISTINCT r.name AS role_name,
       p.name AS permission_name
       FROM model_has_roles m
       INNER JOIN roles r ON r.id=m.role_id
       LEFT JOIN role_has_permissions rp ON rp.role_id=r.id
       LEFT JOIN permissions p
         ON p.id=rp.permission_id AND p.guard_name='admin'
       WHERE m.model_type=? AND m.model_id=?
       AND r.guard_name='admin'`,
      [modelType, String(user.id)]
    );

    const directRows = await connection.query(
      `SELECT DISTINCT p.name AS permission_name
       FROM model_has_permissions m
       INNER JOIN permissions p ON p.id=m.permission_id
       WHERE m.model_type=? AND m.model_id=?
       AND p.guard_name='admin'`,
      [modelType, String(user.id)]
    );

    const roleValues: string[] = roleRows.map(
      (r: {role_name:string}) => String(r.role_name)
    );

    const roles: string[] = Array.from(
      new Set<string>(roleValues)
    );

    const permissionValues: Array<string | null> = [
      ...roleRows.map((r: {permission_name:string|null}) => r.permission_name),
      ...directRows.map((r: {permission_name:string}) => r.permission_name),
    ];

    const permissions: string[] = Array.from(
      new Set<string>(
        permissionValues.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0
        )
      )
    );

    return {
      isSuperAdmin: false,
      hasAdminAccess: roles.length > 0 || permissions.length > 0,
      roles,
      permissions,
    };
  } finally {
    await connection.end();
  }
}

export function hasAdminPermission(
  access: AdminAccess,
  required: string | string[]
) {
  if (access.isSuperAdmin) return true;

  const requested = Array.isArray(required) ? required : [required];

  return requested.some(p => access.permissions.includes(p));
}
