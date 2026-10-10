# Reale Webseiten – Testmatrix

Stand: 2. Oktober 2026

Diese Matrix ergänzt die deterministischen Vitest-, Fixture- und echten
Browser-Smoke-Tests um reale externe Webseiten. Die Seiten wurden so gewählt,
dass sie unterschiedliche Risiken der DOM-Verarbeitung abdecken. Live-Webseiten
ändern sich ohne Vorankündigung; deshalb sind diese Tests als zusätzliche
Integrations- und Lasttests gedacht und sollen normale Pull-Request-Tests nicht
blockieren.

## Textknoten-Klassifizierung (09.10.2026)

Zusätzlich zum historischen `document.body.innerText`-Zähler prüft die
manuelle Browserdiagnose passende Marker in **einzelnen sichtbaren
DOM-Textknoten**. Sie zählt explizit geschützte Bereiche wie
`code`/`pre`, Editoren, `data-sprachverstand-ignore` und
`aria-hidden` getrennt von anderen Textknoten. Die Diagnose gibt
maximal zwölf kurze Wort-/Bereichsproben aus, aber keine ganzen
Webseitentexte, HTML-Pfade oder Quell-URLs.

Wichtig: `innerText` und einzelne DOM-Textknoten besitzen nicht immer
dieselben Wortgrenzen. Eine Abweichung ihrer Summen ist daher weder
automatisch ein Fehler noch ein Beweis für vollständige Erkennung.
Auch als „anderer Textknoten“ klassifizierte Treffer können aus
weiteren Gründen von Sprachverstand bewusst übersprungen werden.
Der DOM-Befund ändert **keine Produktregeln**.

## Diagnose verbliebener Sprachmuster (09.10.2026)

Der Live-Test zählt bekannte Gender-Marker im sichtbaren Seitentext.
Dieser Zähler allein bewertet nicht, ob es sich um einen echten
Erkennungsfehler handelt: Geschützte Code-/Editorbereiche, absichtlich
nicht freigegebene Formen und nachträglich geladene Inhalte können
Restmuster erzeugen. Die Live-Zusammenfassung zeigt deshalb zusätzlich
den Zähler **ohne** Erweiterung, die Differenz und maximal zwölf kurze
Wortproben von je höchstens 64 Zeichen. Die Proben sind ausschließlich
zur manuellen Klassifizierung bestimmt und ersetzen keine unabhängige
Fehlerannotation. Sie enthalten keine Seitenauszüge.

## Zielbild

Für jeden Lauf werden mindestens folgende Werte erfasst:

- Browser, Browser-Version, Betriebssystem und Sprachverstand-Commit
- URL und Zeitpunkt des Tests
- Ladezeit bis `DOMContentLoaded` und bis zum Ende der Beobachtungsphase
- verbleibende offensichtliche Kandidaten wie `:innen`, `*innen`, `_innen` und
  Binnen-I-Schreibweisen im sichtbaren Text
- JavaScript-Fehler und nicht abgefangene Promise-Fehler
- Long Tasks beziehungsweise auffällige Blockaden des Hauptthreads
- bei vorhandenen HTML5-Videos: präsentierte Frames, P95- und Maximalabstand der
  Frames, Frame-Lücken über 120 ms, Waiting-/Stalled-Ereignisse und verworfene Frames
- Zustand geschützter Bereiche vor und nach dem Lauf
- Ergebnis der seitenbezogenen Interaktionsprobe
- soweit aus dem jeweiligen Browserpfad zuverlässig verfügbar: die von
  Sprachverstand gemeldete Ersetzungszahl

Absolute Zeitgrenzen sind bei Live-Seiten ungeeignet. Für Leistungstests ist der
Vergleich mit einem Lauf derselben Seite ohne Erweiterung aussagekräftiger.

### Gepaarte Phasenmessung (10.10.2026)

Der manuelle Workflow `Reale Webseiten` unterstützt optional `pairs=1..5`
(`npm run test:real-world -- --site 9 --pairs 3`). Pro Paar werden
frische Chromium-Sitzungen verglichen. Die Reihenfolge wechselt AB/BA;
der Standard bleibt ein einziges Paar. Für mehrere Paare enthält der
JSON-Report alle Einzelresultate samt Reihenfolge und Median der gültigen
A/B-Paare. Fehlerhafte Paare zählen nicht zum Median und werden separat
mitgezählt.

