# AI Session State

Stand: 2026-10-04  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `3fa06d4a1fcbda1b670738373cd2dc1e9dc1d922`
- Letzte Produktänderung: PR #289 „Lexikon: achtundsiebzigste Ausbauwelle aus Wikidata vorbereiten“
- Abgeschlossene Lexikon-Ausbauwellen: 78
- Welle 77 / PR #288 integriert 17 vollständig geprüfte ESCO-Exaktmappings; Merge-Commit `bdccc38b7f80ccf52259b73af3dbfe6bce665568`.
- Welle 78 / PR #289 integriert 155 vollständig geprüfte Wikidata-Exaktmappings; Merge-Commit `3fa06d4a1fcbda1b670738373cd2dc1e9dc1d922`.
- Bei der Übernahme von Welle 78 wurde die fehlerhafte feminine Form `virtuosein` vor dem Merge zu `virtuosin` korrigiert und die Regression entsprechend angepasst.
- PR #289 war vollständig grün: Kernprüfung, Performance, Gecko CI, Chromium CI, Sammelcheck, CodeQL, GitHub Advanced Security und beide Analyze-Jobs erfolgreich.
- Die anschließende `main`-CI #1039 war vollständig grün; insbesondere Kernprüfung, gesamte Testsuite, Performance, echter Firefox-Lauf, echter Chromium-Lauf und Videowiedergabe unter DOM-Last erfolgreich. Der separate CodeQL-Push-Lauf auf `main` war ebenfalls grün.
- Welle 75 / PR #286 integriert 51 Exact-Mappings aus Priority 21.
- Welle 76 / PR #287 integriert die fünf final angenommenen Priority-22-Exaktmappings: `eri-wart`, `eutonist`, `fennist`, `monitor`, `vermessinger`.
- `printer` und `xerograf` bleiben bewusst ausgeschlossen; der ursprüngliche Pool von 1.995 unbekannten KldB-Kandidaten ist vollständig fachlich entschieden und produktseitig abgearbeitet.
- Es gibt weiterhin keine generische Personen-Suffixregel.
- PR #261 bleibt als DOM-/Framework-Härtung in `main` integriert.
- Nachlauf-Härtung PR #281: Der Framework-Resilienztest wartet bei langsamen Runnern über wenige Event-Loop-Tasks auf den ersten messbaren Teilfortschritt, statt schon im ersten 4-ms-Task eine Ersetzung zu verlangen. Die Produktlogik blieb unverändert.
- Test-/Browser-Härtung PR #283 „Tests: Videowiedergabe unter DOM-Last absichern“ ist integriert; Produktlogik und Lexikonbestand blieben unverändert.

## Video-/Real-World-Härtung (PR #283)

- Der Video-Regressionslauf gehört zu den echten Chromium-Browser-Tests, nicht zum Benchmark-Job.
- Eine lokale 10-Sekunden-WebM-Fixture mit 30 fps wird ohne externes Netzwerk abgespielt.
- Während acht Sekunden Beobachtungszeit erzeugt die Fixture fortlaufend dynamische DOM-Textänderungen, damit Sprachverstand unter typischer MutationObserver-Last geprüft wird.
- Baseline und Erweiterung laufen in getrennten frischen Chromium-Sitzungen.
- Erfasst werden `requestVideoFrameCallback()`, `getVideoPlaybackQuality()`, P95-/Maximalabstand der Frames, Lücken über 120 ms, verworfene Frames und tatsächlicher Wiedergabefortschritt.
- Die Real-World-Matrix erfasst dieselben Video-Signale auf zugänglichen HTML5-Videos zusätzlich zu Long Tasks; externe Seiten bleiben wegen Netzwerk, Werbung, Consent und Plattformänderungen bewusst diagnostisch und nicht Required-CI-blockierend.
- `Yoga74/Techno` bildet den konkret gemeldeten Video-Ruckel-Fall ab; `YouTube Big Buck Bunny` ergänzt eine mutationsreiche lange Videoseite.
- Der frühere seitenbezogene Einzelworttest für Yoga74 wurde entfernt. `Technoliebhaber:innen` wird stattdessen repräsentativ im allgemeinen sicheren `Liebhaber`-Regeltest abgesichert.
- Merge-Commit: `3ba9d04f3eae9fd930e42d3a5bbd8ec83e7656a4`

## DOM-/Framework-Härtung (PR #261)

