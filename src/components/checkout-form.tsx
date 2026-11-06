"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, LockKeyhole, PackageCheck } from "lucide-react";
import { useCart } from "@/lib/cart-store";

function formatPrice(value: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function CheckoutForm({
  checkoutEnabled,
}: {
  checkoutEnabled: boolean;
}) {
  const router = useRouter();
  const { items, count, subtotal, clear } = useCart();
  const [deliveryZone, setDeliveryZone] = useState<"dhaka" | "outside-dhaka">("dhaka");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const shippingCharge = deliveryZone === "dhaka" ? 80 : 150;
  const total = subtotal + shippingCharge;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!checkoutEnabled) {
      setError("Checkout is not enabled until the staging order workflow is verified.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      district: String(form.get("district") || ""),
      area: String(form.get("area") || ""),
      address: String(form.get("address") || ""),
      deliveryZone,
      note: String(form.get("note") || ""),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    setBusy(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "The order could not be placed.");
        return;
      }

      clear();
      router.push(`/order-confirmation?invoice=${encodeURIComponent(result.invoiceId)}`);
    } catch {
      setError("Unable to connect to the order service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <section className="checkout-empty">
        <PackageCheck size={34} />
        <h2>Your cart is empty</h2>
        <p>Add products before proceeding to checkout.</p>
        <Link href="/shop" className="button button-primary">Browse products</Link>
      </section>
    );
  }

  return (
    <form className="checkout-layout" onSubmit={submit}>
      <section className="checkout-form-panel">
        <div className="checkout-section-heading">
          <span>01</span>
          <div><h2>Delivery information</h2><p>Guest checkout. No account registration is required.</p></div>
        </div>

        {error && (
          <div className="checkout-alert" role="alert">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        {!checkoutEnabled && (
          <div className="checkout-disabled-note" role="status">
            <LockKeyhole size={18} />
            <span>
              Checkout is currently locked while the legacy order status and customer records are verified on staging. Do not enable it on production yet.
            </span>
          </div>
        )}

        <div className="checkout-fields">
          <label>
            Full name
            <input name="name" required minLength={2} maxLength={155} autoComplete="name" />
          </label>
          <label>
            Phone number
            <input name="phone" required minLength={7} maxLength={25} autoComplete="tel" />
          </label>
          <label>
            Email address <span>(optional)</span>
            <input name="email" type="email" maxLength={55} autoComplete="email" />
          </label>
          <label>
            District
            <input name="district" required maxLength={100} autoComplete="address-level1" />
          </label>
          <label>
            Area / Thana
            <input name="area" required maxLength={256} autoComplete="address-level2" />
          </label>
          <label className="checkout-field-full">
            Full delivery address
            <textarea name="address" required minLength={5} maxLength={256} rows={3} autoComplete="street-address" />
          </label>
          <label className="checkout-field-full">
            Order note <span>(optional)</span>
            <textarea name="note" maxLength={1000} rows={2} />
          </label>
        </div>

        <div className="checkout-section-heading checkout-delivery-heading">
          <span>02</span>
          <div><h2>Delivery zone</h2><p>One flat standard delivery charge per order.</p></div>
        </div>

        <div className="checkout-zone-options">
          <label className={deliveryZone === "dhaka" ? "is-selected" : ""}>
            <input
              type="radio"
              name="deliveryZone"
              value="dhaka"
              checked={deliveryZone === "dhaka"}
              onChange={() => setDeliveryZone("dhaka")}
            />
            <span><strong>Inside Dhaka</strong><small>৳80 delivery charge</small></span>
          </label>
          <label className={deliveryZone === "outside-dhaka" ? "is-selected" : ""}>
            <input
              type="radio"
              name="deliveryZone"
              value="outside-dhaka"
              checked={deliveryZone === "outside-dhaka"}
              onChange={() => setDeliveryZone("outside-dhaka")}
            />
            <span><strong>Outside Dhaka</strong><small>৳150 delivery charge</small></span>
          </label>
        </div>

        <div className="checkout-policy-note">
          For oversized or heavy products, the team will contact you to discuss and confirm any additional delivery cost before processing. No automatic surcharge is added.
        </div>

        <div className="checkout-payment-note">
          <CheckCircle2 size={18} />
          <div><strong>Cash on Delivery</strong><span>Payment method shown for the initial guest checkout flow.</span></div>
        </div>

        <button
          type="submit"
          className="checkout-submit-button"
          disabled={busy || !checkoutEnabled}
        >
          {busy ? "Submitting order..." : "Place order"}
        </button>
      </section>

      <aside className="checkout-summary-panel">
        <h2>Order summary</h2>
        <p>{count} item{count === 1 ? "" : "s"}</p>
        <div className="checkout-summary-items">
          {items.map((item) => (
            <div key={item.productId}>
              <span>{item.name} × {item.quantity}</span>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="checkout-summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className="checkout-summary-row"><span>Delivery</span><strong>{formatPrice(shippingCharge)}</strong></div>
        <div className="checkout-summary-total"><span>Total payable</span><strong>{formatPrice(total)}</strong></div>
        <p className="checkout-summary-footnote">Prices are revalidated against the current database before an order is accepted.</p>
      </aside>
    </form>
  );
}
