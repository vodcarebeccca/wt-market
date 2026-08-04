const FALLBACK_ADMIN_WHATSAPP_NUMBER = "6285767503449";

export const ADMIN_WHATSAPP_NUMBER =
  process.env.ADMIN_WHATSAPP_NUMBER || FALLBACK_ADMIN_WHATSAPP_NUMBER;

export function createWhatsAppPaymentUrl(input: {
  orderCode: string;
  productTitle: string;
  totalIdr: number;
  buyerWhatsapp?: string | null;
}): string {
  const total = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(input.totalIdr);

  const lines = [
    "Halo admin, saya mau bayar pesanan WT Market.",
    `Kode order: ${input.orderCode}`,
    `Produk: ${input.productTitle}`,
    `Total: ${total}`,
  ];

  if (input.buyerWhatsapp) {
    lines.push(`WhatsApp pembeli: ${input.buyerWhatsapp}`);
  }

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
