# Roadmap

## Internationalisierung und Store-Reichweite

Ziel: Sprachverstand wird technisch und inhaltlich für 51 WebExtension-Locales gepflegt. Deutsch ist die fachliche Referenz. Jede Locale muss exakt 161 i18n-Nachrichten und dieselben Platzhalter wie Deutsch enthalten.

### Technische Leitplanken

- [x] WebExtension-i18n als gemeinsame Basis für Chromium, Edge, Opera und Firefox verwenden.
- [x] Locale-Matrix zentral in `config/locales.json` pflegen.
- [x] Deutsch als Referenz mit exakt 161 Nachrichten festschreiben.
- [x] Vollständigkeit, identische Keys und Platzhalter automatisiert validieren.
- [x] RTL-Unterstützung für Arabisch, Persisch und Hebräisch berücksichtigen.
- [x] Locale-Matrix von 50 auf 51 Sprachen erweitern und Amharisch ergänzen.
- [ ] Alle 51 Locale-Dateien vollständig erstellen.
- [ ] Alle UI-Texte konsequent über i18n-Keys anbinden; verbleibende hart codierte Oberflächentexte entfernen.
- [ ] Vollständigen `npm run check` auf der 51-Sprachen-Matrix grün bekommen.

### UI-Lokalisierungen

| Status | Code | Sprache |
| --- | --- | --- |
| [x] | `de` | Deutsch |
| [x] | `en` | English |
| [x] | `es` | Español |
| [x] | `fr` | Français |
| [x] | `it` | Italiano |
| [x] | `nl` | Nederlands |
| [x] | `pl` | Polski |
| [x] | `pt_BR` | Português (Brasil) |
| [x] | `pt_PT` | Português (Portugal) |
| [x] | `da` | Dansk |
| [x] | `sv` | Svenska |
| [x] | `no` | Norsk |
| [x] | `fi` | Suomi |
| [x] | `cs` | Čeština |
| [x] | `sk` | Slovenčina |
| [x] | `hr` | Hrvatski |
| [x] | `sl` | Slovenščina |
| [x] | `sr` | Српски |
| [x] | `hu` | Magyar |
| [x] | `ro` | Română |
| [x] | `bg` | Български |
| [x] | `ru` | Русский |
| [x] | `uk` | Українська |
| [x] | `el` | Ελληνικά |
| [x] | `tr` | Türkçe |
| [x] | `ca` | Català |
| [x] | `et` | Eesti |
| [x] | `lt` | Lietuvių |
| [x] | `am` | አማርኛ |
| [x] | `ar` | العربية |
| [x] | `bn` | বাংলা |
| [x] | `fa` | فارسی |
| [x] | `fil` | Filipino |
| [x] | `gu` | ગુજરાતી |
| [x] | `he` | עברית |
| [x] | `hi` | हिन्दी |
| [x] | `id` | Bahasa Indonesia |
| [x] | `ja` | 日本語 |
| [x] | `kn` | ಕನ್ನಡ |
| [x] | `ko` | 한국어 |
| [x] | `lv` | Latviešu |
| [ ] | `ml` | മലയാളം |
| [ ] | `mr` | मराठी |
| [ ] | `ms` | Bahasa Melayu |
| [ ] | `sw` | Kiswahili |
| [ ] | `ta` | தமிழ் |
| [ ] | `te` | తెలుగు |
| [ ] | `th` | ไทย |
| [ ] | `vi` | Tiếng Việt |
| [ ] | `zh_CN` | 简体中文 |
| [ ] | `zh_TW` | 繁體中文 |

### Store-Lokalisierung

- [ ] Für jede der 51 Sprachen eine store-taugliche Kurzbeschreibung aus `extensionDescription` pflegen.
- [ ] Für jede der 51 Sprachen einen vollständigen Store-Beschreibungstext im Repository pflegen.
- [ ] Chrome Web Store: globale Screenshots weiterverwenden; lokalisierte Screenshots nur bei messbarem Bedarf.
- [ ] Chrome Web Store: lokale Langbeschreibungen für alle unterstützten Locales im Developer Dashboard hinterlegen.
- [ ] Chrome Web Store API V2 für Paket-Upload, Status und Veröffentlichung vorbereiten; Listing-Metadaten bleiben Dashboard-Aufgabe.
- [ ] Microsoft Edge Add-ons: lokalisierte Store-Texte und wiederverwendete Bildassets vorbereiten.
- [ ] Opera Add-ons: lokalisierte Store-Texte soweit vom Store unterstützt vorbereiten.
- [ ] Firefox AMO: lokalisierte Metadaten strukturiert aus dem Repository bereitstellen.
- [ ] Store-Texte mit einer gemeinsamen deutschen Referenz und konsistenter Funktionsbeschreibung absichern.

### Abschluss

- [ ] PR für den vollständigen i18n-Ausbau erstellen.
- [ ] CI vollständig grün.
- [ ] Nach `dev` mergen.
- [ ] Abschließende `dev`-CI prüfen.
- [ ] Danach neuen Prerelease mit 51 Locales erstellen.
