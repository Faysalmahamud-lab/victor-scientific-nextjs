import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type StorefrontProduct = {
  id: string;
  name: string;
  slug: string;
  newPrice: number;
  oldPrice: number | null;
  stock: number;
  image: string;
  categoryName?: string;
  brandName?: string;
  topsale?: number | null;
};

function formatPrice(value: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function StorefrontProductCard({
  product,
}: {
  product: StorefrontProduct;
}) {
  const price = Number(product.newPrice || 0);
  const oldPrice = Number(product.oldPrice || 0);
  const discount =
    price > 0 && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="shop-product-card"
      aria-label={`View ${product.name}`}
    >
      <div className="shop-product-image-wrap">
        <Image
          src={product.image || "/brand/logo.webp"}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          className="shop-product-image"
        />

        {product.topsale === 1 && (
          <span className="shop-product-badge">Popular</span>
        )}

        {discount > 0 && (
          <span className="shop-product-discount">-{discount}%</span>
        )}

        {product.stock <= 0 && (
          <span className="shop-product-stock">Out of stock</span>
        )}
      </div>

      <div className="shop-product-body">
        {product.categoryName && (
          <span className="shop-product-category">
            {product.categoryName}
          </span>
        )}

        <h3>{product.name}</h3>

        {product.brandName && (
          <span className="shop-product-brand">
            Brand: {product.brandName}
          </span>
        )}

        <div className="shop-product-pricing">
          {price > 0 ? (
            <>
              <strong>{formatPrice(price)}</strong>
              {oldPrice > price && <del>{formatPrice(oldPrice)}</del>}
            </>
          ) : (
            <strong className="shop-contact-price">Contact for price</strong>
          )}
        </div>

        <span className="shop-product-action">
          View product
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