- Framework-Hydrierung: überlappende Mutation-Roots werden vor der Verarbeitung konsolidiert.
- Große dynamische Teilbäume werden mit einem Zeitbudget über mehrere Tasks verteilt.
- Eigene MutationObserver-Rückläufer werden unterdrückt; wiederholte externe Text-Rewrites erhalten einen kurzen Backoff.
- Entfernte Teilbäume und entfernte Elemente mit ausstehender Attributarbeit werden nicht weiterverarbeitet.
- Offene Shadow Roots werden beobachtet und verarbeitet; geschlossene Shadow Roots bleiben unangetastet.
- Regression `Technoliebhaber:innen` ist über die sichere `Liebhaber`-Pluralform abgedeckt.
- Deterministische Performance-Garantie: `overlapping-roots-1500` benötigt genau einen Root-Durchlauf statt zuvor 3.001.
- GitHub-Actions-Messung: Median dieses Hydrierungsfalls von 39,804 ms auf 20,457 ms reduziert (rund 49 %); absolute Zeitwerte dienen wegen Runner-Schwankungen nur der Beobachtung.
- PR-CI: Kernprüfung, Performance, Gecko CI, Chromium CI, Sammelcheck, GitHub Advanced Security, CodeQL sowie beide Analyze-Jobs grün.

## Abgeschlossene kldb-current-Blöcke

- `kldb-current-priority-1`: 20 angenommen, integriert bis Welle 55 / PR #243
- `kldb-current-priority-2`: 50 angenommen, Welle 56 / PR #247
- `kldb-current-priority-3`: 50 angenommen, Welle 57 / PR #249
- `kldb-current-priority-4`: 222 angenommen, Welle 58 / PR #252
- `kldb-current-priority-5`: 250 angenommen, Welle 59 / PR #254
- `kldb-current-priority-6`: 250 angenommen, Welle 60 / PR #256
- `kldb-current-priority-7`: 250 angenommen, Welle 61 / PR #258
- `kldb-current-priority-8`: 250 angenommen, Welle 62 / PR #260
- `kldb-current-priority-9`: 246 angenommen, Welle 63 / PR #264
- `kldb-current-priority-10`: 20 angenommen, Welle 64 / PR #266
- `kldb-current-priority-11`: 2 angenommen, Welle 65 / PR #269
- `kldb-current-priority-12`: 5 angenommen, Welle 66 / PR #271
- `kldb-current-priority-13`: 1 angenommen, Welle 67 / PR #273
- `kldb-current-priority-14`: 2 angenommen, Welle 68 / PR #275
- `kldb-current-priority-15`: 5 angenommen, Welle 69 / PR #277
- `kldb-current-priority-16`: 8 angenommen, Welle 70 / PR #279
- `kldb-current-priority-17`: 20 angenommen, Welle 71 / PR #280
- `kldb-current-priority-18`: 24 angenommen, Welle 72 / PR #282
- `kldb-current-priority-19`: 11 angenommen, Welle 73 / PR #284
- `kldb-current-priority-20`: 148 angenommen, Welle 74 / PR #285
- `kldb-current-priority-21`: 65 geprüft; 51 angenommen, 7 verworfen, 7 zunächst offen; Welle 75 / PR #286 integriert
- `kldb-current-priority-22`: letzte 7 geprüft; 5 angenommen, 2 verworfen, 0 offen; Welle 76 / PR #287 integriert

### Priority 22 im Detail

- 7 letzte Sonderfälle abschließend geprüft
- 5 angenommen: `eri-wart`, `eutonist`, `fennist`, `monitor`, `vermessinger`
- 2 verworfen: `printer`, `xerograf`
- 0 offen
- Flexionsklassen: `plural_e` (2), `weak_en` (2), `unchanged` (1)
- Welle 76 / PR #287 integriert; Merge-Commit `822924a40f7ffba91f51671a566bc02f64d61ac5`
- damit sind 1.995 von 1.995 ursprünglich unbekannten Kandidaten fachlich entschieden

### Priority 21 im Detail

- 65 Restkandidaten vollständig geprüft
- 51 angenommen: 48 reguläre `unchanged`-Formen und 3 schwach flektierte `-ist`-Formen (`computervisualist`, `modellist`, `tapisserist`)
- 7 verworfen: `commercialmanger`, `euromaster`, `geschirrviz`, `ingenier`, `liegerviz`, `oralchirug`, `reiher`
- 7 offen: `eri-wart`, `eutonist`, `fennist`, `monitor`, `printer`, `vermessinger`, `xerograf`
- Welle 75 / PR #286 integriert; Merge-Commit `0c0dd9ba29b4bcf2580b752b7cf4f52fc96407dd`
- keine generische Suffixregel

### Priority 20 im Detail

- 148 Kandidaten
- 148 angenommen
- 0 verworfen, 0 offen
- vollständig mit `language_model_first` semantisch und morphologisch geprüft
- Flexionsklasse: `unchanged` (148)
- Welle 74 / PR #285 integriert; Merge-Commit `2f1287eaeddf637377614a534506b65c0cacd270`
- PR-CI und anschließende `main`-CI vollständig grün

### Priority 19 im Detail

