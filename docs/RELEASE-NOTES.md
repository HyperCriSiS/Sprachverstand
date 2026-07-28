# Sprachverstand 0.6.0 – Beta 11

Beta 11 schließt die vor der Store-Veröffentlichung geplanten Erweiterungen des
Sprachkerns ab und führt getrennte eigene Ersetzungen sowie die endgültige
Open-Source-Lizenz ein.

## Sprachregeln

- Sichtbar markierte Binnen-I-Singularformen wie `NutzerIn` werden für bekannte
  Personenbezeichnungen erkannt.
- `eine NutzerIn` wird in abgesicherten Satz-, Verb-, Präpositions- und
  Einzelphrasenkontexten passend zu `ein Nutzer`, `einen Nutzer`,
  `einem Nutzer` oder `eines Nutzers` flektiert.
- Doppelnennungen mit wiederholten Artikeln und Possessivformen werden in allen
  vier Kasus unterstützt.
- Neue lexikonbasierte Regelgruppe für substantivierte Adjektive wie
  `Erwachsene:r`, `Beschäftigte:n`, `Volljährige:r` und `Vorgesetzte:r`.
- Exakt geprüfte Sonderformen für `Rom*nja`, `Sinti*zze` und ausgewählte
  Phettberg-Formen wie `Studentys`, `Lesys`, `Lehrys` und `Mitarbeitys`.
- Deutlich erweiterter Bestand regelmäßiger, schwacher und unregelmäßiger
  Personenformen.
- Maschinenlesbarer Katalog mit Positiv- und Negativfällen schützt den Ausbau
  des Flexionslexikons vor Regressionen.

## Eigene Ersetzungen

- Persönliche wörtliche Ersetzungen stehen getrennt von Ausnahmen zur Verfügung.
- Keine Regex oder Platzhalter.
- Groß-/Kleinschreibung wird beachtet.
- Ersetzungen werden nicht rekursiv erneut verarbeitet.
- Persönliche Ausnahmen besitzen Vorrang.
- Speicherung ausschließlich lokal im Browser.

## Lizenz und Kennzeichen

- Quelltext unter `AGPL-3.0-only`.
- Vollständiger Lizenztext in `LICENSE`.
- `TRADEMARKS.md` trennt die Quelltextrechte von Name und SV-Logo.
- `NOTICE` dokumentiert Copyright und Gewährleistungsausschluss.
- Popup und Einstellungen verlinken eine lokale Rechtshinweisseite.
- Lizenz-, Kennzeichen- und Hinweisdokumente werden in beide Browserpakete
  aufgenommen.

## Pakete

- Chromium-ZIP zur Installation als entpackte Erweiterung
- Firefox-XPI für temporäre Desktop- und Android-Tests
- vollständiges Quellcodearchiv
- SHA-256-Prüfsummen
- ausführliche Beta-Testanleitung

## Noch besonders zu testen

- Firefox für Android auf einem echten Gerät
- Popup und Einstellungen auf mehreren Displaygrößen
- Screenreader auf Desktop und Android
- DHL-Anmeldung, Mediatheken, rebuy und andere Single-Page-Anwendungen
- große Nachrichtenseiten sowie React-, Angular- und Vue-Seiten
- reale Fundstellen für weiteren kontrollierten Lexikonausbau

Konkrete Positiv-, Negativ- und Bedienungstests stehen in `BETA-TEST.md`.
