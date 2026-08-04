import { Suspense } from "react";
import { type Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilterBar } from "@/components/catalog/FilterBar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { listProducts, parseCatalogFilters } from "@/lib/products";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function itemListJsonLd(products: { id: string; slug: string; titleId: string; priceIdr: number; images: { url: string }[]; stockCount: number }[]) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://wt-market.vercel.app").replace(/\/$/, "");
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${appUrl}/product/${p.slug}`,
      item: {
        "@type": "Product",
        name: p.titleId,
        url: `${appUrl}/product/${p.slug}`,
        image: p.images[0]?.url
          ? p.images[0].url.startsWith("http")
            ? p.images[0].url
            : `${appUrl}${p.images[0].url}`
          : undefined,
        offers: {
          "@type": "Offer",
          price: p.priceIdr,
          priceCurrency: "IDR",
          availability:
            p.stockCount > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations();
  return {
    title: t("catalog.title"),
    description: t("catalog.subtitle"),
    openGraph: {
      title: t("catalog.title"),
      description: t("catalog.subtitle"),
      locale: locale === "id" ? "id_ID" : "en_US",
      type: "website",
    },
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  const cat = await getTranslations({ locale, namespace: "categories" });
  const filters = parseCatalogFilters(sp);
  const products = await listProducts(filters);

  return (
    <>
      {itemListJsonLd(products)}
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
          <form action="/catalog" method="get" className="mb-4">
            <input
              type="text"
              name="search"
              placeholder={t("catalog.searchPlaceholder") || "Search..."}
              defaultValue={sp.search as string || ""}
              className="input"
            />
          </form>

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
                    categoryLabel: cat(p.category as "LEVEL" | "RANK" | "VEHICLE" | "INACTIVE" | "PREMIUM" | "GIFT"),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
