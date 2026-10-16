# Native Chromium-Zeitbasis: kontrollierter Gegenbefund

Stand: 16. Oktober 2026. Produktstand `f778bae`, Chromium / Chrome for Testing
155.0.8059.39. PR #451 bleibt Entwurf, #419 bleibt NO-GO. Diese Diagnose
ändert weder Produktcode noch reguläre Akzeptanzgrenzen.

## Fragestellung und repariertes Messinstrument

Die vorherige Windows-Zeitachse ohne Erweiterung zeigte 47 API-Drops:
alle 1.054 nativen Videofenster waren 6.943 µs breit, ihre tatsächlichen
Abstände lagen im Median bei 7.981 µs. Zu prüfen war, ob diese Abweichung
allein native Quellbildauslassungen verursachen kann.

Der erste Steuerprototyp ist ungültig und bleibt ausgeschlossen. Seine 750
angeforderten 8-ms-Schritte dauerten real etwa 11,4 Sekunden; beide Rollen
erreichten das Ende der zwölfsekündigen Quelle. Die nachträgliche Prüfung
lokalisiert die Hauptgrenze in der Wartefunktion: `setTimeout` und
`Atomics.wait` mit angeforderten 1–8 ms kehrten hier im Median erst nach
etwa 15,5 ms zurück. Die Browserantworten selbst dauerten im Median unter 1 ms.
Nominelle `frameTimeTicks` ersetzen die reale Medienuhr nicht.

Das reparierte lokale Instrument verwendet einen eigenen, unbenannten
[hochauflösenden Windows-Waitable-Timer](https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createwaitabletimerexw).
Es ändert keine globale Timerauflösung, Monitorfrequenz oder Energieeinstellung.
Negative Restwartezeiten werden sofort fortgesetzt. Zeitabstände der Befehle,
Antwortlatenzen, native Renderabstände, Videofortschritt und unveränderte
Medienuhr werden vor der Ergebnisauswertung geprüft.

## Kontrollierter Eingriff ohne Erweiterung

Eigener offizieller headless-shell-Prozess, keine Erweiterung, neutrale
synthetische DOM-Last. Derselbe archivierte WebM in allen vier Rollen:
814.295 Bytes, 720 VP8-Frames / 60 FPS, ausschließlich Video,
SHA-256 `48819a1f5607d5c983a73b0bac837e31d91ad7df205fbe7fd064245f40194f71`.
Eine Sekunde Vorlauf, fünf Sekunden Beobachtung, Phase 0 relativ zur
rekonstruierten Medienuhr modulo 50 ms. Nur das deklarierte Intervall wird
zwischen den Rollen geändert; tatsächlicher Steuertakt bleibt 8 ms.

| Reihenfolge | Deklariertes Intervall | API-Drops in der Beobachtung | Native Auslassungen im inneren Intervall |
| --- | ---: | ---: | ---: |
| Erste Rolle | 6.943 µs | 31 | 31 |
| Zweite Rolle | 8.000 µs | 0 | 0 |
| Umgekehrte Reihenfolge, erste Rolle | 8.000 µs | 0 | 0 |
| Umgekehrte Reihenfolge, zweite Rolle | 6.943 µs | 31 | 31 |

Pro Rolle exakt 750 native Videofenster der angeforderten Breite und exakt
8.000 µs Abstand ihrer deklarierten Anfangszeiten. Reale Befehlsserie
5.992,2–5.992,8 ms bei erwarteten 5.992 ms; reale Sendemediane 7,996–8,002 ms,
P95 höchstens 8,884 ms, maximale Senderverspätung unter 1,84 ms.
Native Renderabstände im Median 7,982–8,003 ms. Die Medienuhr läuft über die
Beobachtung jeweils etwa 4,98–4,99 Sekunden weiter, ohne Pause oder Rateänderung;
kein Videoende, keine Page-Long-Task, alle Rollen sichtbar/fokussiert.
Ursprungsunsicherheit der Medienuhr höchstens 3 µs.

Die native Auswertung umfasst je 623 innere Renderentscheidungen; ihre
Randabgrenzung ist enger als die API-Beobachtung. Die übereinstimmenden
Dropzahlen machen diese beiden Intervalle nicht identisch.

