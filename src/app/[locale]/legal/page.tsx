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
      <div className="card space-y-5 p-6 sm:p-8 leading-relaxed">
        {sections.map((section, i) => {
          const lines = section.split("\n").filter(Boolean);
          const title = lines[0] || "";
          const content = lines.slice(1);

          return (
            <div key={i}>
              <h2 className="mb-2 font-semibold text-accent">{title}</h2>
              {content.map((line, j) => (
                <p key={j} className="text-muted">{line}</p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
