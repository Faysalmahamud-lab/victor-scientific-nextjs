import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import RoleManagementClient from "./role-management-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const user = await requireAdmin("role-list");

  return (
    <div className="admin-layout">
      <AdminSidebar email={user.email} />

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Roles & Permissions</h1>
            <p>
              Manage administrator roles and access permissions.
            </p>
          </div>

          <span className="admin-status">
            <ShieldCheck size={14} />
            Access Control
          </span>
        </div>

        <RoleManagementClient />
      </main>
    </div>
  );
}
