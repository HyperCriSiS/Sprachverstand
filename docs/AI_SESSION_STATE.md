# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `28989e8fb8558cdff9f4e8486f9d3539cd3b9dd3`
- Letzte Produktänderung: PR #258 „Lexikon: einundsechzigste Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 61
- PR #258: Kernprüfung, Gecko CI, Chromium CI, GitHub Advanced Security und Sammelcheck grün.
- Post-Merge auf `main`: Kernprüfung, Gecko CI, Chromium CI, Sammelcheck sowie beide CodeQL-Analysen grün.
- Es gibt weiterhin keine generische Personen-Suffixregel. Neue Personenformen werden nur als explizit geprüfte, quellenneutrale Exact-Allow-Lists bzw. `exact`-Mappings übernommen.

## Abgeschlossene kldb-current-Blöcke

### `kldb-current-priority-1`

- 20 Kandidaten
- 20 angenommen
- vollständig in Welle 54 und 55 integriert
- letzter Integrations-PR: #243

### `kldb-current-priority-2`

- 50 Kandidaten
- 50 angenommen
- vollständig in Welle 56 integriert
- Integrations-PR: #247

### `kldb-current-priority-3`

- 50 Kandidaten
- 50 angenommen
- historisch noch mit externer Evidenz geprüft
- vollständig in Welle 57 integriert
- Integrations-PR: #249

### `kldb-current-priority-4`

- 222 Kandidaten
- 222 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- als quellenneutrale exakte Allow-List in Welle 58 integriert
- Integrations-PR: #252

### `kldb-current-priority-5`

- 250 Kandidaten
- 250 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- fünf explizite Flexionsklassen:
  - `unchanged`: 123
  - `weak_en`: 64
  - `plural_e`: 28
  - `plural_en`: 20
  - `loge`: 15
- vollständig in Welle 59 integriert
- Integrations-PR: #254

### `kldb-current-priority-6`

- 250 Kandidaten
- 250 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- vier explizite Flexionsklassen:
  - `unchanged`: 157
  - `weak_en`: 47
  - `plural_e`: 26
  - `loge`: 20
- neun weniger klare Formen wurden bewusst zurückgestellt: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`
- vollständig in Welle 60 integriert
- Integrations-PR: #256

### `kldb-current-priority-7`

- 250 Kandidaten
- 250 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- alle 250 Kandidaten gehören zur regulären `-er`-Flexionsklasse mit unverändertem Plural
- Auswahl ausschließlich über eine intern geprüfte Exaktliste; keine neue Suffixregel
- die neun Priority-6-Grenzfälle blieben weiterhin ausgeschlossen
- mehrdeutige Sach-/Geräteformen wurden ebenfalls nicht pauschal übernommen
- 505 dedizierte Welle-61-Regressionen; zusammen mit Welle 60 waren 1.015 gezielte Tests grün
- vollständig in Welle 61 integriert
- Integrations-PR: #258
- Merge-Commit: `28989e8fb8558cdff9f4e8486f9d3539cd3b9dd3`

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung**.
- Standard ist `language_model_first`: eindeutige Formen werden intern semantisch und morphologisch geprüft.
- Quellenherkunft und lokale Paarinformationen dürfen Hinweise liefern, haben aber kein Freigabegewicht.
- Externe Recherche wird nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Produktseitige Sicherheitsgrenzen bleiben exakte Allow-Lists bzw. Mappings, Positiv-/Negativregressionen und vollständige CI.
- Ein Batch darf keine generische Suffixfreigabe implizieren.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-7-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-7-manual-decisions.json`
4. `sprachverstand/sources/registry.json`

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Abgeschlossene Entscheidungen aus dem unbekannten Pool:

- `kldb-common-2026`: 96
- `kldb-current-priority-1`: 20
- `kldb-current-priority-2`: 50
- `kldb-current-priority-3`: 50
- `kldb-current-priority-4`: 222
- `kldb-current-priority-5`: 250
- `kldb-current-priority-6`: 250
- `kldb-current-priority-7`: 250

Damit sind **1.188 von 1.995** ursprünglich unbekannten Kandidaten entschieden. Es verbleiben **807 noch nicht entschiedene Kandidaten**.

Die neun bereits in Priority 6 zurückgestellten Grenzfälle bleiben weiterhin separat offen.

## Nächste Arbeitseinheit

Als nächster Block:

1. Die verbleibenden 807 Kandidaten erneut nach Wortbildungs- und Endgliedmustern gruppieren.
2. Die neun zurückgestellten Priority-6-Grenzfälle weiterhin separat behandeln und nicht automatisch freigeben.
3. Verbleibende klare `-ierer`-Formen sowie weitere eindeutig personenbezogene Handwerks-, Bediener- und Berufsbezeichnungen identifizieren.
4. Mehrdeutige Geräte-/Sachklassen weiterhin nicht pauschal freigeben.
5. Bis zu 250 Kandidaten reproduzierbar als `kldb-current-priority-8` ableiten.
6. Den gesamten Batch intern semantisch und morphologisch prüfen.
7. Nur echte Grenzfälle gezielt extern nachprüfen.
8. Produktiv weiterhin ausschließlich exakte Freigaben plus Regressionen integrieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
