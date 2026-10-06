# AI Session State

Stand: 2026-10-07  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller Produktbaseline-Commit: `5b6a4f70371c9da87bcfcbf0ad0b7e13ce048db8`
- Abgeschlossene Lexikon-Ausbauwellen: **80**
- Welle 77 / PR #288: 17 geprüfte ESCO-Exaktmappings
- Welle 78 / PR #289: 155 geprüfte Wikidata-Exaktmappings
- Welle 79 / PR #290: 189 geprüfte Wikidata-Exaktmappings; 6 verworfen
- Welle 80 / PR #294: 14 geprüfte Wikipedia-Realnutzungs-Exaktmappings
- Keine generische Personen-Suffixregel.

Die 14 in Welle 80 integrierten Basen sind:

`fachschaftler`, `titelhalter`, `baron`, `bergkamerad`, `diplomgeograph`,
`ehrensenator`, `familienernährer`, `fcsp-teqballer`, `föderalist`, `knüpfer`,
`stadtzürcher`, `superintendent`, `teufel`, `uigur`.

PR #294 war vollständig grün. Nach dem Merge trat im ersten `main`-Chromium-Job ein Runner-/Browserstart-Flake auf (`DevToolsActivePort file doesn't exist`); der unveränderte Rerun war vollständig grün. Kernprüfung, Performance, Gecko, Chromium, Video-Regressionsprüfung, CodeQL und Sammelcheck sind damit für den integrierten Stand bestätigt.

## KldB/DKZ

Letzte vollständige Nachmessung nach Welle 79:

- Beobachtete eindeutige DKZ-Basen: 10.404
- Vom Produkt erkannt: 10.392
- Bewusst unbekannt: 12
- Eindeutige Coverage: **99,88 %**
- Unentschiedene DKZ-Kandidaten: **0**
- Priority 23: `möller`, `polster`, `steuer`; alle verworfen.
- Privater Review-Commit: `a9de5d70a3be2a7658da3911c1de08bbcc24e33e`

## ESCO

- API v1.2.0: 17 neue Kandidaten
- 17 angenommen
- Produktintegration: Welle 77 / PR #288
- Kein offener Review-Rest.

## Wikidata Occupations

- 350 Kandidaten
- 344 angenommen
- 6 verworfen
- 0 offen
- Produktintegration: Wellen 78 und 79 / PR #289 und #290
- Kein offener Restpool.

## Wikipedia-Realnutzung

### Pipeline

- Öffentlicher Workflow: `.github/workflows/source-ingest.yml`
- Quelle: `wikipedia-real-usage`
- Wikipedia-Seitentexte werden ausschließlich transient gelesen.
- Persistiert werden keine Artikeltexte, Snippets, Seitentitel, Seiten-IDs oder vollständigen Seiten-URLs.
- Dauerhaft bleiben nur aggregierte Formen, technische Zählwerte, Coverage, Kandidaten und Review-Ergebnisse.

Der ursprünglich beim ersten produktiven Versuch gefundene CirrusSearch-/PCRE-Fehler wurde privat mit Commit `7dddead58c1e15eef13ebf58e880e3419c72a229` behoben und regressionsgesichert.

### Erster erfolgreicher Lauf

- Run #18 / Run-ID `37541905780`
- Produktcommit: `a769d65da1be668202dd21b137c5971a88f6191c`
- Privater Import-Commit: `626148693b1f9fbdd27d225df2f88d9a61660c84`
- 530 eindeutige Seiten
- 225 beobachtete Basen
- 578 relevante Vorkommen
- 182 bekannte Basen
- 43 Unknowns
- eindeutige Coverage: **80,89 %**
- vorkommensgewichtete Coverage: **89,97 %**

### Priority 1

- Privater Review-Commit: `f94bec9f5863459fdb1c195e13cb7a8cdc868016`
- 43 geprüft
- 14 angenommen
- 29 verworfen
- 0 offen
- Produktintegration: Welle 80 / PR #294 / Merge `5b6a4f70371c9da87bcfcbf0ad0b7e13ce048db8`

