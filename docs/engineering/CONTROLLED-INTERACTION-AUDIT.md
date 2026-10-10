# Kontrollierte Interaktions- und Longtask-Diagnose

Stand: 10.10.2026. Issue #419. **Keine Releasefreigabe.**

## Ziel und Abgrenzung

Die früheren Real-Web-Läufe auf einer großen Wikipedia-Tabelle mischten Browserstart,
Netzwerk, Seitenskripte, synthetische Scrolls und DOM-Transformation.
Die zusätzliche lokale Chromium-Fixture isoliert stattdessen reproduzierbare
DOM-Arbeit auf `127.0.0.1`, ohne fremdes Netzwerk:

- 1.400 initiale Absätze mit exakt 2 % synthetischen Gender-Marker-Texten
  und 480 später mutierenden Text-Elementen.
- 48 Textmutationen alle 40 ms, standardmäßig vier Sekunden.
- Eine echte WebDriver-Klickaktion und Tastatureingabe während der DOM-Last.
- Frische Chromium-Sitzungen mit und ohne entpackte Erweiterung,
  abwechselnd in AB/BA-Reihenfolge. Beobachtungswerte aller Paare bleiben erhalten.
- Messgrößen: tatsächliche `requestAnimationFrame`-Callbacks, P95 und maximale
  Frameabstände, Lücken über 120 ms, Browser-Longtasks (falls unterstützt),
  Zeit von Klick-/Eingabehandler bis zum nächsten Frame sowie Mutations- und Interaktionszähler.

**Vertragsprüfung:** statischer und dynamischer Text müssen nur mit Erweiterung
transformiert werden; Eingabe und Code bleiben unverändert. Beide Sitzungen müssen
ausreichend Interaktionen, Mutationen und tatsächliche Frames nachweisen. Fehlende
oder ungültige Paare führen zum Fehlschlag.

**Keine pauschalen Performance-Schwellen:** Die Rohzeiten bilden einen
Diagnosevergleich ohne kalibrierte Freigabeschwelle. Die nächste
Frame-Zeit ist kein präziser Messwert für den Zeitraum vom physischen Tastendruck
bis zur Ereignisbehandlung. `longtask`-Einträge messen Mainthread-Arbeit,
weisen deren Ursache aber nicht automatisch der Erweiterung zu.
Der Test ersetzt weder echte Video-/Cue-30/60-FPS-Messungen noch unabhängige
Browser- und Releaseaudits.

## Ausführung

Nach `npm ci` und `npm run build:chromium`:

```bash
npm run test:browser:interaction:chromium -- --pairs 3
```

Erfordert ein installiertes Chromium und ChromeDriver. Die normale
Chromium-Required-CI nutzt ein A/B-Paar und blockiert bei verletzten
Funktions-/Schutzverträgen, nicht bei schwankenden Diagnoselaufzeiten.
Der manuelle Workflow `Kontrollierte Interaktionsperformance` erlaubt
1, 3 oder 5 Paare und lädt den JSON-Report als befristetes CI-Artefakt hoch.
Die komplette Fixture ist synthetisch; ihre 2-%-Markerrate
ist **kein repräsentativer Anteil realer Webseiten**.
