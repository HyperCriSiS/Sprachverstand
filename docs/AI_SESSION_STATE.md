# AI Session State

## Neuester kompakter Audit-Checkpoint (10.10.2026, Europe/Berlin)

- **Neu seit letztem Checkpoint:** #420 externe Videoseite #11 auf Video.js gewechselt (Merge `75e65a32`, reales Medienplayback im CI nicht messbar: `videoMeasured=no`); #421 sämtliche verbliebenen Verweise zur früheren externen Testseite auch aus Archiv/Sitzungsstand/Test entfernt (Merge `83738d32`); #422 synthetisches natives 2-%-Mischprofil im echten Chromium/Firefox neben dem unveränderten 100-%-Stressprofil (Merge `b9071932`); #423 Zehnfachmittelung zur groben Firefox-Messuhr, PR-CI und beide echten Browserläufe vollständig grün (Merge `30600910`). [Run 38016504599](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38016504599): **aktueller** Initialscan bei 200/1k/4k Knoten = Chromium 0,95/4,42/17,42 ms, Firefox 1,30/5,70/22,20 ms; nur 4/20/80 tatsächliche Ersetzungen. Die Korrekturrate von 2 % ist eine Testannahme, kein externer empirischer Webseitenmittelwert. Ganz normale Nutzung, reale Klicks, 60-FPS-Videos und aktive Untertitel sind damit **nicht** freigegeben. Qualitätsblocker #419, weitere unabhängige Auditpunkte sowie **Release-NO-GO** bleiben bestehen. Der Hauptthread-Initialscan ist weiter synchron. Profilübersicht: `docs/engineering/PERFORMANCE-TEST-PROFILES.md`.

- **Neu integriert:** **#415 DOM-02-Funktionsprofil**, Merge `aef8584db39cd2b19d5aa30a16b9966de8c61818`, [Run 38010272966](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38010272966) in Chromium und Firefox erfolgreich. 10k/14 instrumentierte Messungen: neuer Range-Erhalt 174,7 ms (Chromium) bzw. 170 ms (Firefox) exklusive Summenzeiten; aktuelles `transformValue` 164,9/165 ms gegenüber historisch 81,5/89 ms (Methodenwrapper verzerren absolute Dauer). **#416 DOM-02 Range-Schnellpfad**, Merge `7ae34eee83edb53323836921e6770dc966a5f1ec`, einzelner nicht-leerraumändernder Token-Edit lokal über `Text.replaceData()`, komplexe mehrteilige Änderungen unverändert tokenweise; DOM-Auswahl/NBSP/Restore zusätzlich regressionsgesichert. **#417 direkter A/B-Workflow**, Merge `e53f3ced4b5b5c403ded5be25ba9b4c763a35444`. Sämtliche PR-CI und Post-Merge-main-CI einschließlich Kern, Chromium/Video, Firefox/Gecko, Performance und CodeQL grün. Keine Produktregel-, Lexikon- oder Release-Änderung.
- Vorherige geprüfte Auditeinheiten: **#397 DOM-06** `3699903a`, **#398 DOM-12** `188b6bcb`, **#399 DOM-11** `320c2e3c`; alle PR-CI grün. Nachgelagerte `main`-CI getrennt prüfen.
- **Weiterhin NO-GO:** Ausgangsaudit 29 Findings (8 P1, 20 P2, 1 P3), unabhängige vollständige Wiederholungsabnahme ausstehend. Die beiden direkten, uninstrumentierten 0.7.2-A/B-Workflows [38011092311](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38011092311) und [38011180540](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38011180540) vergleichen jeweils in demselben echten Browser die fest gepinnte Vorversion `aef8584d` mit dem optimierten aktuellen Commit `e53f3ced` (2 Blöcke je 7 Messungen/Größe nach 2 Warmups, 1k/4k/10k, alle Ersetzungen validiert). Median-Faktoren neu/alt: Chromium **0,717/0,815/0,852×** und **0,817/0,831/0,851×**, Firefox **0,750/0,813/0,810×** und **0,778/0,912/0,929×**, je Lauf vollständig grün, Rohwerte 90 Tage. Der Einzel-Token-Schnellpfad beschleunigt diesen isolierten Initialscan reproduziert; DOM-02 bleibt wegen größerer historischer Funktionsdifferenzen (Tag v0.7.1 enthält Paket 0.6.6), Real-Web-/Video- und Folgeaudit offen. Nächste Einheiten: DOM-01 Cross-Node, LANG/TEST-01, REL-01 und S3/S4; danach unabhängige Revalidierung. Keine Tags, Releases, Store-Einreichungen oder Pale-Moon-Änderungen.
- **Keine** Release-Tags, GitHub-Releases, Store-Einreichungen oder Pale-Moon-Änderungen. Native Windows/Edge/Opera- und Store-Environment-Prüfungen bleiben offen. Aktueller Arbeitspunkt: `docs/engineering/CURRENT-WORK.md` auf `main`.

Stand: 2026-10-10  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Aktueller Produktbaseline-Commit: `5b901107e454ed8f278dd22b43a7310d0964ffc1`
- Abgeschlossene Lexikon-Ausbauwellen: **92**
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
- CI des Produkt-PR grün: Kernprüfung, Performance, Chromium, Gecko, CodeQL und Gesamtcheck (Run `37802067353`). Nach-Merge-`main`-CI `37802473812` und CodeQL `37802474320` ebenfalls vollständig erfolgreich.
- Drei private Review-Listen A–F, G–M und N–Z sowie Ergebniszusammenfassung unter `HyperCriSiS/Generic-Datastore`. Privater Checkpoint-Commit `664b5da94b656fc3a6d75f2ad5422a380b968333`.
- Keine generische `-er`-Regel. Die Wellen ändern keine unmarkierten Wörter und enthalten keine Rohquellen-/Herkunftsmetadaten.
- Weitere Quellen gemäß Roadmap und privatem Quellenregister; ESCO-v1.2.1-Delta bleibt offen. Pale Moon ausschließlich nach den Releases der modernen Browser.

## Lexikon-Welle 86 abgeschlossen

- PR #319 / Merge `a3257d00e4e7734fe81747817de9168bb53976ed`: 550 explizite Personenbasen, vollständige Positiv-, Negativ-, Paar- und Kasusregressionen. PR-CI einschließlich Chromium, Firefox, Performance und CodeQL grün.
- Hunspell-Zwischenstand: 399 (Welle 84) + 552 (Welle 85) + 550 (Welle 86) = **1.501** neue Exaktmappings; **435 der ursprünglichen 1.936 unbekannten Basen ohne abschließende Reviewentscheidung**.
- Keine generische Endungsregel, keine automatische Aufnahme; private Quelldaten nur in Generic-Datastore. Privater Checkpoint: `e277e4dcef8d83b373dacac8b26f54859c52a34b`.
- Nach-Merge-`main`-CI Run `37806661507` und CodeQL `37806661267` erfolgreich abgeschlossen.
- Nächste Quellenarbeit: verbleibende 435 Hunspell-Kandidaten triagieren, dann ESCO v1.2.1 und IDS. Moderne Browser-Releases vor Pale Moon.

## Lexikon-Welle 87 – Quelle Hunspell DE

- PR #322 / Merge `97ac85b18f2f46f4ffe09e5d75ae7e3c2ad34164`: **231 neue explizite Exaktmappings**, vollständige Flexions-, Paar- und Negativregressionen.
- Originaler Hunspell-Unknown-Pool: 1.936 Basen. Nach Wellen 84–87 wurden **1.732** integriert; **204 verbleiben ohne Freigabe**. Kein generisches Endungsmapping.
- PR-CI und Post-Merge-`main`-CI samt Chromium-Video, Gecko, Performance und CodeQL **vollständig erfolgreich** (Runs `37817862980`, `37818211722`, CodeQL `37818211581`).
- Privater Quellencheckpoint `ec8126261b475d9dc3952b629b5f861f38800e7f`; die Welle enthält keine Rohquellen.
- Nächste Arbeit: 204 verbleibende Hunspell-Basen abschließend klassifizieren, dann ESCO-v1.2.1-**deutsches Label-Delta** und IDS-ReCKS-/KoRaP-Korpora. Pale Moon erst nach den modernen Releases.

