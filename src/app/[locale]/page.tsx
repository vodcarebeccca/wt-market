import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ProductCard } from "@/components/catalog/ProductCard";
import { listProducts } from "@/lib/products";

// Homepage reads live stock/products managed from a separate admin app, so it
// must not be statically cached — otherwise changes never appear.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

function organizationJsonLd() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://wt-market.vercel.app").replace(/\/$/, "");
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WT Market",
    url: appUrl,
    description:
      "WT Market — marketplace akun War Thunder. Level, rank, dan nation pilihan. Diproses admin, pembayaran via WhatsApp.",
    logo: `${appUrl}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Indonesian", "English"],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const cat = await getTranslations({ locale, namespace: "categories" });
  const products = (await listProducts({ sort: "newest" })).slice(0, 4);

  return (
    <>
      {organizationJsonLd()}
      <div className="space-y-12">
      <section className="glow-card reveal-up scanline relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-20"
                  >
          <source src="/videos/war-thunder-trailer.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_10%_10%,#f59e0b44,transparent_35%),radial-gradient(circle_at_90%_20%,#2563eb33,transparent_40%)]" />
        <div className="float-slow absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-accent/30 bg-accent/10 blur-sm sm:block" />
        <div className="relative max-w-2xl space-y-4">
          <p className="reveal-up reveal-delay-1 text-sm font-semibold uppercase tracking-[0.2em] text-accent">WT Market</p>
          <h1 className="reveal-up reveal-delay-1 text-3xl font-bold leading-tight sm:text-5xl">{t("home.heroTitle")}</h1>
          <p className="reveal-up reveal-delay-2 text-muted sm:text-lg">{t("home.heroSubtitle")}</p>
          <Link href="/catalog" className="btn btn-primary reveal-up reveal-delay-2">
            {t("home.ctaCatalog")}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          [t("home.feature1Title"), t("home.feature1Desc")],
          [t("home.feature2Title"), t("home.feature2Desc")],
          [t("home.feature3Title"), t("home.feature3Desc")],
        ].map(([title, desc]) => (
          <div key={title} className="card glow-card reveal-up p-5">
            <h3 className="font-semibold text-accent">{title}</h3>
            <p className="mt-2 text-sm text-muted">{desc}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">{t("home.featuredTitle")}</h2>
          <Link href="/catalog" className="text-sm text-accent hover:underline">
            {t("nav.catalog")} →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              locale={locale}
              product={p}
              labels={{
                stockReady: t("catalog.stockReady", { count: p.stockCount }),
                soldOut: t("catalog.soldOut"),
                categoryLabel: cat(p.category as Parameters<typeof cat>[0]),
              }}
            />
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
