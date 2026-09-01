# Reale Webseiten – Testmatrix

Stand: 1. September 2026

Diese Matrix ergänzt die deterministischen Vitest-, Fixture- und echten
Browser-Smoke-Tests um reale externe Webseiten. Die Seiten wurden so gewählt,
dass sie unterschiedliche Risiken der DOM-Verarbeitung abdecken. Live-Webseiten
ändern sich ohne Vorankündigung; deshalb sind diese Tests als zusätzliche
Integrations- und Lasttests gedacht und sollen normale Pull-Request-Tests nicht
blockieren.

## Zielbild

Für jeden Lauf werden mindestens folgende Werte erfasst:

- Browser, Browser-Version, Betriebssystem und Sprachverstand-Commit
- URL und Zeitpunkt des Tests
- Ladezeit bis `DOMContentLoaded` und bis zum Ende der Beobachtungsphase
- Zahl der von Sprachverstand erfassten Ersetzungen
- verbleibende offensichtliche Kandidaten wie `:innen`, `*innen`, `_innen` und
  Binnen-I-Schreibweisen im sichtbaren Text
- JavaScript-Fehler und nicht abgefangene Promise-Fehler
- Long Tasks beziehungsweise auffällige Blockaden des Hauptthreads
- Zustand geschützter Bereiche vor und nach dem Lauf
- Ergebnis der seitenbezogenen Interaktionsprobe

Absolute Zeitgrenzen sind bei Live-Seiten ungeeignet. Für Leistungstests ist der
Vergleich mit einem Lauf derselben Seite ohne Erweiterung aussagekräftiger.

## Automatische echte Browser-Smoke-Tests

Die Required-CI führt inzwischen für beide modernen Engine-Familien einen echten
Browser-Smoke-Test gegen `tests/browser/extension-smoke.html` aus:

- **Chromium:** der entpackte Chromium-Build wird in echtem Chromium über
  ChromeDriver geladen.
- **Gecko:** der Firefox-Build wird als temporäres XPI über Geckodriver in echtem
  Firefox installiert.
- Beide Läufe prüfen statischen und dynamisch nachgeladenen Text, ein
  zugängliches `aria-label` sowie den Schutz von `code` und `input`.
- Die Testseite wird von einem lokalen HTTP-Server ausgeliefert. Die Required-CI
  hängt damit weder von externem Netzwerkzugriff noch vom aktuellen Zustand
  fremder Webseiten ab.

Diese Smoke-Tests beantworten die grundlegende Integrationsfrage, ob der erzeugte
Build in den realen Browsern geladen wird und die zentralen DOM-Invarianten hält.
Sie ersetzen nicht die folgende externe Real-World-Matrix, die komplexe
Webanwendungen, große DOMs und seitenbezogene Interaktionen abdeckt.

## Die zehn Referenzseiten

| Nr. | Seite | Schwerpunkt | Konkrete Prüfung | Automatisierung |
|---:|---|---|---|---|
| 1 | `https://www.kununu.com/de/deutsche-post` | Accordion-Schaltflächen, viele dynamische Komponenten, viele Ersetzungen | `Mitarbeiter:innen` und `Bewerber:innen` auch in aufklappbaren Schaltflächen korrigieren; mindestens ein FAQ auf- und zuklappen; Zähler muss reagieren | hoch |
| 2 | `https://www.stepstone.de/jobs/` | große dynamische Jobsuche, Filter, Formulare, viele Schreibweisen | sichtbare Jobtitel und Teaser verarbeiten; Such- und Filterfelder unverändert lassen; nach Filteränderung neu geladene Treffer ebenfalls verarbeiten | mittel bis hoch |
| 3 | `https://www.rebuy.de/verkaufen` | SPA, viele unterschiedliche Genderformen, Buttons und Eingaben | unter anderem `Kund:innen`, `Mitarbeiter:innen`, `Programmierer:in`, `Expert:in`, `Jede:r` und `Käufer:in` prüfen; Such- und E-Mail-Felder schützen; aufklappbare Inhalte weiter bedienbar | hoch |
| 4 | `https://www.arbeitsagentur.de/jobsuche/` | komplexe Anwendung mit Suche, Formularen und dynamischen Ergebnissen | Suchwerte dürfen nie verändert werden; Suche ausführen und nachgeladene Ergebnislisten prüfen; keine Fehler bei Navigation oder Filtern | mittel |
| 5 | `https://www.dhl.de/de/privatkunden/hilfe-kundenservice/kundenkonto.html` | sensible Login- und Kontofunktionen, viele Buttons und Eingabebereiche | Login-Maske ein- und ausblenden; Eingaben und technische Werte unverändert; sichtbarer normaler Text und freigegebene zugängliche Attribute dürfen verarbeitet werden | mittel |
| 6 | `https://www.ardmediathek.de/untertitel` | Medienportal, clientseitige Navigation, Untertitel | Seite und Karten normal verarbeiten; Video öffnen; Untertitel bei deaktivierter Option unverändert und flüssig; bei aktivierter Option gezielt korrigieren | mittel |
| 7 | `https://www.youtube.com/results?search_query=Mitarbeiter%3Ainnen` | sehr viele Mutation-Updates, SPA-Navigation, Video-Untertitel | ohne Neuladen zwischen Suche und Video navigieren; Beschreibung und Kommentare verarbeiten; Untertitel standardmäßig auslassen und optional ohne Stocken korrigieren | niedrig bis mittel |
| 8 | `https://github.com/HyperCriSiS/Sprachverstand` | normale Texte direkt neben Code, dynamische GitHub-Oberfläche | normaler README-Text darf korrigiert werden; `code` und `pre` müssen bytegenau unverändert bleiben; Navigations- und Aktionsschaltflächen weiter funktionsfähig | hoch |
| 9 | `https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units` | extrem lange Seite, sehr große Tabellen, sehr viele DOM-Knoten, kaum sinnvolle Ersetzungen | Seite muss schnell sichtbar und bedienbar bleiben; kein langer Freeze durch Sprachverstand; Tabelleninhalt darf nicht beschädigt werden; Ersetzungszahl sollte sehr niedrig sein | hoch |
| 10 | `https://taz.de/Moeglicher-AfD-Sieg-in-Sachsen-Anhalt/!6202713/` | redaktioneller Text mit Soft-Hyphens (`U+00AD`) innerhalb gegenderter Wörter | Formen wie `Künst\u00ADle\u00ADr:in\u00ADnen` trotz unsichtbarer Trennzeichen erkennen; unveränderte Wörter mit Soft-Hyphens bytegenau erhalten; keine typografischen Nebenwirkungen im restlichen Artikel | hoch |

