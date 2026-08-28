/**
 * Anoneurx Authenticator — Vault Manager & Security Lifecycle
 *
 * Implements Section 5, 8, 12, 14 & 24 of Anoneurx Backend Architecture Docs.
 * - Manages in-memory decrypted vault state.
 * - Handles local vault encryption at rest.
 * - Auto-lock lifecycle timer and session security.
 */

import type { VaultAccount, VaultSettings, BackupStatus } from "./vault-types";
import { DEFAULT_SETTINGS } from "./vault-types";
import { encryptData, decryptData, EncryptedPayload } from "./crypto";

const VAULT_STORAGE_KEY = "anoneurx.vault.v1";
const ENCRYPTED_VAULT_KEY = "anoneurx.vault.encrypted.v1";

export interface VaultState {
  accounts: VaultAccount[];
  settings: VaultSettings;
  backup: BackupStatus;
}

export interface EncryptedVaultStore {
  encrypted: true;
  version: number;
  payload: EncryptedPayload;
  updatedAt: number;
}

export class VaultManager {
  private memoryVault: VaultState | null = null;
  private isUnlocked = false;
  private autoLockTimer: ReturnType<typeof setTimeout> | null = null;

  /** Probe if localStorage is available */
  public static isStorageAvailable(): boolean {
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

  /** Read raw unencrypted local vault */
  public static loadPlainVault(): VaultState | null {
    if (!VaultManager.isStorageAvailable()) return null;
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<VaultState>;
      return {
        accounts: parsed.accounts ?? [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        backup: parsed.backup ?? { lastBackupAt: null, lastFilename: null },
      };
    } catch {
      return null;
    }
  }

  /** Write raw unencrypted local vault */
  public static savePlainVault(vault: VaultState): boolean {
    if (!VaultManager.isStorageAvailable()) return false;
    try {
      window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
      return true;
    } catch {
      return false;
    }
  }

  /** Encrypt local vault on disk with master password */
  public static async saveEncryptedVault(
    vault: VaultState,
    masterPassword: string,
  ): Promise<boolean> {
    if (!VaultManager.isStorageAvailable()) return false;
    try {
      const jsonText = JSON.stringify(vault);
      const encryptedPayload = await encryptData(jsonText, masterPassword);
      const store: EncryptedVaultStore = {
        encrypted: true,
        version: 1,
        payload: encryptedPayload,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(ENCRYPTED_VAULT_KEY, JSON.stringify(store));
      // Save sanitized plain vault without secrets
      const sanitizedAccounts = vault.accounts.map((a) => ({ ...a, secret: "" }));
      VaultManager.savePlainVault({ ...vault, accounts: sanitizedAccounts });
      return true;
    } catch {
      return false;
    }
  }

  /** Decrypt local vault from disk with master password */
  public static async loadEncryptedVault(masterPassword: string): Promise<VaultState | null> {
    if (!VaultManager.isStorageAvailable()) return null;
    const rawEncrypted = window.localStorage.getItem(ENCRYPTED_VAULT_KEY);
    if (!rawEncrypted) return null;
    try {
      const store = JSON.parse(rawEncrypted) as EncryptedVaultStore;
      const decryptedText = await decryptData(store.payload, masterPassword);
      return JSON.parse(decryptedText) as VaultState;
    } catch {
      return null;
    }
  }

  /** Lock in-memory vault session (Section 14: Clear secrets from memory) */
  public lockSession(): void {
    this.memoryVault = null;
    this.isUnlocked = false;
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  /** Reset auto-lock timer based on timeout minutes */
  public resetAutoLockTimer(timeoutMinutes: number, onLockCallback: () => void): void {
    if (this.autoLockTimer) clearTimeout(this.autoLockTimer);
    if (timeoutMinutes <= 0) return;

    this.autoLockTimer = setTimeout(() => {
      this.lockSession();
      onLockCallback();
    }, timeoutMinutes * 60 * 1000);
  }
}
