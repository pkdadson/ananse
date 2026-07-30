# Security Policy

## Supported versions

Ananse is pre-1.0. Security fixes will be released against the latest published
minor of each package (`@ananse/core`, `@ananse/react`, `@ananse/tokens`).

| Version | Supported |
|---------|-----------|
| Latest `0.x` | :white_check_mark: |
| Older `0.x` | :x: |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Report privately via one of the following:

1. **GitHub Private Vulnerability Reporting** (preferred) — from the repository
   [Security tab](https://github.com/pkdadson/ananse/security/advisories/new),
   choose "Report a vulnerability". This creates a private advisory only
   maintainers can see.
2. **Email** — `security@` an address the maintainer publishes on their
   GitHub profile (do not publish a live address in this file to avoid
   scraping).

Please include:

- A description of the vulnerability and the affected package(s) and version(s).
- Steps to reproduce, ideally with a minimal repro or PoC.
- The impact you believe it has (e.g. XSS in `<OrgChart>` via unescaped names,
  prototype pollution in `loadOrg`, etc.).
- Any suggested remediation.

## What to expect

- **Acknowledgement** within 3 business days.
- **Initial assessment** within 7 business days confirming severity and
  triage plan.
- **Fix and coordinated disclosure** typically within 30 days for high-severity
  issues; longer for low-severity or issues requiring API changes.
- **Credit** in the release notes (unless you prefer to remain anonymous).

## Scope

In scope:
- Code in `packages/core`, `packages/react`, `packages/tokens` on published
  npm versions.

Out of scope:
- Vulnerabilities in downstream applications built with Ananse.
- Vulnerabilities in third-party dependencies — please report those directly
  to their maintainers. If exploitable through Ananse's default use, we will
  pin or patch.
- Denial of service via extremely large inputs (>10k nodes) — Ananse is not
  hardened for adversarial inputs at that scale; use `@ananse/core` schema
  validation and your own limits at the boundary.
