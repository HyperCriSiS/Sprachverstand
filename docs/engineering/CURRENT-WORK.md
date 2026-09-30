# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **61**
- Letzter integrierter Produkt-PR: **#258 — einundsechzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `28989e8fb8558cdff9f4e8486f9d3539cd3b9dd3`
- Welle 61 integriert 250 intern geprüfte exakte Personenbasen der regulären `-er`-Flexionsklasse.
- PR-CI: Kernprüfung, Gecko, Chromium, GitHub Advanced Security und Sammelcheck grün.
- Post-Merge-CI: Kernprüfung, Gecko, Chromium, Sammelcheck und beide CodeQL-Analysen grün.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten sprachmodellbasiert erschließen

`kldb-current-priority-7` ist abgeschlossen und in Welle 61 integriert:

- 250 Kandidaten
- 250 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle
- Flexionsklasse: 250 × `unchanged`
- keine generische Suffixregel

Von den ursprünglich 1.995 unbekannten Kandidaten sind inzwischen **1.188 entschieden**; **807 bleiben offen**.

Die neun in Priority 6 zurückgestellten Formen bleiben weiterhin separat offen: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`.

Nächster Schritt:

1. Restbestand von 807 Kandidaten erneut nach Wortbildungs- und Endgliedmustern analysieren.
2. Einen neuen konservativen Priority-8-Batch definieren.
3. Verbleibende klare `-ierer`-Formen und weitere eindeutig personenbezogene Handwerks-/Bedienerbezeichnungen untersuchen.
4. Mehrdeutige Sach-/Geräteklassen nicht pauschal freigeben.
5. Bis zu 250 Kandidaten als Priority 8 ableiten.
6. Standardmäßig intern semantisch und morphologisch prüfen.
7. Externe Recherche nur für echte Mehrdeutigkeiten oder widersprüchliche Befunde.
8. Produktiv weiterhin nur exakte Allow-Lists bzw. Mappings plus Regressionen; keine generische Suffixregel aus einem Batch ableiten.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Eindeutige deutsche Personenformen können ohne Webrecherche weiterverarbeitet werden.
3. Lokal vorhandene Paarinformationen sind optionaler Hinweis.
4. Produktseitige Sicherheitsgrenzen sind exakte Freigaben, Positiv-/Negativregressionen und vollständige CI.
5. Historisch eingefrorene Negativfälle dürfen nur gezielt aufgehoben werden, wenn die neue interne Prüfung sie eindeutig freigibt.

## Optionale private Ebene

Aktuell maßgeblich:

- `sprachverstand/CURRENT-STATE.json`
- `sprachverstand/derived/review/kldb-current-priority-7-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-7-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
