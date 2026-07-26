import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function LegalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="card mx-auto max-w-3xl space-y-4 p-6 sm:p-8">
      <h1 className="text-3xl font-bold">{t("legal.title")}</h1>
      <p className="leading-relaxed text-muted">{t("legal.body")}</p>
    </div>
  );
}
