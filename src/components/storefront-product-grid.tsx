import { StorefrontProductCard, type StorefrontProduct } from "@/components/storefront-product-card";

export function StorefrontProductGrid({
  products,
  emptyMessage = "No products match your selection.",
}: {
  products: StorefrontProduct[];
  emptyMessage?: string;
}) {
  if (!products.length) {
    return (
      <div className="shop-empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="shop-product-grid">
      {products.map((product) => (
        <StorefrontProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
