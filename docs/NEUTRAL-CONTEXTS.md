# Kontextkatalog für geschlechtsneutrale Umschreibungen

Partizipformen wie `Mitarbeitende`, `Teilnehmende`, `Studierende` oder
`Lesende` können als geschlechtsneutrale Personenbezeichnung gemeint sein. Sie
können jedoch ebenso eine tatsächlich ausgeübte Tätigkeit beschreiben. Deshalb
werden sie nicht pauschal ersetzt.

Die maschinenlesbaren Fundstellen und Entscheidungen liegen in
`data/neutral-context-catalog.json`.

## Aufnahmeverfahren

Eine neue Fundstelle wird mit folgenden Angaben erfasst:

- Originalform und gewünschte Ersatzform
- vollständiger Satz oder Oberflächenkontext
- Kontextklasse, etwa Anrede, Überschrift, Navigation, Stellenanzeige oder
  institutionelle Rollenbezeichnung
- Sicherheitsbewertung
- Status `collect`, `implemented` oder `reject`
- zugehörige Regelgruppe, sobald umgesetzt

## Aktuelle Entscheidungen

Umgesetzt sind klar abgegrenzte Anreden, Personenumschreibungen und mehrere
kontextuell eindeutige Rollenbezeichnungen, zum Beispiel:

```text
Sehr geehrte Mitarbeitende → Sehr geehrte Mitarbeiter
Liebe Teilnehmende → Liebe Teilnehmer
mitarbeitende Personen → Mitarbeiter
Studierende → Studenten
Wir suchen Mitarbeitende → Wir suchen Mitarbeiter
Teilnehmende des Kurses → Teilnehmer des Kurses
Arbeitnehmende → Arbeitnehmer
```

Als optionale feste Stilumschreibung ist außerdem hinterlegt:

```text
Benutzungshandbuch → Benutzerhandbuch
```

Der derzeitige Katalog enthält keine ungeklärten `collect`-Einträge. Neue reale
Fundstellen können weiterhin zunächst mit diesem Status aufgenommen werden.

Nicht automatisch ersetzt werden insbesondere wörtliche Tätigkeitsbeschreibungen
und Bezeichnungen, bei denen eine Änderung Eigennamen oder fachliche Bedeutung
verfälschen könnte:

```text
die gerade Lesenden
die seit Stunden Wartenden
Studierendenwerk
trans* Personen
inter* Personen
```

`Studierendenwerk` bleibt bewusst unverändert, weil der Ausdruck häufig
Bestandteil offizieller Namen von Anstalten des öffentlichen Rechts ist. Eine
pauschale Ersetzung durch `Studentenwerk` könnte damit Eigennamen und rechtliche
Bezeichnungen verändern.

## Datenschutz

Sprachverstand überträgt keine Seitentexte. Fundstellen werden nur manuell und
ohne private Inhalte in den Projektkatalog aufgenommen. Eine spätere optionale
Meldehilfe darf erst nach ausdrücklicher Zustimmung Daten erzeugen und soll
standardmäßig lediglich eine lokal kopierbare Vorlage erstellen.
