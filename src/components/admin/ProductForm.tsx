import { CATEGORIES, NATIONS } from "@/lib/constants";

type ProductValues = {
  titleId?: string;
  titleEn?: string;
  descId?: string;
  descEn?: string;
  slug?: string;
  category?: string;
  nation?: string | null;
  priceIdr?: number;
  minLevel?: number | null;
  maxLevel?: number | null;
  minRank?: number | null;
  maxRank?: number | null;
  isActive?: boolean;
};

export function ProductForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: ProductValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Judul (ID)</span>
          <input className="input" name="titleId" required defaultValue={values?.titleId || ""} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Title (EN)</span>
          <input className="input" name="titleEn" required defaultValue={values?.titleEn || ""} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Deskripsi (ID)</span>
          <textarea className="input min-h-24" name="descId" required defaultValue={values?.descId || ""} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Description (EN)</span>
          <textarea className="input min-h-24" name="descEn" required defaultValue={values?.descEn || ""} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Slug</span>
          <input
            className="input"
            name="slug"
            required
            pattern="[a-z0-9-]+"
            defaultValue={values?.slug || ""}
            placeholder="wt-level-30-40"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Kategori</span>
          <select className="input" name="category" defaultValue={values?.category || "LEVEL"}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.labelId}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Nation</span>
          <select className="input" name="nation" defaultValue={values?.nation || "ANY"}>
            {NATIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        <label className="block space-y-1 text-sm sm:col-span-1">
          <span className="text-muted">Harga IDR</span>
          <input
            className="input"
            name="priceIdr"
            type="number"
            min={1000}
            required
            defaultValue={values?.priceIdr ?? 15000}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Min level</span>
          <input className="input" name="minLevel" type="number" defaultValue={values?.minLevel ?? ""} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Max level</span>
          <input className="input" name="maxLevel" type="number" defaultValue={values?.maxLevel ?? ""} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Min rank</span>
          <input className="input" name="minRank" type="number" defaultValue={values?.minRank ?? ""} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Max rank</span>
          <input className="input" name="maxRank" type="number" defaultValue={values?.maxRank ?? ""} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={values?.isActive ?? true} />
        <span>Aktif di katalog</span>
      </label>

      <button className="btn btn-primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
