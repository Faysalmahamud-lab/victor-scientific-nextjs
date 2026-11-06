import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { prisma } from "@/lib/db";
import {
  Activity,
  ChartNoAxesCombined,
  FileText,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  let pageCount = 0;
  if (prisma) {
    try {
      pageCount = await prisma.createPage.count({ where: { status: 1 } });
    } catch {
      pageCount = 0;
    }
  }

  const cards = [
    {
      icon: FileText,
      title: "Published CMS pages",
      value: String(pageCount),
      note: "Published legacy content records",
    },
    {
      icon: PackageCheck,
      title: "Storefront",
      value: "Browsing enabled",
      note: "Shop, search, category, brand and product pages",
    },
    {
      icon: ChartNoAxesCombined,
      title: "Analytics",
      value: "Consent-gated",
      note: "GTM and Meta Pixel remain optional",
    },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar email={user.email} />
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Control centre</h1>
            <p>Website overview and migration status</p>
          </div>
          <span className="admin-status">Authenticated</span>
        </div>

        <div className="admin-card-grid">
          {cards.map((card) => (
            <article className="admin-card" key={card.title}>
              <card.icon size={20} />
              <h3>{card.title}</h3>
              <strong style={{ fontSize: 24 }}>{card.value}</strong>
              <p>{card.note}</p>
            </article>
          ))}
        </div>

        <section className="admin-panel">
          <h2>Migration readiness</h2>
          <p>
            <ShieldCheck
              size={15}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: 7,
                color: "#0b9b91",
              }}
            />
            Admin authentication, operator management and role/permission
            management are available. Product, category and brand editing
            screens are not enabled yet.
          </p>
          <p>
            <Activity
              size={15}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: 7,
                color: "#0b9b91",
              }}
            />
            Cart and guest-checkout interfaces are present. Order creation
            remains locked until the legacy customer status, pending order
            status, stock policy and admin order workflow are verified on staging.
          </p>
        </section>

        <section className="admin-panel">
          <h2>Configuration checklist</h2>
          <table className="admin-table">
            <tbody>
              <tr>
                <td>Database connection</td>
                <td>{prisma ? "Configured" : "Pending"}</td>
              </tr>
              <tr>
                <td>Admin email allowlist</td>
                <td>{process.env.ADMIN_ALLOWED_EMAILS ? "Configured" : "Pending"}</td>
              </tr>
              <tr>
                <td>Checkout API</td>
                <td>{process.env.CHECKOUT_ENABLED === "true" ? "Enabled - verify staging" : "Locked"}</td>
              </tr>
              <tr>
                <td>Production cutover</td>
                <td>Blocked pending full acceptance testing</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
