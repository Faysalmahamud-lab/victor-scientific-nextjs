import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="admin-main">
      <section className="admin-panel">
        <h1>Access Restricted</h1>
        <p>
          Your account does not have permission to access this section.
          Contact the Super Admin if you need additional access.
        </p>
        <Link href="/admin">Return to Dashboard</Link>
      </section>
    </main>
  );
}
