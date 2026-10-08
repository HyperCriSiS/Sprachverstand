# Aktueller Arbeitsstand

Stand: 2026-10-08  
Autorität: `main`

## Produktbaseline

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller integrierter Produktstand: `230b67d3bc4a0d64714760a1f0e2fd5c9ea3cc23`
- Abgeschlossene Lexikon-Ausbauwellen: **83**
- Letzter integrierter Lexikon-PR: **#305 — 142 geprüfte Personenformen als Welle 83 integrieren**
- Welle 82 enthält 195 vollständig geprüfte Scribbr-Priority-2-Mappings; alle 195 wurden angenommen.
- Keine generische Personen-Suffixregel.

## Validierung von Welle 80

PR #294 war vor dem Merge vollständig grün:

- Kernprüfung und Gesamttests
- Performance
- Gecko / echter Firefox
- Chromium / echter Chromium
- Video-Regressionsprüfung unter DOM-Last
- Advanced Security
- Sammelcheck

Nach dem Merge schlug der erste Chromium-`main`-Lauf ausschließlich beim Start der WebDriver-Session mit `DevToolsActivePort file doesn't exist` fehl. Derselbe Commit war im PR grün; der unveränderte Wiederholungslauf auf `main` war anschließend vollständig grün, einschließlich Video-Regressionsprüfung. CodeQL war ebenfalls grün.

## Wikipedia-Realnutzung

### Erster Lauf und Review

Erster erfolgreicher produktiver Lauf:

- Workflow Run #18 / Run-ID `37541905780`
- Privater Import-Commit: `626148693b1f9fbdd27d225df2f88d9a61660c84`
- 530 eindeutige Wikipedia-Seiten transient gelesen
- 225 beobachtete Basen / 578 relevante Vorkommen
- 182 Basen bekannt
- 43 Unknowns
- eindeutige Coverage: **80,89 %**
- vorkommensgewichtete Coverage: **89,97 %**

Priority 1 wurde vollständig geprüft:

- Privater Review-Commit: `f94bec9f5863459fdb1c195e13cb7a8cdc868016`
- 43 geprüft
- 14 angenommen
- 29 verworfen
- 0 offen
- Produktintegration: Welle 80 / PR #294

### Nachmessung nach Welle 80

- Workflow Run #19 / Run-ID `37544813498`
- Ergebnis: erfolgreich
- Produktcommit: `5b6a4f70371c9da87bcfcbf0ad0b7e13ce048db8`
- Privater Import-Commit: `ac43b6808cdd3c18b7c8037822845c7b1fd96cd7`
- 527 eindeutige Wikipedia-Seiten transient gelesen
- 227 beobachtete Basen / 578 relevante Vorkommen
- 201 Basen bekannt
- 26 Unknowns
- eindeutige Coverage: **88,55 %**
- vorkommensgewichtete Coverage: **93,08 %**

Die Nachmessung ist eine neue Live-Stichprobe; 527 statt 530 Seiten bedeutet, dass die Prozentwerte nicht als streng identische Vorher-/Nachher-Stichprobe interpretiert werden dürfen.

Durch die Live-Stichprobe erschien genau ein neuer Unknown `panther`. Dieser wurde als Eigennamen-/Organisationsschreibweise verworfen:

- Priority 2: 1 geprüft, 0 angenommen, 1 verworfen, 0 offen
- Privater Review-Commit: `8ee7a61e5a37efa0f27b434ddf548ece45536902`
- Daraus entsteht keine Produktwelle.

## Wikipedia-Runtime-/Surface-Abschluss

Nach Welle 80 wurden zwei weitere Produkt-PRs integriert:

- PR #295 / Merge `1a77e5ce4195ac6aca7672530d37ab52715b115f`
  - drei bereits bekannte Wikipedia-Flexionsoberflächen ausschließlich per Exact-Replacement abgedeckt:
    - `Bürgermeisters/in`
    - `Athleten*innen`
    - `Physikingenieure/innen`
  - `Gewerkschaftern/innen` bleibt explizit unverändert.
  - Realnutzungs-Coverage kann seitdem die tatsächlich beobachteten Oberflächen gegen die vollständige Default-Runtime prüfen.
- PR #296 / Merge `10392e3f0adf3d8dae56b221a0a428c8a65e1cae`
  - vier weitere, durch die Surface-Runtime-Nachmessung sichtbar gewordene echte Personenformen ausschließlich exakt abgedeckt:
    - `Ortsvorsteher(in)`
    - `Benediktiner(innen)`
    - `Nachwuchssportler(in)`
    - `Tennisspieler(in)`
  - `Check-In` und `Gewerkschaftern/innen` bleiben als Negativfälle unverändert.

Für beide PRs waren die `main`-CI- und CodeQL-Läufe grün.

### Aktuelle Wikipedia-Nachmessung

Workflow Run #21 / Run-ID `37554564519`, Attempt 2:

