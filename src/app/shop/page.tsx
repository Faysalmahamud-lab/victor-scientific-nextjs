import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { getShopPageData } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop Scientific & Laboratory Products | Victor Scientific Co.",
  description:
    "Explore scientific equipment, laboratory instruments, chemicals, testing meters and educational products at Victor Scientific Co.",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type ShopProduct = Awaited<
  ReturnType<typeof getShopPageData>
>["products"][number];

const priceFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

function formatPrice(value: number) {
  return `৳ ${priceFormatter.format(value)}`;
}

function readParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function ProductCard({ product }: { product: ShopProduct }) {
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
        <span className="shop-product-category">
          {product.categoryName}
        </span>

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
              {oldPrice > price && (
                <del>{formatPrice(oldPrice)}</del>
              )}
            </>
          ) : (
            <strong className="shop-contact-price">
              Contact for price
            </strong>
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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const query = readParam(params.q).trim().slice(0, 100);
  const categorySlug = readParam(params.category);
  const brandSlug = readParam(params.brand);

  const requestedSort = readParam(params.sort);
  const allowedSorts = [
    "newest",
    "popular",
    "price-low",
    "price-high",
    "name-asc",
  ];
  const sort = allowedSorts.includes(requestedSort)
    ? requestedSort
    : "newest";

  const requestedPage = Number(readParam(params.page));
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const data = await getShopPageData({
    page,
    query,
    categorySlug,
    brandSlug,
    sort,
    pageSize: 24,
  });

  const hasFilters =
    Boolean(query || categorySlug || brandSlug || sort !== "newest");

  function pageHref(nextPage: number) {
    const search = new URLSearchParams();

    if (query) search.set("q", query);
    if (categorySlug) search.set("category", categorySlug);
    if (brandSlug) search.set("brand", brandSlug);
    if (sort !== "newest") search.set("sort", sort);

    search.set("page", String(nextPage));

    return `/shop?${search.toString()}`;
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <div className="shop-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Shop</span>
          </div>

          <div className="shop-hero-content">
            <div>
              <span className="shop-eyebrow">
                VICTOR SCIENTIFIC CO.
              </span>
              <h1>Scientific & Laboratory Products</h1>
              <p>
                Explore laboratory equipment, scientific instruments,
                chemicals, testing meters and educational products
                from our catalogue.
              </p>
            </div>

            <div className="shop-hero-note">
              <PackageSearch size={30} />
              <div>
                <strong>Product Catalogue</strong>
                <span>Browse available products</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-content">
        <div className="container">
          <div className="shop-heading-row">
            <div>
              <span className="shop-section-kicker">
                EXPLORE OUR CATALOGUE
              </span>
              <h2>Shop Products</h2>
            </div>

            <p className="shop-result-count">
              Showing <strong>{data.products.length}</strong> of{" "}
              <strong>{data.total}</strong> products
            </p>
          </div>

          <form
            action="/shop"
            method="get"
            className="shop-filter-form"
          >
            <label className="shop-search-field">
              <Search size={18} />
              <input
                type="search"
                name="q"
                placeholder="Search products, code or model..."
                defaultValue={query}
                maxLength={100}
              />
            </label>

            <label className="shop-filter-select">
              <span>Category</span>
              <select name="category" defaultValue={categorySlug}>
                <option value="">All categories</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop-filter-select">
              <span>Brand</span>
              <select name="brand" defaultValue={brandSlug}>
                <option value="">All brands</option>
                {data.brands.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop-filter-select">
              <span>Sort by</span>
              <select name="sort" defaultValue={sort}>
                <option value="newest">Newest first</option>
                <option value="popular">Popular products</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </label>

            <button type="submit" className="shop-filter-button">
              <SlidersHorizontal size={17} />
              Apply
            </button>

            {hasFilters && (
              <Link href="/shop" className="shop-clear-filters">
                Clear filters
              </Link>
            )}
          </form>

          {data.products.length > 0 ? (
            <div className="shop-product-grid">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="shop-empty-state">
              <PackageSearch size={42} />
              <h2>No products found</h2>
              <p>
                No products match the selected search or filters.
                Try another keyword or clear the filters.
              </p>
              <Link href="/shop" className="shop-empty-button">
                View all products
              </Link>
            </div>
          )}

          {data.totalPages > 1 && (
            <nav className="shop-pagination" aria-label="Shop pagination">
              {data.page > 1 ? (
                <Link
                  href={pageHref(data.page - 1)}
                  className="shop-page-link"
                >
                  <ChevronLeft size={17} />
                  Previous
                </Link>
              ) : (
                <span className="shop-page-link is-disabled">
                  <ChevronLeft size={17} />
                  Previous
                </span>
              )}

              <span className="shop-page-status">
                Page <strong>{data.page}</strong> of{" "}
                <strong>{data.totalPages}</strong>
              </span>

              {data.page < data.totalPages ? (
                <Link
                  href={pageHref(data.page + 1)}
                  className="shop-page-link"
                >
                  Next
                  <ChevronRight size={17} />
                </Link>
              ) : (
                <span className="shop-page-link is-disabled">
                  Next
                  <ChevronRight size={17} />
                </span>
              )}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
