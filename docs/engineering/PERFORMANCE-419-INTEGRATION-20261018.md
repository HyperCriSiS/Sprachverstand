# Performance #419: Integration und Einordnung, 18.10.2026

Dieser Stand ersetzt Draft-PR #451 und den gestapelten Diagnosestrang
`X/*` (139 Commits, Spitze `ca482fc` auf
`X/repair-native-commandline-probe-20261018`). Die vollständigen Messprotokolle
bleiben dort unverändert archiviert und werden nicht nach `main` übernommen,
insbesondere `PERFORMANCE-WINDOWS-20261011.md`,
`PERFORMANCE-NATIVE-CLOCK-20261016.md`, `LINUX-OWNED-IO-WAITS-20261017.md`,
`NAVIGATION-START-DIAGNOSTICS-20261017.md` und `VIDEO30-CONTROLS-20261017.md`.

## Übernommen

- Alle Produktänderungen unter `src/` aus dem Strang (Hintergrundverarbeitung,
  Kandidatenfilter, Zeitbudgets, Warteschlangencursor, Wiederherstellung,
  ShadowRoot-Erkennung, Einstellungs- und Statusoptimierungen) samt Tests.
- Test- und Diagnoseskripte, die von regulärer CI, `package.json`, einem
  manuellen Workflow oder einem Test verwendet werden.
- Manueller Workflow `controlled-video-performance.yml` in der letzten
  regulären 60-FPS-Fassung (`1ea2452`), nicht in der später überschriebenen
  Linux-I/O-Fassung.

## Bewusst nicht übernommen

- Die Linux-Systemdiagnose-Kette (`system-io-*`, `owned-*`, `page-dom-control`,
  `page-worker-wait-correlation`, `check-*`-Prüfer, `webdriver-public-error`).
  Sie untersucht Kernel-Dateicache, V8-Optimierungs- und Safepoint-Wartezeiten
  des Browsers und läuft nur in einem manuellen Workflow.
- Die ausführlichen Diagnose-Protokolle (siehe oben).

## Eigene Ergänzungen in diesem Stand

- **Review-Befund behoben:** Nach Update oder Deaktivieren der Erweiterung
  bleibt in Chromium das alte Content-Script aktiv, der Hintergrund ist aber
  nicht mehr erreichbar. Jeder offene Text wurde dann im Sekundentakt erneut
  angefragt. Jetzt beendet das Content-Script die Verarbeitung, wenn
  `runtime.id` fehlt; bisherige Ersetzungen bleiben stehen
  (`tests/content-orphaned-context.test.ts`).
- **Video-Prüfung:** `scripts/video-pair-gate.mjs` bewertet drei Paare in
  wechselnder Reihenfolge über den Median (`VIDEO_PAIRS`, Standard 3).
  Verworfene Frames zählen wie P95/Maximum erst nach den ersten 15
  Frameintervallen. Funktionale Prüfungen (Endtexte, Erweiterungszustand,
  DOM-Last, Baseline-Eignung) gelten weiter für jedes einzelne Paar. Die
  bisherigen Grenzwerte sind unverändert. `tests/video-pair-gate.test.mjs`
  enthält den aufgezeichneten Startausreißer aus CI `39073664813` (1/9 Drops)
  und eine Gegenprobe, nach der eine gleichmäßig oder mehrheitlich
  verschlechterte Erweiterung weiterhin rot wird.

## Unabhängige Nachmessung der Regelverarbeitung

Gleiches Textkorpus, Node, Median aus 7 Durchläufen, zwei Wiederholungen,
`main` (`ad6d727`) gegen Strangspitze `ca482fc`:

| Korpus | `main` | Strang |
| --- | ---: | ---: |
| 4.000 neutrale Texte | ~26 µs/Text | ~2,6 µs/Text |
| 4.000 Texte, 2 % gegendert | ~28 µs/Text | ~3,1 µs/Text |
| 1.000 gegenderte Texte | ~64 µs/Text | ~32 µs/Text |
| Erster Aufruf | ~44 ms | ~8 ms |

2.895 gegenderte Sätze aus Tests und Regeln liefern in beiden Profilen
byte-identische Ausgaben (5.434 Ersetzungen).

## Einordnung der verbleibenden Gegenbefunde

| Befund | Belegte Ursache | Einordnung |
| --- | --- | --- |
| Frühe Videolücke 150–250 ms (Windows-Chromium) | D3D11-Shaderkompilierung im Graphite/Dawn-Pfad; ohne Erweiterung mit einfachem Seitencode reproduziert (243 ms) | Browser, einmalig beim Start |
| Periodische Drops (30 FPS Dreierrhythmus, 60 FPS) | Abweichung zwischen gemeldetem Renderintervall und realem Takt; ohne Erweiterung 49/51/50 Drops | Messartefakt |
| Linux-CI-Navigationstimeout | Datei-I/O beim Browserstart, auch ohne Erweiterung | CI-Umgebung |
| V8-Optimierungs-/Safepoint-Wartezeiten | Mit minimaler Kontrolle ohne Erweiterung und ohne DOM-Prozessor reproduziert | Umgebung |

Real, aber klein: unter Extremlast (28.800 Textänderungen in 30 s) liegt das
60-FPS-P95 bei 27 statt 21 ms; Interaktionen unter vierfacher CPU-Drosselung
im P95 etwa 7–8 ms langsamer. Texte werden asynchron mit wenigen
Millisekunden Verzögerung ersetzt.

## Offen

- Abnahme auf echter Hardware mit normalen Seiten, Video und Untertiteln
  (Chrome, Firefox, Android).
- Mittelfristig `src/core/dom-processor.ts` (3.673 Zeilen) in Module
  aufteilen: Scheduler, Untertitel, Wiederherstellung, Inline-Schutz.
