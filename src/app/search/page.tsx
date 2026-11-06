import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getShopPageData } from "@/lib/catalog";
import { StorefrontProductGrid } from "@/components/storefront-product-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search Products | Victor Scientific Co.",
  description: "Search scientific equipment, laboratory instruments and products.",
};

type SearchParams = {
  q?: string | string[];
  page?: string | string[];
  sort?: string | string[];
};

function readValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = readValue(params.q).trim().slice(0, 100);
  const requestedPage = Number(readValue(params.page));
  const sortValue = readValue(params.sort);
  const sort = ["newest", "popular", "price-low", "price-high", "name-asc"].includes(
    sortValue
  ) ? sortValue : "newest";

  const data = query
    ? await getShopPageData({
        query,
        page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
        sort,
        pageSize: 24,
      })
    : null;

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <div className="shop-breadcrumb">
            <Link href="/">Home</Link><span>/</span><span>Search</span>
          </div>
          <div className="shop-hero-content">
            <div>
              <span className="shop-eyebrow">PRODUCT SEARCH</span>
              <h1>Find the right product</h1>
              <p>Search by product name, product code or model number.</p>
            </div>
            <div className="shop-hero-note">
              <Search size={30} />
              <div><strong>Catalogue search</strong><span>Search available products</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-content">
        <div className="container">
          <form action="/search" method="get" className="search-page-form">
            <Search size={19} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search products, code or model..."
              aria-label="Search products"
              maxLength={100}
            />
            <button type="submit">Search</button>
          </form>

          {query ? (
            <>
              <div className="shop-heading-row">
                <div>
                  <span className="shop-section-kicker">SEARCH RESULTS</span>
                  <h2>Results for “{query}”</h2>
                </div>
                <p className="shop-result-count">
                  Found <strong>{data?.total ?? 0}</strong> products
                </p>
              </div>
              <StorefrontProductGrid
                products={data?.products ?? []}
                emptyMessage="No products matched your search. Try a different product name, code or model."
              />
            </>
          ) : (
            <div className="shop-empty-state">
              <p>Enter a product name, code or model number to search the catalogue.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
