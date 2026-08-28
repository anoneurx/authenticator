/**
 * Anoneurx Authenticator — AAX Backup Specification Engine
 *
 * Implements Sections 15, 16, 17 of Anoneurx Backend Architecture Docs.
 * File Format (.aax):
 * {
 *   "magic": "AAX",
 *   "version": 1,
 *   "kdf": { "algorithm": "PBKDF2-SHA256", "iterations": 100000, "salt": "<hex>" },
 *   "cipher": { "algorithm": "AES-256-GCM", "iv": "<hex>", "tagLength": 128 },
 *   "ciphertext": "<base64>",
 *   "createdAt": <timestamp>
 * }
 */

import type { VaultAccount, VaultSettings } from "./vault-types";
import { encryptData, decryptData } from "./crypto";

export const AAX_MAGIC = "AAX";
export const AAX_VERSION = 1;

export interface AAXBackupFile {
  magic: string;
  version: number;
  kdf: {
    algorithm: string;
    iterations: number;
    salt: string;
  };
  cipher: {
    algorithm: string;
    iv: string;
    tagLength: number;
  };
  ciphertext: string;
  createdAt: number;
}

export interface AAXDecryptedPayload {
  version: number;
  accounts: VaultAccount[];
  settings?: Partial<VaultSettings>;
  exportedAt: number;
}

interface LegacyAAXFile {
  format: string;
  sealed: string;
  version?: number;
}

export type AAXImportErrorType = "corrupted" | "unsupported-version" | "wrong-password";

export class AAXBackupError extends Error {
  type: AAXImportErrorType;
  constructor(type: AAXImportErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = "AAXBackupError";
  }
}

/**
 * Creates a specification-compliant encrypted .aax backup string.
 */
export async function exportToAAX(
  accounts: VaultAccount[],
  password: string,
  settings?: Partial<VaultSettings>,
): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error("Password is required to encrypt backup.");
  }

  const payload: AAXDecryptedPayload = {
    version: AAX_VERSION,
    accounts,
    ...(settings ? { settings } : {}),
    exportedAt: Date.now(),
  };

  const jsonText = JSON.stringify(payload);
  const encrypted = await encryptData(jsonText, password, 100_000);

  const fileStructure: AAXBackupFile = {
    magic: AAX_MAGIC,
    version: AAX_VERSION,
    kdf: {
      algorithm: "PBKDF2-SHA256",
      iterations: encrypted.iterations,
      salt: encrypted.salt,
    },
    cipher: {
      algorithm: "AES-256-GCM",
      iv: encrypted.iv,
      tagLength: 128,
    },
    ciphertext: encrypted.ciphertext,
    createdAt: payload.exportedAt,
  };

  return JSON.stringify(fileStructure, null, 2);
}

/**
 * Validates the structure and version of an AAX backup file string without decrypting.
 */
export function inspectAAXHeader(fileText: string): { version: number; createdAt: number } {
  let parsed: Partial<AAXBackupFile>;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new AAXBackupError("corrupted", "Invalid JSON structure.");
  }

  if (parsed.magic !== AAX_MAGIC || typeof parsed.ciphertext !== "string") {
    // Check legacy fallback format
    const legacy = parsed as Partial<LegacyAAXFile>;
    if (legacy.format === "aax" && typeof legacy.sealed === "string") {
      return { version: parsed.version ?? 1, createdAt: Date.now() };
    }
    throw new AAXBackupError("corrupted", "File is not a valid AAX backup.");
  }

  if (typeof parsed.version !== "number" || parsed.version > AAX_VERSION) {
    throw new AAXBackupError("unsupported-version", `Unsupported version: ${parsed.version}`);
  }

  return {
    version: parsed.version,
    createdAt: parsed.createdAt || Date.now(),
  };
}

/**
 * Decrypts and restores vault accounts from an AAX backup file string.
 */
export async function importFromAAX(
  fileText: string,
  password: string,
): Promise<AAXDecryptedPayload> {
  inspectAAXHeader(fileText);
  let parsed: Partial<AAXBackupFile>;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new AAXBackupError("corrupted", "Invalid JSON string.");
  }

  // Handle standard modern AAX file format
  if (parsed.magic === AAX_MAGIC && parsed.kdf && parsed.cipher && parsed.ciphertext) {
    try {
      const decryptedText = await decryptData(
        {
          ciphertext: parsed.ciphertext,
          iv: parsed.cipher.iv,
          salt: parsed.kdf.salt,
          iterations: parsed.kdf.iterations,
        },
        password,
      );

      const data = JSON.parse(decryptedText) as AAXDecryptedPayload;
      if (!Array.isArray(data.accounts)) {
        throw new AAXBackupError("corrupted", "Backup accounts data is invalid.");
      }
      return data;
    } catch (err) {
      if (err instanceof AAXBackupError) throw err;
      throw new AAXBackupError("wrong-password", "Incorrect decryption password or file modified.");
    }
  }

  // Handle legacy XOR sealed format for backward compatibility
  const legacy = parsed as Partial<LegacyAAXFile>;
  if (legacy.format === "aax" && typeof legacy.sealed === "string") {
    try {
      const keyed = decodeURIComponent(escape(window.atob(legacy.sealed)));
      const body = Array.from(keyed)
        .map((ch, i) =>
          String.fromCharCode(ch.charCodeAt(0) ^ (password.charCodeAt(i % password.length) || 7)),
        )
        .join("");
      const data = JSON.parse(body) as { accounts: VaultAccount[] };
      if (!Array.isArray(data.accounts)) throw new Error();
      return {
        version: 1,
        accounts: data.accounts,
        exportedAt: Date.now(),
      };
    } catch {
      throw new AAXBackupError("wrong-password", "Incorrect backup password.");
    }
  }

  throw new AAXBackupError("corrupted", "Unrecognized AAX file payload.");
}
