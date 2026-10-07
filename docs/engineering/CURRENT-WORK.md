# Aktueller Arbeitsstand

Stand: 2026-10-07  
Autorität: `main`

## Produktbaseline

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller integrierter Produktstand: `10392e3f0adf3d8dae56b221a0a428c8a65e1cae`
- Abgeschlossene Lexikon-Ausbauwellen: **80**
- Letzter integrierter Produkt-PR: **#296 — weitere Wikipedia-Klammerformen exakt abdecken**
- Welle 80 enthält 14 vollständig geprüfte, ausschließlich exakte Personenmappings aus der Wikipedia-Realnutzungsprüfung.
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

## Nächste Arbeitseinheit

1. Scribbr-Genderwörterbuch (Registry-Priorität 6) gegen den aktuellen Produktstand auditieren.
2. Nur tatsächlich neue, morphologisch und semantisch sichere Kandidaten in eine private Review-Queue übernehmen; keine automatische Freigabe.
3. Danach GENDERATOR als zweite offene Priorität-6-Quelle auditieren.
4. Erst nach abgeschlossener fachlicher Review sichere Exact-Mappings bzw. eng begrenzte Regeln produktseitig per PR integrieren.
5. Nach Abschluss der Quellen-Einheit Registry, privaten CURRENT-STATE und diesen Checkpoint aktualisieren.

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
