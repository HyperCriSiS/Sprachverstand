# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **62**
- Letzter integrierter Produkt-PR: **#260 — zweiundsechzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `ec0e7d904626d88d4307ec55f0565347536347c0`
- Welle 62 integriert 250 intern geprüfte exakte Personenbasen der regulären `-er`-Flexionsklasse.
- PR-CI: Kernprüfung, Gecko, Chromium, GitHub Advanced Security und Sammelcheck grün.
- Post-Merge-CI: Kernprüfung, Gecko, Chromium, Sammelcheck und beide CodeQL-Analysen grün.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten sprachmodellbasiert erschließen

`kldb-current-priority-8` ist abgeschlossen und in Welle 62 integriert:

- 250 Kandidaten
- 250 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle
- Flexionsklasse: 250 × `unchanged`
- keine generische Suffixregel
- 505 dedizierte Welle-62-Regressionen; zusammen mit Welle 61: 1.010/1.010 gezielte Tests grün

Von den ursprünglich 1.995 unbekannten Kandidaten sind inzwischen **1.438 entschieden**; **557 bleiben offen**.

Die neun in Priority 6 zurückgestellten Formen bleiben weiterhin separat offen: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`.

Nächster Schritt:

1. Restbestand von 557 Kandidaten erneut nach Wortbildungs- und Flexionsmustern analysieren.
2. Einen neuen konservativen Priority-9-Batch definieren.
3. Verbliebene klare `-er`-Personenformen und eindeutige Personenformen mit anderen Flexionsklassen untersuchen.
4. Mehrdeutige Maschinen-/Sachklassen wie `Bohrer`, `Presser`, `Stanzer`, `Walzer`, `Wickler` und `Brenner` nicht pauschal freigeben.
5. Bis zu 250 Kandidaten als Priority 9 ableiten.
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
- `sprachverstand/derived/review/kldb-current-priority-8-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-8-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