Die Zeitmessung zerlegt die früher einzige Sitzungsdauer in
**Browserstart**, WebDriver-Navigation, Observer-Einrichtung,
Schutzbereichs-Snapshots, seitenbezogene Interaktion, optionale
Playbacksynchronisierung, Beobachtungswartezeit, DOM-Diagnose und Screenshot.
`visitDeltaMs` zieht nur den Browserstart von der Gesamtdauer ab und
enthält weiterhin Beobachtungswartezeit, DOM-Diagnose sowie Screenshots.
Daher sind weder Gesamtdauer noch `visitDeltaMs` reine
Navigations- oder Core-DOM-Laufzeiten.

Long Tasks werden ergänzend nach ihrem Startzeitpunkt vor beziehungsweise
nach der Observer-Einrichtung aufgeteilt. `PerformanceObserver` verwendet
gepufferte Einträge, soweit der Browser dies unterstützt; die Teilmengen
sind **keine Kausalattribution** zu Sprachverstand. Öffentliche Webseiten,
CDNs, Serverantworten und Runner-Auslastung sind nicht vollständig
kontrolliert. Erst wiederholte, vergleichbar aufgebaute A/B-Reihen mit
konsistenter Phasentrennung können einen belastbaren Fehlerverdacht
begründen. Auch ein grüner Live-Report bleibt diagnostisch und ist keine
Videofreigabe.

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

## Deterministischer Video-Regressionslauf

Die normale Chromium-CI enthält zusätzlich einen lokalen Video-Regressionslauf.
Er gehört bewusst **nicht** zum Benchmark-Job, sondern zu den echten Browser-Tests.
Der lokale HTTP-Server liefert ein fest im Repository hinterlegtes, zehn
Sekunden langes WebM-Testvideo mit 30 Bildern pro Sekunde aus.
Während acht Sekunden Wiedergabe erzeugt die Fixture fortlaufend normale
DOM-Textmutationen mit `Nutzer:innen`. Derselbe Lauf wird einmal ohne und einmal
mit Erweiterung in frischen Chromium-Sitzungen ausgeführt.

Gemessen werden `requestVideoFrameCallback()`, `getVideoPlaybackQuality()`,
Frame-Lücken und der tatsächliche Wiedergabefortschritt. Der Test schlägt nur bei
klaren relativen Regressionen gegenüber der unmittelbar zuvor gemessenen Baseline
fehl. Damit bleibt er reproduzierbar und erkennt gerade die Fehlerklasse
„Erweiterung verursacht periodische Video-Hänger“, ohne von Internetgeschwindigkeit,
Werbung oder Änderungen externer Videoplattformen abzuhängen.

Die Real-World-Seiten 11 und 12 ergänzen diesen Pflichtlauf diagnostisch. Ihre
absoluten Videowerte sind ausdrücklich keine CI-Grenzwerte.

## Die zwölf Referenzseiten

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
| 11 | `https://videojs.org/` | offizielle Video.js-10-Webseite mit Player-Demo, dynamischer Steuerung und aktueller Player-UI | reale Wiedergabe mit Frame-Callbacks und messbarem Fortschritt nachweisen; Hauptthread-Long-Tasks, Frame-Lücken, Stalls, geschützte DOM-Felder und Spielerinteraktionen gegenüber Baseline vergleichen; Textspuren nur bei tatsächlicher Verfügbarkeit zählen | mittel (externe Medien-CDN) |
| 12 | `https://www.youtube.com/watch?v=aqz-KE-bpKQ` | lange Videowiedergabe auf einer mutationsreichen SPA; Big Buck Bunny als stabiler öffentlicher Videoinhalt | Wiedergabe stumm anstoßen und Video-/Long-Task-Metriken gegen die Baseline vergleichen; ein Consent-, Werbe- oder Bot-Blocker wird nur diagnostisch protokolliert | niedrig bis mittel |

### Externer Player-Stack (10.10.2026)

Die offizielle Video.js-10-Webseite
`https://videojs.org/` enthält eine HTML5-Player-Demo mit
Steuerelementen und dynamischer Bedienoberfläche. Dieser Test bietet eine
andere Player-Implementierung als YouTube, das als eigener Fall erhalten bleibt.
Er prüft nicht nur die Erreichbarkeit der Seite, sondern einen tatsächlichen
Wiedergabefortschritt und Frame-Callbacks. Snapshotdaten enthalten zudem
vorhandene und aktivierte Textspuren, ohne solche Spuren zu unterstellen.
Externes Video kann durch Netzwerk, Codec oder CDN ausfallen; der Lauf gilt
dann **nicht** als bestandener Videotest.

