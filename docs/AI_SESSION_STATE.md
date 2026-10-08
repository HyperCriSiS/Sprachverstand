# AI Session State

Stand: 2026-10-08  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller Produktbaseline-Commit: `27cc7ba4983dd8452edbec4e9a6b3ddbea44c3b6`
- Abgeschlossene Lexikon-Ausbauwellen: **85**
- Welle 77 / PR #288: 17 geprüfte ESCO-Exaktmappings
- Welle 78 / PR #289: 155 geprüfte Wikidata-Exaktmappings
- Welle 79 / PR #290: 189 geprüfte Wikidata-Exaktmappings; 6 verworfen
- Welle 80 / PR #294: 14 geprüfte Wikipedia-Realnutzungs-Exaktmappings
- Welle 81 / PR #298: 248 geprüfte Scribbr-Exaktmappings; 2 verworfen
- Welle 82 / PR #299: 195 geprüfte Scribbr-Priority-2-Mappings; 0 verworfen
- Welle 83 / PR #305: **142 eigenständig geprüfte Exaktmappings**, CI inkl. Browser und CodeQL im PR grün; Merge `230b67d3bc4a0d64714760a1f0e2fd5c9ea3cc23`.
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

## Wikipedia-Runtime-/Surface-Abschluss

- PR #295 / Merge `1a77e5ce4195ac6aca7672530d37ab52715b115f`: Surface-Runtime-Coverage aktiviert und `Bürgermeisters/in`, `Athleten*innen`, `Physikingenieure/innen` ausschließlich exakt abgedeckt.
- PR #296 / Merge `10392e3f0adf3d8dae56b221a0a428c8a65e1cae`: `Ortsvorsteher(in)`, `Benediktiner(innen)`, `Nachwuchssportler(in)`, `Tennisspieler(in)` ausschließlich exakt abgedeckt.
- `Gewerkschaftern/innen` und `Check-In` bleiben unverändert.
- `main`-CI und CodeQL für #295 und #296: grün.

Letzte Surface-Nachmessung:

- Run #21 / Run-ID `37554564519`, Attempt 2
- Produktcommit: `10392e3f0adf3d8dae56b221a0a428c8a65e1cae`
- Privater Import-Commit: `bb0c68d9f20cd7fc07fe4b7e23bef2cd717c6496`
- 524 eindeutige Seiten
- 223 Basen / 599 Vorkommen
- 198 bekannte / 25 unbekannte Basen
- Basen-Coverage: **88,79 %**
- vorkommensgewichtete Coverage: **94,82 %**
- 280 verschiedene Oberflächen
- 255 bekannte / 25 unbekannte Oberflächen
- Surface-Coverage: **91,07 %**
- Kein neuer offensichtlicher Produktkandidat im verbleibenden 25er-Rest.

## Scribbr-Genderwörterbuch

- Workflow Run #22 / Run-ID `37558921474` erfolgreich.
- Audit-Baseline: Produktcommit `f02722b92155fd352d094836ed0fd11b3efc2045`.
- Privater Import-Commit: `e89b415`.
- 1.706 Detailseiten; 1.479 lexikalische Paarbasen.
- Vor Review: 1.034 bekannt, 445 unbekannt; Coverage **69,91 %**.
- Priority 1: 250 geprüft, **248 angenommen**, **2 verworfen**, **0 offen**.
- Produktintegration: **Welle 81 / PR #298 / Merge `8f922fc6e3cba033b2797fedfea74914a3e1dfb5`**.
- `mieterinnenvere` bleibt als Nicht-Person verworfen.
- `general` bleibt wegen der zwei korrekten Plurale `Generale` und `Generäle` bewusst unverändert.
- `chilen` und `dompteur` wurden extern gegengeprüft und exakt freigegeben.
- Keine generische Personen-Suffixregel.
- Post-Merge-`main`-CI einschließlich Kernprüfung, Performance, Gecko, Chromium, Video und CodeQL: grün.
- Priority 2: **195 geprüft, 195 angenommen, 0 verworfen, 0 offen**.
- Produktintegration: **Welle 82 / PR #299 / Merge `bc12e3aa7919920a47ae3a9b7ab9a9b53ec1a4a5`**.
- Post-Wave-82-Nachmessung: 1.479 lexikalische Paarbasen, 1.477 bekannt, 2 bewusst verworfen, Coverage **99,86 %**.
- Quellenimport Run `37673725483` erfolgreich; privater Import-Commit `ddc784c18065aa6fe45257f0c2b37e923444e5cd`.

## GENDERATOR – kein offener Produktblocker

- Der ältere Quellenabruf war mit 14 fehlgeschlagenen Listenseiten unvollständig; Run `37700259912` wurde abgebrochen. Ein erneuter Vollaudit ist zurückgestellt.
- Die private zusammengeführte Teilmessung und die erfolgreichen Bestandsprüfungen vom 08.10.2026 ergeben **591 vorläufige Unknowns**.
- **142 Personenbasen** vollständig eigenständig auf reguläre Flexion geprüft und als **Welle 83 / PR #305** integriert; **449 nicht geprüfte Restkandidaten** ohne Reviewentscheidung zurückgestellt.
- Welle 83 enthält ausschließlich explizite Allow-List-Einträge mit Positiv-, Negativ-, Singular-, Plural- und Kasusregressionen. Kein generischer Personen-Suffix.
- Private Review-Dateien: `sprachverstand/derived/review/genderator-partial-merge-priority-1-manual-decisions.json` und `-summary.json` in `Generic-Datastore`.
- Privater Status und Register aktualisiert: Commit `c21d85ce741f9cf1e2ec8a69683ae6c010e51ed0`.

