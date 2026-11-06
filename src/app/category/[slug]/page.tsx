import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopPageData } from "@/lib/catalog";
import { StorefrontProductGrid } from "@/components/storefront-product-grid";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getShopPageData({ categorySlug: slug, pageSize: 1 });
  const category = data.categories.find((item) => item.slug === slug);

  return {
    title: category ? `${category.name} | Victor Scientific Co.` : "Category",
    description: category
      ? `Explore ${category.name} products at Victor Scientific Co.`
      : "Explore scientific products at Victor Scientific Co.",
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const pageNumber = Number(query.page);
  const sort: string = ["newest", "popular", "price-low", "price-high", "name-asc"].includes(
    query.sort || ""
  ) ? (query.sort ?? "newest") : "newest";

  const data = await getShopPageData({
    categorySlug: slug,
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    sort,
    pageSize: 24,
  });

  const category = data.categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <div className="shop-breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <Link href="/shop">Shop</Link><span>/</span>
            <span>{category.name}</span>
          </div>
          <div className="shop-hero-content">
            <div>
              <span className="shop-eyebrow">SHOP BY CATEGORY</span>
              <h1>{category.name}</h1>
              <p>Browse available products in this category from Victor Scientific Co.</p>
            </div>
            <div className="shop-hero-note">
              <strong>{data.total}</strong>
              <span>Available products</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-content">
        <div className="container">
          <div className="shop-heading-row">
            <div>
              <span className="shop-section-kicker">CATEGORY CATALOGUE</span>
              <h2>{category.name} Products</h2>
            </div>
            <p className="shop-result-count">
              Showing <strong>{data.products.length}</strong> of{" "}
              <strong>{data.total}</strong> products
            </p>
          </div>
          <StorefrontProductGrid
            products={data.products}
            emptyMessage="No active products are currently listed in this category."
          />
        </div>
      </section>
    </main>
  );
}
