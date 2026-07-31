import { Link } from "@/i18n/routing";
import { formatPricePair } from "@/lib/money";
import { getTranslations } from "next-intl/server";

type ProductCardProps = {
  locale: string;
  product: {
    slug: string;
    titleId: string;
    titleEn: string;
    category: string;
    nation: string | null;
    priceIdr: number;
    minLevel: number | null;
    maxLevel: number | null;
    minRank: number | null;
    maxRank: number | null;
    stockCount: number;
  };
  labels: {
    stockReady: string;
    soldOut: string;
  };
};

export async function ProductCard({ locale, product, labels }: ProductCardProps) {
  const t = await getTranslations({ locale, namespace: "categories" });
  const title = locale === "en" ? product.titleEn : product.titleId;
  const price = formatPricePair(product.priceIdr);
  const inStock = product.stockCount > 0;
  const categoryLabel = t(product.category as "LEVEL" | "RANK" | "VEHICLE" | "INACTIVE" | "PREMIUM" | "GIFT");

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="card glow-card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_24px_70px_rgba(245,158,11,0.14)]"
    >
      <div className="scanline relative flex h-36 items-end bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-4">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#f59e0b33,transparent_40%),radial-gradient(circle_at_80%_0%,#3b82f633,transparent_35%)]" />
        <div className="relative flex w-full items-center justify-between gap-2">
          <span className="badge badge-warn">{categoryLabel}</span>
          <span className={`badge ${inStock ? "badge-success" : "badge-danger"}`}>
            {inStock ? labels.stockReady : labels.soldOut}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold group-hover:text-accent">{title}</h3>
        <div className="text-xs text-muted">
          {product.nation && product.nation !== "ANY" ? `${product.nation} · ` : ""}
          {product.minLevel != null
            ? `Lv ${product.minLevel}${product.maxLevel && product.maxLevel !== product.minLevel ? `–${product.maxLevel}` : ""}`
            : null}
          {product.minRank != null
            ? `${product.minLevel != null ? " · " : ""}Rank ${product.minRank}${product.maxRank && product.maxRank !== product.minRank ? `–${product.maxRank}` : ""}`
            : null}
        </div>
        <div className="mt-auto pt-2">
          <p className="text-lg font-bold text-accent">{price.idr}</p>
          <p className="text-xs text-muted">≈ {price.usd}</p>
        </div>
      </div>
    </Link>
  );
}
