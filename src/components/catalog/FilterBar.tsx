"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { CATEGORIES, NATIONS } from "@/lib/constants";

type FilterBarProps = {
  locale: string;
  labels: {
    filters: string;
    category: string;
    nation: string;
    level: string;
    rank: string;
    price: string;
    min: string;
    max: string;
    sort: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortNewest: string;
    all: string;
    apply: string;
    reset: string;
  };
};

export function FilterBar({ locale, labels }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of fd.entries()) {
      const v = String(value).trim();
      if (v) params.set(key, v);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function onReset() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const get = (key: string) => searchParams.get(key) || "";

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{labels.filters}</h2>
        <button type="button" onClick={onReset} className="text-xs text-muted hover:text-accent">
          {labels.reset}
        </button>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">{labels.category}</span>
        <select name="category" defaultValue={get("category")} className="input">
          <option value="">{labels.all}</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {locale === "en" ? c.labelEn : c.labelId}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">{labels.nation}</span>
        <select name="nation" defaultValue={get("nation")} className="input">
          <option value="">{labels.all}</option>
          {NATIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.level} {labels.min}</span>
          <input name="minLevel" type="number" min={1} defaultValue={get("minLevel")} className="input" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.level} {labels.max}</span>
          <input name="maxLevel" type="number" min={1} defaultValue={get("maxLevel")} className="input" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.rank} {labels.min}</span>
          <input name="minRank" type="number" min={1} max={8} defaultValue={get("minRank")} className="input" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.rank} {labels.max}</span>
          <input name="maxRank" type="number" min={1} max={8} defaultValue={get("maxRank")} className="input" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.price} {labels.min}</span>
          <input name="minPrice" type="number" min={0} defaultValue={get("minPrice")} className="input" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.price} {labels.max}</span>
          <input name="maxPrice" type="number" min={0} defaultValue={get("maxPrice")} className="input" />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">{labels.sort}</span>
        <select name="sort" defaultValue={get("sort") || "price_asc"} className="input">
          <option value="price_asc">{labels.sortPriceAsc}</option>
          <option value="price_desc">{labels.sortPriceDesc}</option>
          <option value="newest">{labels.sortNewest}</option>
        </select>
      </label>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {labels.apply}
      </button>
    </form>
  );
}
