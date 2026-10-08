# Roadmap

> Strategische Projektplanung. Der aktuelle operative Übergabestand mit aktiven PRs, Blockern und unmittelbaren nächsten Schritten liegt in `docs/engineering/CURRENT-WORK.md`.

## Regel- und Lexikonausbau

Ziel: Sprachverstand erweitert seine Regeln und Personenformen konservativ, regressionsgesichert und quellenneutral. Recherche-, Rohquellen- und Herkunftsdaten, die nicht für das öffentliche Produkt bestimmt sind, bleiben in einem getrennten autorisierten Arbeitsbereich; in dieses Repository gelangen nur eigenständig entwickelte Regeln, quellenneutrale Produktdaten und Tests.

### Produkt- und Evidenzpipeline

- [x] Kuratierte Aufnahme neuer Personenformen mit Positiv-/Negativregressionen und Flexionsprüfung etablieren.
- [x] Konservative Lexikon-Ausbauwellen bis einschließlich Welle 83 in `main` integrieren.
- [ ] Weitere priorisierte Berufs-, Lexikon-, Flexions- und Realtext-Evidenz systematisch gegen den aktuellen Produktstand auswerten.
- [ ] Kandidaten nur nach morphologischer, semantischer und kontextueller Absicherung produktiv übernehmen; mehrdeutige Fälle zurückhalten oder kontextgebunden modellieren.
- [ ] Quellen-/Evidenzarbeit so fortführen, dass private Rohdaten, URLs und Herkunftsmetadaten nicht in das öffentliche Produktrepository gelangen.
- [ ] **Erst nach Quellenabschluss und den Releases aller vorgesehenen modernen Browser** den eigenständigen Pale-Moon-Port auf den dann aktuellen Produktstand synchronisieren.

### Verbindliche Reihenfolge der verbleibenden Arbeiten

**Phase 1 – Quellen vor Releases** (endlicher, nachvollziehbarer Quellenabschluss):

- [ ] Quellenregister auf tatsächlich offene gegenüber bereits fachlich abgeschlossenen Quellen abgleichen, insbesondere die historischen KldB-/DKZ-Statusbezeichnungen.
- [ ] ESCO v1.2.1 als Delta-/Vollständigkeitsprüfung gegenüber dem bereits importierten und geprüften v1.2.0-API-Bestand bearbeiten.
- [ ] Hunspell DE quellen-, lizenz- und qualitätsgeprüft gegen das bestehende Lexikon abgleichen.
- [ ] IDS ReCKS und IDS KoRaP/Gender-Foundry auf tatsächliche Verfügbarkeit und relevante neue Realtext-/Annotierungsfälle prüfen; nur belastbare Daten übernehmen.
- [ ] Noch nicht abgeschlossene Kontext-/Glossar- und Wörterbuchfälle gezielt prüfen, insbesondere Genderleicht, Greifswald sowie DWDS/Duden **nur bei konkretem Klärungsbedarf**.
- [ ] Vor den Releases eine begrenzte Real-Web-/Flexions-/Negativregression mit nachvollziehbarer Ergebnisdokumentation durchführen.
- [ ] Alle daraus entstandenen sicheren Kandidaten nach unabhängiger lexikalischer Prüfung in `main` integrieren und Quellen einzeln mit Ergebnis/Verzicht als abgearbeitet kennzeichnen.

**Sonderfälle:** GENDERATOR ist nach der früheren ausdrücklichen Entscheidung **nicht** erneut vollständig zu scrapen. Die 142 freigegebenen Basen sind integriert, 449 weitere Kandidaten bleiben bewusst ungeprüft zurückgestellt. Laufende Real-Web-Messungen und manuelle Nachschlagequellen brauchen einen definierten Release-Stichtag und blockieren nicht unbegrenzt.

**Phase 2 – Moderne Browser-Releases**:

- [ ] Chromium/Chrome, Firefox und die weiteren vorgesehenen modernen Browserziele (Edge, Opera, soweit Releasekanäle vorbereitet sind) mit finalem Quellenschluss, CI, Browser-, Video- und Untertitelregression prüfen.
- [ ] Versions-/Paket-/Store-Metadaten sowie die geplanten Store-Freigaben und Veröffentlichungen abschließen bzw. deren externe Freigabe dokumentieren.

**Phase 3 – Pale Moon ausdrücklich zuletzt**:

