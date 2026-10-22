# Aktueller Arbeitsstand

Stand: 2026-10-22  
Autorität: `main`

> **Nur aktiver Übergabe-Checkpoint.** Der [vollständige bisherige Stand](archive/CURRENT-WORK-SNAPSHOT-20261009.md) ist unverändert archiviert. Das Archiv **nicht routinemäßig lesen**: frühere „Nächste Schritte“, Store-Vorgaben und CI-Stände können überholt sein. Bei Widersprüchen neuere nachgewiesene Entscheidungen bevorzugen.

## DOM-/Videoperformance (#419)

- **18.10.2026:** Die Produktänderungen aus Draft-PR #451 und dem gestapelten Codex-Strang `X/*` (Spitze `ca482fc`) sind in [PR #457](https://github.com/HyperCriSiS/Sprachverstand/pull/457) zusammengeführt: Regeln/Lexikon im lokalen Hintergrund, Kandidatenfilter, Zeitbudgets, Warteschlangencursor, kooperative Wiederherstellung. Unabhängige Nachmessung: Regelverarbeitung auf neutralem Text ~10× schneller bei byte-identischen Ergebnissen; Content-Script 340 → 97 KB. Ergänzt: Stopp bei verwaistem Content-Script nach Erweiterungsupdate und eine Video-Prüfung über den Median aus drei abwechselnden Paaren (Drops erst nach der Startphase, Grenzwerte unverändert). Details, Einordnung und Archivverweise: [PERFORMANCE-419-INTEGRATION-20261018.md](PERFORMANCE-419-INTEGRATION-20261018.md).
- **Einordnung der Restbefunde:** frühe 150–250-ms-Videolücke (Windows-Shaderkompilierung), periodische Drops (Taktabweichung), Linux-Navigationstimeouts (Start-I/O) und V8-Wartezeiten sind jeweils **ohne Erweiterung reproduziert** und gelten nicht als Produktfehler. Keine weitere Ursachensuche in Browser- oder Kernel-Interna.
- **Codex arbeitet nicht mehr an diesem Strang** (Nutzerentscheidung 18.10.2026). Die `X/*`-Branches sind Archiv.
- **Nächste Schritte:** Abnahme auf echter Hardware (Chrome, Firefox, Android) mit normalen Seiten, Video und Untertiteln; danach #419-Entscheidung. Später: `src/core/dom-processor.ts` modularisieren.
- Frühere Chronologie bis 11.10.: [archive/CURRENT-WORK-419-BIS-20261011.md](archive/CURRENT-WORK-419-BIS-20261011.md).

## Webanalyse deep10000 (21.–22.10.2026)

