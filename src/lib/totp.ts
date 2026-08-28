/**
 * Anoneurx Authenticator — TOTP / HOTP Backend Engine (RFC 6238 / RFC 4226)
 *
 * Implements Sections 4, 11, 13 of Anoneurx Backend Architecture Docs.
 * - Base32 RFC 4648 Decoding
 * - HMAC-SHA1, HMAC-SHA256, HMAC-SHA512 Dynamic Truncation
 * - RFC 6238 TOTP Generation & RFC 4226 HOTP Generation
 * - OTP URI Parser & Generator
 * - Time offset drift tolerance verification
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeSecret(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidSecret(raw: string): boolean {
  const s = normalizeSecret(raw);
  if (s.length < 8) return false;
  return /^[A-Z2-7]+=*$/.test(s);
}

/** Decode Base32 string into Uint8Array byte array according to RFC 4648 */
export function base32ToBytes(secret: string): Uint8Array {
  const s = normalizeSecret(secret).replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of s) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes.length ? bytes : [0]);
}

const ALGORITHM_MAP: Record<string, string> = {
  SHA1: "SHA-1",
  "SHA-1": "SHA-1",
  SHA256: "SHA-256",
  "SHA-256": "SHA-256",
  SHA512: "SHA-512",
  "SHA-512": "SHA-512",
};

/** Convert counter number to 8-byte big-endian Uint8Array */
function counterToBytes(counter: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  // JavaScript numbers support up to 2^53 - 1
  const high = Math.floor(counter / 0x100000000);
  const low = counter % 0x100000000;
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);
  return new Uint8Array(buffer);
}

/** Dynamic truncation step specified in RFC 4226 Section 5.4 */
function truncateHmac(hmac: Uint8Array, digits: number): string {
  const at = (i: number) => hmac[i] ?? 0;
  const offset = at(hmac.length - 1) & 0x0f;
  const binary =
    ((at(offset) & 0x7f) << 24) |
    ((at(offset + 1) & 0xff) << 16) |
    ((at(offset + 2) & 0xff) << 8) |
    (at(offset + 3) & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, "0");
}

/** Cache imported HMAC keys so repeated generations skip re-import cost */
const hmacKeyCache = new Map<string, Promise<CryptoKey>>();

function getHmacKey(secret: string, hashAlgo: string): Promise<CryptoKey> {
  const cacheKey = `${hashAlgo}:${secret}`;
  let cached = hmacKeyCache.get(cacheKey);
  if (!cached) {
    const keyBytes = base32ToBytes(secret);
    cached = crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: "HMAC", hash: { name: hashAlgo } },
      false,
      ["sign"],
    );
    hmacKeyCache.set(cacheKey, cached);
  }
  return cached;
}

/**
 * Generate HOTP code (RFC 4226) using WebCrypto API
 */
export async function generateHotpCodeAsync(
  secret: string,
  counter: number,
  digits = 6,
  algorithm = "SHA1",
): Promise<string> {
  const hashAlgo = ALGORITHM_MAP[algorithm.toUpperCase()] || "SHA-1";
  const cryptoKey = await getHmacKey(normalizeSecret(secret), hashAlgo);

  const counterBytes = counterToBytes(counter);
  const hmacBuffer = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes as BufferSource);
  return truncateHmac(new Uint8Array(hmacBuffer), digits);
}

export interface TotpOptions {
  digits?: number;
  period?: number;
  algorithm?: string;
  at?: number;
}

/**
 * Generate TOTP code (RFC 6238) using WebCrypto API
 */
export async function generateCodeAsync(
  secret: string,
  options: TotpOptions = {},
): Promise<string> {
  const digits = options.digits ?? 6;
  const period = options.period ?? 30;
  const at = options.at ?? Date.now();
  const algorithm = options.algorithm ?? "SHA1";
  const counter = Math.floor(at / 1000 / period);

  return generateHotpCodeAsync(secret, counter, digits, algorithm);
}

export function secondsRemaining(period = 30, at: number = Date.now()): number {
  return period - (Math.floor(at / 1000) % period);
}

export function formatCode(code: string): string {
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
}

export function maskSecret(secret: string): string {
  const s = normalizeSecret(secret);
  return `${s.slice(0, 4)}${"•".repeat(Math.max(8, s.length - 4))}`;
}

/** Verify a TOTP code within a drift window (default +/- 1 period) */
export async function verifyTotpCode(
  inputCode: string,
  secret: string,
  options: TotpOptions & { window?: number } = {},
): Promise<boolean> {
  const window = options.window ?? 1;
  const period = options.period ?? 30;
  const at = options.at ?? Date.now();

  for (let i = -window; i <= window; i++) {
    const timeWithDrift = at + i * period * 1000;
    const generated = await generateCodeAsync(secret, { ...options, at: timeWithDrift });
    if (generated === inputCode.trim()) {
      return true;
    }
  }
  return false;
}

/** Parse an otpauth:// URI (Section 11) */
export function parseOtpAuthUri(uri: string) {
  const trimmed = uri.trim();
  if (!/^otpauth:\/\/(totp|hotp)\//i.test(trimmed)) {
    throw new Error("This QR code isn't a supported authenticator code.");
  }
  const url = new URL(trimmed);
  const type = url.host.toLowerCase();
  const label = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const [labelIssuer, labelAccount] = label.includes(":") ? label.split(":") : [undefined, label];
  const secret = url.searchParams.get("secret") ?? "";
  if (!isValidSecret(secret)) {
    throw new Error("The setup key in this QR code isn't valid.");
  }
  return {
    type,
    issuer: url.searchParams.get("issuer") ?? labelIssuer ?? "Unknown service",
    account: labelAccount?.trim() ?? "",
    secret: normalizeSecret(secret),
    algorithm: (url.searchParams.get("algorithm") ?? "SHA1").toUpperCase(),
    digits: Number(url.searchParams.get("digits") ?? 6),
    period: Number(url.searchParams.get("period") ?? 30),
    counter: Number(url.searchParams.get("counter") ?? 0),
  };
}

/** Generate standard otpauth:// URI */
export function buildOtpAuthUri(params: {
  issuer: string;
  account: string;
  secret: string;
  algorithm?: string;
  digits?: number;
  period?: number;
}): string {
  const issuerEnc = encodeURIComponent(params.issuer);
  const accountEnc = encodeURIComponent(params.account);
  const label = `${issuerEnc}:${accountEnc}`;
  const searchParams = new URLSearchParams({
    secret: normalizeSecret(params.secret),
    issuer: params.issuer,
    algorithm: (params.algorithm || "SHA1").toUpperCase(),
    digits: String(params.digits || 6),
    period: String(params.period || 30),
  });
  return `otpauth://totp/${label}?${searchParams.toString()}`;
}