## Quellencheckpoint nach Welle 88

- **PR #324 / Merge `bec8f0abc29437bf34aa9889811b82039d8fe61c`:** 71 weitere sichere Hunspell-Personenbasen als exakte Lexikonmappings mit Positiv-, Paar-, Kasus- und Negativregressionen; vollständige PR-CI und Post-Merge-`main`-CI einschließlich Chromium, Firefox, Video, Performance und CodeQL grün (Runs `37822554136`, `37822935828`, `37822936389`).
- Fünf Hunspell-Wellen 84–88: 399 + 552 + 550 + 231 + 71 = **1.803** produktiv aufgenommene Basen aus dem anfänglich unbekannten **1.936er** Vorfilterpool. Letzte 204 Fälle ausdrücklich klassifiziert: 71 integriert, **51 nicht freigegeben**, **82 mangels Beleg zurückgestellt**. Keine offenen unklassifizierten Basen *innerhalb dieses Vorfilters*, keine vollständige Hunspell-Lexikonabdeckung behauptet.
- Privater Reviewabschluss: `HyperCriSiS/Generic-Datastore`, Commit `8f0c0c4d84ca0cc2822ee8a58b424ac3178fba18`. Keine Rohquellen oder unsicheren Listen in öffentlichen Produktdateien.
- ESCO 1.2.1 bleibt als deutsches Label-Delta **extern offen**: API veröffentlicht weiterhin v1.2.0, offizielles v1.2.1-CSV-/Deltapaket über E-Mail-Autorisierung. Privat vermerkt: `fea1e3aeff91a1cd69d6fbea423fd67bb82c04d2`.
- IDS ReCKS und DeReKo-KorAP-2026-II/Gender-Foundry methodisch und auf Verfügbarkeit geprüft. Die Foundry ist experimentell und rein musterorientiert, daher kein automatischer Produktimport. Private Evidenznotiz: `f1b3bfe266ff12610cffb2361450ec12ea3d9dc8`.
- **Reihenfolge bleibt:** übrige Quellen und gezielte Realtext-Regression, moderne Browser-Releases, Pale Moon zuletzt.

## KorAP-2026-II-Markerkompatibilität – PR #326

- PR #326 / Merge `45dcd9872910a2ca0fb8caf5b9aedd8c63cdb87f`: Unicode-Schrägstriche U+2215 `∕`, U+2044 `⁄` und U+FF0F `／` auch mit `-innen` und `inne/n`; zusätzlich `(-innen)`. Soft-Hyphen U+00AD verhindert falsche Teilwort-Treffer.
- Weiterhin nur lexikalisch bekannte Personenbasen. Keine allgemeine Endungsregel und keine pauschale Singular-/Neopronomen-Konvertierung.
- 20 positive Markerfälle, 13 Negativfälle, gemischter Satz und eigenständige Prüfung der bekannten Suffix-Kompositaregel. PR-CI `37828113849` und CodeQL `37828105854` vollständig grün.
- Post-Merge-`main`-CI `37828788601`, CodeQL `37828789888` ebenfalls vollständig grün, einschließlich Chromium mit Video, Gecko und Performance.
- KorAP-Releasenotizen waren der Anlass; **keine** selbst erhobenen Korpusbelege. Private Evidenznotiz `sprachverstand/derived/review/korap-2026-ii-marker-compatibility-review.json` im Generic-Datastore.
- ESCO 1.2.1 benötigt für ein echtes deutsches Labeldelta weiterhin den autorisierten Download; Pale Moon bleibt bis nach den modernen Releases zurückgestellt.

## Unabhängige Real-Web-/Kontext-Gegenprobe – PR #328 und #329

- PR #328 / Merge `01801d9cc6469bae3143b2c1f556249f4d2dc00d`: kurze veröffentlichte Duden-/Wörterbuch-Beispiele zu Schrägstrich- und Klammer-Pluralformen mit Singular-, Paar- und Soft-Hyphen-Negativgrenzen. Kernprüfung, Performance, Gecko, Chromium/Video und CodeQL im PR und danach auf `main` grün.
- PR #329 / Merge `a71d5b41a2f547998c4f0479145b8751c3d430eb`: fünf Positiv- und sechs Negativregressionen aus einer **gezielten, unabhängigen Real-Web-Stichprobe** auf Schul-, Verlags-, Veranstaltungs- und Navigationsseiten. Gesamte PR-CI einschließlich Chromium/Video, Gecko, Performance und CodeQL grün; Post-Merge-`main`-CI `37837054517` und CodeQL `37837055053` ebenfalls vollständig grün.
- **Kein neues Lexikonmapping und keine Produktlogikänderung.** Der Bestand bleibt bei 88 freigegebenen Lexikon-Ausbauwellen.
- Private Herkunfts- und Grenzfalldokumentation in `HyperCriSiS/Generic-Datastore`, PR #78 / Merge `d4e1a0e4711d4edc751870d04ba19edc27fdb590`: `sprachverstand/derived/review/real-web-shortforms-20261008.json` und `context-dictionary-boundaries-20261008.json`. Keine Quell-URLs oder Rohtexte im öffentlichen Produkt.
- Genderleicht-Kontextfälle sowie die kuratierte Greifswald-Glossarauswahl (57 überprüfte Einträge, 52 reguläre bereits bekannte Basen und 5 einzeln begründete Sonderfälle) ergeben **keine neue automatisch sichere Regel**. Zwei konkrete Duden-Grenzfälle gesondert geprüft; unklarer Bindestrich-Kompositakontext bleibt bewusst zurückgestellt.
- **Methodische Grenze:** Reale Web-Verwendungen sind keine repräsentative DeReKo-/KorAP-Korpusabfrage. Keine authentifizierten KorAP-KWIC-Primärbelege, keine belastbare Häufigkeitsaussage und kein Nachweis für seltene Unicode-Schrägstriche aus dieser kleinen Stichprobe. KorAP-Zugriff für echte KWIC-Texte und ESCO-v1.2.1-CSV bleiben externe Zugangsfragen. GENDERATOR-Vollaudit bleibt ausgeschlossen.
- Reihenfolge unverändert: Quellen begrenzt abschließen bzw. Zugangsblocker explizit dokumentieren, danach moderne Browser-Releases, Pale Moon zuletzt.

## Moderne Browser – gezielte Live-Gegenprobe und Schutzbereich-Auswertung

