import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function Page() {
  const user = await requireAdmin("product-list");

  return (
    <div className="admin-layout">
      <AdminSidebar email={user.email} />
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Product catalogue</h1>
            <p>Public product browsing is enabled. Product editing is still being migrated.</p>
          </div>
          <span className="admin-status">Read-only</span>
        </div>
        <section className="admin-panel">
          <h2>Product management is not enabled</h2>
          <p>
            Customers can browse active products on the storefront. Create,
            edit, delete, media upload, stock adjustment and bulk import
            operations must be implemented and tested before this admin module
            can write to the staging database.
          </p>
        </section>
      </main>
    </div>
  );
}