- [ ] Erst nach Phase 2 das Legacy-Portierungsdelta neu bestimmen, den bestehenden Paritätskonflikt sauber lösen, Goanna-/Pale-Moon-Build und Runtime prüfen und einen neuen, aktuell basierten PR erstellen.
- [x] Den vorzeitig eröffneten Pale-Moon-PR #311 ohne Merge schließen und seinen Feature-Branch als Referenz erhalten; `palemoon` selbst bleibt unangetastet.

Der detaillierte nicht öffentliche Quellen- und Abarbeitungsstand wird nur bei Aufgaben geladen, die Quellenimport, Audit, Provenienz/Lizenz, Kandidatengenerierung oder Coverage/Evidenz betreffen. Die sichere Wiederaufnahme- und Lookup-Regel steht in `docs/engineering/CURRENT-WORK.md`.

## Internationalisierung und Store-Reichweite

Ziel: Sprachverstand wird technisch und inhaltlich für 51 WebExtension-Locales gepflegt. Deutsch ist die fachliche Referenz. Jede Locale muss exakt 170 i18n-Nachrichten und dieselben Platzhalter wie Deutsch enthalten.

### Technische Leitplanken

- [x] WebExtension-i18n als gemeinsame Basis für Chromium, Edge, Opera und Firefox verwenden.
- [x] Locale-Matrix zentral in `config/locales.json` pflegen.
- [x] Deutsch als Referenz mit exakt 170 Nachrichten festschreiben.
- [x] Vollständigkeit, identische Keys und Platzhalter automatisiert validieren.
- [x] RTL-Unterstützung für Arabisch, Persisch und Hebräisch berücksichtigen.
- [x] Locale-Matrix von 50 auf 51 Sprachen erweitern und Amharisch ergänzen.
- [x] Alle 51 Locale-Dateien vollständig erstellen.
- [x] Alle UI-Texte konsequent über i18n-Keys anbinden; verbleibende hart codierte Oberflächentexte entfernen.
- [x] Vollständigen `npm run check` auf der 51-Sprachen-Matrix grün bekommen.

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
| [x] | `ml` | മലയാളം |
| [x] | `mr` | मराठी |
| [x] | `ms` | Bahasa Melayu |
| [x] | `sw` | Kiswahili |
| [x] | `ta` | தமிழ் |
| [x] | `te` | తెలుగు |
| [x] | `th` | ไทย |
| [x] | `vi` | Tiếng Việt |
| [x] | `zh_CN` | 简体中文 |
| [x] | `zh_TW` | 繁體中文 |

### Store-Lokalisierung

- [x] Für jede der 51 Sprachen eine store-taugliche Kurzbeschreibung aus `extensionDescription` pflegen.
- [x] Für jede der 51 Sprachen einen vollständigen Store-Beschreibungstext im Repository pflegen. Fortschritt: 51/51.
- [x] Chrome Web Store: globale Screenshots weiterverwenden; lokalisierte Screenshots nur bei messbarem Bedarf.
- [ ] Chrome Web Store: lokale Langbeschreibungen für alle unterstützten Locales im Developer Dashboard hinterlegen.
- [x] Chrome Web Store API V2 für Paket-Upload, Status und Veröffentlichung vorbereiten; Listing-Metadaten bleiben Dashboard-Aufgabe.
- [x] Microsoft Edge Add-ons: lokalisierte Store-Texte und wiederverwendete Bildassets vorbereiten.
- [x] Opera Add-ons: lokalisierte Store-Texte soweit vom Store unterstützt vorbereiten.
- [x] Firefox AMO: eigene, geprüfte Store-Texte für 29 Quellsprachen bereitstellen und auf 34 produktive Listing-Locales abbilden.
- [x] Firefox AMO: bestehende v5-API-Helfer um Listing-Status und explizit freigegebenes Listing-Update erweitern.
- [ ] Firefox AMO: 34 lokalisierte Kurz- und Langbeschreibungen nach expliziter Store-Freigabe in das bestehende Live-Listing einspielen.
- [x] Store-Texte mit einer gemeinsamen deutschen Referenz und konsistenter Funktionsbeschreibung absichern.

### Abschluss

- [x] PR für den vollständigen i18n-Ausbau erstellen.
- [x] CI vollständig grün.
- [x] Nach `main` mergen.
- [x] Abschließende `main`-CI prüfen.
- [x] Danach neuen Prerelease mit 51 Locales erstellen.