import { prisma } from "@/lib/db";

export function catalogueIsEnabled(): boolean {
  return Boolean(prisma);
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/brand/logo.webp";

  if (/^https?:\/\//i.test(path)) return path;

  const clean = path
    .replace(/^\/+/, "")
    .replace(/^public\//, "");

  // Encode each path segment so legacy filenames containing spaces,
  // ampersands, percent signs or # characters resolve as real file paths.
  const encoded = clean
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /%25([0-9A-F]{2})/gi,
        "%$1"
      )
    )
    .join("/");

  return `/${encoded}`;
}

export async function getProducts(limit = 24) {
  if (!prisma) return [];

  const products = await prisma.product.findMany({
    where: {
      status: 1,
      approval_status: "approved",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      subcategoryId: true,
      brandId: true,
      oldPrice: true,
      newPrice: true,
      stock: true,
      ratting: true,
      description: true,
      model_number: true,
      origin: true,
      capacity: true,
      warranty: true,
      technical_specifications: true,
      datasheet_path: true,
      createdAt: true,
      featureProduct: true,
      topsale: true,
      flashsale: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: Math.min(Math.max(limit, 1), 100),
  });

  if (!products.length) return [];

  const ids = products.map((p) => Number(p.id));

  const [images, categories, brands] = await Promise.all([
    prisma.productImage.findMany({
      where: { productId: { in: ids } },
      select: {
        id: true,
        productId: true,
        image: true,
      },
      orderBy: { id: "asc" },
    }),

    prisma.category.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),

    prisma.brand.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    }),
  ]);

  const imageMap = new Map<number, string[]>();

  for (const item of images) {
    const current = imageMap.get(item.productId) ?? [];

    if (!current.includes(item.image)) {
      current.push(item.image);
    }

    imageMap.set(item.productId, current);
  }

  const categoryMap = new Map(
    categories.map((item) => [item.id, item])
  );

  const brandMap = new Map(
    brands.map((item) => [item.id, item])
  );

  return products.map((product) => {
    const productImages = imageMap.get(Number(product.id)) ?? [];
    const category = categoryMap.get(product.categoryId);
    const brand = product.brandId
      ? brandMap.get(product.brandId)
      : undefined;

    return {
      ...product,
      id: String(product.id),
      images: productImages.map(getImageUrl),
      image: getImageUrl(productImages[0]),
      categoryName: category?.name ?? "Uncategorized",
      categorySlug: category?.slug ?? "",
      brandName: brand?.name ?? "Unbranded",
      brandSlug: brand?.slug ?? "",
      brandImage: brand?.image
        ? getImageUrl(brand.image)
        : null,
    };
  });
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts(100);
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getCategories() {
  if (!prisma) return [];

  return prisma.category.findMany({
    where: {
      status: 1,
      parentId: 0,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      sort_order: true,
    },
    orderBy: [
      { sort_order: "asc" },
      { name: "asc" },
    ],
  });
}

export async function getBrands() {
  if (!prisma) return [];

  return prisma.brand.findMany({
    where: { status: 1 },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
    orderBy: [
      { sort_order: "asc" },
      { name: "asc" },
    ],
    take: 100,
  });
}

export async function getSubcategories(categoryId: number) {
  if (!prisma) return [];

  return prisma.subcategory.findMany({
    where: {
      categoryId,
      status: 1,
    },
    orderBy: [
      { sort_order: "asc" },
      { subcategoryName: "asc" },
    ],
  });
}

