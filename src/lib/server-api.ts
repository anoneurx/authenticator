/**
 * Anoneurx Authenticator — Backend API Handlers
 *
 * Implements server-side / API backend logic for verifying TOTP codes,
 * parsing QR URIs, and exporting/inspecting AAX backups.
 * Zero-cloud, local execution.
 */

import { generateCodeAsync, parseOtpAuthUri, verifyTotpCode, buildOtpAuthUri } from "./totp";
import { exportToAAX, importFromAAX, inspectAAXHeader } from "./aax-backup";
import type { VaultAccount, VaultSettings } from "./vault-types";

export interface CalculateOtpRequest {
  secret: string;
  algorithm?: string;
  digits?: number;
  period?: number;
}

export interface VerifyOtpRequest extends CalculateOtpRequest {
  code: string;
  window?: number;
}

export interface ExportBackupRequest {
  accounts: VaultAccount[];
  password: string;
  settings?: Partial<VaultSettings>;
}

export interface VerifyBackupRequest {
  aaxFileContent: string;
  password?: string;
}

/** Backend API Service Controller */
export const SecurityBackendAPI = {
  /** Calculate current OTP for secret */
  async calculateOtp(req: CalculateOtpRequest) {
    if (!req.secret) throw new Error("Secret is required.");
    const options: Parameters<typeof generateCodeAsync>[1] = {};
    if (req.algorithm) options.algorithm = req.algorithm as any;
    if (req.digits !== undefined) options.digits = req.digits as any;
    if (req.period !== undefined) options.period = req.period;
    const code = await generateCodeAsync(req.secret, options);
    return { code, algorithm: req.algorithm || "SHA1", digits: req.digits || 6 };
  },

  /** Verify TOTP code with time drift window */
  async verifyOtp(req: VerifyOtpRequest) {
    if (!req.secret || !req.code) throw new Error("Secret and code are required.");
    const options: Parameters<typeof verifyTotpCode>[2] = { window: req.window ?? 1 };
    if (req.algorithm) options.algorithm = req.algorithm as any;
    if (req.digits !== undefined) options.digits = req.digits as any;
    if (req.period !== undefined) options.period = req.period;
    const valid = await verifyTotpCode(req.code, req.secret, options);
    return { valid };
  },

  /** Parse setup QR / otpauth:// URI */
  parseUri(uri: string) {
    return parseOtpAuthUri(uri);
  },

  /** Generate setup QR / otpauth:// URI */
  buildUri(params: {
    issuer: string;
    account: string;
    secret: string;
    algorithm?: string;
    digits?: number;
    period?: number;
  }) {
    return buildOtpAuthUri(params);
  },

  /** Generate encrypted AAX backup payload */
  async exportBackup(req: ExportBackupRequest) {
    const payload = await exportToAAX(req.accounts, req.password, req.settings);
    return { payload, filename: "Anoneurx-Authenticator-Backup.aax" };
  },

  /** Inspect or decrypt AAX backup payload */
  async verifyBackup(req: VerifyBackupRequest) {
    const header = inspectAAXHeader(req.aaxFileContent);
    if (req.password) {
      const decrypted = await importFromAAX(req.aaxFileContent, req.password);
      return { header, validPassword: true, accountCount: decrypted.accounts.length };
    }
    return { header, validPassword: null };
  },
};