Nicht als neue Lexeme behandelt wurden insbesondere:

- `Bürgermeisters/in`
- `Athleten*innen`
- `Physikingenieure/innen`

Diese drei sind Flexions-/Oberflächenfälle bereits bekannter Lexeme. `Gewerkschaftern/innen` ist eine fehlerhafte Oberflächenbildung und ebenfalls kein neues Lexem.

### Nachmessung nach Welle 80

- Run #19 / Run-ID `37544813498`
- Ergebnis: erfolgreich
- Produktcommit: `5b6a4f70371c9da87bcfcbf0ad0b7e13ce048db8`
- Privater Import-Commit: `ac43b6808cdd3c18b7c8037822845c7b1fd96cd7`
- 527 eindeutige Seiten
- 227 beobachtete Basen
- 578 relevante Vorkommen
- 201 bekannte Basen
- 26 Unknowns
- eindeutige Coverage: **88,55 %**
- vorkommensgewichtete Coverage: **93,08 %**

Die zweite Messung ist wegen der Live-Suche keine identische Stichprobe zum ersten Lauf.

### Priority 2 / Live-Delta

Durch Stichprobendrift erschien neu `panther`. Der Treffer wurde als Eigennamen-/Organisationsschreibweise und nicht als generische Personenbasis bewertet.

- 1 geprüft
- 0 angenommen
- 1 verworfen
- 0 offen
- Privater Review-Commit: `8ee7a61e5a37efa0f27b434ddf548ece45536902`
- Keine Produktwelle.

Aktuell gibt es **0 unentschiedene Wikipedia-Kandidaten**.

Der aktuelle 26er-Rest besteht aus:

- 22 bereits verworfenen Nicht-Lexemen/Artefakten
- 3 echten Runtime-/Flexionslücken
- 1 fehlerhaften Oberflächenform

## Kanonischer privater Stand

Privates Repository: `HyperCriSiS/Generic-Datastore`

- Aktueller Status-/Registry-Commit nach Abschluss dieser Einheit: `8386719ccb9102e1c7fba9a6243e679e2aea63e7`
- Maßgeblich: `sprachverstand/CURRENT-STATE.json`
- Registry: `sprachverstand/sources/registry.json`
- Priority-1-Review:
  - `sprachverstand/derived/review/wikipedia-real-usage-priority-1-summary.json`
  - `sprachverstand/derived/review/wikipedia-real-usage-priority-1-manual-decisions.json`
- Priority-2-Review:
  - `sprachverstand/derived/review/wikipedia-real-usage-priority-2-summary.json`
  - `sprachverstand/derived/review/wikipedia-real-usage-priority-2-manual-decisions.json`

## Nächste Arbeitseinheit

Aufgrund der inzwischen langen GitHub-/CI-Historie diese Einheit in einem **frischen Chat** fortsetzen:

1. `Bürgermeisters/in`, `Athleten*innen` und `Physikingenieure/innen` ausschließlich mit engen/exakten Regeln behandeln.
2. Realnutzungs-Coverage oberflächenbewusst gegen die tatsächliche Produkt-Runtime prüfen, statt nur die rekonstruierte Basis über den Pluralmapper zu vermessen.
3. `Gewerkschaftern/innen` unverändert als fehlerhafte Form belassen.
4. Wikipedia danach erneut vermessen.
5. Anschließend die nächsten tatsächlich kandidatenliefernden offenen Quellen aus der Registry bearbeiten.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst `docs/engineering/CURRENT-WORK.md` lesen.
- Danach aktuellen `main`-HEAD live verifizieren.
- Bei Quellenarbeit zusätzlich `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json` lesen.
- Git-Checkpoints haben Vorrang vor alten Chats und früheren „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
- Reine Checkpoint-Dateien direkt auf `main` aktualisieren; Produktcode, Tests, Workflows und fachliche Änderungen bleiben PR-pflichtig.
