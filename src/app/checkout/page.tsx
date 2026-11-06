import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Guest Checkout | Victor Scientific Co.",
  description: "Complete your Victor Scientific Co. order using guest checkout.",
};

export default function CheckoutPage() {
  const checkoutEnabled = process.env.CHECKOUT_ENABLED === "true";

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="shop-breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <Link href="/cart">Cart</Link><span>/</span>
          <span>Guest Checkout</span>
        </div>
        <div className="checkout-page-heading">
          <span className="shop-section-kicker">SECURE ORDER DETAILS</span>
          <h1>Guest Checkout</h1>
          <p>Complete your delivery details. Creating an account is not required.</p>
        </div>
        <CheckoutForm checkoutEnabled={checkoutEnabled} />
      </div>
    </main>
  );
}
