import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const staticPaths = [
  "/",
  "/shop",
  "/brands",
  "/company",
  "/site/contact-us",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = staticPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" as const : "monthly" as const,
    priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.6,
  }));

  if (!prisma) return base;

  try {
    const [products, categories, brands, pages] = await Promise.all([
      prisma.product.findMany({
        where: { status: 1, approval_status: "approved" },
        select: { slug: true, updatedAt: true, createdAt: true },
        take: 10000,
      }),
      prisma.category.findMany({
        where: { status: 1, parentId: 0 },
        select: { slug: true, updatedAt: true, createdAt: true },
        take: 2000,
      }),
      prisma.brand.findMany({
        where: { status: 1 },
        select: { slug: true, updatedAt: true, createdAt: true },
        take: 2000,
      }),
      prisma.createPage.findMany({
        where: { status: 1 },
        select: { slug: true, updatedAt: true, createdAt: true },
        take: 2000,
      }),
    ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...products.map((item) => ({
        url: absoluteUrl(`/product/${item.slug}`),
        lastModified: item.updatedAt || item.createdAt || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories.map((item) => ({
        url: absoluteUrl(`/category/${item.slug}`),
        lastModified: item.updatedAt || item.createdAt || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...brands.map((item) => ({
        url: absoluteUrl(`/brands/${item.slug}`),
        lastModified: item.updatedAt || item.createdAt || new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...pages.map((item) => ({
        url: absoluteUrl(`/page/${item.slug}`),
        lastModified: item.updatedAt || item.createdAt || new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    ];

    return [...base, ...dynamicEntries];
  } catch (error) {
    console.error("[sitemap]", error);
    return base;
  }
}
