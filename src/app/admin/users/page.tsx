import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import OperatorManagementClient from "./operator-management-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireAdmin("operator-list");

  return (
    <div className="admin-layout">
      <AdminSidebar email={user.email} />

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Admin Access</h1>
            <p>
              Manage administrator accounts and operational access.
            </p>
          </div>

          <span className="admin-status">Access Control</span>
        </div>

        <OperatorManagementClient />
      </main>
    </div>
  );
}
