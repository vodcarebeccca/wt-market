/**
 * QRIS Static-to-Dynamic utility
 *
 * Converts a static QRIS EMVCo string into a dynamic QRIS
 * by injecting the transaction amount (tag 54) and recalculating CRC16.
 *
 * QRIS EMVCo tags used:
 *   01 - Point of Initiation Method (11=static, 12=dynamic)
 *   54 - Transaction Amount
 *   58 - Country Code (ID = Indonesia)
 *   63 - CRC16-CCITT checksum
 */

import crc from "crc";

/**
 * Calculate CRC16-CCITT for a QRIS payload string.
 * Returns 4 uppercase hex digits.
 */
export function crc16ccitt(input: string): string {
  return crc
    .crc16ccitt(Buffer.from(input, "utf8"))
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
}

/**
 * Validate that a QRIS payload has a correct CRC16 checksum.
 */
export function isValidQrisChecksum(payload: string): boolean {
  if (payload.length < 4) return false;
  const withoutCrc = payload.slice(0, -4);
  const expected = payload.slice(-4);
  const actual = crc16ccitt(withoutCrc);
  return actual === expected;
}

/**
 * Convert a static QRIS payload to a dynamic QRIS by injecting the
 * transaction amount and updating the point-of-initiation method.
 *
 * @param staticQris - The static QRIS string from GoPay Merchant
 * @param amount - Transaction amount in IDR
 * @returns Dynamic QRIS string with amount embedded
 */
export function generateDynamicQris(
  staticQris: string,
  amount: number,
): string {
  // 1. Remove existing CRC (last 4 hex chars, tag 63)
  const withoutCrc = staticQris.slice(0, -4);

  // 2. Change point-of-initiation from static (11) to dynamic (12)
  // Tag 01 has length 02; value is 11 (static) or 12 (dynamic)
  const dynamicPoi = withoutCrc.replace("010211", "010212");

  if (!dynamicPoi.includes("010212")) {
    throw new Error(
      "Invalid QRIS: could not find static point-of-initiation tag (010211)",
    );
  }

  // 3. Split at country code tag (5802ID)
  const countryMarker = "5802ID";
  if (!dynamicPoi.includes(countryMarker)) {
    throw new Error(
      "Invalid QRIS: could not find country code tag (5802ID)",
    );
  }

  const [beforeCountry, afterCountry] = dynamicPoi.split(countryMarker);

  // 4. Build amount tag: tag 54 + 2-digit length + amount value
  const amountStr = String(amount);
  const amountLength = amountStr.length.toString().padStart(2, "0");
  const amountTag = `54${amountLength}${amountStr}`;

  // 5. Reassemble payload
  const payload = `${beforeCountry}${amountTag}${countryMarker}${afterCountry}`;

  // 6. Calculate and append CRC
  return payload + crc16ccitt(payload);
}

/**
 * Parse a QRIS EMVCo string into a simple key-value map.
 * Returns a Map of tag -> value.
 */
export function parseQris(payload: string): Map<string, string> {
  const tags = new Map<string, string>();
  let pos = 0;

  while (pos < payload.length - 3) {
    const tag = payload.slice(pos, pos + 2);
    const lenStr = payload.slice(pos + 2, pos + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len) || len <= 0 || pos + 4 + len > payload.length) break;
    const value = payload.slice(pos + 4, pos + 4 + len);
    tags.set(tag, value);
    pos += 4 + len;
  }

  return tags;
}

/**
 * Extract merchant name from a QRIS payload if available.
 */
export function getMerchantName(payload: string): string | null {
  const tags = parseQris(payload);
  return tags.get("59") ?? null;
}

/**
 * Get the QRIS string from environment variable.
 * Throws if not configured.
 */
export function getStaticQris(): string {
  const qris = process.env.GOPAYMERCHANT_QRIS_STATIC;
  if (!qris || qris.length < 50) {
    throw new Error(
      "GOPAYMERCHANT_QRIS_STATIC is not configured in environment",
    );
  }
  return qris;
}