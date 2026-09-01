# Store-Ausgaben

Die gemeinsamen Store-Ausgaben werden aus denselben geprüften Quellen erzeugt:

- `config/locales.json`
- `static/_locales/<locale>/messages.json`
- `store/listings/<locale>.json`

Firefox AMO verwendet zusätzlich bewusst eigene Store-Texte unter `store/amo-listings/<locale>.json`. Die AMO-Seite ist damit nicht mehr an die längere Chrome-/Edge-/Opera-Beschreibung gekoppelt. Technische Aussagen und Funktionsumfang bleiben dennoch konsistent.

## Erzeugen

```bash
npm run store:generate
```

Die erzeugten Dateien landen unter `store/generated/` und werden nicht versioniert, weil sie jederzeit reproduzierbar sind.

Erzeugt werden:

- `amo-metadata.json`
- `amo-worklist.csv`
- `chrome-dashboard.csv`
- `chrome-dashboard.html`
- `edge-worklist.csv`
- `opera-worklist.csv`

Die CI prüft mit `npm run validate:store-exports`, dass sämtliche Quelldaten und Zuordnungen vollständig generierbar sind.

## Firefox AMO

AMO unterstützt für Store-Einträge derzeit 43 produktive Locales. Sprachverstand deckt davon mit seinen vorhandenen UI-Sprachen **34 produktive AMO-Store-Locales** sinnvoll ab. Für neun weitere AMO-Sprachen wird bewusst kein Store-Text vorgetäuscht, solange die Erweiterungsoberfläche diese Sprachen nicht unterstützt.

Für AMO werden **29 eigenständige Quellübersetzungen** gepflegt. Regionale AMO-Varianten verwenden daraus passende gemeinsame Texte:

- `en` → `en-US`, `en-GB`, `en-CA`
- `es` → `es-ES`, `es-AR`, `es-CL`, `es-MX`
- `pt_BR` → `pt-BR`
- `pt_PT` → `pt-PT`
- `sv` → `sv-SE`
- `no` → `nb-NO`
- `zh_CN` → `zh-CN`
- `zh_TW` → `zh-TW`

Die AMO-spezifische Beschreibung ist kompakter als der allgemeine Store-Text. Sie beschreibt insbesondere die lokale Textverarbeitung, vorsichtige Regelanwendung, persönliche Ausnahmen, Domain-Ausschlüsse, JSON-Sicherung, dynamische Inhalte und die optional aktivierbare Firefox-Synchronisierung. Ein früherer großer SEO-Tagblock wird nicht übernommen.

`amo-metadata.json` enthält:

- 34 lokalisierte Kurzbeschreibungen,
- 34 lokalisierte Vollbeschreibungen,
- Kategorie `language-support`,
- Lizenz `AGPL-3.0-only`.

`amo-worklist.csv` dient zusätzlich als lesbare Kontroll- und Übertragungshilfe.

Die Datei kann bei einer neuen AMO-Einreichung mit `web-ext` verwendet werden:

```bash
web-ext sign --channel=listed --amo-metadata=store/generated/amo-metadata.json
```

Für das bereits vorhandene AMO-Listing kann der aktuelle öffentliche Zustand ohne Zugangsdaten geprüft werden:

```bash
npm run amo:status
```

Die 34 Summary-/Description-Übersetzungen können anschließend über die offizielle AMO-v5-API aktualisiert werden:

```bash
AMO_API_KEY='…' AMO_API_SECRET='…' npm run amo:update-listing
```

API-Key und Secret werden auf der AMO-Seite für API-Zugangsdaten erzeugt. Sie dürfen niemals ins Repository, in Ausgaben oder in Tickets übernommen werden. Der Update-Helfer verwendet sie nur zur Laufzeit und schreibt sie nicht in Dateien.

Die AMO-Locale-Liste ist eine Store-Eigenschaft und kann sich unabhängig von den unterstützten Firefox-Sprachen ändern. Deshalb validiert der Generator die 29 Quelltexte und die 34 Ziel-Locales ausdrücklich.

## Microsoft Edge Add-ons

Edge erkennt die im Paket enthaltenen Sprachen aus Manifest und `_locales`. Für jede angelegte Store-Sprache ist eine Vollbeschreibung erforderlich.

`edge-worklist.csv` enthält alle 51 vorhandenen Kurz- und Vollbeschreibungen als Übertragungshilfe. Die Datei ist **kein offiziell zugesichertes Edge-Importformat**.

Bildassets werden nicht pro Sprache dupliziert. Im Partner Center wird das vorhandene Logo bzw. der vorhandene Screenshot über die Funktion **Duplizieren** auf die anderen Sprachen übernommen.

## Opera Add-ons

`opera-worklist.csv` enthält dieselben 51 geprüften Texte als Arbeitsgrundlage für die von Opera angebotenen lokalen Store-Felder.

Da für Opera kein verlässliches offizielles Massenimportformat vorausgesetzt wird, ist die CSV ausdrücklich nur eine Übertragungs- und Kontrollhilfe.

## Chrome Web Store

`chrome-dashboard.csv` enthält alle 51 Kurz- und Vollbeschreibungen als tabellarische Übertragungshilfe.

`chrome-dashboard.html` ist für die eigentliche manuelle Pflege komfortabler. Die Datei kann nach `npm run store:generate` direkt lokal im Browser geöffnet werden und bietet:

- Suche nach Sprache oder Locale-Code,
- eine eigene Karte für jede der 51 Sprachen,
- Kopierbuttons für Kurz- und Langbeschreibung,
- Zeichenanzeige für die Kurzbeschreibung,
- RTL-Darstellung für Arabisch, Persisch und Hebräisch,
- eine lokale Erledigt-Markierung mit Fortschrittszähler.

Die Fortschrittsmarkierungen werden ausschließlich im lokalen Browser gespeichert und nicht an Sprachverstand oder einen externen Dienst übertragen.

Paket-Upload, Status und Veröffentlichung werden separat über `scripts/chrome-web-store-v2.mjs` vorbereitet. Langbeschreibungen und weitere Listing-Metadaten bleiben im Developer Dashboard.
