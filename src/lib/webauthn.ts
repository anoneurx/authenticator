/**
 * Anoneurx Passkeys — Web Authentication (WebAuthn) platform helper.
 *
 * Registers a device-bound passkey (Face ID / Touch ID / Fingerprint /
 * Windows Hello / Android biometrics) and verifies it on every unlock.
 * The credential ID is public information and lives in local storage.
 */

const CRED_KEY = "anoneurx.passkey.credentialId";

export function passkeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    !!navigator.credentials?.create &&
    !!navigator.credentials?.get
  );
}

/** True when this device already has a passkey registered for the vault. */
export function hasRegisteredPasskey(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(CRED_KEY));
  } catch {
    return false;
  }
}

export function clearPasskey(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CRED_KEY);
  } catch {
    // Ignore storage failures
  }
}

function bufferToB64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuffer(value: string): ArrayBuffer {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Creates a platform passkey — triggers the OS biometric prompt
 * (Face ID / Touch ID / fingerprint). Must be called from a user gesture.
 */
export async function registerPasskey(userName: string, displayName: string): Promise<boolean> {
  if (!passkeySupported()) return false;
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Authenticator", id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: userName,
          displayName: displayName || userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential?.rawId) return false;
    window.localStorage.setItem(CRED_KEY, bufferToB64url(credential.rawId));
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies the device passkey — triggers the OS biometric prompt.
 * Resolves true only when the authenticator confirmed the user.
 */
export async function authenticateWithPasskey(): Promise<boolean> {
  if (!passkeySupported()) return false;
  try {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(CRED_KEY) : null;
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname,
      userVerification: "required",
      timeout: 60000,
      ...(stored
        ? {
            allowCredentials: [
              { type: "public-key" as const, id: b64urlToBuffer(stored) },
            ],
          }
        : {}),
    };
    const assertion = await navigator.credentials.get({ publicKey });
    return Boolean(assertion);
  } catch {
    return false;
  }
}
