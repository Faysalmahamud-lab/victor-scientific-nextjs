import type { Metadata } from "next";
import Link from "next/link";
import { OrderTrackingForm } from "@/components/order-tracking-form";

export const metadata: Metadata = {
  title: "Track Order | Victor Scientific Co.",
  description: "Check your Victor Scientific Co. order status using your invoice number and phone number.",
  robots: { index: false, follow: true },
};

export default function TrackOrderPage() {
  return (
    <main className="tracking-page">
      <div className="container">
        <div className="shop-breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>Track Order</span>
        </div>
        <div className="tracking-heading">
          <span className="shop-section-kicker">ORDER UPDATES</span>
          <h1>Track your order</h1>
          <p>Enter the invoice number and phone number used when placing the order.</p>
        </div>
        <OrderTrackingForm />
      </div>
    </main>
  );
}