// Homepage banners by banner category.
export async function getBannersByCategory(categoryId: number) {
  if (!prisma) return [];

  const banners = await prisma.banners.findMany({
    where: {
      status: 1,
      category_id: categoryId,
    },
    select: {
      id: true,
      image: true,
      link: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return banners.map((banner) => ({
    ...banner,
    image: getImageUrl(banner.image),
    link: banner.link?.trim() || "/shop",
  }));
}

// Products marked as Top Selling in the database.
export async function getTopSellingProducts(limit = 8) {
  if (!prisma) return [];

  const products = await prisma.product.findMany({
    where: {
      status: 1,
      approval_status: "approved",
      topsale: 1,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      newPrice: true,
      oldPrice: true,
      stock: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: limit,
  });

  if (!products.length) return [];

  const ids = products.map((product) => Number(product.id));

  const images = await prisma.productImage.findMany({
    where: {
      productId: { in: ids },
    },
    select: {
      productId: true,
      image: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const imageMap = new Map<number, string>();

  for (const item of images) {
    if (!imageMap.has(item.productId)) {
      imageMap.set(item.productId, item.image);
    }
  }

  return products.map((product) => ({
    ...product,
    id: String(product.id),
    image: getImageUrl(
      imageMap.get(Number(product.id))
    ),
  }));
}

/**
 * Paginated shop catalogue.
 * Filters are applied in MariaDB rather than loading the whole catalogue
 * into application memory.
 */
export async function getShopPageData(options: {
  page?: number;
  query?: string;
  categorySlug?: string;
  brandSlug?: string;
  sort?: string;
  pageSize?: number;
} = {}) {
  const pageSize = Math.min(Math.max(options.pageSize ?? 24, 1), 48);
  const requestedPage = Math.max(1, Math.floor(options.page ?? 1));
  const query = (options.query ?? "").trim().slice(0, 100);
  const categorySlug = (options.categorySlug ?? "").trim();
  const brandSlug = (options.brandSlug ?? "").trim();
  const sort = options.sort ?? "newest";

  const emptyResult = {
    products: [],
    categories: [],
    brands: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 0,
  };

  if (!prisma) return emptyResult;

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { status: 1, parentId: 0 },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      orderBy: [
        { sort_order: "asc" },
        { name: "asc" },
      ],
    }),
    prisma.brand.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      orderBy: [
        { sort_order: "asc" },
        { name: "asc" },
      ],
      take: 200,
    }),
  ]);

  const selectedCategory = categorySlug
    ? categories.find((item) => item.slug === categorySlug)
    : undefined;

  const selectedBrand = brandSlug
    ? brands.find((item) => item.slug === brandSlug)
    : undefined;

  const where = {
    status: 1,
    approval_status: "approved" as const,
    ...(categorySlug
      ? selectedCategory
        ? { categoryId: selectedCategory.id }
        : { id: BigInt(-1) }
      : {}),
    ...(brandSlug
      ? selectedBrand
        ? { brandId: selectedBrand.id }
        : { id: BigInt(-1) }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { productCode: { contains: query } },
            { model_number: { contains: query } },
          ],
        }
      : {}),
  };

  const total = await prisma.product.count({ where });
  const totalPages = Math.ceil(total / pageSize);
  const page = totalPages > 0
    ? Math.min(requestedPage, totalPages)
    : 1;

  const orderBy =
    sort === "price-low"
      ? [{ newPrice: "asc" as const }, { id: "desc" as const }]
      : sort === "price-high"
        ? [{ newPrice: "desc" as const }, { id: "desc" as const }]
        : sort === "name-asc"
          ? [{ name: "asc" as const }, { id: "desc" as const }]
          : sort === "popular"
            ? [
                { topsale: "desc" as const },
                { ratting: "desc" as const },
                { createdAt: "desc" as const },
                { id: "desc" as const },
              ]
            : [
                { createdAt: "desc" as const },
                { id: "desc" as const },
              ];

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      brandId: true,
      newPrice: true,
      oldPrice: true,
      stock: true,
      ratting: true,
      topsale: true,
      createdAt: true,
    },
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const productIds = products.map((product) => Number(product.id));

  const imageRows = productIds.length
    ? await prisma.productImage.findMany({
        where: { productId: { in: productIds } },
        select: {
          productId: true,
          image: true,
        },
        orderBy: { id: "asc" },
      })
    : [];

  const imageMap = new Map<number, string>();

  for (const row of imageRows) {
    if (!imageMap.has(row.productId)) {
      imageMap.set(row.productId, row.image);
    }
  }

  const categoryMap = new Map(
    categories.map((item) => [item.id, item] as const)
  );

  const brandMap = new Map(
    brands.map((item) => [item.id, item] as const)
  );

  const formattedProducts = products.map((product) => {
    const category = categoryMap.get(product.categoryId);
    const brand = product.brandId
      ? brandMap.get(product.brandId)
      : undefined;

    return {
      ...product,
      id: String(product.id),
      newPrice: Number(product.newPrice),
      oldPrice: product.oldPrice === null
        ? null
        : Number(product.oldPrice),
      stock: Number(product.stock),
      ratting: Number(product.ratting ?? 0),
      image: getImageUrl(imageMap.get(Number(product.id))),
      categoryName: category?.name ?? "Scientific Equipment",
      categorySlug: category?.slug ?? "",
      brandName: brand?.name ?? "",
      brandSlug: brand?.slug ?? "",
    };
  });

  return {
    products: formattedProducts,
    categories,
    brands,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Direct product lookup for the product details route.
 * Does not depend on the first 100 products in the catalogue.
 */
export async function getProductDetailsBySlug(slug: string) {
  if (!prisma) return null;

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: 1,
      approval_status: "approved",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      productCode: true,
      newPrice: true,
      oldPrice: true,
      stock: true,
      ratting: true,
      description: true,
      model_number: true,
      origin: true,
      capacity: true,
      warranty: true,
      technical_specifications: true,
      datasheet_path: true,
      categoryId: true,
      brandId: true,
      createdAt: true,
    },
  });

  if (!product) return null;

  const [images, category, brand] = await Promise.all([
    prisma.productImage.findMany({
      where: { productId: Number(product.id) },
      select: { image: true },
      orderBy: { id: "asc" },
    }),
    prisma.category.findFirst({
      where: { id: product.categoryId, status: 1 },
      select: { name: true, slug: true },
    }),
    product.brandId
      ? prisma.brand.findFirst({
          where: { id: product.brandId, status: 1 },
          select: { name: true, slug: true, image: true },
        })
      : Promise.resolve(null),
  ]);

  const imagePaths = images.map((item) => getImageUrl(item.image));

  return {
    ...product,
    id: String(product.id),
    newPrice: Number(product.newPrice),
    oldPrice: product.oldPrice === null
      ? null
      : Number(product.oldPrice),
    stock: Number(product.stock),
    ratting: Number(product.ratting ?? 0),
    images: imagePaths,
    image: imagePaths[0] ?? "/brand/logo.webp",
    categoryName: category?.name ?? "Scientific Equipment",
    categorySlug: category?.slug ?? "",
    brandName: brand?.name ?? "",
    brandSlug: brand?.slug ?? "",
    brandImage: brand?.image ? getImageUrl(brand.image) : null,
    datasheetUrl: product.datasheet_path
      ? getImageUrl(product.datasheet_path)
      : null,
  };
}