- 11 Kandidaten
- 11 angenommen
- 0 verworfen, 0 offen
- konkrete Wickler-Berufsbezeichnungen; Flexionsklasse `unchanged`
- Welle 73 / PR #284 integriert; Merge-Commit `fc7d3ac488b3f46f8262e227681548b5337edfbe`

### Priority 18 im Detail

- 24 Kandidaten
- 24 angenommen: `aluminiumspritzer`, `bandstanzer`, `bandwalzer`, `blechlocher`, `blechpresser`, `blechstanzer`, `blechwalzer`, `blechzieher`, `bodenlederstanzer`, `bolzenpresser`, `drahtwalzer`, `drahtwickler`, `drahtzieher`, `einlagenstanzer`, `eisenblechstanzer`, `eisendrahtzieher`, `federpresser`, `federwalzer`, `federwickler`, `feinblechwalzer`, `feindrahtzieher`, `feinstanzer`, `fertigwalzer`, `fleckstanzer`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch und morphologisch geprüft
- Flexionsklasse: `unchanged` (24)
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- generische Basen wie `presser`, `stanzer`, `walzer`, `wickler`, `zieher` und `spritzer` bleiben ausdrücklich ausgeschlossen
- Welle 72 enthält ausschließlich Exact-Mappings plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `05141f64706580d5fda6b5c4401b9aedad93be53`

### Priority 17 im Detail

- 20 Kandidaten
- 20 angenommen: `branntsteinbrenner`, `destillatbrenner`, `einzieher`, `hammerdrücker`, `handflämmer`, `kakaomahler`, `kernschwärzer`, `kondensmilchsieder`, `maschinendrücker`, `metalldrücker`, `metallschläger`, `metallätzer`, `senger`, `universaldrücker`, `webgeschirreinzieher`, `weißbeizer`, `zapfer`, `zinkdrücker`, `zinndrücker`, `ätzer`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch und morphologisch geprüft
- Flexionsklasse: `unchanged` (20)
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- generische Maschinen-/Sachklassen wie `-bohrer`, `-presser`, `-stanzer`, `-walzer`, `-wickler`, `-sortierer`, `-mischer` und `-kopierer` bleiben ausgeschlossen
- Welle 71 enthält ausschließlich Exact-Mappings plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `9b474e0c383caad84c282a871449acd65bc04477`

### Priority 16 im Detail

- 8 Kandidaten
- 8 angenommen: `branntweinbrenner`, `likörbrenner`, `schnapsbrenner`, `silberschläger`, `strichätzer`, `zementbrenner`, `ziegelbrenner`, `zigarrenroller`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch und morphologisch geprüft
- Flexionsklasse: `unchanged` (8)
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- generische Maschinen-/Sachklassen wie `-bohrer`, `-presser`, `-stanzer`, `-walzer`, `-wickler`, `-sortierer`, `-mischer` und `-kopierer` bleiben ausgeschlossen
- Welle 70 enthält ausschließlich Exact-Mappings plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `d3b1815866d22525284a6d6962173a85c9831731`

### Priority 15 im Detail

- 5 Kandidaten
- 5 angenommen: `logenschließer`, `mikrograf`, `perforatortaster`, `süßmoster`, `wertpapierabwickler`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch geprüft; ungewöhnliche historische Berufsbezeichnungen gezielt extern gegengeprüft
- Flexionsklassen:
  - `unchanged`: 4
  - `weak_en`: 1
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- Welle 69 enthält ausschließlich Exact-Mappings plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `2ddd18fa5e4320f44b8113c37a2fb29fe3df8f1b`

### Priority 14 im Detail

- 2 Kandidaten
- 2 angenommen: `kettler`, `moster`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch geprüft; seltene historische Berufsbezeichnungen gezielt extern gegengeprüft
- Flexionsklasse: `unchanged` (2)
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- Welle 68 enthält ausschließlich Exact-Mappings plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `2576168e0befa809b8bf7e3e52643a52f8285a0f`

### Priority 13 im Detail

- 1 Kandidat
- 1 angenommen: `archäometer`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch geprüft; seltene Fachbezeichnung gezielt extern gegengeprüft
- Flexionsklasse: `unchanged` (1)
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- Welle 67 enthält ausschließlich ein Exact-Mapping plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `f50e7f61a5153f18bd42c55e63f082641c889881`

### Priority 12 im Detail

- 5 Kandidaten
- 5 angenommen: `choralmagister`, `countertenor`, `generalkonsul`, `jollen-instructor`, `profiler`
- 0 verworfen
- 0 offen
- vollständig mit `language_model_first` semantisch geprüft; bei vier ungewöhnlichen Flexionen gezielte externe Gegenprüfung
- Flexionsklassen:
  - `unchanged`: 2
  - `plural_en`: 1
  - `plural_n`: 1
  - `umlaut_plural_e`: 1
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- Welle 66 enthält ausschließlich Exact-Mappings plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `3af2988677736e44c5585c957c84d96cd9371aef`

