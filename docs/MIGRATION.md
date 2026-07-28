# Auswertung der Altprojekte

Diese Datei dokumentiert, welche Fehlerfälle und Konzepte aus den geprüften
Altprojekten in Sprachverstand eingeflossen sind. Fremder Quelltext wird nicht
übernommen; produktiver Code wird unabhängig neu implementiert.

## Geprüfte Quellen

- `brilliance-richter-huh/gendersprache-korrigieren`
- `sternth/no-gender`
- `motsiw/rggl`

Die vorhandenen funktionalen Issues und Pull Requests aller drei Projekte wurden
ausgewertet. Ein erneuter Komplettaudit ist erst nötig, wenn dort neue Einträge
oder relevante Commits erscheinen.

## Durch die Architektur gelöst

| Quelle | Fundstelle | Umsetzung in Sprachverstand |
|---|---|---|
| gendersprache-korrigieren #19 | Änderungen in `code` und `pre` | zentrale DOM-Sicherheitsprüfung |
| gendersprache-korrigieren #31 / rggl #4 | dynamisch nachgeladene Inhalte | gezielter `MutationObserver`, kein periodischer Vollscan |
| no-gender #1 | springender Cursor in Editoren | Eingaben und `contenteditable` ausgeschlossen |
| no-gender #8 | beschädigte Base64-Inhalte | technische Inhalte werden übersprungen |
| rggl #7 | Genderformen in Alternativtexten | Positivliste für `alt`, `aria-label`, `aria-description` und `title` |
| rggl #10 | beschädigte Seiten im Hervorhebungsmodus | kein Umschreiben von `innerHTML` |

## Umgesetzte Sprachfälle

| Quelle | Fundstelle | Umsetzung |
|---|---|---|
| alle | `:`, `*`, `_`, `/`, `·`, `•`, `.`, `’`, `‘` | lexikalisch geprüfte Separatorregeln |
| alle | Binnen-I | gemeinsames Flexionslexikon |
| rggl #3 | `Messebauer*innen` | getrennte Formen für `Bauer` und Komposita |
| rggl #5 | `Innen- und Außendienst` | Negativregression |
| rggl #6 | `Kunde/Kundin` | sichere Singular-Doppelformen |
| rggl #11 | typografische Apostrophe | explizit unterstützte Separatoren |
| rggl PR #1/#2 | `LogIn`, `AddIn`, `PlugIn`, `DriveIn` | Negativregressionen |
| rggl PR #1/#2 | `Prof.in`, `Dr.in` | eigene kontextabhängige Titelregel |
| no-gender #10 | `den:die Arbeitnehmer:in` | beide Artikelreihenfolgen und Kasusformen |
| no-gender #11 | `Privatkund*in` | lexikalisch geprüfte Singularformen ohne Artikel |
| no-gender #15 | Artikel und Possessivformen | Nominativ, Akkusativ, Dativ und Genitiv |
| no-gender #24 | `Jede:r` | eindeutiger Singular-Kontext |
| gendersprache-korrigieren #22 | `(m/w/d)` | eigene optionale, standardmäßig deaktivierte Gruppe |

## Partizipien und neutrale Umschreibungen

`rggl` #8 und ähnliche Meldungen aus den anderen Projekten zeigen, dass Wörter
wie `Mitarbeitende`, `Studierende` und `Lesende` nicht sicher durch eine einzige
breite Regel ersetzt werden können.

Sprachverstand teilt dies deshalb auf:

- eindeutige Anreden wie `Sehr geehrte Mitarbeitende` werden standardmäßig
  korrigiert;
- außerhalb dieser Anreden werden nur einzeln geprüfte Wendungen aus dem
  Kontextkatalog ersetzt;
- `Benutzungshandbuch` kann in der optionalen Stilgruppe zu
  `Benutzerhandbuch` werden;
- legitime Begriffe wie `Testpersonen`, `Persönlichkeiten`, `Kollegium` und
  `ärztliche Sprechstunde` bleiben unverändert.

## Bewusst nicht pauschal umgesetzt

Eine normale feminine Personenbezeichnung wird nicht maskulinisiert.
`Die Organspenderin widersprach`, `Professorin Müller` oder `Politikerinnen`
können ausdrücklich Frauen bezeichnen und bleiben unverändert.

Auch breite Schlussregeln, die beliebige Endungen `in` oder `innen` entfernen,
werden verworfen. Sie würden unter anderem `Innen- und Außendienst`, `LinkedIn`
und viele normale Wörter beschädigen.

## Seit Beta 11 zusätzlich umgesetzt

| Quelle | Fundstelle | Umsetzung |
|---|---|---|
| rggl #12 | `Jüdinnen und Juden` | explizite unregelmäßige Doppelform und Regressionen |
| no-gender #20/#21 | substantivierte Adjektive | eigene lexikonbasierte Flexionslogik |
| no-gender #18/#27 | `Studentys`, `Rom*nja`, `Sinti*zze` | exakte optionale Sonderformzuordnungen ohne breite Suffixregel |

## Weiterhin bewusst offen

| Quelle | Fundstelle | Status |
|---|---|---|
| mehrere | sprachlich falsche oder abgeschnittene Formen wie `Zuhörer*inne` | keine allgemeine Rechtschreibkorrektur; nur bei belastbaren realen Mustern |
| reale Webseiten | weitere Kontext- und Flexionsfundstellen | erst mit vollständigem Satz- und Seitenkontext aufnehmen |

## Qualitätsgrenzen

- Keine Regel ohne positive und negative Tests.
- Eine ausgelassene Ersetzung ist besser als eine falsche.
- Keine periodischen Komplettscans.
- Kein Umschreiben von `innerHTML`.
- Eingaben, Editoren, Code und technische Daten bleiben unberührt.
- Riskantere Bedeutungsänderungen erscheinen als eigene, standardmäßig
  deaktivierte Gruppen.
- Zitate werden standardmäßig korrigiert; auf Wunsch können Inhalte innerhalb
  üblicher Anführungszeichen geschützt werden.

## Kontextkatalog statt pauschaler Partizipregel

Beta 6 ersetzt die globale optionale Wortliste für `Studierende`, `Lesende` und
ähnliche Formen durch einen versionierten Kontextkatalog. Sichere Anreden bleiben
aktiv. Weitere Fälle werden als `collect`, `implemented` oder `reject` erfasst.
Das verhindert, dass wörtliche Tätigkeitsbeschreibungen durch eine bloße
Endungsregel verändert werden.

Siehe `data/neutral-context-catalog.json` und `docs/NEUTRAL-CONTEXTS.md`.
