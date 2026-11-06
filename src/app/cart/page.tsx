"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";

function formatPrice(value: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default function CartPage() {
  const { items, count, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <main className="cart-page">
      <div className="container">
        <div className="shop-breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>Shopping Cart</span>
        </div>
        <div className="cart-heading">
          <div>
            <span className="shop-section-kicker">YOUR SELECTION</span>
            <h1>Shopping Cart</h1>
            <p>{count} item{count === 1 ? "" : "s"} in your cart</p>
          </div>
          <Link href="/shop" className="cart-continue-link">Continue shopping</Link>
        </div>

        {!items.length ? (
          <section className="cart-empty">
            <span><ShoppingBag size={30} /></span>
            <h2>Your cart is empty</h2>
            <p>Explore the catalogue and add products to your cart.</p>
            <Link href="/shop" className="button button-primary">Browse products</Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items-panel">
              {items.map((item) => (
                <article className="cart-item" key={item.productId}>
                  <Link href={`/product/${item.slug}`} className="cart-item-image">
                    <Image src={item.image} alt={item.name} fill unoptimized sizes="110px" />
                  </Link>
                  <div className="cart-item-info">
                    <Link href={`/product/${item.slug}`} className="cart-item-name">{item.name}</Link>
                    <strong>{formatPrice(item.price)}</strong>
                    <span className="cart-item-stock">
                      {item.stock > 0 ? `${item.stock} available` : "Stock unavailable"}
                    </span>
                    <div className="cart-item-controls">
                      <div className="cart-quantity-control">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        ><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={item.quantity >= item.stock}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        ><Plus size={14} /></button>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-button"
                        onClick={() => removeItem(item.productId)}
                      ><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                  <strong className="cart-item-total">{formatPrice(item.price * item.quantity)}</strong>
                </article>
              ))}
            </section>

            <aside className="cart-summary-panel">
              <h2>Order Summary</h2>
              <div><span>Subtotal ({count} items)</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Delivery</span><strong>Calculated at checkout</strong></div>
              <div className="cart-summary-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <Link href="/checkout" className="cart-checkout-button">Proceed to checkout</Link>
              <p>Guest checkout is supported. You do not need to create an account to place an order.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
