# Aktueller Arbeitsstand

Stand: 2026-10-30  
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
- **Performance (22.–23.10.):** #503 Kandidatenfilter bei eigenen Ersetzungen (2.000 Texte mit 100er-Liste 118 → 49 ms), #504 Singular-Vorfilter (neutraler Text etwa 4× schneller, Ausgaben identisch), #505 weitere Sprachrestfälle.
- **Codex-Gegenprüfung 23.10.2026** (`artifacts/gegenpruefung-20261023`, alle Befunde gegen `main` nachgeprüft):
  - #507 Relativpronomen und Dativ-n (N01–N03, N07, N11, N13).
  - #508 Satzbau und Kasus (N04–N06, N08–N10, V02, R01, R03), inklusive ReDoS-Fix aus CodeQL.
  - #509 Begleitwort nach Seitenänderung neu berechnet (N14), geschützter Artikel verhindert halbe Umwandlung (V03), Possessiv nach „jede X*in“ (N12).
  - #510 Restfälle: `jedem*r`, Kurzform-Adjektive mit `/` und Komma, Genitiv-Koordination.
  - #511 Dativ-n nach Dativverben (V01).
  - #514 einmaliger Retry beim Chromium-Sitzungsstart im Smoke-Test (Nutzerentscheidung 23.10.2026).
  - #515 früher Ausstieg der Singularregel (Codex-Vorschlag): markierter Singular etwa ein Drittel schneller, Ergebnisse unverändert.
