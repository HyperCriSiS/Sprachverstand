# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **64**
- Letzter integrierter Produkt-PR: **#266 — vierundsechzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `2f69a81991ce0c126878efe0f2ec553e35dbd3eb`
- Welle 64 integriert 20 intern geprüfte exakte Personenbasen.
- Klassen: 18 `unchanged`, 2 `plural_e`.
- PR-CI einschließlich Kernprüfung, Gecko, Chromium, CodeQL, Advanced Security und Sammelcheck vollständig grün.
- Keine generische Suffixregel; die neuen Formen liegen ausschließlich in einer Exact-Allow-List.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten als Einzelfälle erschließen

`kldb-current-priority-10` ist abgeschlossen und in Welle 64 integriert:

- 20 Kandidaten
- 20 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle
- 18 `unchanged`, 2 `plural_e`
- bekannte Priority-6-Grenzfälle und mehrdeutige Geräte-/Sachklassen blieben ausgeschlossen
- keine generische Suffixregel

Von den ursprünglich 1.995 unbekannten Kandidaten sind **1.704 entschieden**; **291 bleiben offen**.

Der Restpool besteht überwiegend aus bewusst nicht pauschal freigegebenen Geräte-/Sachbezeichnungen. Besonders häufig sind `Bohrer`, `Presser`, `Stanzer`, `Walzer`, `Wickler`, `Brenner`, `Sortierer`, `Kopierer`, `Rechner`, `Mischer` und ähnliche Endglieder.

Die neun in Priority 6 zurückgestellten Formen bleiben separat offen: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`.

Nächster Schritt:

1. Restbestand von 291 Kandidaten einzeln bzw. in kleinen eindeutigen Gruppen prüfen.
2. Einen möglichen Priority-11-Batch ausschließlich aus explizit sicheren Personenformen bilden; kein Zielumfang erzwingen.
3. Mehrdeutige Geräte-/Sachklassen weiterhin nicht pauschal freigeben.
4. Morphologisch ungewöhnliche Formen zurückstellen, sofern die interne Bewertung nicht eindeutig ist.
5. Externe Recherche nur für echte Grenzfälle oder widersprüchliche Befunde.
6. Produktiv weiterhin nur exakte Allow-Lists bzw. Mappings plus Regressionen.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Eindeutige deutsche Personenformen können ohne Webrecherche weiterverarbeitet werden.
3. Lokal vorhandene Paarinformationen sind optionaler Hinweis.
4. Produktseitige Sicherheitsgrenzen sind exakte Freigaben, Positiv-/Negativregressionen und vollständige CI.
5. Historisch eingefrorene Negativfälle dürfen nur gezielt aufgehoben werden, wenn die neue interne Prüfung sie eindeutig freigibt.

## Optionale private Ebene

Aktuell maßgeblich:

- `sprachverstand/CURRENT-STATE.json`
- `sprachverstand/derived/review/kldb-current-priority-10-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-10-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
