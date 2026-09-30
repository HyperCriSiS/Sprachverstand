# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **59**
- Letzter integrierter Produkt-PR: **#254 — neunundfünfzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `27cfc991b9aa18651a8bac6651d8a98e8b33fe0b`
- Welle 59 integriert 250 intern geprüfte exakte Personenbasen in fünf Flexionsklassen.
- CI von PR #254: Kernprüfung, Gecko, Chromium, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten sprachmodellbasiert erschließen

`kldb-current-priority-5` ist abgeschlossen und in Welle 59 integriert:

- 250 Kandidaten
- 250 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle

Von den ursprünglich 1.995 unbekannten Kandidaten sind inzwischen **688 entschieden**; **1.307 bleiben offen**.

Der Priority-5-Selektor ist ausgeschöpft. Er darf nicht unverändert als Priority 6 wiederverwendet werden.

Nächster Schritt:

1. Restbestand von 1.307 Kandidaten erneut nach Wortbildungs- und Endgliedmustern analysieren.
2. Morphologisch heikle Restklassen getrennt betrachten.
3. Einen weiteren konservativen Selektor bzw. reproduzierbare Kandidatengruppen definieren.
4. Bis zu 250 Kandidaten als Priority 6 ableiten.
5. Standardmäßig intern semantisch und morphologisch prüfen.
6. Externe Recherche nur für echte Mehrdeutigkeiten oder widersprüchliche Befunde.
7. Produktiv weiterhin nur exakte Allow-Lists bzw. Mappings plus Regressionen; keine generische Suffixregel aus einem Batch ableiten.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Eindeutige deutsche Personenformen können ohne Webrecherche weiterverarbeitet werden.
3. Lokal vorhandene Paarinformationen sind optionaler Hinweis.
4. Produktseitige Sicherheitsgrenzen sind exakte Freigaben, Positiv-/Negativregressionen und vollständige CI.
5. Historisch eingefrorene Negativfälle dürfen nur gezielt aufgehoben werden, wenn die neue interne Prüfung sie eindeutig freigibt.

## Optionale private Ebene

Aktuell maßgeblich:

- `sprachverstand/CURRENT-STATE.json`
- `sprachverstand/derived/review/kldb-current-priority-5-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-5-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
