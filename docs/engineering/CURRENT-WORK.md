# Aktueller Arbeitsstand

Stand: 2026-10-08  
Autorität: `main`

## Produktbaseline

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller integrierter Produktstand: `27cc7ba4983dd8452edbec4e9a6b3ddbea44c3b6`
- Abgeschlossene Lexikon-Ausbauwellen: **86**
- Letzter integrierter Lexikon-PR: **#319 — 550 geprüfte Personenformen als Welle 86 integrieren**
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

## CI-Abschluss und Stabilisierung nach Welle 83

- Produktwelle 83: PR #305 / Merge `230b67d3bc4a0d64714760a1f0e2fd5c9ea3cc23`.
- Im ersten `main`-Lauf kam es bei identischem Produktcode zu schwankenden Frame-Messungen (78,2 % und 79,6 % der Baseline); der PR-Browserlauf und ein Wiederholungslauf hatten die Videoregression bestanden.
- PR #307 / Merge `4065ee2312d09428ce4e7a3692b4f51b98cb6f39` bestätigt ausschließlich eine Unterschreitung des vorhandenen 80-%-Grenzwerts durch **eine** zusätzliche vollständige Baseline-/Erweiterungsmessung. Andere Fehlschläge bleiben sofortige Fehlschläge. Video-Schranken wurden nicht gelockert.
- PR #307: Kernprüfung, Performance, Gecko, Chromium inklusive Video, CodeQL und Sammelcheck vollständig grün.
- Post-Merge-`main`-CI **vollständig grün**: Run `37786658417` (Kernprüfung, Performance, Gecko, Chromium samt Videotest und Sammelcheck); CodeQL-Run `37786658368` erfolgreich.

## Untertitel-Videointegrationstest

- PR #309 / Merge `6afbbd850b099900bb24edc1207958011c44446b`: Chromium-Regression mit echtem, lokalem WebM-Video und zeitgebunden wechselnden DOM-Untertitel-Overlays (YouTube-ähnliche DOM-Captions).
- Echter Schalter in der Optionsseite: **Aus → An → Aus**, jeweils während derselbe Videotab weiterspielt; Standardtext wird unabhängig weiter korrigiert. Untertitel bleiben bei Aus original, werden bei An korrigiert und bei erneutem Aus wiederhergestellt.
- In der PR-CI erfolgreich: Kernprüfung, Performance, realer Chromium-Test mit Videowiedergabe, Gecko-Smoke, CodeQL und Sammelcheck (Run `37790232285`).
- Dies deckt **keine** systemeigenen, browserintern gerenderten WebVTT-Untertitel und noch keine Live-Streamingportale ab. Die tatsächliche DOM-Overlay-Integration wird geprüft.
- Post-Merge-`main`-CI vollständig grün: Run `37790612790` einschließlich Kernprüfung, Performance, Firefox, Chromium mit Videountertiteln und Sammelcheck; CodeQL-Lauf `37790611441` erfolgreich.

## Verbindliche Priorisierung: Quellen → moderne Releases → Pale Moon

Privater KldB-/DKZ-Statusabgleich: `HyperCriSiS/Generic-Datastore` Commit `163ee6a173b7183b124a3020ae2925716ec2cc3f`.

**Entscheidung vom 08.10.2026:** Zuerst alle noch relevanten, begrenzt prüfbaren Quellen bearbeiten und sichere Produktkandidaten in `main` abschließen; danach die geplanten Releases für Chrome/Chromium, Firefox und weitere moderne Browserkanäle abschließen; **Pale Moon zuletzt**.

- Quellenregister mit 24 Einträgen ist Grundlage. BA-KldB-2026 und DKZ-Current sind anhand erfolgreicher Importe und sämtlicher 22 abgeschlossener Reviews im privaten Register bereits als erledigt nachgetragen. Wikidata, Wikipedia und Scribbr ebenfalls nicht blind wiederholen.
- Offene abgegrenzte Arbeit: ESCO-v1.2.1-Delta, Hunspell DE, IDS ReCKS / KoRaP/Gender-Foundry, verbliebene Kontext-/Glossarfragen (Genderleicht/Greifswald), DWDS/Duden bei Zweifelsfällen und begrenzte Real-Web-/Flexions-Regressionsnachmessung.
- **GENDERATOR-Ausnahme bleibt bestehen:** Keine erneute Vollerfassung. 142 sicher geprüfte Formen integriert, 449 Kandidaten ohne Entscheidung zurückgestellt.
- Abgeschlossene Quellen nicht mit Prozentzahlen überbewerten: Jeder Quellenschritt endet mit einem nachvollziehbaren Ergebnis (Integration, kein Mehrwert, zurückgestellt oder externer Zugriff nicht möglich), ohne fiktive Vollständigkeitsbehauptungen.
- Nach Quellenabschluss Release-Sperren, echte Browser-/Video-/Untertiteltests, Paket- und Store-Prüfungen der modernen Browser abschließen. Dauerhaft offene Real-Web- und manuelle Referenzquellen erhalten einen Release-Stichtag.
- **PR #311 ist ohne Merge geschlossen**. Der getestete Referenzstand liegt weiterhin auf `sync/palemoon-lexikon-welle-83-20261008`, der permanente Branch `palemoon` bleibt unverändert. Die in diesem PR bekannte strenge Paritäts-CI-Sperre wird erst in Phase 3 bearbeitet.

