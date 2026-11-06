import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

import { HomeSlider } from "@/components/home-slider";

import {
  getProducts,
  getCategories,
  getBrands,
  getImageUrl,
  getBannersByCategory,
  getTopSellingProducts,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

type ProductCardData = {
  name: string;
  slug: string;
  newPrice: number;
  oldPrice: number | null;
  stock: number;
  image: string;
  categoryName?: string;
};

const priceFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

function formatPrice(value: number) {
  return `৳ ${priceFormatter.format(value)}`;
}

function ProductCard({
  product,
  badge,
}: {
  product: ProductCardData;
  badge?: string;
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
      className="home-product-card"
    >
      <div className="home-product-media">
        <Image
          src={product.image || "/brand/logo.webp"}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          className="home-product-image"
        />

        {badge && (
          <span className="home-product-badge">
            {badge}
          </span>
        )}

        {discount > 0 && (
          <span className="home-product-discount">
            -{discount}%
          </span>
        )}

        {product.stock <= 0 && (
          <span className="home-stock-badge">
            Out of stock
          </span>
        )}
      </div>

      <div className="home-product-body">
        <span className="home-product-category">
          {product.categoryName || "Scientific Equipment"}
        </span>

        <h3>{product.name}</h3>

        <div className="home-product-price">
          {price > 0 ? (
            <>
              <strong>{formatPrice(price)}</strong>

              {oldPrice > price && (
                <del>{formatPrice(oldPrice)}</del>
              )}
            </>
          ) : (
            <strong className="home-contact-price">
              Contact for price
            </strong>
          )}
        </div>

        <div className="home-product-action">
          View Product
          <ArrowUpRight size={16} />
        </div>
      </div>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText = "View all",
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkText?: string;
}) {
  return (
    <div className="home-section-heading">
      <div>
        <span className="home-kicker">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <Link href={href} className="home-view-all">
        {linkText}
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [
    slides,
    hotDealBanners,
    categories,
    brands,
    latestProducts,
    topSellingProducts,
  ] = await Promise.all([
    getBannersByCategory(1),
    getBannersByCategory(9),
    getCategories(),
    getBrands(),
    getProducts(12),
    getTopSellingProducts(8),
  ]);

  const hotDeal = hotDealBanners[0];

  return (
    <main className="home-page">

      {/* MAIN SLIDER */}

      <section className="home-slider-section">
        <div className="container">
          {slides.length > 0 ? (
            <HomeSlider slides={slides} />
          ) : (
            <div className="home-slider-fallback">
              <span>VICTOR SCIENTIFIC CO.</span>
              <h1>Scientific & Laboratory Equipment</h1>
              <p>
                Explore our range of scientific equipment,
                laboratory instruments and testing solutions.
              </p>
              <Link href="/shop" className="button button-primary">
                Explore Products
                <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* INTRODUCTION */}

      <section className="home-intro-section">
        <div className="container home-intro">
          <div>
            <span className="home-kicker">
              WELCOME TO VICTOR SCIENTIFIC CO.
            </span>

            <h1>
              Scientific Equipment & Laboratory Solutions
            </h1>

            <p>
              Discover laboratory equipment, chemicals,
              testing instruments, educational models and
              scientific products from leading brands.
            </p>
          </div>

          <Link href="/shop" className="home-intro-button">
            <ShoppingBag size={18} />
            Browse All Products
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}

      {categories.length > 0 && (
        <section className="home-section">
          <div className="container">

            <SectionHeading
              eyebrow="Explore Categories"
              title="Shop by Category"
              description="Explore our scientific products across different equipment and laboratory categories."
              href="/shop"
              linkText="All Products"
            />

            <div className="home-category-grid">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="home-category-card"
                >
                  <div className="home-category-art">
                    <Image
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      fill
                      unoptimized
                      sizes="(max-width: 600px) 40vw, 180px"
                    />
                  </div>

                  <h3>{category.name}</h3>

                  <span>
                    Explore Category
                    <ChevronRight size={15} />
                  </span>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* HOT DEALS BANNER */}

      {hotDeal && (
        <section className="home-hot-section">
          <div className="container">
            <a
              href={hotDeal.link || "/shop"}
              className="home-hot-banner"
              aria-label="Explore Victor Scientific hot deals"
            >
              <Image
                src={hotDeal.image}
                alt="Victor Scientific Hot Deals"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 1180px"
              />
            </a>
          </div>
        </section>
      )}

      {/* TOP SELLING */}

      {topSellingProducts.length > 0 && (
        <section className="home-section home-section-soft">
          <div className="container">

            <SectionHeading
              eyebrow="Popular Selection"
              title="Top Selling Products"
              description="Explore products marked as top selling in our catalogue."
              href="/shop"
            />

            <div className="home-product-grid">
              {topSellingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  badge="Top Selling"
                />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* LATEST PRODUCTS */}

      {latestProducts.length > 0 && (
        <section className="home-section">
          <div className="container">

            <SectionHeading
              eyebrow="Recently Added"
              title="Latest Products"
              description="Browse the latest products added to the Victor Scientific catalogue."
              href="/shop"
              linkText="Shop All Products"
            />

            <div className="home-product-grid">
              {latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  badge="New Arrival"
                />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* BRANDS */}

      {brands.length > 0 && (
        <section className="home-section home-section-soft">
          <div className="container">

            <SectionHeading
              eyebrow="Our Brand Partners"
              title="Popular Brands"
              description="Explore products from the brands available in our catalogue."
              href="/brands"
              linkText="View All Brands"
            />

            <div className="home-brand-grid">
              {brands.slice(0, 15).map((brand) => (
                <Link
                  key={brand.id}
                  href="/brands"
                  className="home-brand-card"
                  title={`Explore ${brand.name} products`}
                >
                  <Image
                    src={getImageUrl(brand.image)}
                    alt={brand.name}
                    width={150}
                    height={65}
                    unoptimized
                  />
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* CONTACT CTA */}

      <section className="home-section">
        <div className="container">
          <div className="home-contact-panel">
            <div>
              <span className="home-kicker">
                NEED ASSISTANCE?
              </span>

              <h2>
                Looking for Scientific Equipment?
              </h2>

              <p>
                Contact Victor Scientific Co. for product
                information and general enquiries.
              </p>
            </div>

            <Link
              href="/site/contact-us"
              className="home-contact-button"
            >
              Contact Us
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
