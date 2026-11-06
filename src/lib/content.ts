import { prisma } from "@/lib/db";

export async function getPublishedPage(slug: string) {
  if (!prisma) return null;
  return prisma.createPage.findFirst({ where: { slug, status: 1 } });
}

export async function getPublishedPages() {
  if (!prisma) return [];
  return prisma.createPage.findMany({ where: { status: 1 }, select: { title: true, slug: true }, orderBy: { id: "asc" } });
}

export async function getBrands() {
  if (!prisma) return [];
  return prisma.brand.findMany({ where: { status: 1 }, select: { id: true, name: true, slug: true, image: true }, orderBy: { name: "asc" }, take: 100 });
}
