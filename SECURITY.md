# Security Policy

## Supported Versions

Security fixes are applied to the latest release line and to `main`.

| Version | Supported |
| ------- | --------- |
| latest `main` / current release | ✅ |
| older releases | ❌ |

## Reporting a Vulnerability

Please report security vulnerabilities **privately**. Do not open a public
GitHub issue for an active vulnerability.

- Email: **security@anoneurx.com**
- Or use GitHub **Private Vulnerability Reporting** for this repository
  (Security → Report a vulnerability).

Please include:

- A clear description of the vulnerability and its impact
- Steps to reproduce (proof-of-concept if possible)
- Affected version(s) / commit
- Any suggested mitigation

What **not** to include in public channels:

- Exploits against third parties
- Disclosure before a fix is available
- The signing keystore or any credential (these are never in the repository)

We will acknowledge receipt, work on a fix, and coordinate disclosure with you.
Public disclosure should only happen after a fix has been released.

## Scope

Only the published source in this repository is in scope. The Android signing
keystore and any deployment keys are intentionally kept private and are not
part of this repo.

## Out of Scope

- The Google Play distribution infrastructure
- Third-party services not used by the app (the app makes no network calls)