- CI-Verbesserung **PR #332** / Merge `ee3901b906d0a0b40c6b56e5eea9a52a00742757`: Der diagnostische Real-Web-Bericht trennt Änderungen geschützter DOM-Selektoren im Basis- und im Erweiterungslauf. Gezielte Tests und PR-CI (Kernprüfung, Performance, Firefox/Gecko, Chromium/Video und CodeQL) vollständig grün. Daraus wird keine automatische Kausalitätsbehauptung abgeleitet.
- Manueller `real-world.yml`-Lauf **37837774593** auf `main`: drei ausgewählte Websites (TAZ/Soft-Hyphen, früherer Videofall, YouTube Big Buck Bunny), 3/3 Seiten erfolgreich; lokale Chromium-, Video- und Untertiteltests erfolgreich. Ursprüngliche Anzeige `pre`-/`input`-Änderung war auf den Erweiterungslauf beschränkt, nicht mit dem Basislauf verglichen.
- Erneute diagnostische Messung mit neuer Auswertung: **Run 37838968882**, **3/3 erfolgreich**, kein JavaScript-Fehler, keine Restmuster innerhalb der begrenzten definierten Suchmuster. `taz-soft-hyphen`: geschützte Bereiche unverändert in beiden Modi; frühere Videostichprobe: `pre` in Basis- **und** Erweiterungslauf dynamisch; `youtube-big-buck-bunny`: `input` in Basis- **und** Erweiterungslauf dynamisch. **Kein Selektor ausschließlich im Erweiterungslauf verändert.** Das ist keine generelle Unbedenklichkeitsgarantie; die Web-Metrik meldet für beide Videoseiten keine Frame-Callback-Ereignisse, weshalb das lokale Videoregressions-Gate weiterhin eigenständig erforderlich ist.
- Nach-Merge-CodeQL von #332: `37838957815` grün; Nach-Merge-`main`-CI `37838958356` **vollständig erfolgreich** (einschließlich Chromium, Video, Gecko, Performance und Gesamtcheck).
- GitHub-Releases stehen derzeit zuletzt auf `v0.7.2-rc.12`; das Paket meldet Version `0.7.2`. **Kein neuer Tag, keine Store-Einreichung.** Der Store-Publish-Workflow hat einen separaten `validate`-Modus und fordert für `submit` explizite Tag/Ziel-Freigabe.
- **Issue #331** dokumentiert eine Konfigurationslücke: `store-production` wird im Workflow genutzt, ist aber unter den abrufbaren Repository-Environments nicht angelegt; Store-Secrets konnten mit dem vorhandenen GitHub-Token nicht gelesen werden. Vor produktiver Veröffentlichung erforderliche Umgebungs- und Rechteprüfung durchführen.
- **Pale Moon bleibt unangetastet.** KorAP-KWIC und ESCO-v1.2.1 sind weiterhin externe Quellenzugangsfragen, kein automatisches erneutes Vollscraping.

## Moderne Release-Vorabprüfung – abgeschlossen am 08.10.2026

- PR **#334** / Merge `ea3910aabcb3c51cdfce9a72eb4ae9b279d2da95`: manueller, ausschließlich lesender GitHub-Actions-Preflight für den exakt ausgelösten modernen `main`-Commit. Prüft `npm run check`, echten Chromium-/Firefox-Browser, Video und DOM-Untertitel, baut Chromium-ZIP, unsignierte Firefox-XPI und Source-ZIP, validiert Manifest/Versionsdaten, Archive und SHA-256. Keine Tags oder Store-Aktionen.
- Erster manueller Run `37842314563`: Browser- und Store-Prüfung bestanden, **Prüfsummendatei wurde irrtümlich selbst gehasht**; drei eigentliche Archiv-Prüfsummen waren korrekt. PR **#336** / Merge `9df39a65874614f0702c210ea537b9659b51eef0` behebt diese isolierte CI-Ursache durch Ausschluss von `SHA256SUMS.txt` und ergänzt die Regression. PR-CI einschließlich Chromium/Video, Gecko, Performance, CodeQL sowie nachgelagerte `main`-CI `37842979062` und CodeQL `37842978710` vollständig grün.
- **Abschließender Preflight `37842986543`: vollständig erfolgreich.** Paketversion `0.7.2`, drei Archivprüfungen, Paket-/Quellmanifest-Versionen, Release-Notes und Checksummen erfolgreich. Temporäres GitHub-Actions-Artefakt `modern-release-preflight-9df39a65874614f0702c210ea537b9659b51eef0` (ID `11578592630`, 14 Tage Retention). Keine Veröffentlichung ausgelöst.
- **Release-Blocker:** Issue **#335** – operative Edge-/Opera-Dokumentation verspricht eigene ZIP-Artefakte, die der echte Release-Workflow noch nicht erzeugt; außerdem fehlen die dokumentierten Source-Provenienzdateien im Release-Source-ZIP. Beide Punkte vor einem modernen stabilen Release korrigieren und denselben Preflight um Edge/Opera ergänzen.
- **Store-Blocker:** Issue **#331** – `store-production`-Umgebung/Store-API-Berechtigungen gesondert absichern; `store-publish.yml` läuft für produktive Einreichungen nur nach eigenständiger expliziter Freigabe. Der letzte öffentliche stabile GitHub-Release bleibt `v0.7.1`, die letzte moderne Prerelease `v0.7.2-rc.12`. Es wurde weder ein neuer Release-Tag noch ein Store-Submission-Job gestartet.
- Quellendelta ESCO 1.2.1 und authentifizierte KorAP-KWIC-Primärtexte bleiben externe Zugangsgrenzen. Keine Wiederholung abgeschlossener Vollimports; **Pale Moon zuletzt**.

## Release-Artefakte und Source-Provenienz – 09.10.2026

- **Issue #335 abgeschlossen:** PR **#338**, Squash-Merge `c8f75158d84ac53c64d070750f65084ec97419ad`. Release-Workflow und manueller Preflight erzeugen fünf moderne Archive: Chromium-ZIP, Edge-ZIP, Opera-ZIP, unsignierte Firefox-XPI und Source-ZIP. Edge und Opera werden aus dem validierten `dist/chromium`-Build abgeleitet und erhalten nur ein anderes Manifest. Pale Moon unverändert.
- `scripts/verify-release-packages.mjs` prüft alle fünf Archive inklusive Manifest-Versionen, Release-Notes, SHA-256, vollständiger Bytegleichheit von Edge/Opera zum Chromium-Build außer `manifest.json` sowie `SOURCE_COMMIT.txt` und `RELEASE_PROVENANCE.txt` innerhalb des Source-ZIPs. Im tatsächlichen Release enthält die Provenienz Tag, exakten Git-Commit und sechs vorbereitete Versionsdateien; im Preflight steht ausdrücklich `Tag: preflight`.
- Erste CI der PR zeigte drei überholte Vertragstests, die eigene Edge-/Opera-Pakete und Source-Provenienz verbaten; Annahmen korrigiert. Anschließend **vollständige PR-CI grün** einschließlich Kernprüfung (9.229+ Tests), Gecko, Chromium/Video, Performance und CodeQL. Auch die Post-Merge-`main`-CI **37850575457** und CodeQL **37850575347** erfolgreich.
- **Manueller Preflight `37850584984` erfolgreich**, Commit `c8f7515`, Paketversion `0.7.2`: alle fünf Archive, echte Chromium-/Firefox-/Video-/Untertiteltests, Quell-Provenienz, Bytevergleich und SHA-256-Prüfung erfolgreich. Internes GitHub-Actions-Artefakt `modern-release-preflight-c8f75158d84ac53c64d070750f65084ec97419ad`, ID **11581717990**, 14 Tage Aufbewahrung.
- **Kein Release-Tag und keine Veröffentlichung** ausgelöst. Letzter stabiler GitHub-Release weiterhin `v0.7.1`; aktuell geprüfte Arbeitsversion `0.7.2`. Separate echte Store-Freigabe erforderlich.
- **Issue #331 bleibt offen:** GitHub-Repositorium meldet als Environment nur `copilot` ohne Protections; `store-production` fehlt weiterhin. Zugriff auf Repository-Variablen/Secrets mit verfügbarem Token `403`. Keine ungeschützte Ersatzumgebung angelegt; Store-Zugänge, Environment-Schutz und manueller Freigabeprozess sind vor AMO-/Chrome-Submission durch einen Berechtigten zu prüfen. Edge/Opera benötigen darüber hinaus die in den Einreichungsanleitungen vorgesehenen manuellen Store-/Browserprüfungen.
- Externe ESCO-v1.2.1-/KorAP-KWIC-Zugangsgrenzen bleiben dokumentiert, keine erneuten Vollimports. **Pale Moon erst nach den modernen Browser-Releases**.

## GENDERATOR – gezielte Fehlseiten-Nachprüfung beendet am 09.10.2026

