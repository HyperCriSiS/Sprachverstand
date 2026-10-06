# Aktueller Arbeitsstand

Stand: 2026-10-07  
Autorität: `main`

## Produktbaseline

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller integrierter Produktstand: `5b6a4f70371c9da87bcfcbf0ad0b7e13ce048db8`
- Abgeschlossene Lexikon-Ausbauwellen: **80**
- Letzter integrierter Produkt-PR: **#294 — achtzigste Ausbauwelle**
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

## Aktueller Wikipedia-Restpool

Es gibt **0 unentschiedene Kandidaten**.

Die 26 aktuell unbekannten Basen zerfallen in:

- 22 bereits geprüfte und verworfene Nicht-Lexeme, Eigennamen-, Marken-, Titel-, Englisch- oder Parserartefakte
- 3 echte Runtime-/Flexionslücken bereits bekannter Lexeme:
  - `Bürgermeisters/in`
  - `Athleten*innen`
  - `Physikingenieure/innen`
- 1 fehlerhafte Oberflächenform:
  - `Gewerkschaftern/innen`

`Gewerkschaftern/innen` wird nicht als neues Lexem oder automatische Korrektur freigegeben.

## Nächste Arbeitseinheit

Die nächste größere Einheit soll **separat** erfolgen:

1. Die drei echten Oberflächenlücken ausschließlich mit engen/exakten Regeln abdecken.
2. Den Wikipedia-Realnutzungs-Coverage-Audit oberflächenbewusst machen, damit nicht nur eine rekonstruierte Basis, sondern die tatsächlich beobachtete Form gegen die reale Produkt-Runtime geprüft wird.
3. `Gewerkschaftern/innen` als fehlerhafte Form unverändert lassen.
4. Danach Wikipedia erneut vermessen.
5. Anschließend die nächsten offenen Quellen aus der Registry bearbeiten, insbesondere die noch offenen Genderwörterbuch-Audits.

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
