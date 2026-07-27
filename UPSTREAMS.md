# Recherchequellen

Sprachverstand ist eine eigenständige Neuimplementierung.

Folgende Projekte wurden als Recherchequellen für bekannte Schreibweisen,
Flexionsfälle, Fehlerfälle, offene Issues und mögliche Regressionstests
ausgewertet:

- https://github.com/brilliance-richter-huh/gendersprache-korrigieren
- https://github.com/sternth/no-gender
- https://github.com/motsiw/rggl

Unser ausdrücklicher Dank gilt den Entwicklern, Mitwirkenden, Testern und
Issue-Autoren dieser Projekte. Ihre offen dokumentierte Arbeit hat wichtige
Hinweise für Anforderungen, Grenzfälle und Sicherheitsprüfungen geliefert.

## Art der Nutzung

Es wurden keine Codebestandteile oder fremden Regexketten übernommen. Die
Regel-Engine, DOM-Verarbeitung und Browser-Architektur wurden neu entwickelt.
Öffentlich dokumentierte Sprachbeispiele, Flexionsfälle, Fehlertreffer und
fachliche Kategorien dienten als Recherchebasis und wurden in eigenständig
formulierte Regeln und Tests überführt.

`rggl` enthält eine umfangreiche, über Jahre gewachsene Kasus- und
Flexionssammlung und steht unter GPL-3.0. Deshalb wird besonders darauf geachtet,
keine Quelltextpassagen, Regexketten oder vollständigen Datenbestände zu
übernehmen.

Die Herkunft einzelner fachlicher Anregungen bleibt in `docs/MIGRATION.md`, der
Git-Historie und den Pull Requests nachvollziehbar.
