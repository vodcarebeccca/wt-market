import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getProductById } from "@/lib/products";

type Props = {
  params: Promise<{ locale: string; productId: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { locale, productId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const product = await getProductById(productId);
  if (!product || !product.isActive) notFound();

  const title = locale === "en" ? product.titleEn : product.titleId;

  return (
    <div className="mx-auto max-w-lg">
      <CheckoutForm
        productId={product.id}
        productTitle={title}
        priceIdr={product.priceIdr}
        locale={locale}
        inStock={product.stockCount > 0}
        labels={{
          title: t("checkout.title"),
          email: t("checkout.email"),
          whatsapp: t("checkout.whatsapp"),
          note: t("checkout.note"),
          pay: t("checkout.pay"),
          creating: t("checkout.creating"),
          total: t("checkout.total"),
          agree: t("checkout.agree"),
          needAgree: t("checkout.needAgree"),
          noStock: t("checkout.noStock"),
          error: t("checkout.error"),
        }}
      />
    </div>
  );
}
