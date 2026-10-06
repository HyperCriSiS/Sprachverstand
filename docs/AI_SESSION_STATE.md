# AI Session State

Stand: 2026-10-06  
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

## Wikipedia-Realnutzungs-Discovery – vorbereiteter Stand

Die Discovery-Pipeline wurde im privaten Datastore mit Commit `bbe8093d580d1ce2085d10b7d13a74a5eb70cf91` vorbereitet. Neu bzw. dafür vorhanden sind insbesondere:

- `sprachverstand/scripts/discover_wikipedia_real_usage.py`
- `sprachverstand/scripts/run_wikipedia_discovery.py`
- `sprachverstand/tests/test_wikipedia_real_usage_discovery.py`
- `sprachverstand/tests/test_run_wikipedia_discovery.py`

Eigenschaften der Pipeline:

- Wikipedia-Seitentexte werden nur transient über die MediaWiki-API geladen.
- Persistiert werden keine Artikeltexte, Snippets, Seitentitel, Seiten-IDs oder vollständigen Seiten-URLs.
- Persistiert werden nur aggregierte Formen, technische Zählwerte, Coverage und unbekannte Kandidaten.
- Discovery-Kandidaten werden gegen den echten Sprachverstand-Produktstand geprüft.
- Die vorhandene MediaWiki-Hilfe erzwingt robuste API-Behandlung; die Discovery erzwingt mindestens 1 Sekunde Pause zwischen Anfragen.
- Gezielte lokale Regression am 2026-10-06: **7/7 Tests grün** für Discovery und Runner.

### Aktueller Infrastrukturblocker

Die produktive Ausführung ist noch nicht erfolgt. Der bestehende öffentliche Workflow `.github/workflows/source-ingest.yml` akzeptiert derzeit nur `kldb-snapshot` und `kldb-current`.

Ein sauberer Workflow-Zweig für `wikipedia-real-usage` wurde konzeptionell vorbereitet, konnte aber mit dem aktuell verbundenen GitHub-Tunnel nicht geschrieben werden:

- Öffentlicher Workflow-Patch wurde vom Sicherheitsfilter blockiert, weil die bestehende Workflow-Datei ein Repository-Secret referenziert.
- Das Anlegen eines neuen privaten Workflows in `Generic-Datastore` scheiterte mit GitHub `403 Resource not accessible by personal access token` für `.github/workflows/*`.
- Fachcode und Regressionstests selbst sind nicht blockiert; betroffen ist nur die Workflow-Schreibberechtigung.

## Nächste Arbeitseinheit

1. GitHub-Tunnel/Token für Workflow-Dateien mit der nötigen `workflow`-Berechtigung verbinden **oder** den vorbereiteten Workflow-Patch einmal über einen entsprechend berechtigten GitHub-Zugang einspielen.
2. Danach einen kleinen ersten Lauf von `wikipedia-real-usage` starten (`max-pages-per-pattern=100`, `min-count=1`, Pause 1,0 s).
3. Persistierte aggregierte Evidenz, Coverage und Unknown-Liste prüfen.
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
