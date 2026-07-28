# Beta 12 – Vorschau und Einstellungssicherung testen

Dieser Testblock betrifft die neuen Funktionen der Einstellungsseite. Er ergänzt
die allgemeinen Prüfungen aus [`BETA-TEST.md`](BETA-TEST.md).

## Vorschau eigener Ersetzungen

1. Unter **Eigene Ersetzungen** eintragen:

   ```text
   Sonderform => Ziel
   Nutzer:innen => Mitglied
   Zusatz =>
   ```

2. Als Testtext eingeben:

   ```text
   Sonderform, Nutzer:innen und Zusatz.
   ```

3. Erwartetes Ergebnis:

   ```text
   Ziel, Mitglied und .
   ```

4. Die Vorschau darf die Einträge noch nicht speichern oder auf offenen Seiten
   aktivieren.
5. Nach dem Speichern muss dieselbe Verarbeitung auf einer normalen Testseite
   erfolgen.

## Konflikthinweise

Nacheinander folgende Fälle prüfen:

```text
Gleich => Gleich
A => B
B => C
Nutzer => Leser
Nutzerkonto => Konto
Name => Bezeichnung
name => kleine Bezeichnung
Nutzer:innen => Mitglied
```

Zusätzlich `Nutzer:innen` als persönliche Ausnahme eintragen.

Erwartete Hinweise:

- wirkungslose Ersetzung bei `Gleich => Gleich`
- Kettenhinweis bei `A => B` und `B => C`
- Überlappung bei `Nutzer` und `Nutzerkonto`
- Hinweis zur Groß-/Kleinschreibung bei `Name` und `name`
- Hinweis auf die eingebaute Verarbeitung von `Nutzer:innen`
- Warnung, dass die persönliche Ausnahme die eigene Ersetzung blockiert

Identische doppelte Zeilen sollen als Dublette gemeldet werden. Derselbe
Ausgangstext mit zwei unterschiedlichen Zielen muss als Fehler abgewiesen werden.

## Vollständiger Export

Vor dem Export einen eindeutig erkennbaren Teststand herstellen:

- Erweiterung deaktiviert
- nur einige Regelgruppen aktiv
- zugängliche Attribute deaktiviert
- Zitatverarbeitung deaktiviert
- mindestens eine ausgeschlossene Domain
- mindestens eine persönliche Ausnahme
- mindestens eine eigene Ersetzung

**Alle Einstellungen als JSON exportieren** wählen.

Die Datei muss enthalten:

- `format: "sprachverstand.settings-backup"`
- `version: 1`
- einen gültigen ISO-Zeitstempel
- Aktivierungsstatus
- aktive Regelgruppen
- Domain-Ausschlüsse
- Zitat- und Attributoptionen
- persönliche Ausnahmen
- eigene Ersetzungen

Die Datei darf keinen ausführbaren Code und keine Webseiteninhalte enthalten.

## Import ohne sofortige Aktivierung

1. Einstellungen nach dem Export sichtbar verändern.
2. Die exportierte Datei importieren.
3. Prüfen, dass die Werte zunächst nur im Formular erscheinen.
4. Einstellungsseite schließen, ohne zu speichern, und erneut öffnen: Der alte
   gespeicherte Stand muss weiterhin vorhanden sein.
5. Erneut importieren und anschließend speichern: Erst jetzt muss der importierte
   Stand aktiv werden.

## Importstrategien

Mit einem vorhandenen Eintrag `A => Alt` und einer Importdatei mit `A => Neu`
prüfen:

- **Vorhandene Ersetzungsziele behalten:** `A => Alt` bleibt und der Konflikt wird
  angezeigt.
- **Importierte Ersetzungsziele übernehmen:** `A => Neu` steht im Formular.
- **Alles vollständig ersetzen:** Allgemeine Einstellungen und beide
  persönlichen Listen entsprechen vollständig der Importdatei.

Allgemeine Einstellungen aus der Sicherung müssen bei allen drei Strategien in
das Formular übernommen werden. Die Strategie betrifft nur die Zusammenführung
bereits vorhandener persönlicher Listen.

## Fehlerhafte Dateien

Folgende Dateien müssen ohne Teilübernahme abgewiesen werden:

- ungültiges JSON
- fremder `format`-Wert
- unbekannte höhere Schemaversion
- fehlendes Einstellungsobjekt
- falsche Feldtypen
- Datei größer als 1 MB
- mehr persönliche Einträge als erlaubt
- zu lange Ausnahmen oder Ersetzungstexte

## Datenschutz und Oberfläche

- Der Import öffnet ausschließlich einen lokalen Dateiauswahldialog.
- Es darf keine zusätzliche Browserberechtigung verlangt werden.
- Der Link **Lizenz und Quelltext** erscheint nur in den Einstellungen, nicht im
  kompakten Popup.
- Die Lizenzseite zeigt nur eine gemeinsame Überschrift
  **Lizenz und Quelltext**; eine zweite unterschiedlich große Markenüberschrift
  ist nicht vorhanden.
- Die Formulierung **Freie Software unter starkem Copyleft** ist auf der
  Lizenzseite nicht vorhanden.
