import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Confirmation | Victor Scientific Co.",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>;
}) {
  const { invoice } = await searchParams;

  return (
    <main className="order-confirmation-page">
      <section className="order-confirmation-card">
        <span className="order-confirmation-icon"><CheckCircle2 size={34} /></span>
        <span className="shop-section-kicker">ORDER RECEIVED</span>
        <h1>Thank you for your order</h1>
        <p>Your order request has been submitted.</p>
        {invoice ? (
          <div className="order-confirmation-invoice">
            <span>Invoice number</span>
            <strong>{invoice}</strong>
          </div>
        ) : (
          <p>Use your invoice number and phone number to track an order.</p>
        )}
        <div className="order-confirmation-actions">
          <Link href="/track-order" className="button button-primary">Track order</Link>
          <Link href="/shop" className="button button-quiet">Continue shopping</Link>
        </div>
      </section>
    </main>
  );
}