## Automatisierbare Aussagen

Ein Browser-Test kann für diese Seiten sinnvoll und reproduzierbar prüfen:

1. Die Erweiterung startet ohne Ausnahme.
2. Die Seite bleibt nach Laden und Scrollen bedienbar.
3. Geschützte Elemente wie `input`, `textarea`, `contenteditable`, `code` und
   `pre` behalten Inhalt und Werte.
4. Textänderungen finden nur in normalen Textknoten oder ausdrücklich
   freigegebenen zugänglichen Attributen statt.
5. Dynamisch hinzugefügte Inhalte werden nachträglich verarbeitet.
6. Bekannte Restmuster werden nach einer Beobachtungszeit gesammelt und als
   Diagnose ausgegeben.
7. Die Zahl der Ersetzungen und Performance-Metriken werden als JSON- oder
   HTML-Artefakt gespeichert.
8. Ein kleiner Satz stabiler Interaktionen wie Accordion öffnen, scrollen oder
   einen Filter umschalten funktioniert weiterhin.

## Was ein Live-Test nicht zuverlässig allein entscheiden kann

Ein Restmuster ist nicht automatisch ein Fehler. Es kann absichtlich geschützt,
sprachlich mehrdeutig, in einem Eingabefeld oder von einer deaktivierten Regel
erfasst sein. Ebenso bedeutet eine ausgeführte Ersetzung nicht automatisch, dass
sie sprachlich richtig ist. Deshalb sollte ein automatischer Live-Lauf Fundstellen
und DOM-Kontext zurückgeben, statt aus jeder Fundstelle unmittelbar einen
Fehlschlag zu machen.

Für sprachliche Korrektheit bleiben die lokalen Regressionstests maßgeblich. Neue
Fehler aus Live-Seiten werden zuerst als minimiertes HTML-Beispiel oder als
isolierter String in die deterministische Testsuite übernommen.

## Aufbau der externen Live-Automatisierung

- Chromium mit der entpackten Erweiterung in einem persistenten Browser-Kontext
  starten.
- Jeden Test einmal ohne und einmal mit Sprachverstand ausführen.
- Feste Beobachtungsfenster statt `networkidle` verwenden, weil viele Seiten
  dauerhaft Netzwerkverbindungen offen halten.
- Cookie-Banner nur mit seitenbezogenen, defensiven Helfern bedienen.
- Screenshots, Konsole, Restmuster, Ersetzungszahl und Performance-Daten als
  Artefakt sichern.
- Live-Tests ausschließlich manuell oder zeitgesteuert ausführen und nicht als
  zwingende Pull-Request-Prüfung konfigurieren.
- Bei einer Abweichung zuerst feststellen, ob die Webseite geändert wurde. Erst
  danach einen Fehler in Sprachverstand annehmen.

Damit liefern reale Webseiten brauchbare Warnsignale, ohne dass Änderungen fremder
Webseiten die normale CI unzuverlässig machen.
