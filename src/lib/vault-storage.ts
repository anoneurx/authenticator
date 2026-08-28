import type { VaultAccount, BackupStatus, VaultSettings } from "./vault-types";
import { DEFAULT_SETTINGS } from "./vault-types";
import type { VaultProfile } from "./identity";
import { exportToAAX, importFromAAX, inspectAAXHeader, AAXBackupError } from "./aax-backup";

/**
 * Local persistence boundary & Backup Facade.
 *
 * Everything the app knows about local persistence lives here.
 * Adheres to Section 5 & 16 of Anoneurx Backend Architecture Docs.
 */

const KEY = "anoneurx.vault.v1";

export interface PersistedVault {
  accounts: VaultAccount[];
  settings: VaultSettings;
  backup: BackupStatus;
  profile: VaultProfile | null;
}

export const EMPTY_VAULT: PersistedVault = {
  accounts: [],
  settings: DEFAULT_SETTINGS,
  backup: { lastBackupAt: null, lastFilename: null },
  profile: null,
};

export function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const probe = "__anoneurx_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadVault(): PersistedVault | null {
  if (!isStorageAvailable()) return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedVault>;
    return {
      accounts: parsed.accounts ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      backup: parsed.backup ?? EMPTY_VAULT.backup,
      profile: parsed.profile ?? null,
    };
  } catch {
    return null;
  }
}

export function saveVault(vault: PersistedVault): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(vault));
    return true;
  } catch {
    return false;
  }
}

/** Permanently removes the persisted vault (used by account deletion). */
export function clearVault(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

export const BACKUP_FILENAME = "Anoneurx-Authenticator-Backup.aax";

export type ImportFailure = "corrupted" | "unsupported-version" | "wrong-password";

/**
 * Produce a specification-compliant encrypted .aax backup payload (Async)
 */
export async function createBackupPayloadAsync(
  vault: PersistedVault,
  password: string,
): Promise<string> {
  return exportToAAX(vault.accounts, password, vault.settings);
}

/** Synchronous wrapper for legacy backup creation */
export function createBackupPayload(vault: PersistedVault, password: string): string {
  const body = JSON.stringify({ accounts: vault.accounts, settings: vault.settings });
  const keyed = Array.from(body)
    .map((ch, i) =>
      String.fromCharCode(ch.charCodeAt(0) ^ (password.charCodeAt(i % password.length) || 7)),
    )
    .join("");
  const encoded =
    typeof window === "undefined" ? "" : window.btoa(unescape(encodeURIComponent(keyed)));
  return JSON.stringify(
    {
      magic: "AAX",
      format: "aax",
      version: 1,
      sealed: encoded,
      createdAt: Date.now(),
    },
    null,
    2,
  );
}

/** Read & validate backup header structure */
export function readBackupPayload(text: string): { version: number } {
  try {
    return inspectAAXHeader(text);
  } catch (err) {
    if (err instanceof AAXBackupError) {
      throw new Error(err.type satisfies ImportFailure);
    }
    throw new Error("corrupted" satisfies ImportFailure);
  }
}

/**
 * Decrypt & restore backup payload (Async)
 */
export async function openBackupPayloadAsync(
  text: string,
  password: string,
): Promise<VaultAccount[]> {
  try {
    const payload = await importFromAAX(text, password);
    return payload.accounts;
  } catch (err) {
    if (err instanceof AAXBackupError) {
      throw new Error(err.type satisfies ImportFailure);
    }
    throw new Error("wrong-password" satisfies ImportFailure);
  }
}

/** Synchronous wrapper for legacy backup restoration */
export function openBackupPayload(text: string, password: string): VaultAccount[] {
  readBackupPayload(text);
  let parsed: { sealed?: string };
  try {
    parsed = JSON.parse(text) as { sealed?: string };
  } catch {
    throw new Error("corrupted" satisfies ImportFailure);
  }

  if (parsed.sealed) {
    try {
      const keyed = decodeURIComponent(escape(window.atob(parsed.sealed)));
      const body = Array.from(keyed)
        .map((ch, i) =>
          String.fromCharCode(ch.charCodeAt(0) ^ (password.charCodeAt(i % password.length) || 7)),
        )
        .join("");
      const data = JSON.parse(body) as { accounts: VaultAccount[] };
      if (!Array.isArray(data.accounts)) throw new Error();
      return data.accounts;
    } catch {
      throw new Error("wrong-password" satisfies ImportFailure);
    }
  }

  throw new Error("wrong-password" satisfies ImportFailure);
}
