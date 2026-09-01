# Store-Ausgaben

Alle Store-Ausgaben werden aus denselben geprüften Quellen erzeugt:

- `config/locales.json`
- `static/_locales/<locale>/messages.json`
- `store/listings/<locale>.json`

Dadurch bleiben Kurz- und Vollbeschreibungen zwischen den Store-Plattformen konsistent.

## Erzeugen

```bash
npm run store:generate
```

Die erzeugten Dateien landen unter `store/generated/` und werden nicht versioniert, weil sie jederzeit reproduzierbar sind.

Erzeugt werden:

- `amo-metadata.json`
- `chrome-dashboard.csv`
- `chrome-dashboard.html`
- `edge-worklist.csv`
- `opera-worklist.csv`

Die CI prüft mit `npm run validate:store-exports`, dass sämtliche Quelldaten und Zuordnungen vollständig generierbar sind.

## Firefox AMO

AMO unterstützt für Store-Einträge derzeit nur einen Teil der 51 WebExtension-Locales. Die Erweiterung selbst bleibt in Firefox trotzdem in allen 51 UI-Sprachen verfügbar.

Der Generator bildet die derzeit unterstützte Schnittmenge auf die AMO-Locale-Codes ab, unter anderem:

- `en` → `en-US`
- `es` → `es-ES`
- `pt_BR` → `pt-BR`
- `pt_PT` → `pt-PT`
- `sv` → `sv-SE`
- `no` → `nb-NO`
- `zh_CN` → `zh-CN`
- `zh_TW` → `zh-TW`

Aktuell entstehen **29 lokalisierte AMO-Store-Einträge**.

`amo-metadata.json` enthält:

- lokalisierte Kurzbeschreibungen,
- lokalisierte Vollbeschreibungen,
- Kategorie `language-support`,
- Lizenz `AGPL-3.0-only`.

Die Datei kann nach dem Erzeugen direkt mit `web-ext` verwendet werden:

```bash
web-ext sign --channel=listed --amo-metadata=store/generated/amo-metadata.json
```

Die AMO-Locale-Liste ist eine Store-Eigenschaft und kann sich unabhängig von den unterstützten Firefox-Sprachen ändern. Deshalb muss die Zuordnung bei Änderungen auf AMO aktualisiert werden.

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
