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

Sicher umgesetzt sind klare Anreden und explizite Personenumschreibungen:

```text
Sehr geehrte Mitarbeitende → Sehr geehrte Mitarbeiter
Liebe Teilnehmende → Liebe Teilnehmer
mitarbeitende Personen → Mitarbeiter
```

Als optionale feste Stilumschreibung ist außerdem hinterlegt:

```text
Benutzungshandbuch → Benutzerhandbuch
```

Noch gesammelt und nicht allgemein ersetzt werden unter anderem:

```text
Studierende
Wir suchen Mitarbeitende
Teilnehmende des Kurses
```

Hier soll zunächst ausgewertet werden, ob DOM-Kontext wie Überschrift,
Navigation, Formularbeschriftung oder Stellenanzeige zuverlässig erkannt werden
kann. Eine bloße Wortliste reicht dafür nicht.

Nicht ersetzt werden wörtliche Tätigkeitsbeschreibungen:

```text
die gerade Lesenden
die seit Stunden Wartenden
```

## Datenschutz

Sprachverstand überträgt keine Seitentexte. Fundstellen werden nur manuell und
ohne private Inhalte in den Projektkatalog aufgenommen. Eine spätere optionale
Meldehilfe darf erst nach ausdrücklicher Zustimmung Daten erzeugen und soll
standardmäßig lediglich eine lokal kopierbare Vorlage erstellen.
