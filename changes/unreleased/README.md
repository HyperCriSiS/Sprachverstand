# Changelog-Fragmente

Jeder Pull Request legt seinen Changelog-Eintrag als eigene Datei in diesem
Ordner ab, statt `CHANGELOG.md` direkt zu ändern. Zwei Pull Requests berühren
so nie dieselbe Datei, und es entstehen keine Merge-Konflikte.

Dateiname: kurze Beschreibung aus Kleinbuchstaben, Ziffern und Bindestrichen,
etwa `dativ-grossgeschriebene-begleitwoerter.md`.

Inhalt: erste Zeile die Kategorie, dann eine Leerzeile, dann der Eintrag wie
im Changelog.

```markdown
kategorie: Behoben

- Dativ nach großgeschriebenem Begleitwort wieder richtig: „mit Ihren
  Schüler*innen“ wird zu „mit Ihren Schülern“.
```

Erlaubte Kategorien: Hinzugefügt, Geändert, Leistung, Behoben, Sicherheit,
Entfernt, Tests.

`npm run changelog:check` prüft die Fragmente (Teil von `npm run check`).
Vor einem Release überträgt `npm run changelog:collect` alle Fragmente in den
Abschnitt „Unveröffentlicht“ von `CHANGELOG.md` und entfernt sie.
