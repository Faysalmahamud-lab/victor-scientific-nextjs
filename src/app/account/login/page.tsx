import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Account | Victor Scientific Co.",
  description: "Customer account access for Victor Scientific Co.",
  robots: { index: false, follow: false },
};

export default function CustomerLoginPage() {
  return (
    <main className="account-access-page">
      <section className="account-access-card">
        <span className="account-access-icon"><ShieldCheck size={28} /></span>
        <span className="shop-section-kicker">CUSTOMER ACCOUNT</span>
        <h1>Account access is being prepared</h1>
        <p>
          Existing customer account sign-in is part of the legacy account migration.
          It will be enabled after password compatibility and account verification are tested.
        </p>
        <Link href="/shop" className="button button-primary">
          <ShoppingBag size={17} /> Continue shopping
        </Link>
        <p className="account-guest-note">
          You can continue as a guest when checkout is enabled. No registration will be required.
        </p>
      </section>
    </main>
  );
}
