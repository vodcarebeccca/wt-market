import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type CatalogFilters = {
  category?: string;
  nation?: string;
  minLevel?: number;
  maxLevel?: number;
  minRank?: number;
  maxRank?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  search?: string;
};

function num(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseCatalogFilters(
  sp: Record<string, string | string[] | undefined>
): CatalogFilters {
  const g = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    category: g("category") || undefined,
    nation: g("nation") || undefined,
    minLevel: num(g("minLevel")),
    maxLevel: num(g("maxLevel")),
    minRank: num(g("minRank")),
    maxRank: num(g("maxRank")),
    minPrice: num(g("minPrice")),
    maxPrice: num(g("maxPrice")),
    sort: g("sort") || "price_asc",
    search: g("search") || undefined,
  };
}

export async function listProducts(filters: CatalogFilters = {}) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (filters.category) where.category = filters.category;
  if (filters.nation) where.nation = filters.nation;
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.priceIdr = {};
    if (filters.minPrice != null) where.priceIdr.gte = filters.minPrice;
    if (filters.maxPrice != null) where.priceIdr.lte = filters.maxPrice;
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    where.OR = [
      { titleId: { contains: q } },
      { titleEn: { contains: q } },
      { descId: { contains: q } },
      { descEn: { contains: q } },
    ];
  }

  if (filters.minLevel != null || filters.maxLevel != null) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      filters.minLevel != null
        ? {
            OR: [{ maxLevel: null }, { maxLevel: { gte: filters.minLevel } }],
          }
        : {},
      filters.maxLevel != null
        ? {
            OR: [{ minLevel: null }, { minLevel: { lte: filters.maxLevel } }],
          }
        : {},
    ];
  }
  if (filters.minRank != null || filters.maxRank != null) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      filters.minRank != null
        ? { OR: [{ maxRank: null }, { maxRank: { gte: filters.minRank } }] }
        : {},
      filters.maxRank != null
        ? { OR: [{ minRank: null }, { minRank: { lte: filters.maxRank } }] }
        : {},
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { priceIdr: "asc" };
  if (filters.sort === "price_desc") orderBy = { priceIdr: "desc" };
  if (filters.sort === "newest") orderBy = { createdAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      _count: {
        select: {
          stockItems: { where: { status: "AVAILABLE" } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });

  return products.map((p) => ({
    ...p,
    stockCount: p._count.stockItems,
  }));
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          stockItems: { where: { status: "AVAILABLE" } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!product || !product.isActive) return null;
  return { ...product, stockCount: product._count.stockItems };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          stockItems: { where: { status: "AVAILABLE" } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!product) return null;
  return { ...product, stockCount: product._count.stockItems };
}
