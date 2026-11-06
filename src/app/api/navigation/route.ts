import { NextResponse } from "next/server";
import { getBrands, getCategories } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categories, brands] = await Promise.all([
      getCategories(),
      getBrands(),
    ]);

    return NextResponse.json(
      {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        })),
        brands: brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[public-navigation]", error);
    return NextResponse.json(
      { categories: [], brands: [] },
      { status: 200 }
    );
  }
}