### Priority 11 im Detail

- 2 Kandidaten
- 2 angenommen: `registrar`, `substitut`
- 0 verworfen
- 0 offen
- 0 externe Recherchefälle
- vollständig mit `language_model_first` geprüft
- Flexionsklasse: `plural_e` (2)
- die neun separat zurückgestellten Grenzfälle bleiben unverändert offen
- Welle 65 enthält ausschließlich Exact-Allow-List plus Positiv-, Negativ-, Paar- und Kasusregressionen
- Merge-Commit: `fa11c7dd49dd35af02b4c4303dcd1ce2b5303b42`

### Priority 10 im Detail

- 20 Kandidaten
- 20 angenommen
- 0 verworfen
- 0 offen
- 0 externe Recherchefälle
- vollständig mit `language_model_first` geprüft
- Flexionsklassen:
  - `unchanged`: 18
  - `plural_e`: 2
- bewusst kleine Einzelfallwelle; kein künstliches Auffüllen
- bekannte Priority-6-Grenzfälle und mehrdeutige Geräte-/Sachklassen bleiben ausgeschlossen
- Welle 64 enthält eine Exact-Allow-List plus Positiv-, Negativ-, Paar-, Kasus- und Bindestrichregressionen
- Merge-Commit: `2f69a81991ce0c126878efe0f2ec553e35dbd3eb`

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Wikidata-Occupations-Ausbau

- Priority 1: 155 Kandidaten, 155 angenommen, 0 verworfen, 0 offen; vollständig als Exact-Mappings in Welle 78 / PR #289 integriert.
- Priority 2: 195 Kandidaten, 189 angenommen, 6 verworfen, 0 offen; Ziel ist Welle 79.
- Verworfene Priority-2-Kandidaten: `der`, `fachmänn`, `kanoniss`, `militant`, `tertiar`, `vorsitzender`.
- Alle 189 angenommenen Priority-2-Einträge sind mit `confidence: high` geprüft.
- Die Flexionsklassen umfassen reguläre unveränderte Formen sowie explizite Sonderklassen wie `weak_e`, `weak_en`, `plural_e`, `plural_en`, `plural_s`, `gehilf`, `koech`, `baeuer`, `umlaut_plural_e` und einzelne Sonderformen.
- Auch für Welle 79 gilt: ausschließlich exakte Mappings; keine generische Suffixregel.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung**.
- Standard ist `language_model_first`: eindeutige Formen werden intern semantisch und morphologisch geprüft.
- Quellenherkunft und lokale Paarinformationen dürfen Hinweise liefern, haben aber kein Freigabegewicht.
- Externe Recherche wird nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Produktseitige Sicherheitsgrenzen bleiben exakte Allow-Lists bzw. Mappings, Positiv-/Negativregressionen und vollständige CI.
- Ein Batch darf keine generische Suffixfreigabe implizieren.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-18-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-18-manual-decisions.json`
4. `sprachverstand/sources/registry.json`

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Entschieden sind inzwischen **1.995 von 1.995** ursprünglich unbekannten Kandidaten. Es gibt **keine offenen Kandidaten mehr**.

Priority 19 und 20 haben 159 weitere sichere Exact-Mappings integriert. Priority 21 hat den kompletten verbleibenden 65er-Pool geprüft: 51 angenommen, 7 verworfen und 7 offen.

Priority 22 hat die letzten sieben Sonderfälle abgeschlossen: 5 angenommen (`eri-wart`, `eutonist`, `fennist`, `monitor`, `vermessinger`) und 2 verworfen (`printer`, `xerograf`).

## Nächste Arbeitseinheit

1. Welle 79 aus `wikidata-occupations-priority-2` auf einer frischen Basis des aktuellen `main` aufbauen.
2. Die 189 angenommenen Exact-Mappings vollständig übernehmen und die sechs verworfenen Kandidaten mit Negativregressionen abgesichert außerhalb des Produktlexikons halten.
3. Positiv-, Paar-, Kasus- und repräsentative Pluralregressionen ergänzen; Sonderflexionen explizit testen.
4. PR-CI vollständig abwarten und erst bei grünem Stand mergen.
5. Anschließend `main`-CI prüfen und den Checkpoint auf Welle 79 aktualisieren.
6. Keine breite Suffixfreigabe hinzufügen.


## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
- Reine Checkpoint-/Wiederaufnahmedateien wie `docs/AI_SESSION_STATE.md` werden direkt auf `main` aktualisiert; dafür keine eigenen PRs erzeugen. Produktcode, Tests, Workflows und fachliche Änderungen bleiben PR-pflichtig.