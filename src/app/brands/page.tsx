import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { getBrands, getImageUrl } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Brands | Victor Scientific Co.",
  description: "Explore scientific equipment and laboratory product brands available from Victor Scientific Co.",
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <div className="shop-breadcrumb">
            <Link href="/">Home</Link><span>/</span><span>Brands</span>
          </div>
          <div className="shop-hero-content">
            <div>
              <span className="shop-eyebrow">OUR BRAND DIRECTORY</span>
              <h1>Explore Our Brands</h1>
              <p>Browse available scientific and laboratory product brands.</p>
            </div>
            <div className="shop-hero-note">
              <Building2 size={30} />
              <div><strong>{brands.length}</strong><span>Active brands</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-content">
        <div className="container">
          <div className="shop-heading-row">
            <div>
              <span className="shop-section-kicker">BRAND DIRECTORY</span>
              <h2>Available Brands</h2>
            </div>
          </div>

          {brands.length ? (
            <div className="brand-directory-grid">
              {brands.map((brand) => (
                <Link
                  href={`/brands/${brand.slug}`}
                  className="brand-directory-card"
                  key={brand.id}
                >
                  <span className="brand-directory-image">
                    <Image
                      src={getImageUrl(brand.image)}
                      alt={brand.name}
                      fill
                      unoptimized
                      sizes="(max-width: 600px) 40vw, 160px"
                    />
                  </span>
                  <strong>{brand.name}</strong>
                  <span className="brand-directory-link">
                    View products <ArrowUpRight size={15} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="shop-empty-state">
              <p>No active brands are currently available.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
