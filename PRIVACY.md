# Privacy

This document describes the **actual** behavior of ANONEURX Authenticator as
implemented in the source code. It does not make claims about planned features.

## What the app does

- **Everything runs on the device.** The app makes **no network requests**.
  There is no backend, no cloud synchronization, no analytics, and no
  third-party telemetry. TOTP generation, QR decoding, cryptography, and
  storage all happen locally.
- **Camera is used on-device only.** When you scan a QR code, the image is
  decoded locally (via `jsQR`) to extract the `otpauth://` URI. The camera
  feed is never uploaded.
- **Notifications are local and optional.** System notifications ( Capacitor
  Local Notifications / Web Notifications) are opt-in and never leave the
  device.

## How data is stored

- The vault (your accounts and TOTP secrets) is persisted in the browser or
  WebView **`localStorage`** under the key `anoneurx.vault.v1` as **plaintext
  JSON**.
- **The live vault is currently stored as plaintext and is NOT encrypted at
  rest.** Anyone with access to the browser/WebView storage (e.g., via
  malware, a compromised device, or a rooted device) could read the secrets in
  clear text.
- Unlock credentials (password/pattern) are stored only as salted digests; the
  raw secret is never persisted.

## Backups (`.aax`)

- Exporting a backup produces an encrypted `.aax` file.
- Backups are sealed with **PBKDF2-HMAC-SHA256** key derivation (100,000
  iterations, random 16-byte salt) and **AES-256-GCM** authenticated
  encryption (12-byte random IV, 128-bit tag).
- Without the correct password the backup cannot be decrypted or tampered
  with undetected.
- Be aware that a legacy XOR-based backup path also exists in the code; the
  modern, recommended path is the AES-256-GCM `.aax` export.

## Permissions

- The app requests camera access only to scan QR codes, and (on Android)
  notification permission only if you opt in. No permission is required for
  core TOTP functionality.

## Planned / future work (NOT yet implemented)

- **Encryption-at-rest for the live vault.** A future security core (intended
  to be a Rust component) is planned to encrypt the in-storage vault, so secrets
  are not kept as plaintext `localStorage` JSON.
- Hardware-backed key storage and stronger OS integration.

Until those improvements land, treat the device itself as the trust boundary:
use a strong device lock, and keep backups encrypted and stored safely.
