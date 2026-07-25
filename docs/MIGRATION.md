# Auswertung der Altprojekte

Diese Datei ist die Arbeitsmatrix für bekannte Fehlerfälle, Issues und Pull
Requests. Sie beeinflusst den ausgelieferten Code nicht.

## Geprüfte Quellen

- `brilliance-richter-huh/gendersprache-korrigieren`
- `sternth/no-gender`
- `motsiw/rggl`

Alle funktionalen Issues und Pull Requests werden ausgewertet. Reine
Abhängigkeitsupdates, generierte Build-Dateien und Projektlöschungen werden nur
berücksichtigt, wenn sie eine architektonische Aussage enthalten.

## Bereits durch die neue Architektur gelöst

| Quelle | Eintrag | Entscheidung | Umsetzung |
|---|---|---|---|
| gendersprache-korrigieren | #7 unerwünschte Parcel-Verbindungen | neu gelöst | moderner Produktions-Build ohne Parcel-Laufzeit |
| gendersprache-korrigieren | #19 Änderungen in `code` und `pre` | neu gelöst | zentrale DOM-Sicherheitsprüfung |
| gendersprache-korrigieren | #31 dynamische Seiten und SPA | neu gelöst | `MutationObserver` für neue und geänderte Textknoten |
| no-gender | #1 springender Cursor in Editoren | neu gelöst | Eingaben und `contenteditable` werden ausgeschlossen |
| no-gender | #8 beschädigte Base64-Inhalte | neu gelöst | technische Textknoten werden nicht verarbeitet |
| rggl | #4 nachgeladene Inhalte | für Textknoten gelöst | ereignisgesteuerte Verarbeitung statt Verzögerung oder periodischem Komplettscan |
| rggl | #10 Fehler im Hervorhebungsmodus | Architekturentscheidung | kein Ersetzen vollständiger `innerHTML`-Blöcke |

## Umgesetzte Schreibweisen

| Quelle | Eintrag | Entscheidung | Umsetzung |
|---|---|---|---|
| alle | Doppelpunkt, Stern, Unterstrich, Schrägstrich, Mittel- und Hochpunkt | neu implementiert | sichere unveränderte und explizit abgebildete Pluralformen |
| alle | Binnen-I im Plural | neu implementiert | dasselbe geprüfte Plurallexikon wie bei Separatorformen |
| gendersprache-korrigieren / no-gender | Doppelnennungen | neu implementiert | nur bei lexikalisch identischer maskuliner Form; Dativ wird erhalten |
| gendersprache-korrigieren / no-gender | gegenderte Artikel im Singular | neu implementiert | explizite Nominativ-, Akkusativ- und Dativmuster |
| no-gender | #3 falsche Änderung von `gewinnen` | Regressionstest | darf niemals verändert werden |
| no-gender | #29 falsche Änderung von `ersinnen` | Regressionstest | darf niemals verändert werden |
| gendersprache-korrigieren | #14 falsche Änderung bei `Rot-Rot` | Regressionstest | zentraler Negativkatalog |
| rggl | #5 falsche Änderung von `Innen- und Außendienst` | Regressionstest einplanen | normales Wort `Innen` darf nicht als Binnen-I behandelt werden |

## Relevante Erkenntnisse aus `rggl`

`rggl` dokumentiert 21 geordnete Regelgruppen. Fachlich wertvoll sind vor allem:

- Kasuserkennung über Artikel, Pronomen, Präpositionen und bestimmte Verben
- getrennte Nominativ-, Akkusativ-, Dativ- und Genitivformen
- schwache Deklination wie `Student` / `Studenten`
- abweichende Formen für Komposita
- unregelmäßige Singular- und Pluralformen
- substantivierte Adjektive und Partizipialformen
- Possessivartikel und Pronomenpaare
- Sonderformen wie `Rom*nja`, `Sinti*zze`, `LuL` und `SuS`
- optionale Erkennung deutschsprachiger Seiten

