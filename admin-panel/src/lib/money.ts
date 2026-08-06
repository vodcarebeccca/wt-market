export function getUsdRate(): number {
  const rate = Number(process.env.USD_RATE || "16000");
  return Number.isFinite(rate) && rate > 0 ? rate : 16000;
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsdFromIdr(amountIdr: number): string {
  const usd = amountIdr / getUsdRate();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

export function formatPricePair(amountIdr: number): { idr: string; usd: string } {
  return {
    idr: formatIdr(amountIdr),
    usd: formatUsdFromIdr(amountIdr),
  };
}
