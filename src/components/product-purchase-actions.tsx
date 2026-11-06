"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-store";

type Props = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  stock: number;
};

export function ProductPurchaseActions(props: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const unavailable = props.stock <= 0 || props.price <= 0;

  function addToCart(goToCart = false) {
    if (unavailable) return;

    addItem({
      productId: props.productId,
      slug: props.slug,
      name: props.name,
      image: props.image,
      price: props.price,
      stock: props.stock,
    });

    setAdded(true);

    if (goToCart) {
      router.push("/cart");
    } else {
      window.setTimeout(() => setAdded(false), 1600);
    }
  }

  return (
    <div className="product-purchase-actions">
      <button
        type="button"
        className="product-add-cart-button"
        disabled={unavailable}
        onClick={() => addToCart(false)}
      >
        {added ? <Check size={17} /> : <ShoppingBag size={17} />}
        {unavailable ? "Currently unavailable" : added ? "Added to cart" : "Add to cart"}
      </button>
      <button
        type="button"
        className="product-buy-now-button"
        disabled={unavailable}
        onClick={() => addToCart(true)}
      >
        <Zap size={17} />
        Buy now
      </button>
    </div>
  );
}
