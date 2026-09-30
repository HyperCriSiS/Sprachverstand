# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `ec0e7d904626d88d4307ec55f0565347536347c0`
- Letzte Produktänderung: PR #260 „Lexikon: zweiundsechzigste Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 62
- PR #260: Kernprüfung, Gecko CI, Chromium CI, GitHub Advanced Security und Sammelcheck grün.
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
- fünf explizite Flexionsklassen: 123 `unchanged`, 64 `weak_en`, 28 `plural_e`, 20 `plural_en`, 15 `loge`
- vollständig in Welle 59 integriert
- Integrations-PR: #254

### `kldb-current-priority-6`

- 250 Kandidaten
- 250 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- vier explizite Flexionsklassen: 157 `unchanged`, 47 `weak_en`, 26 `plural_e`, 20 `loge`
- neun weniger klare Formen wurden bewusst zurückgestellt: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`
- vollständig in Welle 60 integriert
- Integrations-PR: #256

### `kldb-current-priority-7`

- 250 Kandidaten
- 250 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- 250 reguläre `-er`-Personenformen mit unverändertem Plural
- Auswahl ausschließlich über eine intern geprüfte Exaktliste; keine neue Suffixregel
- die neun Priority-6-Grenzfälle blieben ausgeschlossen
- vollständig in Welle 61 integriert
- Integrations-PR: #258

### `kldb-current-priority-8`

- 250 Kandidaten
- 250 angenommen
- 0 verworfen, 0 offen, 0 externe Grenzfälle
- vollständig mit `language_model_first` geprüft
- alle 250 Formen gehören zur regulären `-er`-Flexionsklasse mit unverändertem Plural
- Auswahl ausschließlich über eine intern geprüfte Exaktliste; keine generische Suffixregel
- die neun Priority-6-Grenzfälle blieben weiterhin ausgeschlossen
- mehrdeutige Maschinen-/Sachklassen wie `Bohrer`, `Presser`, `Stanzer`, `Walzer`, `Wickler` und `Brenner` wurden nicht pauschal übernommen
- 505 dedizierte Welle-62-Regressionen; zusammen mit Welle 61 waren 1.010 gezielte Tests grün
- vollständig in Welle 62 integriert
- Integrations-PR: #260
- Merge-Commit: `ec0e7d904626d88d4307ec55f0565347536347c0`

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
2. `sprachverstand/derived/review/kldb-current-priority-8-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-8-manual-decisions.json`
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
- `kldb-current-priority-8`: 250

Damit sind **1.438 von 1.995** ursprünglich unbekannten Kandidaten entschieden. Es verbleiben **557 noch nicht entschiedene Kandidaten**.

Die neun bereits in Priority 6 zurückgestellten Grenzfälle bleiben weiterhin separat offen.

## Nächste Arbeitseinheit

Als nächster Block:

1. Die verbleibenden 557 Kandidaten erneut nach Wortbildungs- und Flexionsmustern gruppieren.
2. Die neun zurückgestellten Priority-6-Grenzfälle weiterhin separat behandeln und nicht automatisch freigeben.
3. Verbliebene eindeutige `-er`-Personenformen sowie klare Personenformen mit anderen Flexionsklassen identifizieren.
4. Mehrdeutige Maschinen-/Sachklassen wie `Bohrer`, `Presser`, `Stanzer`, `Walzer`, `Wickler` und `Brenner` weiterhin nicht pauschal freigeben.
5. Bis zu 250 Kandidaten reproduzierbar als `kldb-current-priority-9` ableiten.
6. Den gesamten Batch intern semantisch und morphologisch prüfen.
7. Nur echte Grenzfälle gezielt extern nachprüfen.
8. Produktiv weiterhin ausschließlich exakte Freigaben plus Regressionen integrieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
