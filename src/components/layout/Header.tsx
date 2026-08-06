"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Subscribe to window.location.search changes without setState-in-effect. */
function useLocationSearch() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("popstate", cb);
      return () => window.removeEventListener("popstate", cb);
    },
    () => window.location.search,
    () => "",
  );
}

/** Preserve search params (e.g. ?token=...) when switching locale. */
function useLocaleSwitchHref() {
  const pathname = usePathname();
  const cleanPathname = pathname?.replace(/^\/(en|id)\//, "/") || "/";
  const search = useLocationSearch();
  return cleanPathname + search;
}

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const otherLocale = locale === "id" ? "en" : "id";
  const switchHref = useLocaleSwitchHref();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <img src="/logo/logo.png" alt="WT Market" className="h-10 w-auto" />
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/" className="rounded-lg px-2 py-1 text-muted hover:text-foreground">
            {t("nav.home")}
          </Link>
          <Link href="/catalog" className="rounded-lg px-2 py-1 text-muted hover:text-foreground">
            {t("nav.catalog")}
          </Link>
          <Link href="/legal" className="rounded-lg px-2 py-1 text-muted hover:text-foreground">
            {t("nav.legal")}
          </Link>
          <Link
            href={switchHref}
            locale={otherLocale}
            className="rounded-lg border border-border px-2 py-1 text-xs font-semibold uppercase text-accent hover:bg-accent/10"
          >
            {otherLocale}
          </Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}