import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProductBySlug } from "@/lib/products";
import { formatPricePair } from "@/lib/money";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = locale === "en" ? product.titleEn : product.titleId;
  const desc = locale === "en" ? product.descEn : product.descId;
  return {
    title,
    description: desc.slice(0, 160),
    openGraph: {
      title,
      description: desc.slice(0, 160),
      locale: locale === "id" ? "id_ID" : "en_US",
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const cat = await getTranslations({ locale, namespace: "categories" });
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const title = locale === "en" ? product.titleEn : product.titleId;
  const desc = locale === "en" ? product.descEn : product.descId;
  const price = formatPricePair(product.priceIdr);
  const inStock = product.stockCount > 0;
  const categoryLabel = cat(product.category as "LEVEL" | "RANK" | "VEHICLE" | "INACTIVE" | "PREMIUM" | "GIFT");

  return (
    <div className="space-y-6">
      <Link href="/catalog" className="text-sm text-muted hover:text-accent">
        ← {t("product.backCatalog")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card glow-card reveal-up scanline relative min-h-64 overflow-hidden p-6">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,#f59e0b33,transparent_40%),radial-gradient(circle_at_80%_80%,#3b82f633,transparent_40%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end gap-3">
            <span className="badge badge-warn w-fit">{categoryLabel}</span>
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
        </div>

        <div className="card reveal-up reveal-delay-1 space-y-5 p-6">
          <div>
            <p className="text-3xl font-bold text-accent">{price.idr}</p>
            <p className="text-sm text-muted">≈ {price.usd}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">{t("product.category")}</dt>
              <dd className="font-medium">{categoryLabel}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("product.nation")}</dt>
              <dd className="font-medium">{product.nation || "ANY"}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("product.levelRange")}</dt>
              <dd className="font-medium">
                {product.minLevel != null
                  ? `${product.minLevel}${product.maxLevel ? `–${product.maxLevel}` : ""}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t("product.rankRange")}</dt>
              <dd className="font-medium">
                {product.minRank != null
                  ? `${product.minRank}${product.maxRank ? `–${product.maxRank}` : ""}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t("product.stock")}</dt>
              <dd className="font-medium">
                {inStock
                  ? t("catalog.stockReady", { count: product.stockCount })
                  : t("catalog.soldOut")}
              </dd>
            </div>
          </dl>

          <div>
            <h2 className="mb-2 font-semibold">{t("product.details")}</h2>
            <p className="text-sm leading-relaxed text-muted">{desc}</p>
          </div>

          {inStock ? (
            <Link href={`/checkout/${product.id}`} className="btn btn-primary w-full">
              {t("product.buyNow")}
            </Link>
          ) : (
            <button className="btn btn-ghost w-full" disabled>
              {t("product.soldOut")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