- Grundlage: Codex-Kampagne `deep10000-20261019` (Branch `origin/X/diagnostic-runner-loadtest-20261019`, 119.535 eindeutige Kontexte, Produktbasis `6b135fc` = #462). Codex-Daten nur als Eingabe; jeder Befund gegen `main` nachgeprüft.
- **Gemergt:** #476 Dativ nach großgeschriebenem Begleitwort/Mengennomen, #477 markierter Singular nach Präposition und `zur`, #478 kurze Begleitwortpaare (`einem/r`, `des/r`), #479 Singularschutz und Genitiv-/Dativ-`der` (`Projekt der Künstler*in` → „des Künstlers“), #480 zweite Lexikontranche (1.249 geprüfte Stämme) plus neue Regelgruppe **Englische Lehnwörter** (`lexicon.loanwords`, Standard an, Settings-Revision 11), #481 **Changelog-Fragmente** (`changes/unreleased/*.md`, `npm run changelog:check`/`changelog:collect`), #482 `Stamm-/innen` und Kurzformpaare (`vom:von der`), #483 Dateinamen/URLs ohne Schema geschützt, #484 Binnenmajuskeln erhalten (`AfDler`), #485 Schrägstrich-/Koordinationspaare nicht halb, #486 `data-testid="image-caption"` ist kein Untertitel (bechtle.com-Initialscan), #487 markierte Partizipien (`Mitarbeitende:r` → „Mitarbeiter“), Adjektiv-Komposita, `der/die` vor femininem Substantiv. #488 als überholt geschlossen.
- **Danach gemergt (22.10.):**
  - #489 Koordination nach Präposition.
  - #491 Popup-Domainschaltfläche zweizeilig.
  - #492 Genitiv-`der` beim Binnen-I.
  - #498 Optionstext nur mit eigenem `value`.
  - #499 Codex-Gegenprüfung (Satzanfangsverb, Relativpronomen, Dativverb, Inline-Singular).
  - **#500 Schutzfälle aufgelöst.** Kasus aus dem Satzbau (`src/rules/clause-case.ts`), Begleitwortpaare/Kurzformen (`src/rules/determiner-pairs.ts`), keine Schutzprüfung über Satzgrenzen, Titel/Aufzählungen, Komposita nach dem Marker, -er-Plurale ohne Lexikoneintrag. Zielliste: `tests/open-protection-cases.test.ts`.
  - **#501 Begleitwort im vorangehenden Textknoten.** `Das Projekt der <em>Künstler*in</em>` → „des Künstlers“. Umgesetzt über `src/core/leading-context-edit.ts`; der DomProcessor ändert den direkt vorangehenden Inline-Text mit und stellt ihn wieder her.
- **Nutzerentscheidung 22.10.2026:** Gegendert ist gegendert, auch wenn erkennbar eine Frau gemeint ist (`Die südafrikanische Fotograf:in …` → „Der südafrikanische Fotograf …“). Eigenkreationen/Gruppennamen werden wie Personenbezeichnungen entgendert (`InteGREATer:innen`, `RosaLila PantherInnen`). Geschützt bleibt nur, was wirklich mehrdeutig ist oder sprachlichen Unsinn ergäbe.
- **Restliste Codex (deep10000):**
  - bewusst geschützt: 140 von 291 umgewandelt;
  - Regel/Grammatik: 206 von 244 umgewandelt;
  - der Rest sind überwiegend technische Bezeichner und Textfragmente sowie gut 70 Einzelfälle.
- **Bekannte offene Punkte (vorbestehend):**
  - `eine Medizinpädagoge/-in` → „eine Medizinpädagoge“: ausgeschriebene männliche Form plus Kompositum nach mehrdeutigem Begleitwort.
  - Relativpronomen in einem eigenen Textknoten nach dem Inline-Element wird nicht angeglichen (`des <em>Künstlers</em>, die …`).
  - Begleitwort in geschütztem `<code>` wird beim Kontext übersprungen.
- **Bewusst unverändert:** echt mehrdeutige Fälle (`Das Kind mag die Lehrer*in`, `ihre Familie oder Partner*in`), Metasprache (`die Endsilbe -ant:in`), Ausgangsfehler der Seiten, unmarkierte Feminina.
- **Nächste Schritte:**
  - Performance-Bericht von Codex (`artifacts/performance-audit-20261022/BEFUNDE.md`) umsetzen: zuerst den Kandidatenfilter bei eigenen Ersetzungen (unabhängig, echter Mehraufwand), dann den Singular-Vorfilter (nur gegen den neuen `main`-Stand neu messen; positive Fälle dürfen nicht langsamer werden), danach vorbereitete persönliche Listen.
  - Danach die Kampagne erneut gegen `main` laufen lassen.
  - Changelog-Einträge nur als Fragment.

## Pale Moon (22.10.2026)

- `palemoon` ist mit #494 auf Main-Parität. Der CI-Schritt „Gemeinsame Produktfunktionen … mit main abgleichen“ verlangt identische Pfade `src/core`, `src/rules`, `src/settings` usw. Nach jedem `main`-Merge, der diese Pfade ändert, den Sync nachziehen.
- Der Sync enthält:
  - `maxVersion 35.*` (CI erlaubt nur `<major>.*`);
  - Pale Moon 35.0.2;
  - #497: Regeln und Lexikon einmal pro Fenster statt pro Seite;
  - den Stand bis #501.
- Xrays bleiben aktiv (Nutzerentscheidung). Der Optionstext wird nur mit eigenem `value` umgewandelt.
- Messung (Median aus 5) vor → nach #497:

  | Seite | Laufzeit | Längste Lücke |
  |---|---|---|
  | 1.000 Absätze | 2,9 s → 3,5 s | 312 → 69 ms |
  | 4.000 Absätze | 15,6 s → 21,0 s | 375 → 139 ms |
  | bechtle | 1,5 s → 1,8 s | 410 → 111 ms |

  Die Seite bleibt also deutlich flüssiger, braucht insgesamt aber etwas länger.
- Lokale Browser für Live-Prüfungen: `artifacts/local-tools` (Einrichtungsskript aus #493/#495, inklusive Pale Moon 35.0.2).

## Sprache und DOM-Abdeckung (18.10.2026)

- **#458** (`c0e13d85`): geprüfte Berufsformen aus #454–#456 (ß-Schreibweisen, 190 Singularpaare, 13 abweichende Stämme) plus Dativ nach Begleitwörtern auf -en (`unseren Lehrer*innen` → „Lehrern“). Einzel-PRs geschlossen.
- **#459** (`dac991b4`): **DOM-01 geschlossen.** Über Inline-Elemente getrennte Formen (`Lehrer<em>:innen</em>`, `<a>Lehrer</a>:innen`, `Mitarbeiter<b>Innen</b>`) werden erkannt; geändert wird nur der Markerteil, Umlautwechsel und dreigeteilte Formen bleiben bewusst unverändert. Dativauslöser im vorangehenden Element (`Mit <em>allen</em> Lehrer*innen`) wird erkannt.
- **#460:** substantivierte Adjektive im markierten Plural (`die Angestellt:innen` → „die Angestellten“, `viele Angestellt:innen` → „viele Angestellte“, ohne eindeutigen Anker unverändert) sowie `Azubi:innen`, `Fan:innen`, `Flüchtling:innen`.
- **#359** bleibt bewusst offen bzw. abgeschlossen als Kasusmehrdeutigkeit: `persönlichen Betreuer:innen` ohne linken Kontext wird nicht erzwungen; mit Kontext (`mit ihren persönlichen …`) korrekt.
- Stichprobe 945 Formen (135 gängige Personenbezeichnungen × 7 Schreibweisen): nach diesen Änderungen werden alle realistisch gebräuchlichen Formen umgewandelt; verbleibende Treffer sind konstruierte bzw. ungebräuchliche Formen (`Hebamm:innen`, `Opfer:innen`, `Studierend:innen`).

## Unabhängiger 0.7.2-Audit: aktueller Korrekturstand

- Auditsnapshot `439a3e8`: 29 Befunde (8 P1, 20 P2, 1 P3), **weiterhin NO-GO** bis zur neuen unabhängigen Abnahme.
- **Gemergt und gesamte PR-CI grün:** #378 DOM-02, #379 DOM-13/05, #380 LANG-09, #381 S1, #382 LANG-02, #383 LANG-01/03, #384 S2, #386 DOM-04, #387 Worker-Discovery-Flake, #388 DOM-07, #389 DOM-01 (Teilkorrektur), #390 DOM-08, **#392 DOM-09** (`9615b4ff`) und **#394 DOM-03** (`6c030ead`). #393 wurde nach Squash-Merge-Konflikt durch #394 ersetzt; die letztgenannte PR-CI war vollständig grün. Aktuellen `main`-HEAD bei Wiederaufnahme live prüfen.
- **Neu integriert, gesamte PR-CI grün:** **#416 Range-Schnellpfad** (Merge `7ae34eee`, einzelner zusammenhängender Token-Edit ohne geänderten Leerraum über lokales `Text.replaceData` statt vollständiger Tokenzerlegung; mehrteilige Änderungen behalten den bisherigen Rückwärtsalgorithmus; neue DOM-Ranges-/NBSP-/Restore-Tests, vollständige PR- und Post-Merge-main-CI `38010825035` grün). **#415 natives Funktionsprofil** (Merge `aef8584d`; Profil-Run `38010272966` Chromium/Firefox erfolgreich), **#417 direkter A/B-Vergleich** (Merge `e53f3ced`, vollständige PR- und Post-Merge-main-CI `38011085250` grün). Zuvor #413/#412 native DOM-02-Referenzmessung, #410 JSDOM und #408/#407 Schutzkorrekturen. Keine Änderung an produktiven Sprachregeln oder Lexikon.
- **Reale Nutzung vs. Stress – nachgemessen (10.10.2026):** **#420** externe Referenzseite #11 durch Video.js ersetzt (Merge `75e65a32`); öffentliche Medienquelle im Linux-CI-Runner nicht dekodiert, ausdrücklich `videoMeasured=no`, kein Videofreigabenachweis. **#421** alle verbliebenen Verweise auf die frühere externe Videoseite aus aktuellen Statusdateien, altem Snapshot, Test und Matrix entfernt (Merge `83738d32`), aktuelle Code-/Dokumentdateien direkt geprüft. Git-Historie und alte CI-Artefakte bewusst nicht umgeschrieben. **#422** echtes Chromium-/Firefox-Mischlastprofil (Merge `b9071932`), 200/1.000/4.000 Knoten, exakt 2 % synthetische Ersetzungen, geschützte Eingaben/Code; bestehendes 100-%-Stressprofil erhalten. **#423** Zeitauflösungsfix durch zehn Scans je Probe (Merge `30600910`), ganze PR-CI und nativer A/B-Lauf [38016504599](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38016504599) grün. Mediane aktuell 200/1k/4k: Chromium **0,95/4,42/17,42 ms**, Firefox **1,30/5,70/22,20 ms**; im selben Lauf Vorversion 0,99/4,56/18,01 bzw. 1,40/5,60/21,80 ms. 2 % ist **keine** belegte reale Häufigkeit; der reine synchrone Initialscan ist keine vollständige Erweiterungs- oder Videomessung. Testklassen erklärt unter `docs/engineering/PERFORMANCE-TEST-PROFILES.md`. Issue **#419**: der inkrementelle Initialscan und die begrenzte Untertitelarbeit sind mit #425/#426 als Teilfix integriert; reale Interaktionen und echte 30/60-FPS-Videoabnahme bleiben **Release-NO-GO**.\n- **Nächste begrenzte Einheit:** **DOM-02 gezielt optimiert, aber nicht insgesamt geschlossen.** Funktionsprofil auf 10k/14 Samples zeigte neue Eigenzeiten in `replaceTextKeepingRanges` (Chromium 174,7 ms, Firefox 170 ms) und zusätzliche `transformValue`-Kosten (aktuell Chromium 164,9/Ff 165 ms, historisch 81,5/89 ms); Profil-Wrapper verzerren absolute Zeiten. Zwei **direkte, nicht instrumentierte** native A/B-Läufe jeweils auf denselben 0.7.2-Commits `aef8584d` vor vs. `e53f3ced` nach #416, je 1k/4k/10k in identischen Browserjobs, 2 Blöcke × 7 Samples plus Warmups: [Run 38011092311](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38011092311) Chromium-Faktoren **0,717/0,815/0,852×**, Firefox **0,750/0,813/0,810×**; [Run 38011180540](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38011180540) Chromium **0,817/0,831/0,851×**, Firefox **0,778/0,912/0,929×**. Faktoren unter 1 = schneller. Alle vier Browserjobs und Ersetzungsverträge erfolgreich; keine allgemeine Webseiten-/Video-Performancefreigabe. Weiterer Gesamtabgleich gegen historischen Tag `v0.7.1` (der Paket-/Manifestversion **0.6.6** enthält), Funktionsumfang und nicht vollständig profilierte Transformationskosten bleiben offen. **Danach:** LANG/TEST-01 (DOM-01 mit #459 erledigt), REL-01 wiederholte native Video/Frame-Prüfungen, S3/S4 und unabhängigen Reaudit abschließen. Release weiterhin **NO-GO**.
- **Später gesondert:** Security- und Releasegates S3/S4 sowie vollständige unabhängige Revalidierung. Keine Releases, Tags oder Store-Einreichungen ohne ausdrückliche Freigabe.

## Zuletzt verifizierte Produktbaseline

- Repository `HyperCriSiS/Sprachverstand`. Für jede neue Arbeit den **aktuellen `main`-HEAD live** bestimmen; kein hier genannter Commit ersetzt diese Abfrage.
- Letzter integrierter `main`-HEAD vor diesem Checkpoint: `28d9b86eef069511de14189a3d400374b5ea7049` (#501), davor #500 `d9034d2`, #499 `38d3ed9`, #496 `412986f` (DOM-Kern ohne Kinderlisten pro Knoten). `palemoon`: `6a1a531` (#494). Vor Wiederaufnahme HEAD live prüfen.
- Produktversion `0.7.2`, 93 integrierte Lexikonwellen (zuletzt PR **#374**); zuletzt dokumentierte öffentliche moderne Prerelease `v0.7.2-rc.12`. **Kein neuer Release-Tag oder Store-Submit** durch die Vorbereitung.
- PR-CI für #372–#374 grün: Kernprüfungen, Performance, Chromium/Video, Gecko/Firefox, CodeQL und Sammelcheck.
- **Nicht veröffentlichender** Gesamt-Preflight [Run #37975520305](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/37975520305) auf Produktstand `b26f837` vollständig erfolgreich: fünf moderne Releasepakete und SHA-Prüfungen. Artefakt `11638965688` läuft am **23.10.2026, 18:48 UTC** ab. „Technisch grün“ bedeutet nicht „veröffentlicht“ oder „Store-freigegeben“.

## Aktive Aufgaben und Blocker

1. **Moderne Releases vorbereiten:** Gegen den aktuellen `main` prüfen; verbleibende **native Windows-, Edge- und Opera-Prüfungen** sowie manuelle Browser-/Store-Checks durchführen. Geprüfte Chromium-/Firefox-CI und erzeugte Edge-/Opera-Pakete ersetzen keine echten nativen Browserprüfungen. Details: `docs/engineering/MODERN-RELEASE-READINESS-20261009.md`, `RELEASE-PREFLIGHT.md`.
2. **Store-Environment / Issue #331:** `store-production`, AMO-/Chrome-Web-Store-Credentials und OIDC sind zuletzt **nicht als konfiguriert bzw. geprüft bestätigt**. Einrichtung und Rechteprüfung durch berechtigten Eigentümer; kein Store-Submit ohne diese Voraussetzungen.
3. **Explizite Veröffentlichungsentscheidung:** Nutzer entscheidet über RC/stabile Version, Tag und Store-Ziele gesondert. Tags dürfen GitHub-Releasepakete erzeugen, aber **niemals automatisch Store-Submissions**. `store-publish.yml` nur **manuell** mit `mode: submit`, Tag, Ziel und Bestätigungsphrase; Eigentümeridentität einschließlich Reruns prüfen. Neueste Nutzerentscheidung: **kein zweiter Required Reviewer**; geschützter Branch, deaktivierter Admin-Bypass und fail-closed bleiben erforderlich. Ältere Hinweise auf einen verpflichtenden zweiten Reviewer sind überholt; tatsächlichen Workflow und `STORE-PRODUCTION-GATE.md` vor Umsetzung abgleichen.
4. **Sprache / Issue #359:** isolierte mehrdeutige Dativform `persönlichen Betreuer:innen` bleibt bewusst unverändert (Kasusmehrdeutigkeit); keine unsichere pauschale Dativ-`n`-Anfügung. Nur präzise Korrekturen mit Positiv-, Negativ- und Satztests. Gezielte Real-Web-Stichproben nicht als repräsentative Precision-/Recall-Messung darstellen.
5. **Pale Moon:** Main-Parität ist hergestellt (siehe Abschnitt Pale Moon). Eine Veröffentlichung folgt weiterhin erst nach den modernen Browsern und nur mit ausdrücklicher Freigabe.

## Dauerhafte Qualitäts- und Quellengrenzen

- `language_model_first`; Quellen sind Kandidaten, keine automatische Produktfreigabe. Nur eigenständig geprüfte Exact-Mappings oder eng begrenzte Regeln; Positiv-/Negativ-, Paar-, Plural-/Kasus-, Satz- und relevante Browserregressionen wahren. **Keine generischen Personen-Suffixregeln oder pauschalen `-ende`-Regeln.** Einzige Ausnahme (Nutzerentscheidung 22.10.2026): markierte Plurale auf `-er` ohne Lexikoneintrag (`Widerstandkämpfer:innen` → „Widerstandkämpfer“), weil ihr Plural gleich dem Singular ist. Ausgenommen sind `-ier` sowie substantivierte Adjektive und Partizipien. Ist die Regelgruppe „Englische Lehnwörter“ aus, bleiben deren Wörter unverändert.
- Geschützte DOM-Bereiche (Code, Editoren/Formulare, Shadow DOM, weitere Ausschlüsse) und Video-/Untertitelverhalten nicht beeinträchtigen. Historische Ausschlüsse wie `General:innen` und `Stallknecht:innen` sowie attributive/mehrdeutige Partizipien wahren.
- **GENDERATOR: keine weiteren Web-/Browserabrufe und keine neuen Vollimports.** 142 geprüfte Basen integriert; 449 frühere Kandidaten zurückgestellt. 72 später gefundene zusätzliche Quellpfade sind keine automatisch freigegebenen Produktkandidaten.
- Bereits geprüfte Wikipedia-, Scribbr-, Hunspell- und ESCO-Quellen nicht blind neu abarbeiten. ESCO-1.2.0→1.2.1-Deltavergleich und echte KorAP-KWIC-Belege nur mit verfügbarem, autorisiertem Zugang; keine erfundene Vollständigkeit oder repräsentative Web-/Korpusgenauigkeit.
- Private Rohquellen, Prüfbelege, Herkunfts- und Lizenzunterlagen ausschließlich im getrennten `HyperCriSiS/Generic-Datastore`. `sprachverstand/CURRENT-STATE.json` **nur für Quellen-, Provenienz-, Lizenz-, Kandidaten- oder Evidenzaufgaben** lesen; nicht bei alltäglicher Produkt-/Release-Arbeit.
- Ohne ausdrückliche Freigabe **keine Tags, GitHub-Releases, Store-Einreichungen oder destruktiven externen Aktionen**. Tatsächlichen GitHub-/CI-/PR-Stand stets prüfen; keine Behauptung allein aus alten Checkpoints.

## Kontextsparsames Wiederaufnahmeprotokoll

1. Diese Kurzdatei von **`main`** lesen, danach nur erforderliche aktuelle Branches, PRs, Issues und `main`-HEAD live verifizieren.
2. Nur aufgabenrelevanten Code, Tests und notwendige Detaildokumente öffnen. **Archiv, ganze Dokumentationsbäume und private Quellen nicht vorladen.**
3. Nach größerer Integration/Entscheidung die Kurzdatei mit **aktiven** Blockern, nächsten Schritten und wenigen Belegen aktualisieren. Abgeschlossene Chronologie nicht hier anhängen; bei Bedarf separat archivieren.
4. Aktuelle Git-/CI-/Nutzerentscheidungen haben Vorrang vor historischen Notizen und alten Chatverläufen.

## Nachschlagewerke (nur bei Bedarf)

- [Vollständige, unveränderte Historie bis 09.10.2026](archive/CURRENT-WORK-SNAPSHOT-20261009.md).
- `ROADMAP.md` (Strategie); `docs/engineering/PROJECT-PLAYBOOK.md` (Branch-/Dokumentationsregeln).
- `docs/engineering/MODERN-RELEASE-READINESS-20261009.md`, `RELEASE-PREFLIGHT.md`, `STORE-PRODUCTION-GATE.md` (relevante Release-Gates; anhand der neuesten Entscheidungen prüfen).