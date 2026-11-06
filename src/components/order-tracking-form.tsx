"use client";

import { useState } from "react";
import { AlertCircle, PackageCheck, Search } from "lucide-react";

type OrderResult = {
  invoiceId: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  createdAt: string | null;
};

function formatPrice(value: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function OrderTrackingForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/order-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: String(form.get("invoiceId") || ""),
          phone: String(form.get("phone") || ""),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Order could not be found.");
        return;
      }

      setOrder(result.order as OrderResult);
    } catch {
      setError("Unable to connect to the tracking service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tracking-card">
      <form className="tracking-form" onSubmit={submit}>
        <label>
          Invoice number
          <input name="invoiceId" required minLength={5} maxLength={55} placeholder="Example: VSC-..." />
        </label>
        <label>
          Phone number used for the order
          <input name="phone" required minLength={7} maxLength={25} placeholder="01XXXXXXXXX" />
        </label>
        {error && <p className="tracking-error" role="alert"><AlertCircle size={16} />{error}</p>}
        <button type="submit" disabled={busy}>
          <Search size={17} /> {busy ? "Checking order..." : "Track order"}
        </button>
      </form>

      {order && (
        <section className="tracking-result" aria-live="polite">
          <span className="tracking-result-icon"><PackageCheck size={23} /></span>
          <span className="shop-section-kicker">ORDER STATUS</span>
          <h2>{order.status}</h2>
          <p className="tracking-invoice">{order.invoiceId}</p>
          <div><span>Payment</span><strong>{order.paymentStatus}</strong></div>
          <div><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></div>
          <div><span>Discount</span><strong>{formatPrice(order.discount)}</strong></div>
          <div><span>Delivery</span><strong>{formatPrice(order.shippingCharge)}</strong></div>
          <div className="tracking-total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
        </section>
      )}
    </div>
  );
}
