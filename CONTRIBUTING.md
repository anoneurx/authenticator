# Contributing to ANONEURX Authenticator

Thanks for your interest in contributing! This project is open source under the
Apache License 2.0.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies (requires Node.js 20+):

   ```bash
   npm install      # or: npm ci
   ```

3. Create a feature branch from `main`:

   ```bash
   git checkout -b my-feature
   ```

## Before opening a pull request

Run the linter and a production build to make sure your changes are clean:

```bash
npm run lint
npm run build
```

Type-checking is part of the build. Please fix any lint or type errors before
submitting.

## Guidelines

- Keep the app **offline-first and local-only**. Do not add network calls,
  analytics, telemetry, or cloud synchronization unless explicitly discussed
  and approved via an issue.
- Match the existing architecture: crypto in `src/lib/crypto.ts`, persistence
  in `src/lib/vault-storage.ts`, TOTP logic in `src/lib/totp.ts`.
- Follow the existing code style (ESLint + Prettier are configured).
- Keep commits focused and write clear commit messages.
- Update `README.md` / docs when behavior or setup changes.

## Android / Capacitor

- The `android/` Capacitor project is part of the repo.
- **Never** commit APK/AAB files, signing keystores (`.jks`/`.keystore`), or
  any credential. These are excluded by `.gitignore`.
- Build native assets with `npm run android:build` before opening Android
  Studio.

## Reporting security issues

Do **not** open public issues for security vulnerabilities. See
[SECURITY.md](./SECURITY.md) and email **security@anoneurx.com**.

## License

By contributing, you agree that your contributions will be licensed under the
Apache License 2.0.
