# AI Session State

Stand: 2026-10-04  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller öffentlicher Checkpoint-HEAD vor dieser Aktualisierung: `050745e26d452378ec5db4d083e8b885e6efc14d`
- Letzte Produktänderung: PR #290 „Lexikon: neunundsiebzigste Ausbauwelle aus Wikidata vorbereiten“
- Produktbaseline nach Welle 79: `4b8c75f38ecf2ebfa585914755a154e9e3e1e937`
- Abgeschlossene Lexikon-Ausbauwellen: 79
- Welle 77 / PR #288: 17 geprüfte ESCO-Exaktmappings
- Welle 78 / PR #289: 155 geprüfte Wikidata-Exaktmappings
- Welle 79 / PR #290: 189 geprüfte Wikidata-Exaktmappings; 6 Kandidaten verworfen
- Keine generische Personen-Suffixregel.
- PR #290 und anschließende `main`-CI waren vollständig grün, einschließlich Kernprüfung, Performance, Gecko, Chromium, Video-Regressionsprüfung, CodeQL, Advanced Security und Sammelcheck.
- DOM-/Framework-Härtung aus PR #261 sowie Video-/Browser-Härtung aus PR #283 bleiben integriert.

## Quellen- und Coverage-Stand nach Welle 79

Privates Repository: `HyperCriSiS/Generic-Datastore`

Am 2026-10-04 wurde der tagesaktuelle DKZ-Import erneut gegen den echten `main`-Produktstand ausgeführt:

- Öffentlicher Workflow: `Quellenimport` Run #16 / Run-ID `37235754627`
- Ergebnis: erfolgreich
- Privater Import-Commit: `7e4a036ff054cce5fe563eaee00873361ca5495a`
- Beobachtete eindeutige DKZ-Basen: 10.404
- Vom Produkt nach Welle 79 erkannt: 10.392
- Bewusst unbekannt: 12
- Eindeutige Coverage: **99,88 %**
- Offene/noch unentschiedene DKZ-Kandidaten nach Review: **0**

Die 12 bewusst unbekannten Basen bestehen aus 9 bereits früher verworfenen Fällen plus 3 bei der Nachmessung sichtbar gewordenen Grenz-/Fehlbasen:

- `möller`
- `polster`
- `steuer`

Diese drei wurden als `kldb-current-priority-23` vollständig geprüft und sämtlich verworfen:

- `polster`: Fehlrückführung; `Polsterin` gehört zu `Polsterer`, nicht zu einer maskulinen Personenbasis `Polster`.
- `steuer`: Fehlrückführung; `Steuerin` gehört zu `Steuerer/Steurer`, nicht zu einer maskulinen Personenbasis `Steuer`.
- `möller`: keine ausreichend sichere aktuelle Personen-/Berufsbedeutung für ein Produktmapping; im Standardwortschatz Sachbegriff im Hüttenwesen und zugleich stark als Familienname belastet.

Privater Review-Commit: `a9de5d70a3be2a7658da3911c1de08bbcc24e33e`

Kanonische neue Review-Dateien:

1. `sprachverstand/derived/candidates/kldb-current-priority-23.txt`
2. `sprachverstand/derived/candidates/kldb-current-priority-23-selection.json`
3. `sprachverstand/derived/review/kldb-current-priority-23-summary.json`
4. `sprachverstand/derived/review/kldb-current-priority-23-manual-decisions.json`

Für Priority 23 entsteht **keine Produktwelle**, weil 0 Kandidaten angenommen wurden.

## Abgeschlossene Kandidatenpools

### KldB/DKZ

- Ursprünglicher Unbekanntpool: 1.995 Kandidaten
- Bis Priority 22 vollständig entschieden.
- Nach aktueller Nachmessung: Priority 23 ergänzt 3 neu sichtbar gewordene Grenz-/Fehlbasen.
- Priority 23: 3 geprüft, 0 angenommen, 3 verworfen, 0 offen.
- Gesamt aktuell bewusst unbekannte DKZ-Basen: 12.
- Gesamt aktuell unentschiedene DKZ-Basen: 0.

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

## Nächste Arbeitseinheit

Der nächste tatsächlich kandidatenliefernde offene Block ist **Wikipedia-Realnutzung** (`wikipedia-real-usage`).

Im privaten Datastore existieren bereits:

- `scripts/query_wikipedia_candidates.py`: Titelevidenz für bereits bekannte Kandidaten
- `scripts/mediawiki_api.py`: rate-limit-feste MediaWiki-Hilfe
- Regressionstests für Wikipedia-Titelevidenz

Diese bestehende Logik ist **noch keine Discovery-Pipeline**, weil sie nur vorgegebene Kandidaten gegen Wikipedia prüft.

Nächster sinnvoller Schritt:

1. Eine konservative Wikipedia-Realnutzungs-Discovery definieren, die reale Genderformen/Kandidaten findet, ohne Artikeltexte dauerhaft zu speichern.
2. Nur aggregierte bzw. minimale Evidenz privat persistieren.
3. Discovery-Kandidaten gegen den aktuellen Produktstand deduplizieren.
4. Einen kleinen ersten Review-Block erzeugen und `language_model_first` prüfen.
5. Nur tatsächlich sichere neue Personenformen als nächste Produktwelle integrieren.
6. Falls Wikipedia keine brauchbaren neuen Kandidaten liefert, danach die offenen Genderwörterbuch-Audits (`scribbr-genderwoerterbuch`, `genderator-genderwoerterbuch`) angehen.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json` und die dort referenzierten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats und früheren „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
- Reine Checkpoint-Dateien wie `docs/AI_SESSION_STATE.md` direkt auf `main` aktualisieren; dafür keinen eigenen PR erzeugen.
- Produktcode, Tests, Workflows und fachliche Produktänderungen bleiben PR-pflichtig.