- Ergebnis: erfolgreich
- Produktcommit: `10392e3f0adf3d8dae56b221a0a428c8a65e1cae`
- Privater Import-Commit: `bb0c68d9f20cd7fc07fe4b7e23bef2cd717c6496`
- 524 eindeutige Seiten
- 223 beobachtete Basen
- 599 relevante Vorkommen
- 198 bekannte Basen
- 25 unbekannte Basen
- eindeutige Basen-Coverage: **88,79 %**
- vorkommensgewichtete Coverage: **94,82 %**
- 280 verschiedene beobachtete Oberflächen
- 255 bekannte Oberflächen
- 25 unbekannte Oberflächen
- Surface-Coverage: **91,07 %**

Der verbleibende 25er-Rest enthält nach Sichtprüfung keinen neuen offensichtlichen Produktkandidaten. Er besteht aus bereits verworfenen Nicht-Lexemen/Artefakten, Eigennamen/Fremdformen, Schreibfehlern sowie der bewusst unveränderten fehlerhaften Form `Gewerkschaftern/innen`.

## Scribbr-Genderwörterbuch

Der erste vollständige Audit ist abgeschlossen:

- Workflow Run #22 / Run-ID `37558921474`
- 1.706 Detailseiten gelesen
- 1.479 lexikalische Paarbasen
- 1.034 vor Scribbr-Welle 81 bekannt / 445 unbekannt
- Ausgangs-Coverage: **69,91 %**
- Privater Import-Commit: `e89b415`
- Priority 1: **250 geprüft, 248 angenommen, 2 verworfen, 0 offen**
- Produktintegration: **Welle 81 / PR #298 / Merge `8f922fc6e3cba033b2797fedfea74914a3e1dfb5`**
- Verworfen: `mieterinnenvere` als Organisationsartefakt und `general` wegen konkurrierender korrekter Plurale `Generale` / `Generäle`
- `chilen` und `dompteur` wurden wegen früherer Negativregressionen extern gegengeprüft und anschließend exakt freigegeben
- Post-Merge-`main`-CI und CodeQL: vollständig grün
- Priority 2: **195 geprüft, 195 angenommen, 0 verworfen, 0 offen**
- Produktintegration: **Welle 82 / PR #299 / Merge `bc12e3aa7919920a47ae3a9b7ab9a9b53ec1a4a5`**
- Post-Wave-82-Nachmessung: **1.477 / 1.479 bekannt = 99,86 % Coverage**
- Die zwei verbleibenden Unknowns sind die bereits bewusst verworfenen Fälle `general` und `mieterinnenvere`

Die Freigaben bleiben vollständig `language_model_first`; es wurde keine generische Personen-Suffixregel ergänzt.

## GENDERATOR – Teilbestand abgeschlossen, weitere Abrufe zurückgestellt

- Historischer Teilimport: 14 fehlgeschlagene Listenseiten; der Vollaudit ist **nicht vollständig**.
- Der spätere Vollaudit Run `37700259912` wurde abgebrochen; erneutes Komplettscraping wird nicht weiterverfolgt.
- Zwei erfolgreiche private Bestandsprüfungen am 08.10.2026; aktuelle zusammengeführte Kandidatenliste: **591 vorläufige Unknowns**.
- Davon wurden **142 reguläre Personenbasen eigenständig geprüft** und als Exaktmappings in **Welle 83 / PR #305** integriert (Merge `230b67d3bc4a0d64714760a1f0e2fd5c9ea3cc23`). Keine generische Suffixregel.
- **449 Kandidaten** sind ohne fachliche Gesamtentscheidung zurückgestellt, nicht pauschal verworfen. Keine behauptete Voll-Coverage.
- Private Review- und Registerdaten: `HyperCriSiS/Generic-Datastore`, Commit `c21d85ce741f9cf1e2ec8a69683ae6c010e51ed0`.
- **Kein GENDERATOR-Blocker** für die weitere Sprachverstand-Roadmap.

## Nächste Arbeitseinheit

1. Nach-Merge-`main`-CI von Welle 83 abschließend kontrollieren.
2. Die reguläre `ROADMAP.md` fortsetzen; Quellenvollaudits nur bei konkretem Mehrwert erneut priorisieren.
3. Nach einem stabilen `main`-Checkpoint den getrennten Pale-Moon-Port bei Bedarf synchronisieren.
4. Private Quellenstände nur für ausdrückliche Quellen-/Evidenzarbeit laden; keine umfangreichen Audit- oder CI-Schleifen ohne Bedarf.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Standard ist `language_model_first`.
3. Externe Evidenz nur für echte Grenzfälle.
4. Produktseitig nur sichere Exact-Mappings bzw. eng begrenzte Regeln.
5. Positive, negative, Paar- und Kasusregressionen beibehalten.
6. Keine breite oder generische Personen-Suffixfreigabe hinzufügen.

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json` lesen.
4. Git-Checkpoints haben Vorrang vor alten Chats.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.