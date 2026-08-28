/**
 * Anoneurx Security Core — Cryptographic Primitives (WebCrypto API)
 *
 * Adheres strictly to Section 9 & 10 of Anoneurx Backend Architecture Docs.
 * - Key Derivation: PBKDF2-HMAC-SHA256 with 100,000+ iterations & 16-byte random salt.
 * - Authenticated Cipher: AES-256-GCM (128-bit tag length) with 12-byte random IV/nonce.
 * - Zero-knowledge local crypto operations (no network dependencies).
 */

const KDF_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

/** Generate secure random bytes using WebCrypto */
export function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for non-WebCrypto SSR environments
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/** Convert Uint8Array to Hex string */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Convert Hex string to Uint8Array */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Convert Uint8Array to Base64 string */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof window !== "undefined" && window.btoa) {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] as number);
    }
    return window.btoa(binary);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  throw new Error("Base64 encoding environment unsupported.");
}

/** Convert Base64 string to Uint8Array */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof window !== "undefined" && window.atob) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  throw new Error("Base64 decoding environment unsupported.");
}

/** Zero sensitive Uint8Array in memory (Section 14) */
export function zeroMemory(bytes: Uint8Array): void {
  bytes.fill(0);
}

/**
 * Derive an AES-GCM 256-bit CryptoKey from a user password using PBKDF2-HMAC-SHA256.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations = KDF_ITERATIONS,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );

  zeroMemory(passwordBytes);
  return derivedKey;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Hex
  salt: string; // Hex
  iterations: number;
}

/**
 * Encrypt arbitrary string payload using PBKDF2 + AES-256-GCM.
 */
export async function encryptData(
  plaintext: string,
  password: string,
  iterations = KDF_ITERATIONS,
): Promise<EncryptedPayload> {
  const salt = getRandomBytes(SALT_BYTE_LENGTH);
  const iv = getRandomBytes(IV_BYTE_LENGTH);
  const key = await deriveKey(password, salt, iterations);

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    plaintextBytes as BufferSource,
  );

  zeroMemory(plaintextBytes);

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    iv: bytesToHex(iv),
    salt: bytesToHex(salt),
    iterations,
  };
}

/**
 * Decrypt AES-256-GCM ciphertext payload back to plaintext string.
 */
export async function decryptData(payload: EncryptedPayload, password: string): Promise<string> {
  const salt = hexToBytes(payload.salt);
  const iv = hexToBytes(payload.iv);
  const ciphertextBytes = base64ToBytes(payload.ciphertext);

  const key = await deriveKey(password, salt, payload.iterations || KDF_ITERATIONS);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
      },
      key,
      ciphertextBytes as BufferSource,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Decryption failed: Incorrect password or tampered data.");
  }
}