Diese Kategorien werden nicht als lange Regexkette übernommen. Sie fließen in
das zentrale Flexionslexikon, kleine kontextbezogene Parser und unabhängige
Regressionstests ein.

## Neu erkannte offene Lücken

| Quelle | Eintrag | Status | Geplante Lösung |
|---|---|---|---|
| rggl | #3 `Messebauer*innen` | offen | für `Bauer` zwischen alleinstehender Form `Bauern` und Kompositum `Messebauer` unterscheiden |
| rggl | #6 `Kunde/Kundin` | offen | explizite singularische Doppelnennungen sicher zusammenführen |
| rggl | #7 Genderformen in `alt` | offen | kontrollierte Verarbeitung von `alt`, `aria-label` und gegebenenfalls `title`; Attributmutationen beobachten |
| rggl | #8 weitere Partizipien | zurückgestellt | optionale kontextabhängige Regelklasse |
| rggl / no-gender / gendersprache-korrigieren | typografische Apostrophe `’` und `‘` | offen | Separatorparser erweitern und Negativtests ergänzen |
| rggl | #12 `Jüdinnen und Juden` | offen | explizite unregelmäßige Doppelform |
| no-gender | #10 `den:die Arbeitnehmer:in` | teilweise | weitere Reihenfolgen gegenderter Artikel ergänzen |
| no-gender | #11 `Privatkund*in` | offen | lexikalisch eindeutige Singularform ohne Artikelkontext |
| no-gender | #20/#21 substantivierte Adjektive | offen | eigene Adjektivflexionslogik |
| no-gender | #18/#27 Sonderformen | offen | kleine explizite Sonderregeln |
| gendersprache-korrigieren | #22 `(m/w/d)` | optional | eigene abschaltbare Bereinigungsregel |

## Bewusst nicht allgemein umgesetzt

Eine normale feminine Personenbezeichnung wird nicht pauschal maskulinisiert.
`Die Organspenderin widersprach` kann ausdrücklich eine Frau bezeichnen und muss
unverändert bleiben. Nur sichtbar gegenderte Konstruktionen oder ausdrücklich
aktivierte persönliche Regeln dürfen solche Texte verändern.

Ebenso wird die breite Schlussregel aus `rggl`, alle verbleibenden Formen auf
`innen` oder `in` abzuschneiden, nicht übernommen. Sie ist mit Fehlertreffern wie
`Innen- und Außendienst`, `LinkedIn` und zusammengesetzten `Bauer`-Formen nicht
vereinbar.

## Architektonische Entscheidungen

- Kein periodischer Vollscan der Webseite.
- Kein Umschreiben von `innerHTML` zur Hervorhebung von Änderungen.
- Keine Veränderung von Eingaben, Editoren, Code oder technischen Daten.
- Attribute werden später nur über eine begrenzte Positivliste verarbeitet.
- Sprachprüfung soll elementbezogene `lang`-Attribute berücksichtigen, darf aber
  deutsche Inhalte auf falsch ausgezeichneten Webseiten nicht pauschal sperren.
- Konkreter GPL- oder AGPL-Quelltext wird nicht unbesehen kopiert.

## Nächste fachliche Reihenfolge

1. Genitivformen und Possessivartikel
2. Sonderformen im Singular wie `Mutter:in`
3. alleinstehende und zusammengesetzte `Bauer`-Formen
4. typografische Apostrophe und Punkt als Separator
5. explizite singularische Doppelnennungen
6. zugängliche Textattribute und Attribut-Mutationen
7. substantivierte Adjektive
8. optionale Partizipialformen
9. reale Browsertests für DHL, rebuy, ARD, Adidas und große SPA-Seiten

## Entscheidungswerte

- `neu implementieren`
- `als Regressionstest übernehmen`
- `bereits gelöst`
- `zu riskant`
- `nicht relevant`
- `verwerfen`

Konkreter Fremdcode wird nicht unbesehen kopiert oder per Cherry-Pick übernommen.
