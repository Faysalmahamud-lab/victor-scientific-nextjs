import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function Page() {
  const user = await requireAdmin("category-list");

  return (
    <div className="admin-layout">
      <AdminSidebar email={user.email} />
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Category management</h1>
            <p>Active categories are used by the public storefront.</p>
          </div>
          <span className="admin-status">Read-only</span>
        </div>
        <section className="admin-panel">
          <h2>Category editing is not enabled</h2>
          <p>
            Category browsing is available to customers. Admin create, edit,
            delete, image upload, hierarchy and SEO-field management remain
            pending staging verification.
          </p>
        </section>
      </main>
    </div>
  );
}
