import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilterBar } from "@/components/catalog/FilterBar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { listProducts, parseCatalogFilters } from "@/lib/products";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  const filters = parseCatalogFilters(sp);
  const products = await listProducts(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("catalog.title")}</h1>
        <p className="mt-1 text-muted">{t("catalog.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="card h-40 animate-pulse" />}>
          <FilterBar
            locale={locale}
            labels={{
              filters: t("catalog.filters"),
              category: t("catalog.category"),
              nation: t("catalog.nation"),
              level: t("catalog.level"),
              rank: t("catalog.rank"),
              price: t("catalog.price"),
              min: t("catalog.min"),
              max: t("catalog.max"),
              sort: t("catalog.sort"),
              sortPriceAsc: t("catalog.sortPriceAsc"),
              sortPriceDesc: t("catalog.sortPriceDesc"),
              sortNewest: t("catalog.sortNewest"),
              all: t("catalog.all"),
              apply: t("catalog.apply"),
              reset: t("catalog.reset"),
            }}
          />
        </Suspense>

        <div>
          {products.length === 0 ? (
            <div className="card p-8 text-center text-muted">{t("catalog.empty")}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  locale={locale}
                  product={p}
                  labels={{
                    stockReady: t("catalog.stockReady", { count: p.stockCount }),
                    soldOut: t("catalog.soldOut"),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