## CI-Stabilisierung nach Welle 83

- PR #307 / Merge `4065ee2312d09428ce4e7a3692b4f51b98cb6f39`: Auf die schwankenden Chromium-Video-Frame-Verhältnisse reagiert die Videoprüfung nur bei einer erstmaligen Unterschreitung von 80 % mit einer einzigen vollständigen erneuten Baseline-/Erweiterungsmessung.
- Die bisherige 80-%-Schwelle sowie Videozeit-, Frame-Lücken-, P95-, Decoder-, DOM-Last- und Drop-Frame-Prüfungen bleiben unverändert.
- Beide Messungen werden protokolliert; wiederholte Unterschreitung bleibt ein CI-Fehler.
- PR-CI grün: Kernprüfung, Performance, Gecko, Chromium mit Video, CodeQL, Gesamtstatus.
- Post-Merge-`main`-CI **grün**: Run `37786658417` inklusive echter Browser und Videotest; CodeQL `37786658368` erfolgreich.

## Untertitel-Integration bei laufendem Video

- PR #309 / Merge `6afbbd850b099900bb24edc1207958011c44446b`: lokales WebM mit dynamischen DOM-Captions, echter Optionen-Schalter Aus/An/Aus ohne Neustart der Videoseite.
- Chromium-Integration bestätigt unveränderten Untertitel bei Aus, Korrektur bei An, Wiederherstellung bei Aus sowie fortlaufende Videowiedergabe und neue Cues. Regulärer Seitentext bleibt korrigiert.
- PR-CI (Run `37790232285`) vollständig grün einschließlich Browser, Video, Performance, Kernprüfung und CodeQL. Post-Merge-`main`-CI vollständig grün (Run `37790612790`); CodeQL `37790611441` erfolgreich.
- Grenzen: kein Test der nativen WebVTT-Texttracks oder externer Streamingportale; die tatsächlichen HTML-/DOM-Untertitel-Overlays sind abgedeckt.

## Neue verbindliche Projektreihenfolge: Quellen → moderne Releases → Pale Moon

KldB-/DKZ-Registerstatus nach erfolgreichem Import und allen 22 Reviews korrigiert: privater Commit `163ee6a173b7183b124a3020ae2925716ec2cc3f`.

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
- CI des Produkt-PR grün: Kernprüfung, Performance, Chromium, Gecko, CodeQL und Gesamtcheck (Run `37802067353`). Nach-Merge-`main`-CI `37802473812` und CodeQL `37802474320` bei diesem Checkpoint noch gesondert zu kontrollieren.
- Drei private Review-Listen A–F, G–M und N–Z sowie Ergebniszusammenfassung unter `HyperCriSiS/Generic-Datastore`. Privater Checkpoint-Commit `664b5da94b656fc3a6d75f2ad5422a380b968333`.
- Keine generische `-er`-Regel. Die Wellen ändern keine unmarkierten Wörter und enthalten keine Rohquellen-/Herkunftsmetadaten.
- Weitere Quellen gemäß Roadmap und privatem Quellenregister; ESCO-v1.2.1-Delta bleibt offen. Pale Moon ausschließlich nach den Releases der modernen Browser.

## Nächste Arbeitseinheit

1. Nach-Merge-CI von Welle 85 verifizieren. Danach den **verbliebenen Hunspell-Reviewpool (985)** und die ESCO-v1.2.1-Delta-Zugänglichkeit priorisiert abklären; nur semantisch und morphologisch sichere neue Blöcke integrieren. Bereits abgeschlossene KldB-/Wikidata-/Scribbr-Reviews nicht wiederholen.
2. Weitere offene Quellen in begrenzten, einzeln getesteten Arbeitseinheiten abarbeiten. Sichere Änderungen mit Regressionstests in `main` integrieren, private Roh-/Evidenzdaten im Datastore belassen.
3. Nach dokumentiertem Quellenabschluss die modernen Releases prüfen und abschließen. Pale Moon bis dahin nicht bearbeiten oder ungeprüft aktualisieren.
4. Erst nach Abschluss der übrigen Releases Pale Moon neu planen und CI-Paritätskonflikt beheben.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst `docs/engineering/CURRENT-WORK.md` lesen.
- Danach aktuellen `main`-HEAD live verifizieren.
- Bei Quellenarbeit zusätzlich `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json` lesen.
- Git-Checkpoints haben Vorrang vor alten Chats und früheren „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
- Wegen des aktiven Default-Branch-Rulesets auch reine öffentliche Checkpoint-Dateien per PR aktualisieren; Produktcode, Tests, Workflows und fachliche Änderungen bleiben ebenfalls PR-pflichtig.