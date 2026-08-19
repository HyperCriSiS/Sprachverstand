# Sprachverstand — Repository Instructions

Follow the global Codex instructions first.

## Product constraints

- This is a browser extension focused on local text transformation and readability.
- Preserve privacy-first/local behavior. Do not introduce unnecessary remote processing, telemetry, tracking, or cloud dependencies.
- Maintain German and English UI/localization consistently when user-facing strings change.
- Treat Firefox/Waterfox compatibility as first-class. Check Chromium-specific behavior separately when applicable.
- Pale Moon or legacy compatibility must not be assumed from modern WebExtension behavior; verify it separately where the project supports it.
- Subtitle handling, page text transformation, options UI, permissions, and content-script behavior are regression-sensitive.

## Change rules

- Avoid broad text-transformation changes without representative tests because small rule changes can alter large amounts of page content.
- Do not silently increase extension permissions.
- Keep manifests, package metadata, build scripts, store-facing metadata, and version sources synchronized.
- Preserve the user's established wording/branding decisions unless the task explicitly changes them.

## Repository workflow

- Read `README.md`, `CHANGELOG.md`, `PRIVACY.md`, `SECURITY.md`, `UPSTREAMS.md`, manifests, package scripts, tests, and CI before substantial changes.
- If no `ROADMAP.md` exists but project work requires one, follow the global roadmap rule and repository conventions rather than creating competing planning files.
