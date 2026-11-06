import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function Page() {
  const user = await requireAdmin("brand-list");

  return (
    <div className="admin-layout">
      <AdminSidebar email={user.email} />
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Brand management</h1>
            <p>Active brands are available in the public brand directory.</p>
          </div>
          <span className="admin-status">Read-only</span>
        </div>
        <section className="admin-panel">
          <h2>Brand editing is not enabled</h2>
          <p>
            Brand browsing is available to customers. Admin create, edit,
            delete, logo upload and product assignment operations remain
            pending staging verification.
          </p>
        </section>
      </main>
    </div>
  );
}
