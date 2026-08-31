import { toast } from "@/lib/notify";

/**
 * Prompts native OS device lock / Passkey / Biometric verification.
 * Opens OS Device Lock (fingerprint, Face ID, Screen PIN, Passkey).
 */
export async function authenticateDeviceLock(actionName = "delete this account"): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return true;
  }

  try {
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      return true;
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    try {
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
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Authenticator" },
          user: {
            id: userId,
            name: "vault-user",
            displayName: `Device Lock Verification — ${actionName}`,
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

      return !!credential;
    }
  } catch (err: any) {
    if (
      err?.name === "NotAllowedError" ||
      err?.name === "AbortError" ||
      err?.name === "SecurityError" ||
      err?.name === "InvalidStateError"
    ) {
      toast.error("Device lock authentication canceled", {
        description: "Device verification was canceled or failed. Account was not deleted.",
      });
      return false;
    }
    return true;
  }
}
