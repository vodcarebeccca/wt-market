export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

export const CATEGORIES = [
  { value: "LEVEL", labelId: "Level", labelEn: "Level" },
  { value: "RANK", labelId: "Rank", labelEn: "Rank" },
  { value: "VEHICLE", labelId: "Kendaraan", labelEn: "Vehicle" },
  { value: "INACTIVE", labelId: "Inactive", labelEn: "Inactive" },
  { value: "PREMIUM", labelId: "Premium", labelEn: "Premium" },
  { value: "GIFT", labelId: "Gift", labelEn: "Gift" },
] as const;

export const NATIONS = [
  "USA",
  "USSR",
  "Germany",
  "Britain",
  "Japan",
  "China",
  "Italy",
  "France",
  "Sweden",
  "Israel",
  "ANY",
] as const;

export const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
} as const;

export const STOCK_STATUS = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
  INVALID: "INVALID",
} as const;
