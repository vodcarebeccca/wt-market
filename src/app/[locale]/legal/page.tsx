import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function LegalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const body = t("legal.body");
  const sections = body.split("\n\n");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("legal.title")}</h1>
      <div className="card space-y-6 p-6 sm:p-8 leading-relaxed">
        {sections.map((section, i) => {
          const lines = section.split("\n").filter(Boolean);
          const title = lines[0] || "";
          const items = lines.slice(1);

          // Section heading
          return (
            <div key={i}>
              <h2 className="mb-1 text-base font-bold text-accent">{title}</h2>
              {items.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
