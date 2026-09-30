# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **62**
- Letzter integrierter Produkt-PR: **#260 — zweiundsechzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `ec0e7d904626d88d4307ec55f0565347536347c0`
- Welle 62 integriert 250 intern geprüfte exakte Personenbasen der regulären `-er`-Flexionsklasse.
- PR-CI und Post-Merge-CI sind vollständig grün, einschließlich Gecko, Chromium und CodeQL.
- Keine generische Suffixregel; die neuen Formen liegen ausschließlich in einer Exact-Allow-List.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten sprachmodellbasiert erschließen

`kldb-current-priority-8` ist abgeschlossen und in Welle 62 integriert:

- 250 Kandidaten
- 250 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle
- Flexionsklasse: 250 × `unchanged`

Von den ursprünglich 1.995 unbekannten Kandidaten sind **1.438 entschieden**; **557 bleiben offen**.

Die neun in Priority 6 zurückgestellten Formen bleiben separat offen: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`.

Mehrdeutige Sach-/Geräte-Endglieder wurden auch in Priority 8 bewusst ausgeschlossen, insbesondere `bohrer`, `presser`, `stanzer`, `walzer`, `wickler`, `brenner`, `sortierer`, `kopierer`, `rechner`, `zähler`, `mischer`, `spritzer`, `roller` und `tiefzieher`.

Nächster Schritt:

1. Restbestand von 557 Kandidaten erneut nach Wortbildungs- und Endgliedmustern analysieren.
2. Einen konservativen Priority-9-Batch von bis zu 250 Kandidaten definieren.
3. Eindeutige Personenformen intern semantisch und morphologisch prüfen.
4. Mehrdeutige Sach-/Geräteklassen nicht pauschal freigeben.
5. Externe Recherche nur für echte Grenzfälle oder widersprüchliche Befunde.
6. Produktiv weiterhin nur exakte Allow-Lists bzw. Mappings plus Regressionen.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Eindeutige deutsche Personenformen können ohne Webrecherche weiterverarbeitet werden.
3. Lokal vorhandene Paarinformationen sind optionaler Hinweis.
4. Produktseitige Sicherheitsgrenzen sind exakte Freigaben, Positiv-/Negativregressionen und vollständige CI.
5. Historisch eingefrorene Negativfälle dürfen nur gezielt aufgehoben werden, wenn die interne Prüfung sie eindeutig freigibt.

## Optionale private Ebene

Aktuell maßgeblich:

- `sprachverstand/CURRENT-STATE.json`
- `sprachverstand/derived/review/kldb-current-priority-8-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-8-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
