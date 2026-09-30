# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **60**
- Letzter integrierter Produkt-PR: **#256 — sechzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `609798ba0207454439dfcfbf8cd6a29c4f6e2dff`
- Welle 60 integriert 250 intern geprüfte exakte Personenbasen in vier Flexionsklassen.
- CI von PR #256: Kernprüfung, Gecko, Chromium, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten sprachmodellbasiert erschließen

`kldb-current-priority-6` ist abgeschlossen und in Welle 60 integriert:

- 250 Kandidaten
- 250 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle
- Flexionsklassen: 157 `unchanged`, 47 `weak_en`, 26 `plural_e`, 20 `loge`

Neun weniger klare Formen wurden bewusst nicht in den Batch aufgenommen und bleiben offen: `computervisualist`, `eri-wart`, `eutonist`, `fennist`, `mindermaschinenstricker`, `modellist`, `tapisserist`, `verschmelzer`, `wäscher`.

Von den ursprünglich 1.995 unbekannten Kandidaten sind inzwischen **938 entschieden**; **1.057 bleiben offen**.

Der Priority-6-Selektor ist für klare Fälle ausgeschöpft. Unverändert angewendet würde er nur noch die neun bewusst ausgesparten Grenzfälle liefern.

Nächster Schritt:

1. Restbestand von 1.057 Kandidaten erneut nach Wortbildungs- und Endgliedmustern analysieren.
2. Einen neuen konservativen Priority-7-Selektor definieren.
3. Häufige `-ierer`-Klassen sowie weitere klare Personenendglieder gezielt untersuchen.
4. Mehrdeutige Geräte-/Werkzeugklassen wie `Bohrer`, `Brenner`, `Presser`, `Stanzer`, `Walzer` und `Wickler` nicht pauschal freigeben.
5. Bis zu 250 Kandidaten als Priority 7 ableiten.
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
- `sprachverstand/derived/review/kldb-current-priority-6-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-6-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
