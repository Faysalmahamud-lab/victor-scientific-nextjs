import Link from "next/link";
import {
  Activity,
  ChartNoAxesCombined,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Package,
  Tags,
  Building2,
} from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-rbac";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/catalog", label: "Products", icon: Package, permissions: ["product-list"] },
  { href: "/admin/categories", label: "Categories", icon: Tags, permissions: ["category-list"] },
  { href: "/admin/brands", label: "Brands", icon: Building2, permissions: ["brand-list"] },
  { href: "/admin/pages", label: "Content pages", icon: FileText, permissions: ["page-list"] },
  { href: "/admin/seo", label: "SEO controls", icon: Search, permissions: ["seo-manage"] },
  { href: "/admin/analytics", label: "Analytics & Pixels", icon: ChartNoAxesCombined, permissions: ["report-view", "pixel-manage"] },
  { href: "/admin/users", label: "Admin access", icon: Users, permissions: ["operator-list"] },
  { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, permissions: ["role-list"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, permissions: ["setting-list"] },
];

export async function AdminSidebar({ email }: { email: string }) {
  const session = await getAdminSession();
  const access = session
    ? await getAdminAccess(session).catch(() => null)
    : null;

  const visibleItems = items.filter(item => {
    if (!item.permissions) return true;
    if (access?.isSuperAdmin) return true;

    return item.permissions.some(permission =>
      access?.permissions.includes(permission)
    );
  });

  const roleLabel = access?.isSuperAdmin
    ? "Super Admin"
    : access?.roles.join(", ") || "Administrator";

  return (
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand">
        VSC <span>Control centre</span>
      </Link>

      <nav>
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="admin-user">
        <span className="admin-avatar">
          {email.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{roleLabel}</strong>
          <small>{email}</small>
        </div>
      </div>

      <form action="/api/admin/logout" method="post">
        <button className="admin-logout">
          <LogOut size={16} />
          Sign out
        </button>
      </form>

      <span className="admin-build">
        <Activity size={13} /> Next.js Control Centre
      </span>
    </aside>
  );
}
