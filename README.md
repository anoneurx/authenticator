# ANONEURX Authenticator

> A privacy-first, offline-first TOTP authenticator for the Android.

ANONEURX Authenticator is a completely offline authenticator that generates
time-based one-time passwords (TOTP) entirely on your device. It has **no
backend, no cloud sync, no analytics, and no network calls** — everything the
app knows stays on the device.

## Features

- Add TOTP accounts by scanning a QR code (on-device camera, `jsQR`)
- Add accounts manually using a secret key
- View 6-digit authentication codes with a live countdown ring
- Search, copy, edit labels, and delete accounts
- Lock the vault and unlock with device authentication (biometrics / passkey)
  or an on-device pattern
- Export and import an encrypted `.aax` backup
- PWA-ready, fully responsive UI
- Android app via Capacitor (distributed through Google Play)

## Privacy-focused architecture

- **No network.** The application never makes outbound HTTP requests. All
  crypto, TOTP generation, QR decoding, and storage happen locally.
- **Local-only storage.** The vault is persisted in the browser/WebView
  `localStorage`. See [PRIVACY.md](./PRIVACY.md) for the exact behavior.
- **Encrypted backups.** `.aax` backups are sealed with
  PBKDF2-HMAC-SHA256 key derivation and AES-256-GCM authenticated encryption.
- **No telemetry.** There is no analytics SDK and no third-party tracking.

## Offline-first concept

The app is designed to work with zero connectivity. TOTP codes are computed
from secrets already stored on the device and the current time. There is no
account, no server, and no recovery service — losing the device without a
backup means losing access, by design.

## Technology stack

- React 19 + TypeScript
- Vite 7
- TanStack Start / TanStack Router
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Capacitor 8 (Android)
- WebCrypto API for cryptography
- WebAuthn for device-bound unlock

## Project structure

```text
anoneurx-authenticator/
├── src/                  # Application source (routes, libs, components)
│   ├── lib/              # Crypto, vault storage, TOTP, backup, device lock
│   ├── components/anoneurx/  # Feature components
│   ├── components/ui/    # Base UI primitives
│   └── routes/           # TanStack routes
├── public/               # Static web assets (icons, manifest, sw.js)
├── android/              # Capacitor Android project (committed; keystore excluded)
├── capacitor.config.ts
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── README.md
├── LICENSE
├── SECURITY.md
├── PRIVACY.md
├── CONTRIBUTING.md
└── .gitignore
```

> Note: Tailwind v4 is configured through the Vite plugin, so there is no
> separate `tailwind.config.*` or `postcss.config.*` file.

## Development setup

Requirements: Node.js 20+ and npm.

```bash
npm install        # or: npm ci  (uses package-lock.json)
```

## Run the web version

```bash
npm run dev        # start the Vite dev server
```

Production web build:

```bash
npm run build      # build the app (outputs to .output/)
npm run preview    # preview the production build locally
```

## Android (Capacitor)

The `android/` directory is the Capacitor Android project and **is part of this
repository** so contributors can build and run the native app. Build artifacts,
APK/AAB files, and the signing keystore are **not** committed.

Build and sync the web assets into the Android project:

```bash
npm run android:build   # vite build -> render-static.mjs -> npx cap sync android
npm run android:open     # open the project in Android Studio
npm run android:run      # build & run on a connected device/emulator
```

`capacitor.config.ts` uses `webDir: ".output/public"`; `render-static.mjs`
generates the static `index.html` shell that Capacitor copies into the native
project.

### Android development

1. Install Android Studio and the Android SDK.
2. Run `npm run android:build` to produce and sync the native assets.
3. Open the project with `npm run android:open` and build/run from Android
   Studio, or use `npm run android:run`.

Signing is handled locally via `android/app/release-key.jks` (excluded from
version control — see `.gitignore`). Do not commit keystores or signing
credentials.

## Google Play availability

The Android application is distributed through the **Google Play Store**, not
through GitHub Releases. APK/AAB binaries and signing keys are intentionally
kept out of this repository.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). In short: fork, branch, run
`npm run lint` and `npm run build` before opening a pull request, and keep all
behavior local/offline.

## Security

Found a vulnerability? Please report it privately to
**security@anoneurx.com** or via GitHub Private Vulnerability Reporting. See
[SECURITY.md](./SECURITY.md).

## License

Released under the [Apache License 2.0](./LICENSE).