BeginFrameControl und `run-all-compositor-stages-before-draw` sind reine
Diagnosevoraussetzungen. Wie in der früheren kontrollierten Matrix ist nur
in diesen Prozessen `OnBeginFrameThrottleVideo` deaktiviert, damit die
[Videodrosselung](https://github.com/chromium/chromium/blob/155.0.8059.39/components/viz/service/frame_sinks/compositor_frame_sink_support.cc)
das angeforderte Intervall nicht ersetzt. Der
[Headless-Handler](https://github.com/chromium/chromium/blob/155.0.8059.39/headless/lib/browser/protocol/headless_handler.cc)
übernimmt Zeit und Intervall. Im
[Rendereralgorithmus](https://github.com/chromium/chromium/blob/155.0.8059.39/media/filters/video_renderer_algorithm.cc)
bestimmt diese Breite das Renderintervall; Kadenz, Überdeckung und Drift
wirken gemeinsam an der Auswahl mit. Der konkrete interne Kadenz- und
Queuezustand wird weiterhin nicht direkt gelesen.

Der isolierte Eingriff reproduziert die Auslassungen und beseitigt sie in
beiden Reihenfolgen. Damit ist der Effekt der deklarierten Intervallabweichung
für diese kontrollierte Browserkonfiguration belegt. Die genaue Ursache des
abweichenden Takts im regulären Browser und jede historische Einzelinstanz
sind damit noch nicht vollständig erklärt.

## Regulärer Browser: Headless gegen sichtbares Fenster

Neue frische Full-Chrome-Sitzungen mit demselben archivierten Video, ohne
Erweiterung und ohne experimentelle Frame-Steuerung. Reihenfolge Headless /
sichtbares Fenster / Headless: **49 / 51 / 50 API-Drops**. Alle 1.440 Endtexte
korrekt, sichtbar/fokussiert, keine Page-Long-Task. Sämtliche nativen
Videofenster sind auch im sichtbaren Browser 6.943 µs breit; tatsächliche
Abstände liegen überwiegend näher an 8 ms. Der Befund ist damit keine reine
Headless-Besonderheit. Aus der Softwarezeitachse folgt keine Messung der
physischen Bildschirmausgabe oder Festlegung auf eine Betriebssystemursache.

## Aktueller Produktbuild im sichtbaren Browser

Zwei zusätzliche Aus/an-Vergleiche prüfen `f778bae` im sichtbaren Full Chrome,
einmal Basis zuerst, einmal Erweiterung zuerst. Identische Videoquelle,
unveränderte reguläre Vergleichsgrenzen, Standardbrowserfunktionen aktiv.

| Reihenfolge | Drops Basis / Erweiterung | Callbacks Basis / Erweiterung | Größter Callbackabstand Basis / Erweiterung |
| --- | ---: | ---: | ---: |
| Basis zuerst | 50 / 41 | 426 / 424 | 32,1 / 32,4 ms |
| Erweiterung zuerst | 52 / 53 | 423 / 426 | 31,7 / 32,2 ms |

Beide relativen Vergleiche bestehen. Alle 1.920 dynamischen Endtexte und
statischen Kontrolltexte korrekt, sämtliche Rollen sichtbar/fokussiert,
keine Page-Long-Task. Der Prüfbuild ist zum verifizierten Produktbuild
bytegleich. Auch hier melden alle nativen Videofenster 6.943 µs bei
Medianabständen von etwa 7,8–8,0 ms.

Diese bestandenen Gegenproben ersetzen die frühere rote reguläre Probe mit
42/58 Drops nicht. Sie beweisen weder vollständige Regressionsfreiheit noch
ruckelfreie Wiedergabe: Die hohen absoluten Dropzahlen bleiben sichtbar.
Auch die frühe 30-FPS-Präsentationslücke, historische lange V8-/GC-Wandzeiten
und der frühere Navigationstimeout bleiben offen. Keine Compilerflags,
Erwärmung oder weicheren Grenzwerte als Produktkorrektur.

Die Rohtraces bleiben lokal. Hier stehen ausschließlich geprüfte synthetische
Aggregate; keine persönlichen Browserprofile, Gerätekennungen, Audio- oder
Mikrofonaufnahmen. Sämtliche eigenen Testsitzungen, Server und Timer beendet.
Vorherige Befunde und Produktkorrekturen:
[Windows-Performanceevidenz](PERFORMANCE-WINDOWS-20261011.md).
