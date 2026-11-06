import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Package,
} from "lucide-react";

import { getProductDetailsBySlug } from "@/lib/catalog";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function formatPrice(value: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function cleanContent(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetailsBySlug(slug);

  if (!product) return { title: "Product not found" };

  const description = cleanContent(product.description).slice(0, 160) ||
    `Explore ${product.name} at Victor Scientific Co.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductDetailsBySlug(slug);

  if (!product) notFound();

  const description = cleanContent(product.description);
  const specifications = cleanContent(
    product.technical_specifications
  );

  const details = [
    ["Product code", product.productCode],
    ["Model number", product.model_number],
    ["Origin", product.origin],
    ["Capacity", product.capacity],
    ["Warranty", product.warranty],
  ].filter((item) => Boolean(item[1]));

  return (
    <main className="product-detail-page">
      <div className="container">
        <div className="product-detail-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">Shop</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <Link href="/shop" className="product-back-link">
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <section className="product-detail-layout">
          <ProductGallery
            images={product.images.length ? product.images : [product.image]}
            productName={product.name}
          />

          <div className="product-detail-info">
            <span className="product-detail-kicker">
              {product.categoryName}
            </span>

            <h1>{product.name}</h1>

            {product.brandName && (
              <p className="product-detail-brand">
                Brand: <strong>{product.brandName}</strong>
              </p>
            )}

            <div className="product-detail-price">
              {product.newPrice > 0 ? (
                <>
                  <strong>{formatPrice(product.newPrice)}</strong>
                  {product.oldPrice !== null &&
                    product.oldPrice > product.newPrice && (
                      <del>{formatPrice(product.oldPrice)}</del>
                    )}
                </>
              ) : (
                <strong className="shop-contact-price">
                  Contact for price
                </strong>
              )}
            </div>

            <div className="product-stock-line">
              {product.stock > 0 ? (
                <>
                  <CheckCircle2 size={17} />
                  <span>In stock</span>
                </>
              ) : (
                <>
                  <Package size={17} />
                  <span>Currently out of stock</span>
                </>
              )}
            </div>

            {details.length > 0 && (
              <div className="product-detail-spec-list">
                {details.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}

            {product.datasheetUrl && (
              <a
                href={product.datasheetUrl}
                target="_blank"
                rel="noreferrer"
                className="product-datasheet-link"
              >
                <FileText size={17} />
                View product datasheet
                <ArrowUpRight size={15} />
              </a>
            )}

            <ProductPurchaseActions
              productId={product.id}
              slug={product.slug}
              name={product.name}
              image={product.image}
              price={product.newPrice}
              stock={product.stock}
            />

            <Link
              href="/site/contact-us"
              className="product-enquiry-button"
            >
              Enquire about this product
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        {(description || specifications) && (
          <section className="product-detail-content">
            {description && (
              <article className="product-content-panel">
                <h2>Product Description</h2>
                <div className="product-readable-content">
                  {description}
                </div>
              </article>
            )}

            {specifications && (
              <article className="product-content-panel">
                <h2>Technical Specifications</h2>
                <div className="product-readable-content">
                  {specifications}
                </div>
              </article>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
