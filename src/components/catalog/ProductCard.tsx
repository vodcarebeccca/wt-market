"use client";

import { Link } from "@/i18n/routing";
import { formatPricePair } from "@/lib/money";
import { useWishlist } from "@/lib/wishlist";
import { Product, ProductImage } from "@prisma/client";

type ProductCardProps = {
  locale: string;
  product: Product & { stockCount: number; images: ProductImage[] };
  labels: {
    stockReady: string;
    soldOut: string;
    categoryLabel: string;
  };
};

export function ProductCard({ locale, product, labels }: ProductCardProps) {
  const { isWishlisted, toggle, loaded } = useWishlist();
  const title = locale === "en" ? product.titleEn : product.titleId;
  const price = formatPricePair(product.priceIdr);
  const inStock = product.stockCount > 0;
  const coverImage = product.images[0]?.url ?? product.imageUrl;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card glow-card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_24px_70px_rgba(245,158,11,0.14)]"
    >
      <div className="scanline relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-4">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition group-hover:opacity-75 group-hover:scale-105 duration-500"
          />
        ) : (
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#f59e0b33,transparent_40%),radial-gradient(circle_at_80%_0%,#3b82f633,transparent_35%)]" />
        )}
        <div className="relative z-10 flex w-full items-center justify-between gap-2">
          <span className="badge badge-warn">{labels.categoryLabel}</span>
          <span className={`badge ${inStock ? "badge-success" : "badge-danger"}`}>
            {inStock ? labels.stockReady : labels.soldOut}
          </span>
          {loaded && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(product.id);
              }}
              className="text-lg transition-transform hover:scale-125"
              aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isWishlisted(product.id) ? "❤️" : "🤍"}
            </button>
          )}
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
