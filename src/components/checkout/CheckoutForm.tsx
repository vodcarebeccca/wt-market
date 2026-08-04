"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { createCheckoutOrder } from "@/actions/checkout";
import { formatPricePair } from "@/lib/money";

type Props = {
  productId: string;
  productTitle: string;
  priceIdr: number;
  locale: string;
  labels: {
    title: string;
    email: string;
    whatsapp: string;
    note: string;
    pay: string;
    creating: string;
    total: string;
    agree: string;
    needAgree: string;
    noStock: string;
    error: string;
  };
  inStock: boolean;
};

export function CheckoutForm({
  productId,
  productTitle,
  priceIdr,
  locale,
  labels,
  inStock,
}: Props) {
  const router = useRouter();
  const price = formatPricePair(priceIdr);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!inStock) {
      setError(labels.noStock);
      return;
    }
    if (!agree) {
      setError(labels.needAgree);
      return;
    }

    setLoading(true);
    try {
      const result = await createCheckoutOrder({
        productId,
        buyerEmail: email,
        buyerWhatsapp: whatsapp,
        locale,
        agree: true,
      });

      if (!result.ok) {
        setError(result.error || labels.error);
        setLoading(false);
        return;
      }

      router.push(`/order/${result.orderCode}?token=${result.accessToken}`);
    } catch {
      setError(labels.error);
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-5 p-5">
      <div>
        <h1 className="text-xl font-bold">{labels.title}</h1>
        <p className="mt-1 text-sm text-muted">{productTitle}</p>
      </div>

      <div className="rounded-xl border border-border bg-black/30 p-4">
        <p className="text-sm text-muted">{labels.total}</p>
        <p className="text-2xl font-bold text-accent">{price.idr}</p>
        <p className="text-xs text-muted">≈ {price.usd}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.email}</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{labels.whatsapp}</span>
          <input
            className="input"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1"
          />
          <span>{labels.agree}</span>
        </label>

        <p className="text-xs text-muted">{labels.note}</p>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading || !inStock}>
          {loading ? labels.creating : labels.pay}
        </button>
      </form>
    </div>
  );
}