- **Codex-Gegenprüfung 24.10.2026** (`artifacts/gegenpruefung-20261024`, Vier-Augen-Prüfung von #507–#515, alle Befunde nachgeprüft):
  - #517 Dativ: „bis zu“ vor Zahlen (N19), Dativverben nur ohne nachgestelltes Subjekt (N18), „Vertrauen unseren …“ (N21), Koordinationen vollständig (N20, halbe Umwandlungen).
  - #518 Possessiv nur ohne anderen möglichen Besitzer (N16), Genitiv-Koordination nur ohne andere Lesart (N17), Konjunktiv nach Subjektpronomen (N22).
  - #519 Begleitwort beim Entfernen oder Ersetzen des Nomens zurückgesetzt (N14), Leerraum vor geschütztem Artikel (V03).
  - #520 Retry räumt die erste Chromium-Sitzung ab (N23), nativ mit Codex' Fehler-Injektion bestätigt (0 Restprozesse).
  - Codex' Sollfälle: 27 → 134 von 162; 356 von 358 als korrekt bewerteten Änderungen unverändert.
- **Danach (24.10.):**
  - #523 Titel (N10): „zum Energieauditor und Energieberater“, „zum Manual Therapeuten“, „»Studentischer OP Assistent«“, Kurzform-Adjektive mit `-n` und Adjektivlisten. Sollfälle: 142 von 162.
  - #524 weicher Trennstrich (R04): Wörter mit Trennstrich werden mit Begleitwort und Adjektiven umgewandelt.
  - #525 Pale-Moon-Performance (N15): Pale Moon kompiliert Regex-Literale mit `\p{…}` bei jeder Auswertung neu. Die Literale der zwei teuersten Regeln liegen jetzt auf Modulebene. In Pale Moon 35.0.2 sind alle gemessenen Fälle schneller als vor den Sprach-PRs (neutral 2 414 → 212 ms je 2 000 Aufrufe).
- **N15 Performance:** In Node, Chromium und Firefox ist neutraler Text 2,5–3× schneller als vor den Sprach-PRs. Markierter Plural bleibt 1,2–1,8× langsamer, markierter Singular nach #515 noch 1,4–1,6×. Pale Moon siehe #525.
- **Regel für neuen Code:** Regex-Literale mit `\p{…}` nicht in Funktionen oder Callbacks schreiben, sondern als Konstante auf Modulebene (Pale Moon, siehe #525).
- **Bekannte offene Punkte:**
  - #528 hat 27 weitere `\p{…}`-Literale aus Callbacks der Dativ-, Singular-, Satzbau- und Begleitwortregeln gezogen (Pale Moon, markierter Plural 674 → 548 ms). Übrig sind solche Literale nur in selten durchlaufenen Pfaden (DOM-Hilfen, einzelne Sonderregeln).
  - Relativpronomen in einem eigenen Textknoten nach dem Inline-Element wird nicht angeglichen (`des <em>Künstlers</em>, die …`, V04). Bewusst offen: 0 Korpusfälle, die Lösung bräuchte einen nachfolgenden Kontext samt Rücknahme im DOM-Kern. Mehrknotige Attribute (R02) ebenso.
  - Rückverweis „sie“ über Satzgrenzen nach generischem Singular (N12-Rest), weil „sie“ auch Plural sein kann.
  - „zwischen … und …“ bekommt kein Dativ-n („zwischen“ regiert Dativ oder Akkusativ); Alias „Systempartnern“ (N11).
  - Restliste R05: nach Codex' strenger Zählung (exakte Zielspanne in Regel- und DOM-Pfad) 10 von 99 gelöst. Der Rest sind überwiegend Tippfehler der Quelle (`Patent*innen`, `Ärzti:innen`) oder Einzelfälle, die Satzverständnis über Teilsätze brauchen.
- **Bewusst unverändert:** echt mehrdeutige Fälle (`Das Kind mag die Lehrer*in`, `ihre Familie oder Partner*in`), Metasprache (`die Endsilbe -ant:in`), Ausgangsfehler der Seiten, unmarkierte Feminina.
- **Gegenprüfung 25.10.2026** (`artifacts/gegenpruefung-20261025`, Prüfstand `2104f83`, alle Befunde gegen `main` nachgeprüft):
  - #531 Dativverben: Subjekt vor dem Verb, Genitivattribut danach, `folgen` mit eigenem Subjekt, weitere Inversionsanfänge, zu-Infinitiv mit Abstand (N24, N18).
  - #532 Mengenwort nach Artikel/Possessiv kein Dativauslöser, auch mit Gradadverb, Genitiv-Possessiv und Koordination (N25).
  - #533 Koordination übernimmt den Dativ nicht über Satz- und Attributgrenzen (N26).
  - #534 koordinierter Genitiv am Satzanfang (N27).
  - #535 Possessiv-Besitzer: „Es regnet“, „ihre eigene“, weibliche Nomen, Namen mit Verb, zwei Sätze Kontext (N28, N16).
  - #536 Konjunktiv im Nebensatz mit eigenem Subjekt (N22).
  - #537 Dativ-n für zusammengesetzte Personennomen (`mit Humanmediziner*innen`); behebt einen Großteil der halben Dativlisten (N07).
  - Sollfälle des Berichts: 171 → 315 von 489; die 980 als korrekt bewerteten Änderungen bleiben (4 weitere verbessert).
- **Gegenprüfung 26.10.2026** (`artifacts/gegenpruefung-20261026`, Prüfstand `5fbb2ed`, alle Befunde gegen `main` nachgeprüft):
  - #540 Regressionen: Präpositionalgruppe mit Adverb vor Dativverb (N29), Wörter auf -in ohne Person als Besitzer (N30), `neben` als Dativauslöser (N31), femininer Singular als Pluralkopf (N33).
  - #541 weicher Trennstrich hebt Partizipersetzungen nicht mehr auf (N32).
  - #542 Varianten: Subjekt mit Attribut, Gradadverbien, Satzanfänge ohne Namen, Nominalsubjekt im Nebensatz (N24, N25, N28, N22).
  - #543 restliche Unicode-Literale aus Funktionen (N15). Pale Moon, je 2 000 Aufrufe: neutral 214 → 60 ms, markierter Plural 592 → 390 ms.
  - #544 `zwischen` als Dativauslöser (N20), weitere Subjekte vor `folgen`, Fokuspartikel am Satzanfang (N27), Besitzer drei Sätze zurück als Schleife (das verschachtelte Muster brachte V8 an die Speichergrenze).
  - Sollfälle des Berichts: 1 301 → 1 368 von 1 454.
  - Restfälle danach:
    - #547 Satzbau: Doppelpunkt als Satzanfang, „Sie sagt jeder Lehrer*in“ → „jedem“, vorangestellter Dativ („und der Ärzt*in überreiche ich“, „dem Lehrer und der Ärzt*in“), Nebensatzsubjekte mit Adverb/Name/Nominalgruppe.
    - #548 Dativlisten: Nachbar mit eindeutigem Dativ (unterscheidet sich vom Nominativplural), neuer Satz nach der Liste, Verb in der Wortgruppe („Auf den Bühnen treffen …“).
    - #549 „Wir suchen eine/r …“ → „einen“, männliche Vornamen/Städte keine Besitzer, Mengenangaben zwischen Auslöser und Nomen, zu-Infinitiv mit Abstand, Adjektiv nach „und“.
    - #550 rechter Nachbar, lange Genitivattribute, Herkunftsadjektiv in Listen.
    - #551 Paarschreibungen `Heilpädagogen/in`, `Assistentin/en` nach markiertem Adjektiv.
  - Sollfälle des Berichts: 1 368 → 1 423 von 1 454 (8 der 31 übrigen sind Pale-Moon-Messungen ohne Sollausgabe).
  - Bewusst offen: N17 „dem Sohn eines Lehrers und einer Ärzt*in, also zwei Personen“ (nur über den Nachsatz entscheidbar) und Korpus 20988 (mehrdeutig); Quellfehler (`einer_eines …`, „Freund*innen oder Arbeitgebern“); Erhalt weicher Trennstriche im umgewandelten Wort; Ellipse „geprüfte/r Gesundheits- und Krankenpfleger/in“; „mit Eltern und, bei Bedarf, Lehrer:innen“ („Eltern“ ist kein eindeutiger Dativ); einzelne lange Listen mit weit entferntem Auslöser.
- **Gegenprüfung 27.10.2026** (`artifacts/gegenpruefung-20261027`, Prüfstand `087f109`):
  - #554 Regressionen N34–N40: „zwischen/neben“ nach Richtungsverben Akkusativ, Listen-Nachbarn nur Personen und ohne Attribut-/Satzgrenze, neuer Satz nach Liste allgemein erkannt, „jeder“ nur nach Dativverben „jedem“, eingebettete Partizipialattribute, Datumsangaben, Adjektivlücke nur echte Adjektive; dazu Zahlwörter, Doppelpunkt als Satzanfang in der Singularregel, Namen als Besitzerin nur mit weiblicher Endung oder unisex, Pluralbesitzer.
  - Sollfälle des Berichts: 171 → 335 von 439; die übrigen sind überwiegend teilweise bewertete Korpuskontexte und die bewusst offenen Punkte oben.
- **Gemeinsame Satzgliederkennung (Schritt 1 und 2, 25.10.2026):**
  - #557 `src/rules/clause-structure.ts`: Satzanfang, neuer Hauptsatz nach Listen, Nebensatzkonjunktionen, Hilfsverben, Nichtverben, Präpositionen, Zahlwörter und Adjektivendungen an einer Stelle; die Kasusregeln nutzen diese Listen. Korpus: eine Änderung (Verbesserung).
  - #558 `src/rules/noun-lists.ts`: Listen-Scanner sucht für ein markiertes Listenglied das regierende Wort vor dem ersten Glied, auch über Attribute („Berater aus der Praxis“, „Vertreter des …“), Mengen („rund 90 … am Vormittag und etwa 140 …“), Wortteile und Doppelpunktformen; ohne regierendes Wort entscheidet ein eindeutiger Dativ-Nachbar. Ersetzt den Aufzählungs- und die beiden Nachbar-Durchläufe. Sachplurale („Fertigteilhäusern“) zählen nicht als Personen (N35), Adverbien wie „erneut/sofort/stellenweise“ nicht als Verben (N41). Korpus: 1 115 Texte an 759 Stellen geändert, alle einzeln gesichtet.
  - Messregel: Bündel immer in getrennten Prozessen vergleichen; im selben Prozess ist das zuerst geladene Bündel systematisch schneller.
- **Gegenprüfung 28.10.2026** (`artifacts/gegenpruefung-20261028`, Prüfstand `e5bc745`):
  - #559 N42/N28 Besitzer (weibliche Namen auch ohne -a/-e, Pluralsubjekte), N43/N34 Richtungsakkusativ (nur Verbformen, nicht „los“ oder koordiniertes Prädikat, Objekt vor der Präposition), N44 Begleitwortpaare mit Doppelpunkt und Zeilenwechsel, N45 „bis zu“ vor Zahl, N19 Zahlwörter und Binnen-I mit Zahl, N46 Punkte in Adressen/Abkürzungen, N36, N38, N40, V05 (Inline-Element nach Richtungsverb), N35-Varianten (neuer Satz nach Präteritum und Namenspaar, Dativ-Nachbar ohne Auslösewort, erweiterte Attribute, „die Beamten“ als Nominativ); Binnen-I nutzt dieselbe Mengen- und Attributlücke wie die übrigen Marker. Korpus: 281 Texte an 236 Stellen geändert, alle gesichtet.
  - Sollfälle des Berichts: Befundbeispiele 7 → 53 von 54 (V05 nur im echten DOM prüfbar, dort richtig), Proben 637 → 989 von 989, frühere Sollpaare 1 935 → 1 940 von 1 977. N47: Problemfälle schneller als vorher (Liste mit Adverb 122 → 48 ms, Besitzer 177 → 96 ms, Doppelpunktpaar 93 → 76 ms je 2 000 Aufrufe, Node); gewöhnliche markierte Liste 65 → ~119 ms; Korpus gesamt (Regelpfad) gleichauf mit vorher.
- **Gegenprüfung 29.10.2026** (`artifacts/gegenpruefung-20261029`, Prüfstand `9ea3eda`):
  - #562 N48 Listen-Scanner: kein Dativ aus einem Attribut über Glieder, die kein Dativ sein können, nach Kopula („sind KMU aus …“), bei Zweierlisten nur mit Komma vor Adverb oder Einschub; N49 Genitivreihen (nach Singular ohne Personen immer, nach Plural nur ohne echtes Regens; „der Lehrern“ ist kein Genitiv); N50 Singularartikel im Glied nur mit Dativbeleg in anderem Glied; N51/N19 „bis zu“ vor Mengenwörtern; N52 Richtungsinfinitiv nach Liste; N35/N41/N42/N28-Varianten (Dativ-Nachbar am Satzanfang vor Dativverb, Attribut mit Adverb/Zahl, weitere Nichtverben, Pluralbesitzer).
  - **Besitzerregel umgestellt:** Ein unbekannter Name mit Verb gilt als mögliche Besitzerin („ihre“ bleibt); ausgenommen eine Liste männlicher Namen und Orte sowie typisch männliche Endungen (-o, -us, -er …). Grund: Listen weiblicher Namen sind nie vollständig.
  - Sollfälle des Berichts: Befundbeispiele 0 → 33 von 36, Proben 695 → 903 von 907, bewertete Korpusänderungen 1 299 → 1 312 von 1 354 ohne neue Fehler; Korpus gegenüber main 20 Texte an 12 Stellen. Laufzeit gleichauf mit main.
  - Bewusst offen: „mit Ausbildungsabschluss im Herbst sowie Quereinsteiger“, Dativ über ein weit entferntes Verb („ermöglicht … bis zu 260 Zuschauern“), Komma statt Konjunktion am Satzende („zusammen mit Gewerkschaften, Textilarbeiter“). Die Besitzerregel dieser Runde ist mit #565 wieder eng gefasst.
- **Gegenprüfung 30.10.2026** (`artifacts/gegenpruefung-20261030`, Prüfstand `c67bfee`):
  - #565 N53/N54 Besitzerregel wieder eng: Als mögliche Besitzerin gelten nur Namen mit weiblichem Beleg (Endung, Namensliste, Unisex), nicht jedes großgeschriebene Wort am Satzanfang („Boris wartet“, „Benzin brennt“, „Augsburg ist schön“); N42 weitere weibliche Namen; N28 Pluralbesitzer mit Zahlwort, Koordination und „sind“.
  - #565 Listen: N55 echte Komma-Dativliste nach eindeutigem Dativ („danken Lehrern, Schüler:innen besonders“); N56/N48 gezähltes Glied nach Attribut („Tausende von Nominierten, beinahe 200 Künstler“, „2 Gruppen aus Münster und Bremen und 17 Schüler“), Kopula mit Adjektiv oder Konjunktion, „zu Wort“, kein Kommasprung beim Dativ vor dem Plural; N49 Genitiv nach Singular auf -n/-s („Mit Wissen der Schulen“); N50 Dativbeleg ohne Artikel; N51 „bis zu sehr vielen“; N52 Richtungsinfinitiv nach Adjektiv; N35 vorangestellter Dativ nach Fokuspartikel, Doppelpunkt oder Adverb.
  - Sollfälle des Berichts: Befundbeispiele 0 → 36 von 41, Proben 244 → 369 von 399, Änderungen 20 von 20; ältere Prüfsätze ohne Rückschritt. Korpus gegenüber main 11 Texte an 10 Stellen, alle Verbesserungen. Laufzeit gleichauf.
  - Bewusst offen: Dreierliste vor Richtungsinfinitiv („zwischen Lehrer:innen, Schüler:innen und Musiker:innen zu setzen“), Sachplural ohne Artikel in der Liste („Firmen aus Berlin, Betriebe, Lehrer:innen“), „Quereinsteiger“ (siehe oben).
- **Nächste Schritte:**
  - Offene Punkte der Gegenprüfungen nach Bedarf.
  - Changelog-Einträge nur als Fragment.
  - Keine KI-Namen in PRs, Commits, Tests oder Doku (Nutzerentscheidung 24.10.2026).

## Pale Moon (22.10.2026)

- `palemoon` ist auf Main-Parität: #494, #506 (#503–#505), #512 (#507–#511), #516 (#515), #521 (#517–#519), #526 (#523–#525), #529 (#528), #538 (#531–#537), #545 (#540–#544), #552 (#547–#551), #556 (#554), #560 (#557–#559), #563 (#562) und #566 (#565). Der CI-Schritt „Gemeinsame Produktfunktionen … mit main abgleichen“ verlangt identische Pfade `src/core`, `src/rules`, `src/settings` usw. Nach jedem `main`-Merge, der diese Pfade ändert, den Sync nachziehen.
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
- Letzter integrierter `main`-HEAD vor diesem Checkpoint: #565 (Gegenprüfung 30.10.), davor #562 (Gegenprüfung 29.10.), davor #559 (Gegenprüfung 28.10.), davor #558/#557 (gemeinsame Satzglied- und Listenerkennung), davor #554 (Gegenprüfung 27.10.), davor #551 (Restfälle #547–#551), davor #544 (Gegenprüfung 26.10., #540–#544), davor #537 (#531–#537), davor `75cce7a` (#528), davor #527 `8629def`, #525 `2df871b`, davor #524 `9ccb3fb`, #523 `4965fc4`, #522 `2104f83`, #520 `9a8b335`. `palemoon`: Sync #566. Vor Wiederaufnahme HEAD live prüfen.
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