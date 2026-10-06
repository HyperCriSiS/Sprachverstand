# AI Session State

Stand: 2026-10-07  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller Produkt-/Workflow-HEAD vor dieser Checkpoint-Aktualisierung: `a769d65da1be668202dd21b137c5971a88f6191c`
- Abgeschlossene Lexikon-Ausbauwellen: 79
- Welle 77 / PR #288: 17 geprüfte ESCO-Exaktmappings
- Welle 78 / PR #289: 155 geprüfte Wikidata-Exaktmappings
- Welle 79 / PR #290: 189 geprüfte Wikidata-Exaktmappings; 6 Kandidaten verworfen
- Keine generische Personen-Suffixregel.
- DOM-/Framework-Härtung aus PR #261 sowie Video-/Browser-Härtung aus PR #283 bleiben integriert.
- PR #292 „Wikipedia-Realnutzung im Quellenimport aktivieren“ wurde als `a769d65da1be668202dd21b137c5971a88f6191c` gemergt.
- Die anschließende `main`-CI für PR #292 war vollständig grün, einschließlich Kernprüfung, Performance, Gecko, Chromium und CodeQL.

## Quellen- und Coverage-Stand

Privates Repository: `HyperCriSiS/Generic-Datastore`

### KldB/DKZ

Letzte vollständige Nachmessung nach Welle 79:

- Beobachtete eindeutige DKZ-Basen: 10.404
- Vom Produkt erkannt: 10.392
- Bewusst unbekannt: 12
- Eindeutige Coverage: **99,88 %**
- Unentschiedene DKZ-Kandidaten: **0**
- Priority 23: `möller`, `polster`, `steuer`; alle drei geprüft und verworfen.
- Privater Review-Commit: `a9de5d70a3be2a7658da3911c1de08bbcc24e33e`

### ESCO

- API v1.2.0: 17 neue Kandidaten
- 17 angenommen
- Produktintegration: Welle 77 / PR #288
- Kein offener Review-Rest.

### Wikidata Occupations

- 350 Kandidaten in zwei Prioritätsblöcken
- 344 angenommen
- 6 verworfen
- 0 offen
- Produktintegration: Wellen 78 und 79 / PR #289 und #290
- Kein offener Restpool.

## Kandidatenprüfung – verbindliche Regeln

- Standard: `language_model_first`.
- Quellen liefern Kandidaten; Quellenherkunft besitzt kein Freigabegewicht.
- Externe Recherche nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde.
- Produktseitig nur sichere Exact-Mappings bzw. eng begrenzte Regeln.
- Positiv-, Negativ-, Paar- und Kasusregressionen beibehalten.
- Keine breite oder generische Personen-Suffixfreigabe hinzufügen.

## Wikipedia-Realnutzungs-Discovery – erster produktiver Lauf abgeschlossen

Die Discovery-Pipeline liegt privat im `Generic-Datastore`. Wikipedia-Seitentexte werden nur transient über die MediaWiki-API gelesen. Persistiert werden keine Artikeltexte, Snippets, Seitentitel, Seiten-IDs oder vollständigen Seiten-URLs.

Der erste produktive Workflow-Lauf (#17 / Run-ID `37541613824`) erreichte die Discovery, scheiterte dort aber an PCRE-Konstrukten (`\b`, `(?:...)`), die CirrusSearch/Lucene nicht unterstützt. Die Suchmuster wurden privat mit Commit `7dddead58c1e15eef13ebf58e880e3419c72a229` auf Lucene-kompatible Syntax korrigiert und durch eine Regression abgesichert.

Der Wiederholungslauf (#18 / Run-ID `37541905780`) war vollständig erfolgreich. Privater Import-Commit: `626148693b1f9fbdd27d225df2f88d9a61660c84`.

Ergebnis:

- 530 eindeutige Wikipedia-Seiten transient gelesen; 530 davon mit Text.
- 324 aggregierte Oberflächenformen aus 628 Extraktionsvorkommen.
- Nach Coverage-Normalisierung 225 beobachtete Basen / 578 relevante Vorkommen.
- 182 Basen bereits produktseitig erkannt.
- 43 Basen unbekannt und fachlich zu prüfen.
- Eindeutige Coverage: **80,89 %**
- Vorkommensgewichtete Coverage: **89,97 %**
- Unbekannte Vorkommen: 58.

Kanonische private Ergebnisdateien:

1. `sprachverstand/derived/evidence/wikipedia-real-usage-forms.json`
2. `sprachverstand/derived/candidates/wikipedia-real-usage-coverage-input.json`
3. `sprachverstand/derived/candidates/wikipedia-real-usage-coverage.json`
4. `sprachverstand/derived/candidates/wikipedia-real-usage-unknown.txt`
5. `sprachverstand/derived/manifests/wikipedia-real-usage.json`

## Nächste Arbeitseinheit

1. Die 43 Wikipedia-Unknowns als Review-Block `language_model_first` prüfen.
2. Echte neue Personenbasen von bereits bekannten Flexions-/Kasusformen und eindeutigen Wikitext-/Namens-/URL-Artefakten trennen.
3. Nur sichere neue bzw. exakt modellierbare Formen als Produktwelle 80 integrieren.
4. Falls Wikipedia danach keinen sinnvollen Rest mehr hat, die offenen Genderwörterbuch-Audits (`scribbr-genderwoerterbuch`, `genderator-genderwoerterbuch`) fortsetzen.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json` sowie die dort referenzierten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats und früheren „als Nächstes“-Formulierungen.
- Nach größeren abgeschlossenen Einheiten diesen Checkpoint aktualisieren.
- Reine Checkpoint-Dateien wie `docs/AI_SESSION_STATE.md` direkt auf `main` aktualisieren; dafür keinen eigenen PR erzeugen.
- Produktcode, Tests, Workflows und fachliche Produktänderungen bleiben PR-pflichtig.
