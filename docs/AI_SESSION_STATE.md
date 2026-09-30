# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `27cfc991b9aa18651a8bac6651d8a98e8b33fe0b`
- Letzte Produktänderung: PR #254 „Lexikon: neunundfünfzigste Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 59
- PR #254: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
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
- morphologisch heikle `Modelleur`-/`Dompteur`-/`Magister`-Fälle sowie `Mikrograf` und `Xerograf` wurden bewusst nicht aufgenommen
- die alte Negativ-Regression für `Diakon:innen` wurde gezielt aufgehoben, nachdem `Diakon → Diakonin → Diakone` intern freigegeben wurde
- 511 dedizierte Welle-59-Regressionen
- vollständig in Welle 59 integriert
- Integrations-PR: #254
- Merge-Commit: `27cfc991b9aa18651a8bac6651d8a98e8b33fe0b`

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung**.
- Standard ist `language_model_first`: eindeutige Formen werden intern semantisch und morphologisch geprüft.
- Quellenherkunft und lokale Paarinformationen dürfen Hinweise liefern, haben aber kein Freigabegewicht.
- Externe Recherche wird nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Produktseitige Sicherheitsgrenzen bleiben exakte Allow-Lists bzw. Mappings, Positiv-/Negativregressionen und vollständige CI.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-5-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-5-manual-decisions.json`
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

Damit sind **688 von 1.995** ursprünglich unbekannten Kandidaten entschieden. Es verbleiben **1.307 noch nicht entschiedene Kandidaten**.

Der Priority-5-Selektor ist ebenfalls ausgeschöpft: Alle von ihm zugelassenen 250 Kandidaten wurden verarbeitet.

## Nächste Arbeitseinheit

Nicht denselben Selektor unverändert als Priority 6 wiederverwenden. Als nächster Block:

1. Die verbleibenden 1.307 Kandidaten erneut nach Wortbildungs- und Endgliedmustern gruppieren.
2. Besonders die bislang bewusst ausgesparten morphologisch heiklen Klassen separat untersuchen.
3. Weitere klar personenbezogene Klassen definieren, ohne daraus eine generische Suffixregel abzuleiten.
4. Bis zu 250 Kandidaten reproduzierbar als `kldb-current-priority-6` ableiten.
5. Den gesamten Batch intern semantisch und morphologisch prüfen.
6. Nur echte Grenzfälle gezielt extern nachprüfen.
7. Produktiv weiterhin ausschließlich exakte Freigaben plus Regressionen integrieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