## Hunspell-DE: erste große Lexikon-Welle 84

- Privater Import nach festem LibreOffice-Commit `32b006a2c22a4ac7e8ed3f03346f7b3d85a970a4`, Workflow-Run `37797005772`: **258.220** Hunspell-Einträge, daraus **3.502** vorgefilterte Basen mit Movierungshinweis (keine automatische Personenfreigabe).
- Runtime-Coverage vor Welle 84: **1.566 bereits bekannt**, **1.936 unbekannt**.
- Welle 84 / **PR #315** / Merge `f056be49438c12d7cba32d418dfc853249c58a89`: **399** ausdrücklich ausgewählte reguläre Personenbasen mit Positiv-, Negativ-, Paar-, Plural- und Kasusregressionen in `main` integriert. Der PR einschließlich Kernprüfung, Performance, Chromium, Gecko und CodeQL war vollständig grün.
- **1.537** zuvor unbekannte Kandidaten bleiben ungeprüft oder bewusst zurückgestellt, darunter zahlreiche Einwohnerbezeichnungen und Zweifelsfälle. Es wurde keine generische `-er`-Regel ergänzt und keine vollständige Quellen-Coverage behauptet.
- Quelldateien und Reviewdokumentation bleiben privat unter `HyperCriSiS/Generic-Datastore`, Abschlusscommit `b67560efac168d6cee399e58956c701fbd264259`.
- Post-Merge-`main`-CI für #315 erfolgreich: Run `37798840421`, CodeQL `37798843800`.
- ESCO 1.2.1 bleibt als Delta-Prüfung offen. Der offizielle Download benötigt eine E-Mail-Freigabe; keinen geprüften Import behaupten.

## Hunspell-DE: große Lexikon-Welle 85

- Produkt-PR **#317** / Merge `27cc7ba4983dd8452edbec4e9a6b3ddbea44c3b6`: **552** neue, explizit geprüfte Herkunfts- und Einwohnerbasen mit unverändertem Plural, femininer `-in`-Form sowie Singular-, Paar- und vier Kasusregressionen.
- Welle 84 (399) + Welle 85 (552) = **951** hinzugefügte Personenbasen aus dem zuvor 1.936 Basen umfassenden Hunspell-Unknown-Pool. **985** sind ohne weitere Entscheidung zurückgestellt. Diese wurden nicht als ungeeignet klassifiziert.
- CI des Produkt-PR grün: Kernprüfung, Performance, Chromium, Gecko, CodeQL und Gesamtcheck (Run `37802067353`). Nach-Merge-`main`-CI `37802473812` und CodeQL `37802474320` ebenfalls vollständig erfolgreich.
- Drei private Review-Listen A–F, G–M und N–Z sowie Ergebniszusammenfassung unter `HyperCriSiS/Generic-Datastore`. Privater Checkpoint-Commit `664b5da94b656fc3a6d75f2ad5422a380b968333`.
- Keine generische `-er`-Regel. Die Wellen ändern keine unmarkierten Wörter und enthalten keine Rohquellen-/Herkunftsmetadaten.
- Weitere Quellen gemäß Roadmap und privatem Quellenregister; ESCO-v1.2.1-Delta bleibt offen. Pale Moon ausschließlich nach den Releases der modernen Browser.

## Lexikon-Welle 86 abgeschlossen

- PR #319 / Merge `a3257d00e4e7734fe81747817de9168bb53976ed`: 550 explizite Personenbasen, vollständige Positiv-, Negativ-, Paar- und Kasusregressionen. PR-CI einschließlich Chromium, Firefox, Performance und CodeQL grün.
- Hunspell-Zwischenstand: 399 (Welle 84) + 552 (Welle 85) + 550 (Welle 86) = **1.501** neue Exaktmappings; **435 der ursprünglichen 1.936 unbekannten Basen ohne abschließende Reviewentscheidung**.
- Keine generische Endungsregel, keine automatische Aufnahme; private Quelldaten nur in Generic-Datastore. Privater Checkpoint: `e277e4dcef8d83b373dacac8b26f54859c52a34b`.
- Nach-Merge-`main`-CI Run `37806661507` und CodeQL `37806661267` separat verifizieren.
- Nächste Quellenarbeit: verbleibende 435 Hunspell-Kandidaten triagieren, dann ESCO v1.2.1 und IDS. Moderne Browser-Releases vor Pale Moon.

## Nächste Arbeitseinheit

1. Nach-Merge-main-CI für PR #319 prüfen.
2. Die 435 offenen Hunspell-Basen auf Bedeutung und Flexion prüfen.
3. Danach ESCO-v1.2.1 und IDS-Korpora bearbeiten.
4. Moderne Browser-Releases fertigstellen; Pale Moon zuletzt.

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