import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-foreground">{t("brand")}</p>
          <div className="flex gap-4">
            <Link href="/catalog" className="hover:text-accent">
              {t("nav.catalog")}
            </Link>
            <Link href="/legal" className="hover:text-accent">
              {t("nav.legal")}
            </Link>
          </div>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed">{t("footer.disclaimer")}</p>
        <p className="text-xs">{t("footer.rights", { year })}</p>
      </div>
    </footer>
  );
}
