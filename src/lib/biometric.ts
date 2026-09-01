/**
 * Native / Web biometric unlock primitives.
 *
 * On Android (Capacitor) this uses `@aparajita/capacitor-biometric-auth` which
 * presents the OS fingerprint / face / iris prompt (with optional device
 * PIN/pattern/passkey fallback). On the web it falls back to WebAuthn's
 * platform authenticator (Windows Hello, Touch ID, Face ID, etc.).
 */

import { Capacitor } from "@capacitor/core";

let bioModule: typeof import("@aparajita/capacitor-biometric-auth") | null =
  null;

async function loadBiometricAuth() {
  if (!bioModule) {
    bioModule = await import("@aparajita/capacitor-biometric-auth");
  }
  return bioModule;
}

export interface BiometryStatus {
  /** True when the device supports biometry and the user has enrolled. */
  available: boolean;
  /** Human readable biometry name, e.g. "Fingerprint" or "Face ID". */
  name: string;
}

/**
 * Check whether biometry is available and enrolled on this device.
 */
export async function biometricAvailability(): Promise<BiometryStatus> {
  if (typeof window === "undefined") return { available: false, name: "" };

  if (Capacitor.isNativePlatform()) {
    try {
      const { BiometricAuth, BiometryType, getBiometryName } =
        await loadBiometricAuth();
      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable) return { available: false, name: "" };
      const name =
        getBiometryName(info.biometryType) ||
        (info.biometryTypes.includes(BiometryType.fingerprintAuthentication)
          ? "Fingerprint"
          : "Biometric");
      return { available: true, name };
    } catch {
      return { available: false, name: "" };
    }
  }

  // Web: platform authenticator (WebAuthn)
  try {
    const supported = Boolean(window.PublicKeyCredential);
    if (!supported) return { available: false, name: "" };
    const enrolled =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!enrolled) return { available: false, name: "" };
    return { available: true, name: "Biometric" };
  } catch {
    return { available: false, name: "" };
  }
}

/**
 * Prompt the user to confirm with the OS biometric / passkey / device lock.
 * Resolves `true` only when authentication (with user verification) succeeds.
 */
export async function authenticateBiometric(
  reason = "Unlock your vault",
  allowDeviceCredential = true,
): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { BiometricAuth } = await loadBiometricAuth();
      await BiometricAuth.authenticate({ reason, allowDeviceCredential });
      return true;
    } catch {
      // BiometryError (userCancel, biometryLockout, authenticationFailed, …)
      return false;
    }
  }

  // Web: WebAuthn platform authenticator
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: [],
      },
    });
    return true;
  } catch {
    // No discoverable credential yet — register the vault passkey the first time.
    try {
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Authenticator" },
          user: {
            id: userId,
            name: "vault-user",
            displayName: "Vault Unlock",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });
      return Boolean(credential);
    } catch {
      return false;
    }
  }
}
