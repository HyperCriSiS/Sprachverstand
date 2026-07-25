# Recherchequellen

Sprachverstand ist eine neue Implementierung.

Folgende Projekte werden als Recherchequellen für bekannte Schreibweisen,
Fehlerfälle, offene Issues und mögliche Regressionstests ausgewertet:

- https://github.com/brilliance-richter-huh/gendersprache-korrigieren
- https://github.com/sternth/no-gender
- https://github.com/motsiw/rggl

## Stand 0.2.0

Die aktuelle Regel-Engine, DOM-Verarbeitung und Browser-Architektur wurden neu
entwickelt. Bekannte Fehlerfälle und Sprachbeispiele aus den Rechercheprojekten
werden als eigenständige Tests und neu entworfene Regeln umgesetzt.

`rggl` enthält eine umfangreiche, über Jahre gewachsene Kasus- und
Flexionssammlung. Das Projekt steht unter GPL-3.0. Konkreter Quelltext und
Regexketten werden deshalb nicht kopiert; fachliche Kategorien, öffentlich
dokumentierte Fehlerfälle und Sprachbeispiele werden unabhängig neu umgesetzt.

Herkunftshinweise bleiben außerhalb des produktiven Laufzeitcodes. Details zu
einzelnen Entscheidungen stehen in `docs/MIGRATION.md` und in der Git-Historie.
