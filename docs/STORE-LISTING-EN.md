# English store listing for Sprachverstand

**Status: 17 August 2026**

This file is the versioned English source for the Firefox Add-ons and Chrome Web Store listings. The product name remains **Sprachverstand** in all languages. English is an interface and store language; Sprachverstand continues to process German website text and does not translate websites.

The public privacy policy is available in [`PRIVACY.md`](../PRIVACY.md).

## Shared information

**Name:** Sprachverstand

**Tagline:** Makes German websites easier to read.

**Short description:**

> Normalizes selected gendered forms in German website text locally in your browser, with configurable rules and no tracking or telemetry.

**Single purpose:**

> Sprachverstand locally adjusts supported gendered forms in German website text according to configurable reading preferences.

The English listing is intended both for English-speaking readers of German websites and for people learning German.

## Firefox Add-ons

**Recommended category:** Language Support

### Detailed description

Sprachverstand makes German websites easier to read by normalizing selected gendered spellings directly in your browser.

Forms such as `Nutzer:innen`, `Mitarbeiter*innen`, `NutzerInnen`, double forms, nominalized adjectives and selected participle forms are handled according to conservative, configurable rules.

Examples:

- Nutzer:innen → Nutzer
- Mitarbeiter*innen → Mitarbeiter
- NutzerInnen → Nutzer
- NutzerIn → Nutzer
- Nutzerinnen und Nutzer → Nutzer
- Student*innen → Studenten
- Studierende → Studenten
- Erwachsene:r → Erwachsener

The website itself and its server-side data remain unchanged. Sprachverstand changes only the local presentation in your browser. Disabling the extension restores its changes on open pages without requiring a reload.

Features include individually selectable rule groups, a correction counter, personal exceptions, literal custom replacements without regular expressions, live preview and conflict hints, local JSON import/export, optional per-category browser synchronization, domain exclusions, optional handling of quotations, subtitles and accessible text attributes, and protection for input fields, editors, source code, URLs and technical data.

Sprachverstand deliberately favors conservative processing: unknown or ambiguous forms remain unchanged when a sufficiently reliable replacement is not available.

Privacy:

- website text is processed locally in the browser
- no website text or visited addresses are sent to the developer
- no proprietary cloud service or external language API
- no tracking or telemetry
- no advertising or user profiling
- settings remain local by default
- optional synchronization uses only the browser provider's synchronization service and only for categories explicitly selected by the user

Supported platforms: Firefox for desktop and Firefox for Android.

## Chrome Web Store

**Recommended category:** Accessibility

### Detailed description

Sprachverstand normalizes selected gendered forms in German website text locally in your browser. It can be useful for readers who prefer conventional grammatical forms as well as for learners of German who find forms such as the gender colon, gender asterisk, Binnen-I or double forms harder to parse.

Supported examples include `Nutzer:innen`, `Mitarbeiter*innen`, `NutzerInnen`, `NutzerIn`, `Nutzerinnen und Nutzer`, selected nominalized adjectives and selected participle forms. Each rule group can be enabled or disabled separately.

All text processing happens locally. The extension does not send website text, browsing history or usage data to the developer and does not use an external language service, tracking, telemetry or advertising.

Additional features include personal exceptions and literal replacements, live preview, JSON backup and restore, optional browser synchronization by data category, domain exclusions, optional subtitle processing and optional handling of accessible text attributes.

### Search terminology

Use these terms naturally in prose rather than as keyword stuffing: German language, German learners, German gendered language, gender colon, gender asterisk, Binnen-I, double forms, German text normalization, readable German.

## Store localization workflow

- Keep **Sprachverstand** unchanged as the product name.
- The extension package contains `_locales/de/messages.json` and `_locales/en/messages.json`.
- German is the fallback locale.
- The browser UI language selects the extension interface automatically.
- Mozilla AMO and Chrome Web Store listing texts are maintained separately in their respective developer dashboards using this file as the English source of truth.