Zusätzliche harte Videolast- und DOM-Untertitelregressionen bleiben in der
deterministischen lokalen Chromium-Fixture; dort hängen Ergebnisse nicht von
externen Videodiensten ab. Ein einzelner Live-A/B-Lauf ist **keine**
Freigabebestätigung für ungestörte 60-FPS-Videos und für native WebVTT-Cues
(Issue #419).

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
7. Performance-Metriken und – in Browserpfaden mit zuverlässig zugänglichem
   Erweiterungszähler – die Ersetzungszahl werden als Artefakt gespeichert.
8. Bei HTML5-Videos werden zusätzlich Frame-Takt, Lücken über 120 ms,
   Waiting-/Stalled-Ereignisse sowie `getVideoPlaybackQuality()` erfasst.
9. Ein kleiner Satz stabiler Interaktionen wie Accordion öffnen, scrollen oder
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

- Chromium mit der entpackten Erweiterung in einem isolierten Browser-Kontext
  starten; Baseline und Erweiterungslauf verwenden jeweils eine frische Sitzung.
- Jeden Test einmal ohne und einmal mit Sprachverstand ausführen.
- Feste Beobachtungsfenster statt `networkidle` verwenden, weil viele Seiten
  dauerhaft Netzwerkverbindungen offen halten.
- Cookie-Banner nur mit seitenbezogenen, defensiven Helfern bedienen.
- Screenshots, Konsole, Restmuster und Performance-Daten als Artefakt sichern.
- Live-Tests ausschließlich manuell oder zeitgesteuert ausführen und nicht als
  zwingende Pull-Request-Prüfung konfigurieren.
- Bei einer Abweichung zuerst feststellen, ob die Webseite geändert wurde. Erst
  danach einen Fehler in Sprachverstand annehmen.

Damit liefern reale Webseiten brauchbare Warnsignale, ohne dass Änderungen fremder
Webseiten die normale CI unzuverlässig machen.

## Manueller Live-Lauf

Die oben beschriebene externe Automatisierung ist als eigener, nicht erforderlicher
GitHub-Actions-Workflow umgesetzt. Sie wird ausschließlich über
`workflow_dispatch` gestartet und beeinflusst weder Pull Requests noch normale
Pushes. Optional kann über den Workflow-Eingabewert `site` eine einzelne
Seiten-ID, ein Slug oder eine kommagetrennte Auswahl ausgeführt werden.

Vor jedem externen Lauf wird zuerst der deterministische lokale Chromium-Smoke-Test
ausgeführt. Erst wenn damit bewiesen ist, dass der aktuelle Build tatsächlich als
Erweiterung geladen wurde, startet die Live-Matrix. Jede ausgewählte Referenzseite
wird danach einmal ohne und einmal mit Sprachverstand in einer frischen
Chromium-Sitzung geöffnet.

Der Runner schreibt `artifacts/real-world/report.json` und Screenshots für beide
Varianten. Der Report enthält insbesondere DOM- und Textknotenzahl,
Navigationstiming, Restmuster, Long Tasks, HTML5-Video- und Frame-Metriken, nach
Start der Messung beobachtete JavaScript- und Promise-Fehler sowie ausschließlich
Hashes und Anzahlen
geschützter `input`-, `textarea`-, `contenteditable`-, `code`- und `pre`-Bereiche.
Rohinhalte dieser geschützten Bereiche werden nicht in den Report übernommen.

Die erste Automatisierungsstufe liest den Badge-/Background-Zähler absichtlich
noch nicht als angebliche Seitenmetrik aus: Aus dem normalen Webseitenkontext ist
dieser Erweiterungszustand über WebDriver nicht robust und browserübergreifend
zugänglich. Als reproduzierbare automatische Vergleichsgrößen dienen deshalb
Restmuster und die Differenzen zwischen Baseline und Erweiterungslauf. Der
Ersetzungszähler bleibt Bestandteil der manuellen seitenbezogenen Prüfung, bis ein
stabiler Erweiterungs-Kontext dafür automatisiert adressiert werden kann.

Einzelne nicht erreichbare oder durch Bot-Schutz veränderte Live-Seiten werden als
Diagnosefehler im Artefakt festgehalten, machen den Runner aber nicht automatisch
unbrauchbar. Der Lauf schlägt auf Runner-Ebene nur fehl, wenn keine einzige
ausgewählte Seite erfolgreich mit der Erweiterung geprüft werden konnte. Dadurch
bleibt die Live-Matrix ein Warn- und Untersuchungsinstrument und wird nicht zu
einer flüchtigen Freigabesperre.

Lokal kann die Konfiguration ohne Netzwerkzugriff mit
`npm run validate:real-world` geprüft werden. Ein tatsächlicher Live-Lauf erfolgt
nach vorhandenem Chromium-Build mit `npm run test:real-world`; über
`-- --site 8,9` lassen sich beispielsweise nur GitHub und die große
Wikipedia-Referenzseite auswählen.