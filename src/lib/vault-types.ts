export type OtpAlgorithm = "SHA1" | "SHA256" | "SHA512";
export type OtpDigits = 6 | 8;

export interface VaultAccount {
  id: string;
  issuer: string;
  account: string;
  label?: string;
  secret: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  period: number;
  createdAt: number;
}

export type AutoLockDelay = "immediate" | "1m" | "5m" | "15m" | "never";
export type ThemePreference = "system" | "light" | "dark";

export interface VaultSettings {
  theme: ThemePreference;
  biometricUnlock: boolean;
  requireAuthOnLaunch: boolean;
  autoLock: AutoLockDelay;
  hideCodesUntilFocus: boolean;
}

export interface BackupStatus {
  lastBackupAt: number | null;
  lastFilename: string | null;
}

export interface VaultState {
  accounts: VaultAccount[];
  locked: boolean;
  settings: VaultSettings;
  backup: BackupStatus;
}

export const AUTO_LOCK_LABELS: Record<AutoLockDelay, string> = {
  immediate: "Immediately",
  "1m": "1 minute",
  "5m": "5 minutes",
  "15m": "15 minutes",
  never: "Never",
};

export const DEFAULT_SETTINGS: VaultSettings = {
  theme: "dark",
  biometricUnlock: true,
  requireAuthOnLaunch: true,
  autoLock: "5m",
  hideCodesUntilFocus: false,
};
