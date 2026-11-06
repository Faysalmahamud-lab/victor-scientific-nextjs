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
  const data = await getShopPageData({ brandSlug: slug, pageSize: 1 });
  const brand = data.brands.find((item) => item.slug === slug);

  return {
    title: brand ? `${brand.name} Products | Victor Scientific Co.` : "Brand",
    description: brand
      ? `Explore ${brand.name} products at Victor Scientific Co.`
      : "Explore scientific product brands.",
  };
}

export default async function BrandDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const pageNumber = Number(query.page);
  const sort: string = ["newest", "popular", "price-low", "price-high", "name-asc"].includes(
    query.sort || ""
  ) ? (query.sort ?? "newest") : "newest";

  const data = await getShopPageData({
    brandSlug: slug,
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    sort,
    pageSize: 24,
  });

  const brand = data.brands.find((item) => item.slug === slug);
  if (!brand) notFound();

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <div className="shop-breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <Link href="/brands">Brands</Link><span>/</span>
            <span>{brand.name}</span>
          </div>
          <div className="shop-hero-content">
            <div>
              <span className="shop-eyebrow">BRAND CATALOGUE</span>
              <h1>{brand.name}</h1>
              <p>Explore available products from {brand.name}.</p>
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
              <span className="shop-section-kicker">PRODUCTS BY BRAND</span>
              <h2>{brand.name}</h2>
            </div>
            <p className="shop-result-count">
              Showing <strong>{data.products.length}</strong> of{" "}
              <strong>{data.total}</strong> products
            </p>
          </div>
          <StorefrontProductGrid
            products={data.products}
            emptyMessage={`No active products are currently listed for ${brand.name}.`}
          />
        </div>
      </section>
    </main>
  );
}
