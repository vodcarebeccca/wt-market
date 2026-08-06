import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error("CREDENTIAL_ENCRYPTION_KEY env var is required.");
}

// AES-256-GCM needs a 32-byte key. Accept any string >= 32 chars and derive
// a fixed-length key via sha256 so users don't have to count characters.
const KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();

// Format: `v1:<iv_base64url>:<tag_base64url>:<ciphertext_base64url>`
const PREFIX = "v1:";

export function encryptCredential(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptCredential(payload: string): string {
  // Fallback: legacy plaintext values (no prefix) pass through unchanged.
  if (!payload.startsWith(PREFIX)) {
    return payload;
  }
  const [, ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted credential");
  }
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