- Privater, auf 14 historische Fehlerpositionen begrenzter Chromium-/WebForms-Abruf: erste Ausführung **37853305451** zeigte, dass die Startseiten von B/K/P/S erreichbar waren; ein direkter Legacy-Postback scheiterte jedoch. Navigation per echtem Playwright-Pagerklick korrigiert (private PRs #80–#82), öffentlicher manueller Quellenimport **PR #340** / Merge `5ff886fdfc1d9d0526fb1de82d7045b976a64d58`; vollständige Produkt-PR-CI grün.
- Abschließender Run **37853899360** erfolgreich ausgeführt, Quellabdeckung **weiterhin unvollständig**: 9 von 10 einzeln nummerierten Fehlseiten erreicht, daraus **72 Quellpfade**, die im bislang privat zusammengeführten Teilbestand fehlten. Vier weitere Buchstaben B/K/P/S nur auf Seite 1 geprüft (insgesamt 32 Einträge), also **keine abgeschlossenen Segmente**. Die leere Seite X bleibt offen.
- Reine Formanalyse der 72 Einträge: 58 direkte `-in`-Paare, sieben abweichende weibliche Formen, vier identische Formen, drei neutrale Bezeichnungen. **0 neue Produktfreigaben**: Quellpfade sind nicht gleich lexikalische Basen; semantische, morphologische und Produktregressionen nicht abgeschlossen. Die zuvor **449 zurückgestellten** GENDERATOR-Kandidaten bleiben eigenständig unverändert.
- **Verbindliche Nutzerentscheidung:** Keine weiteren GENDERATOR-Web-/Browserabrufe und keine weiteren Wiederholungsversuche, auch nicht für die fünf verbliebenen Positionen. Privater Quellencheckpoint in `HyperCriSiS/Generic-Datastore` **PR #83**, Merge `7912f23f56a14bb9fd5ba54e187daac808743eff`. Private Rohdaten bleiben privat.
- Quellenarbeit nur noch unabhängig von GENDERATOR und ohne erneute Vollimporte fortsetzen. Die 82 älteren Hunspell-Deferrals sind bereits als `requiresFurtherEvidence` fachlich klassifiziert (nicht ungeprüft); eine Aufnahme ohne neue belastbare Evidenz ist ausgeschlossen. ESCO-v1.2.1-Download und KorAP-KWIC bleiben separate Zugangsgrenzen. Modernes Release-Gate #331 und Pale-Moon-Priorität bleiben unverändert.

## Store-Produktionsschutz – 09.10.2026

- PR **#342** / Squash-Merge `d0005f2239fc2466b8e2c04731a6d50ec2bf53a6`: Veröffentlichungsgate in `.github/workflows/store-publish.yml` eingebaut und vollständig durch PR-CI, Gecko, Chromium/Video, Performance und CodeQL geprüft.
- **Fail-Closed:** Für `mode: submit` prüft bereits `prepare` die Existenz und wirksame Konfiguration von `store-production`. Verpflichtend sind Required Reviewers, verhinderte Selbstfreigabe, deaktivierter Admin-Bypass und nur geschützte Branches. Fehlende/unlesbare GitHub-API-Informationen blockieren den Submit. Jeder Publisherjob prüft nach dem Environment-Approval vor Zugriff auf AMO- oder Google-Store-Credentials erneut.
- `scripts/verify-store-production-environment.mjs`, Negativ-/Positivregressionen in `tests/store-production-environment.test.ts` und Setup-Anleitung `docs/engineering/STORE-PRODUCTION-GATE.md` sind integriert. Reiner `validate`-Modus und Release-Preflight bleiben weiterhin ohne Store-Veröffentlichung nutzbar.
- **Issue #331 bleibt offen:** GitHub-Environment `store-production` wurde **nicht eingerichtet**; letzter aktueller API-Stand nur `copilot`. AMO-/Chrome-Store-Zugänge, Geheimnisse und OIDC-Konfiguration konnten mit den verfügbaren Rechten nicht überprüft werden. Für die echte Freigabe braucht es einen berechtigten Administrator, mindestens einen zweiten Reviewer sowie gesonderte Tag-/Ziel-Zustimmung. Keine Store-Aktion oder Release-Tag ausgelöst.
- ESCO v1.2.1 offiziell bestätigt als Übersetzungs-/Labelqualitätsupdate ohne neue Berufe; für den echten deutschen Versionsdelta-Abgleich weiterhin offizielle Delta-/CSV-Datei mit akzeptierter Datenschutzerklärung und Download-E-Mail erforderlich. Kein synthetischer Delta-Import. GENDERATOR-Abrufstopp bleibt bestehen, Pale Moon zuletzt.
## Nächste Arbeitseinheit

1. **Issue #331 durch einen berechtigten Administrator abschließen:** Das technische Fail-Closed-Gate ist in PR #342 integriert. Tatsächlich `store-production` mit Required Reviewer, Selbstfreigabeverbot, deaktiviertem Admin-Bypass und geschützten Branches einrichten; AMO-/Chrome-Store-Credentials und OIDC prüfen. Ohne Rechte keine Umgebung anlegen und keine Store-Einreichung behaupten.
2. Vor einem stabilen modernen Release die notwendige Versions-/Store-Entscheidung und manuelle Edge-/Opera-/Firefox-/Chrome-Einreichungschecks durchführen. Release-Preflight für `0.7.2` ist technisch grün, ersetzt aber weder Store-Annahme noch manuelle Browsertests; `store-publish.yml` nur nach gesonderter ausdrücklicher Tag-/Ziel-Freigabe im `submit`-Modus ausführen.
3. Keine Tag-/Store-Publikation in der autonomen CI-Vorbereitung; temporäre Preflight-Artefakte aus GitHub Actions sind keine öffentlichen Releases. ESCO-v1.2.1 und KorAP-KWIC nur bei tatsächlichem autorisierten Datenzugriff wieder aufnehmen.
4. Pale Moon einschließlich des bekannten Paritätsproblems erst nach den modernen Veröffentlichungen bearbeiten; alter PR #311 bleibt geschlossen.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst `docs/engineering/CURRENT-WORK.md` lesen.
- Danach aktuellen `main`-HEAD live verifizieren.
- Bei Quellenarbeit zusätzlich `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json` lesen.
- Git-Checkpoints haben Vorrang vor alten Chats und früheren „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
- Wegen des aktiven Default-Branch-Rulesets auch reine öffentliche Checkpoint-Dateien per PR aktualisieren; Produktcode, Tests, Workflows und fachliche Änderungen bleiben ebenfalls PR-pflichtig.

## Lexikonwelle 89 – 09.10.2026

- **PR #344 / Merge `feb8bda53081ac5ec4fbc157b521b5463021cbd5`:** 53 morphologisch geprüfte Personenbasen als exakte Mappings, getrennte Positiv-, Singular-, Paar-, Kasus- und Negativtests; keine generische Personenendungsregel.
- Vollständige PR-CI einschließlich Kernprüfung, Performance, Chromium/Video, Gecko, CodeQL und Sammelcheck erfolgreich. Nach-Merge-Status wird über CI-Run `37872549550` und CodeQL `37872549623` überprüft.
- Fachliche Herkunfts-/Kandidatenprüfungen bleiben privat in `HyperCriSiS/Generic-Datastore`. Keine Originalquellen und keine Herkunftsmetadaten in produktiven Lexikondateien.
- Weitere Lexikonarbeit nur als begrenzte, eigenständig geprüfte Kandidatenchargen; externe KorAP-Primärbelege erfordern weiterhin berechtigten Zugang. GENDERATOR-Abrufstopp bleibt bestehen. Moderne Browser-Releases vor Pale Moon.

## Lexikonwelle 90 – 09.10.2026

- **PR #346 / Merge `d7ea0d9565cc160417371d4455917a4971acc75c`:** 336 weitere exakt definierte Personenbasen: 222 unveränderte Plurale, 25 Plurale auf `-e`, 26 Plurale auf `-en`, 63 schwache Flexionen. Keine generische Suffixfreigabe.
- 336 positive Plural-, Singular-, Kasus- und Paarprüfungen sowie gezielte Negativtests; Kernprüfung, Performance, Chromium, Gecko, CodeQL und Sammelcheck auf PR #346 vollständig grün.
- Herkunfts- und Kandidatenbewertungen bleiben ausschließlich im privaten Datenbestand; Produktcode enthält nur freigegebene exakte Formen.
- Nachgelagerte `main`-CI gesondert überprüfen. Weitere Sonderfälle nur nach konkreter Flexionsprüfung integrieren. Moderne Releases weiter priorisieren.

## Lexikonwelle 91 – 09.10.2026

- **PR #348 / Merge `5592de5f3cac5a2085f62ba6053da78d3f466b17`:** 20 explizite, geprüfte Sonderflexionen mit positivem Plural-/Kasus-/Paartest und negativen Sicherheitstests integriert.
- Bereits vorhandene Ausschlussregressionen für `General:innen` (Wellen 13 und 81) bleiben unverändert; `General` wurde nach Regressionstreffer nicht freigegeben. `Stallknecht` bleibt ebenfalls für zusätzliche morphologisch-semantische Prüfung zurückgestellt.
- Vollständige PR-Pflichtprüfungen einschließlich Kernprüfung, Performance, Chromium, Gecko, CodeQL und Sammelcheck erfolgreich. Nach-Merge-`main`-CI separat prüfen.
- **Nächste Arbeitseinheit:** echte Textbeispiele und unabhängige Negativkorpora für Fehlkorrekturen prüfen. Die ESCO-Einzelwort-Abdeckung ist nicht mit einer allgemeinen Realtext-Erkennungs- oder Präzisionsquote gleichzusetzen.

## Begrenztes Realtext-Qualitätsgate – 09.10.2026

- **PR #350 / Merge `800ecce757c45be218a158b4f32df69566939195`:** `tests/realtext-quality-gate.test.ts` prüft die **gesamte Textpipeline** im aggressiven Profil, nicht nur eine einzelne Separatorregel.
- **39 kuratierte Proben:** 5 kurze, unabhängig beobachtete positive Weboberflächen und 2 negative; zusätzlich 14 konstruierte positive und 18 konstruierte negative Fälle. Positiv **19/19** mit genauem Zieltext, negative **20/20** ohne unerwünschte Änderung. Kein repräsentativer Precision-/Recall-Nachweis für beliebige Webseiten.
- `General:innen` und `Stallknecht:innen` bleiben unverändert; die ESCO-Einzelwort-Basenwellen enden bei **91**. Keine neue Produktregel oder allgemeine Personen-Suffixableitung.
- **Live-Web Chromium Run `37876881000`, Attempt 2** auf altem Produkt-HEAD `382bd3b8`: drei von drei Seiten erfolgreich (GitHub, taz, frühere Videoseite), keine JavaScript-/Promise-Fehler und keine nur durch die Erweiterung veränderten geschützten Bereiche. Der erste Versuch scheiterte bereits am lokalen Videogate mit 18 verworfenen Frames gegenüber 1 in der Baseline; unveränderter zweiter Lauf bestanden. GitHub lieferte 5 diagnostische Restmuster, taz und frühere Videoseite je 0. frühere Videoseite-`pre` veränderte sich sowohl in Baseline als auch mit Erweiterung. Gemessene Laufzeiten sind keine signifikante Performance-Aussage.
- **Nächster Schritt:** Post-Merge-main-CI/CodeQL für #350 bestätigen, dann Qualität unabhängig auf zusätzlichen realen Texten prüfen bzw. gezielte Auffälligkeiten nachverfolgen. Anschließend moderne Browser-Release-Gates (Issue #331); keine Tags, Store-Submissions oder Pale-Moon-Arbeit ohne ihre vorgesehenen Freigaben.

## Restmuster-Diagnose der Real-Web-Matrix – 09.10.2026

- **PR #352 / Squash-Merge `8297686dc3f8ff58e2216c74bf290c46fbc8cc11`:** Der manuelle `real-world.yml`-Workflow zeigt für verbliebene Marker zusätzlich Baseline-Anzahl, Differenz und maximal 12 kurze Tokenproben zu je höchstens 64 Zeichen. Diese Daten lagen bereits im ausführlichen Laufbericht vor, waren aber in der kompakten CI-Ausgabe nicht sichtbar. Keine Änderung der Ersetzungsregeln oder Sicherheitsgrenzen.
- **PR #352 vollständig grün:** Kernprüfung, Performance, Chromium/Video, Gecko, CodeQL und Sammelcheck. Post-Merge-`main`-CI noch separat prüfen.
- **Manueller Chromium-Live-Lauf `37878495919` auf PR-HEAD `b334f793`:** GitHub-Projektseite Baseline **8** Restmarker, Erweiterung **5**, Differenz **−3**. Wortproben `Nutzer:innen`, `Mitarbeiter*innen`, `Student*innen`; Status beider Modi erfolgreich, keine JavaScript-/Promise-Fehler, keine ausschließlich erweiterungsseitigen Änderungen geschützter Bereiche. Lokale Video-Regression erfolgreich.
- Die README enthält diese Marker als Markdown-Inline-Codebeispiele, die geschützt bleiben müssen. Die Zuordnung **jedes einzelnen** der fünf verbliebenen DOM-Vorkommen zu einem geschützten Textknoten ist damit noch nicht nachgewiesen. Keine neuen Lexikoneinträge aus Restmustern ableiten; keine allgemeine Web-Fehlerquote behaupten.
- **Nächste größere abgeschlossene Einheit:** bei Bedarf genaue DOM-Herkunft der fünf Restmarker anhand begrenzter Textknoten-Messung auf GitHub untersuchen; anschließend unabhängiges annotiertes Realtext-Sample für Fehlkorrekturen/Recall aufbauen und die modernen Release-Gates prüfen. Store-Environment #331 erfordert Admin-Rechte und gesonderte Freigaben. Keine Tag-/Store-Veröffentlichung oder Pale-Moon-Arbeit im Rahmen dieser Einheit.

## Geschützte DOM-Restmarker eindeutig klassifiziert – 09.10.2026

- **PR #354 / Squash-Merge `91922cdf491a3075573cdf036113d1c054fbae7b`:** Diagnose- und Regressionserweiterung ohne Änderung produktiver Regeln. Ein Live-Browser-Snapshot unterscheidet weiterhin den historischen `innerText`-Markerzähler, zählt aber zusätzlich einzelne sichtbare DOM-Textknoten und ordnet explizite Schutzbereiche (Code, Editoren, Ignore-Markierungen, ARIA und ausgeschlossene Rollen) separat zu.
- **Gezielter Chromium-Live-Run `37879935003` auf Diagnose-HEAD `c6254cbe`:** GitHub-README Baseline 8 Marker, mit Erweiterung 5; **sämtliche fünf verbliebenen DOM-Vorkommen lagen in `<code>`-Bereichen, null in anderen Textknoten**. Vorkommensproben: zweimal `Nutzer:innen`, zweimal `Mitarbeiter*innen` und einmal `Student*innen`. Keine JavaScript-/Promise-Fehler oder ausschließlich im Erweiterungslauf veränderte geschützte Selektoren; lokaler Video-Gate grün.
- Vor dem Produktmerge hat die zusätzliche Vitest-Grenzprüfung fehlerhafte ASCII-Wortgrenzen bei einem Unicode-Binnen-I-Marker aufgedeckt; in der **diagnostischen** Knotenroutine durch Unicode-Wortgrenzen korrigiert und Regression für vollständige Umlaute ergänzt. Bestehende Produktregeln und das bisherige `innerText`-Vergleichsmaß unverändert.
- **PR #354 vollständig grün:** Kernprüfung (9.700+ Tests), Performance, Chromium, Gecko/Firefox, CodeQL und Sammelcheck. Nach-Merge-`main`-CI separat bestätigen.
- Die fünf GitHub-Restmarker sind in dieser konkreten Live-Stichprobe **erwartete geschützte Beispiele, keine übersehenen Korrekturen**. Keine Repräsentativität für andere Webseiten, keine allgemeine False-Negative-/Precision-Quote. Keine Lexikonwelle, keine generische Suffixfreigabe, keine Rohdaten oder Quell-URLs im Produkt.
- **Fortsetzung:** unabhängig annotierte Positiv-/Negativ-Realtexte erweitern; anschließend moderne Browser-Releases vorbereiten. Store-Production-Environment/Review-Rechte (Issue #331) bleiben Admin-/Freigabeblocker. Keine Store-Einreichung, Tags oder Pale-Moon-Arbeit in dieser Einheit.

## ESCO 1.2.1 – erweiterter Mehrwort-Label-Audit und Lexikonwelle 92 (09.10.2026)

- **PR #356 / Merge `c91b761754319bd51337ffbce9f367219695ae78`:** 276 zusätzliche exakte Personenbasen in vier Flexionsklassen (215 unveränderte Plurale, 24 auf `-e`, 14 auf `-en`, 23 schwache Deklinationen) mit Positiv-, Singular-, Genitiv-, Plural-, Paar- und Negativregressionen. Zehn eigenständig formulierte Mehrwortsätze prüfen, dass der Satzkontext erhalten bleibt.
- Vollständige PR-CI einschließlich Kernprüfung, Performance, Chromium samt Video, Gecko, CodeQL und Gesamtcheck erfolgreich. Post-Merge-`main`-CI folgt getrennt.
- Das bereits vorliegende offizielle deutsche **ESCO-1.2.1-Classification-ZIP** (18 CSV-Dateien, 3.043 Berufe, 16.136 alternative Labelzeilen) wurde zusätzlich über bevorzugte **mehrteilige** Berufslabels und deren Alternativlabels untersucht: 375 mögliche bisher nicht aus direkten Paaren gewonnene Wortkopf-Kandidaten; 93 bereits wortwörtlich im geprüften Code-Snapshot, 276 ausdrücklich in Welle 92 aufgenommen, **6 bewusst zurückgestellt** (zwei auffällige Schreibweisen, `vormund` und drei numerische 3D-Komposita mit nicht unterstütztem Markerpfad). Vorherige Ausnahmen `General:innen` und `Stallknecht:innen` bleiben bestehen.
- Methodische Grenze: Wortkopf-Erkennung ist **keine** grammatisch vollständige Umformung beliebiger Berufsphrasen; 251 bevorzugte nichtslash-getrennte Bezeichnungen und komplexe andere Paarungsstrukturen können nicht ungeprüft als Gender-Marker-Regeln übernommen werden. Ein genauer historischer deutscher Wort-für-Wort-Versionsvergleich 1.2.0→1.2.1 wurde mangels vollständigem 1.2.0-Paket bzw. Delta-Datei nicht durchgeführt. Kein neuer Download dafür angefordert.
- Quellenrohtexte und detaillierter Quellenabgleich bleiben privat unter `HyperCriSiS/Generic-Datastore`. Keine neuen GENDERATOR-Abrufe. Weitere Quellen nur mit konkreter neuer Evidenz; anschließend moderne Browser-Releases. Store-Freigabe (Issue #331) weiterhin Admin-Aufgabe, Pale Moon zuletzt. Keine Tags oder Store-Einreichungen.

## Unabhängige Real-Web-Stichprobe – 09.10.2026

- **PR #358 / Merge `64825443e03d2482c65823f3e60986e11a10dbd0`:** 58 zusätzliche kurze, auf 14 öffentlich beobachteten Webseiten gezielt gesammelte Testoberflächen für die vollständige Textpipeline (aggressives Profil). 28 Positivfälle korrekt normalisiert, **4 reale Dativplural-Flexionslücken** mit unverfälschtem Soll-/Ist-Text, 24 unmarkierte Negativfälle unverändert und 2 als **beabsichtigte** `Studierende → Studenten`-Partizipumformungen getrennt bewertet. Kein neuer Produktregel-Eingriff.
- Die vier Dativfehler sind in **Issue #359** als konkrete Fälle zur grammatischen Kontextprüfung erfasst. Die bisherige Regel soll nicht durch pauschale `-n`-Anfügung verändert werden; neue oder geänderte Produktregeln benötigen eigene Negativ- und Satztests.
- Anfangs fielen die vier Zieltext-/Kasusfälle und zwei fälschlich als Negativproben klassifizierte Partizipfälle durch. Die abschließende Revision bewahrt die tatsächlichen Resultate in **verschiedenen Testkategorien**. Vollständige PR-Kern-, Gecko-, Chromium-, Performance-, CodeQL- und Sammelchecks grün. Ein Chromium-Testlauf war wegen nicht gefundener Erweiterungs-Serviceworker-Zielseite fehlgeschlagen und bestand bei unverändertem Wiederholungslauf; Sicherheitsgrenzen wurden nicht gelockert.
- **Keine repräsentative Webgenauigkeit:** zielgerichtete Stichprobe, mehrere Fundstellen vom selben Herausgeber; DOM-Schutz wird separat geprüft. Herkunfts-URLs und Abrufinformationen liegen nur im privaten Quellenbestand. Nach-Merge-`main`-CI separat prüfen.
- **Fortsetzung:** Issue #359 anhand Dativ-/Akkusativ-Kontext und Mehrwortsatzgrenzen sorgfältig bearbeiten; dann moderne Chromium-/Firefox-Releases vorbereiten. Store-Production-Issue #331 ist weiterhin eine administrative Freigabehürde. Keine Tags, Store-Einreichung oder Pale-Moon-Arbeit in dieser Einheit.

## Dativplural-Kontexte und substantivierte Partizipien – 09.10.2026

- **Produkt-PR #361 / Squash-Merge `351ed538697f56ae262a62206583acd427c7578b`:** Enge neue Regel `plural.marked-dative-context` vor den gewöhnlichen Pluralregeln. Sie ergänzt für bereits lexikalisch bekannte, sichtbar markierte Pluralpersonenformen nach eindeutig dativischen Signalen (`mit`, `bei`, `von`, `zu`, `aus`, `nach`, `seit` und `den`) ein grammatisch erforderliches Dativ-`n`, soweit der bekannte Plural nicht schon `-n` oder `-s` trägt. Eine koordinierte Zweiergruppe wird gezielt unterstützt. Die Regel ist der vorhandenen sichtbaren Plural-Einstellungsgruppe zugeordnet; keine generische Wortendungs- oder unmarkierte Personenregel.
- **Drei belegte Fehlkontexte behoben:** `mit erfahrenen Forscher*innen → mit erfahrenen Forschern`, `den Forscher*innen und Expert*innen → den Forschern und Experten`, `mit den Betreuer*innen → mit den Betreuern`. Die vierte Beobachtung `persönlichen Betreuer:innen` ohne ausreichenden linken Kasuskontext bleibt ausdrücklich als **offene grammatische Abweichung** in Test und **Issue #359**.
- Die unabhängige, gezielte 58er-Webprobe enthält auf diesem Stand **31 richtige positive Normalisierungen, 1 offene Dativlücke, 24 unveränderte Negativfälle und 2 gewünschte Partizipumformungen**. Keine repräsentative Webpräzision oder generelle Fehlerquote ableiten. Bestehende Singular-, Schutzbereichs- und `General:innen`-/`Stallknecht:innen`-Regressionen bewahren.
- Produkt-PR-Kernprüfung (10.000+ Tests), Performance, Gecko/Firefox, Chromium/Video und CodeQL nach korrigierter Regelreihenfolge vollständig grün. Nachgelagerte `main`-CI und CodeQL separat nachweisen.
- **Folgearbeit aus Nutzerentscheidung:** Issue **#362** für eindeutige substantivierte Partizipien außerhalb der bisherigen Anrede-/Alleinstellung (`die Studierenden`, `ein Studierender`, `eine Studierende`). Gewöhnliche attributive Adjektive (`studierende Kinder`) und mehrdeutige Kasusformen schützen. Eigene eng begrenzte Regel- und Negativtests, keine pauschale `-ende`-Ersetzung.
- Verbindliche Reihenfolge bleibt: sichere Sprachqualitätskorrekturen und moderne Browser-Release-Gates, Pale Moon zuletzt. Store-Environment **Issue #331** erfordert weiterhin Admin/Reviewer-Rechte; keine neue Release-/Tag-/Store-Aktion.

## Substantivierte Partizipien mit sicherem Satzkontext – 09.10.2026

- **Produkt-PR #364 / Merge `5b901107e454ed8f278dd22b43a7310d0964ffc1`:** Vorhandene 13 explizit lexikalisch freigegebene substantivierte Partizip-Personenbezeichnungen erhalten eng gefasste Singular-, Plural-, Genitiv- und Dativkontexte nach Determinierern. Beispiele: `die Studierenden → die Studenten`, `eine Studierende → eine Studentin`, `ein Studierender → ein Student`, `mit den Mitarbeitenden → mit den Mitarbeitern` und `die Dozierenden → die Dozenten`.
- **Schutzgrenzen:** attributive Partizipien wie `die studierenden Kinder` und `die forschenden Wissenschaftler` bleiben unangetastet, ebenso mehrdeutige Formen wie `der Studierenden` und `den Mitarbeitenden` ohne klare Dativpräposition. Keine generische `-ende`-Regel, keine zusätzlichen ungeprüften Wortstämme. Tests prüfen auch deaktivierte Regelgruppe, persönliche Ausnahmen, Großschreibung und die gesamte Pipeline.
- Die im gezielten Realweb-Korpus beobachtete `die Teilnehmenden` (Beleg n04a) wird jetzt **gewollt** als `die Teilnehmer` verarbeitet und verbleibt mit unveränderter Beleg-ID in der Probe. Die weiterhin 58 Kurzproben verteilen sich auf **31** korrekt normalisierte andere Positiva, **1** offene Dativlücke (Issue #359), **23** unverändert erhaltene Negativformen und **3** beabsichtigte Partizipnormalisierungen. Keine repräsentative Precision-/Recall-Aussage.
- Produkt-PR-Checks Kernprüfung, Performance, Chromium/Video, Gecko/Firefox und CodeQL vollständig grün. **Nachgelagerte `main`-CI und CodeQL getrennt bestätigen.** Öffentlicher Projektcheckpoint und privater Quellenstand aktualisieren. Issue #362 nach erfolgreicher Nach-Merge-Prüfung abschließen; Issue #359 bleibt partiell offen.
- Release-Reihenfolge weiterhin moderne Browser zuerst, Pale Moon zuletzt. Store-Production-Environment Issue #331 benötigt Admin-/Reviewer-Freigaben. Keine Tags oder Store-Einreichung in dieser Arbeitseinheit.

## Moderne Release-Vorabprüfung – 09.10.2026

- Aktueller `main`-Commit `2f6fa9b5d5fd19dffeb43739f5dfa23deee564a3` (Produkt-PR #364 enthalten): **nicht veröffentlichender Workflow `release-preflight.yml` erfolgreich**, Run [#37949645173](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/37949645173), inklusive Produkt-, Chromium-/Video-, Firefox- und Archivprüfungen. Fünf moderne ZIP/XPI-Archive und Prüfsummen im Actions-Artefakt `11625781348`, Ablauf 23.10.2026. Edge/Opera-Pakete technisch geprüft, **nicht** als echte Browser-Tests dargestellt.
- Paketstand `0.7.2`; letztes publiziertes modernes Release `v0.7.2-rc.12`. **Kein Release/Tag erstellt.** Aktives Ruleset `Main` schützt den Branch, aber `store-production` antwortet weiterhin mit **404**; Aktionen-Variablen/Secrets lassen sich mit den vorhandenen Rechten nicht prüfen (403). [Issue #331](https://github.com/HyperCriSiS/Sprachverstand/issues/331) um Befund ergänzt.
- **Details und nächste Freigaben:** `docs/engineering/MODERN-RELEASE-READINESS-20261009.md`. Vorerst Admin-/Reviewerfreigaben und Entscheidung über RC/stabile Version offen; keine Store-Einreichung, kein Pale Moon. Technisch grün bedeutet **nicht** zur Veröffentlichung freigegeben.

## Nachprüfung des aktuellen Release-Gates und Kasusgrenzen – 09.10.2026

- Nicht veröffentlichender moderner Release-Preflight [Run #37962396400](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/37962396400) auf `main`-Commit `28a8fbde517cfa33ad7f6496baeff6813800fee0` erfolgreich. Vollständiger Produktcheck, echter Chromium, Video/DOM-Untertitel, echter Firefox sowie fünf moderne Archive, Manifeste, Source-Provenienz und SHA-256 bestanden.
- CI-Artefakt `modern-release-preflight-28a8fbde517cfa33ad7f6496baeff6813800fee0`, ID `11632486391`, Größe 3.395.698 Byte, bis 23.10.2026 16:56 UTC. Nur internes Artefakt; kein Tag/Release/Store-Upload ausgelöst.
- Der verbleibende Realweb-Beleg `p13b` (`persönlichen Betreuer:innen`) ist als isolierte Oberfläche **kasusmehrdeutig**. Eine zwingende Dativform darf ohne linken Satzkontext nicht als sichere Autokorrektur gelten. Zwei Dativsatztests und drei Nicht-Dativ-/Fragmentregressionen sichern die Grenze; die originale 58er-Stichprobe bleibt erhalten. Bis zur CI-Prüfung keine abgeschlossene Issue-Freigabe behaupten.
- Extern blockiert bleiben das geschützte Environment `store-production`, berechtigte Reviewer und prüfbare Store-Zugänge (Issue #331). Keine Absenkung der Sicherheitsregeln. Moderne Releases vor Pale Moon.

## Issue #331 – vorbereitete Administrator-Selbstprüfung (09.10.2026)

- Live-Rollenabfrage: einziges Repository-Collaborator-Konto `HyperCriSiS` (admin). Für geschützte Store-Einreichungen ist ein eigener berechtigter Required Reviewer nötig. Das GitHub-Environment `store-production` und Store-Zugangsdaten sind weiterhin nicht als eingerichtet bestätigt; keine Änderungen an GitHub-Administrationsressourcen oder Store-Konten.
- Der bestehende Store-Workflow verwendet die öffentliche GitHub-REST-Umgebungsabfrage. Deren fein granulierte Mindestberechtigung ist `Actions: read`; die Workflow-Rechte wurden dafür explizit ergänzt, auch im Chrome-Job mit eigenem Rechteblock. `id-token: write` bleibt ausschließlich im Chrome-Job für kurzlebiges Google-OIDC.
- Ein separater ausschließlich manuell ausführbarer, nicht veröffentlichender Workflow `store-production-audit.yml` kontrolliert auf `main` mit dem vorhandenen fail-closed Prüfskript die GitHub-Environment-Schutzregeln. Er referenziert das Environment nicht als Job-Ziel, kann es somit nicht implizit ungeschützt anlegen und erhält keinerlei Store-Credentials.
- Testvertrag und ausführliche Admin-Einrichtungsanleitung zu Reviewern, AMO, Google Workload Identity sowie den zwei Environment-Secrets und fünf Variablen hinzugefügt. Die automatischen Tests/CI und der Merge dieses Deltas müssen eigenständig bestätigt werden. Keine Tag-/Release-/Store-Submission; Pale Moon bleibt zurückgestellt.

## Sicherheitspräzisierung zum zweiten Store-Reviewer (09.10.2026)

- Nach PR #369 wurde eine Berechtigungsgrenze der GitHub-Personenrepositories ergänzt: Eine Collaborator-Einladung an `HyperCriSiS/Sprachverstand` kann Schreibrechte gewähren. Zuerst im öffentlichen Repository die Person direkt als Required Reviewer zu wählen versuchen; falls das nicht möglich ist, nur bewusst einem vertrauenswürdigen Collaborator Zugriff geben oder eine eigenständig entschiedene Organisationsmigration erwägen.
- Die Anforderung an eine zweite unabhängige Deployment-Freigabe und das vorhandene fail-closed Produktgate bleiben unverändert. Keine Admin- oder Store-Aktion ausgelöst.

## Manuelle Store-Freigabe ohne zweiten Reviewer – 09.10.2026

- Nutzerpräferenz: Einzelentwickler `HyperCriSiS`, keine zweite Person zur GitHub-Freigabe, **kein automatischer Store-Upload bei Git-Tags**. `release.yml` behält die automatische GitHub-Release-Paketerstellung; `store-publish.yml` bleibt ausschließlich `workflow_dispatch`, mit `validate` als Standard und `submit` nur per exakter Tag-/Ziel-Phrase.
- Anpassung des Gate-Validators für `store-production`: keine Required-Reviewer-Regel, kein Admin-Bypass, ausschließlich geschützte Branches; Umgebung muss existieren und vollständig lesbar sein. Zusätzliche `submit`-Kontrolle bindet Auslöser und Wiederauslöser an den Repository-Eigentümer. Das unterscheidet ausdrückliche Eigentümerfreigabe von einer früheren nicht erforderlichen Vieraugenregel.
- Tests der positiven/negativen Environment-Regeln sowie des fehlenden `push`-Triggers bei Store-Publish ergänzt. Admin-Anleitung und read-only Audit aktualisiert. **Noch offen:** CI- und Merge-Bestätigung dieser Änderungen; tatsächliche Environment- und AMO-/Google-Einrichtung erfordert Adminzugriff. Kein Tag, Store-Submit oder GitHub-Release ausgelöst.

## Pre-Release-Audit 09.10.2026 – drei vollständig geprüfte Fix-PRs

- Ausgangs-Audit gegen `main` `94e6cb2`: zwei P1 (unmarkierte Feminina und Soft-Hyphen-Schutzverträge) sowie P2 für DOM-Bewegungen, Editor-/Shadow-Grenzen, Dativ-Mehrwortkontexte und Windows-Workflowpfade.
- **PR #372 / Merge `93535e0618520541f49eb316c5b527d436d8c2ab`:** Binnen-I ist in allen Kontextregeln nur mit tatsächlichem großem `In` wirksam; reguläre Feminina und zweiter Partizip-Durchlauf regressionsgesichert. Soft-Hyphen-Korrektur findet ausschließlich vor und innerhalb ungeschützter Originalsegmente statt; Ausnahmen und eigene Ersetzungsziele sind endgültig.
- **PR #373 / Merge `b26f837e984de7bddd5fd8d7f6f93ba113b5f50c`:** Bei innerhalb des Dokuments verschobenen Knoten bleiben Original, Zähler und Wiederherstellung erhalten. Case-insensitive `contenteditable`-Werte und ignorierte Shadow-Hosts geschützt; Workflowpfade plattformneutral verglichen.
- **PR #374 / Merge `51ac8cc1dbaac464a69bbf68e0a4123d7640d285`:** Dativ bei einfachen Inline-Grenzen und eindeutigen längeren Aufzählungen, Schutz uneindeutiger Artikel-/Plural-Mischformen, zwei belegte `/-in`-Einzeloberflächen und zwei exakte neue Personenbasen (**Welle 93**) integriert.
- Alle drei PRs inklusive Kernprüfung, Performance, Chromium samt Video, Firefox, CodeQL und Sammelcheck **grün**. Endgültiger gemeinsamer Produktcommit: `b26f837e984de7bddd5fd8d7f6f93ba113b5f50c`.
- **Nicht veröffentlichender moderner Preflight [Run #37975520305](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/37975520305) erfolgreich** auf diesem Commit: vollständige Produktprüfung, Chromium, Video/DOM-Untertitel, Firefox sowie fünf moderne Archive einschließlich SHA-/Paketprüfung. Internes Artefakt `11638965688`, Ablauf 23.10.2026 18:48 UTC. Echte Edge-/Opera- und Windows-Browserläufe sind damit nicht behauptet.
- Rest: Kasusfragment ohne eindeutigen Kontext (Issue #359), administrative Store-Konfiguration und explizite Veröffentlichungsfreigabe (Issue #331), eigenständige Release-/Versionsentscheidung. Keine Tags, GitHub-Releases, Store-Einreichungen oder Pale-Moon-Änderungen ausgeführt.

## Unabhängiger 0.7.2-Audit – technischer Fix-Checkpoint 09.10.2026

- Ausgangspunkt: unabhängiger Audit-Snapshot `439a3e8`, 29 Findings (8 P1, 20 P2, 1 P3), weiterhin Release-**NO-GO** bis vollständiger Wiederholungsprüfung.
- Nach vollständig erfolgreicher PR-CI inkl. Kernprüfung, Performance, Chromium-Video, Gecko und CodeQL bereits in `main`: #378 DOM-02, #379 DOM-13/05, #380 LANG-09, #381 S1, #382 LANG-02, #383 LANG-01/03, #384 S2, #386 DOM-04, #387 **nur** Videotest-MV3-Worker-Erkennung, #388 DOM-07, #389 DOM-01 **Teilkorrektur**, #390 DOM-08.
- **Neu:** #392 DOM-09 (geschützte Attribute unabhängig von Accessibility-Option beobachten; laufende Editor-/Ignore-/Hidden-Transitions und Originalrestore; DesignMode vor `beforeinput` restaurieren), Merge `9615b4ffde73367967974d1061ceea7319188722`, gesamte PR-CI grün.
- **Neu:** #394 DOM-03 (maximal 120 Zeichen nach rechts abhängige Inline-Regeln aus gespeichertem Original nach Prefixwechsel/Removal neu auswerten), Merge `6c030ead892a05876fa5661fc687a2a440965052`, gesamte PR-CI grün. Vorheriger gestapelter #393 hatte ebenfalls grüne CI, war aber nach Squash-Historie nicht mergefähig und wurde zugunsten #394 geschlossen.
- **Nächste abgeschlossene Einheit:** DOM-06 übergreifende Zitat-/Mehrwortausnahmen über Inline-Markup; dann DOM-10/11/12 und übrige Sprach-/DOM-Befunde. Dynamischer reiner DesignMode-Off-Wechsel ohne Event ist nicht vollständig abgedeckt. DOM-01 ist wegen unvollständigem generischem Inline-Run noch nicht umfassend abgeschlossen.
- **Offene Mess-/Release-Sperren:** REL-01 Video-Drop-/Frame-Grenzwerte unabhängig mehrfach nativ prüfen (Worker-Erkennung ist nur separater Flake-Fix); DOM-02 1k/4k/10k nativ gegen v0.7.1 nachmessen; danach S3/S4, übrige Befunde und vollständigen unabhängigen Audit erneut ausführen.
- Keine Tags, GitHub-Releases, Store-Einreichungen oder Pale-Moon-Änderungen.