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

## Frühe 30-FPS-Lücke: separater Graphite-Gegenbefund

Eine gezielte neue Startzeitachse verwendet die unveränderte eingecheckte
30-FPS-Quelle, SHA-256
`13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd`.
Frische Chromium-Sitzungen, aktueller Produktbuild, native Media-/Viz-/GPU-
und V8-Ereignisse ab Navigation. Die frühe Lücke tritt erneut in beiden Rollen
auf. Währenddessen fehlen auch native Renderaufrufe; die Seitenhauptaufgaben
in der ersten nativen Wiedergabesekunde bleiben unter 8 ms.

| Grafikpfad, frische Sitzungen | Frühe Seitenlücke Basis / Erweiterung | API-Drops Basis / Erweiterung | Größte native Renderlücke in der ersten Sekunde Basis / Erweiterung |
| --- | ---: | ---: | ---: |
| Standard vorher | 148,4 / 241,0 ms | 4 / 9 | 146,534 / 240,045 ms |
| Nur im Diagnoseprozess Graphite deaktiviert | keine >120 ms / keine >120 ms | 0 / 4 | 32,586 / 31,308 ms |
| Zurück zum Standard, erneut frische Sitzungen | 132,5 / 243,6 ms | 4 / 9 | 126,754 / 236,312 ms |

Alle sechs Rollen haben 480 korrekte Endtexte, keine Page-Long-Task und
durchgehend sichtbare/fokussierte Frameproben. Die Vergleichsgrenzen bleiben
unverändert; auch die Standardrollen bestehen relativ, obwohl die frühen
Lücken in den Rohproben sichtbar sind. Die bekannte Zusammenfassung verwirft
die ersten 15 Callbackabstände und wird deshalb nicht als vollständige
Startabnahme ausgegeben.

Mit dem Standardpfad enthält die erste native Wiedergabesekunde lange
`DawnPlatformImpl::RunWorkerTask`-Phasen: höchstens rund 95–113 ms Wandzeit
bei rund 95–111 ms CPU-Zeit. Lange GPU-Hauptaufgaben benötigen dagegen
rund 103–120 ms Wandzeit bei weniger als 8 ms CPU-Zeit. Im Gegenprozess
fehlen die Dawn-Workerphasen und sämtliche erfassten Graphite-Rasterereignisse.
Nach Rückkehr zum Standard kommen sie zusammen mit den Lücken wieder.

Der explizite lokale Schalter `--disable-skia-graphite` wird über die eigene
Browserbefehlszeile geprüft. Laut
[pinned GPU-Konfiguration](https://github.com/chromium/chromium/blob/155.0.8059.39/gpu/config/gpu_finch_features.cc)
hat er Vorrang vor den Graphite-Featureentscheidungen. Die
[Dawn-Tracephase](https://github.com/chromium/chromium/blob/155.0.8059.39/gpu/command_buffer/service/dawn_platform.cc)
umfasst den aufgerufenen Worker-Callback; ihr Name allein benennt keinen
bestimmten Shader oder Grafiktreiberfehler. Der Eingriff wechselt den Grafikpfad
und isoliert damit noch keine einzelne interne Pipelineoperation.

Eine weitere Kontrolle ersetzt dieselben Texte ausschließlich durch kleinen
Seitencode, **ohne geladene Erweiterung**. 7.681 Textkorrekturen, 480 korrekte
Endtexte, keine Page-Long-Task; dennoch eine frühe Lücke von **243,2 ms**, sieben
API-Drops und eine Dawn-Workerphase von 97,843 ms bei 97,472 ms CPU-Zeit.
Damit lässt sich auch die längere Startlücke mit gewöhnlichen Textänderungen
ohne Sprachverstand reproduzieren. Die Zeitplanung dieses kleinen Seitencodes
ist kein exakter Ersatz für die Erweiterung und beweist keine vollständige
Gleichheit aller Renderkosten.

Eine anschließend gezielt um `gpu.dawn` und Skia-GPU-Ereignisse erweiterte
Zeitachse desselben Seitencode-Kontrollfalls benennt die lange Operation:
`CreatePipelineAsyncEvent::InitializeImpl` mit D3D11-Shaderkompilierung.
Zwei frühe Pipelines benötigen **101,085 / 87,528 ms Wandzeit** bei
**100,614 / 87,343 ms CPU-Zeit**. Darin liegen `CompileShaderFXC`-Phasen
von 16,024 + 78,951 ms beziehungsweise 60,031 + 21,010 ms.
Überlappende Graphite-`CommandBuffer::addRenderPass`-Aufrufe benötigen
101,098 / 87,579 ms Wandzeit bei nur 1,790 / 0,052 ms CPU-Zeit.
Die Auswertung prüft jeweils enthaltene Shaderphasen auf demselben Worker
und die zeitliche Überdeckung des Renderpass-Aufrufs.

Dieser stärker instrumentierte Lauf hat weiterhin keine geladene Erweiterung:
7.633 Seitentextkorrekturen, 480 korrekte Endtexte, keine Page-Long-Task,
208,968 ms frühe Seitenlücke und sechs API-Drops. Die Detailtrace belegt damit
die beteiligte Pipeline-/FXC-Arbeit und die gleichzeitigen langen
Graphite-Renderpass-Aufrufe. Welcher konkrete Shader oder Treiberfehler die
Kosten verursacht und ob jede historische Startlücke denselben internen
Ablauf hatte, wird weiterhin nicht behauptet.

Die kontrollierten Eingriffe grenzen diesen lokalen Startbefund auf den
nativen Grafikpfad ein. Sie sind keine Produktkorrektur und begründen keine
dauerhaft deaktivierte Browserfunktion. Die ursprüngliche 158,2-ms-Einzelprobe
enthielt keinen nativen Trace und wird nicht rückwirkend exakt zugeordnet.
Historische Linux-V8-/GC-Wartezustände und der Navigationstimeout werden durch
diese Windows-Grafikdiagnose ebenfalls nicht erklärt. PR #451 bleibt Entwurf,
#419 bleibt NO-GO; keine neuen Produktänderungen oder gelockerten Gates.

## Begrenzte Linux-Versionskontrolle für die offene Wartefrage

Die historische Befehlsseitenprobe verwendete Chromium 155.0.8059.0;
die spätere Dateicache-Gegenprobe bereits .39. Eine neue
[begrenzte Gegenprobe auf .0](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38865018419)
behält den geprüften rein lesenden Monitor, dieselbe Produktbasis a6e4047
und den Exportfilter bei; nur die offizielle Browser-/Driver-Version wird
angepasst. Alle zehn Versionswerte, Fokus/Sichtbarkeit und 4.800 Endtexte
sind geprüft. 16 kleine JSON-Artefakte enthalten ausschließlich erlaubte
synthetische Aggregate; native Rohdaten werden vor Dateiexport entfernt.

Der Lauf ist rot: Drops Basis/Addon **1/2, 2/0, 2/167, 2/1, 163/1**.
Keine Page-Long-Task, größter zusammengefasster Callbackabstand 50,1 ms,
größte erfasste V8-/GC-Wandphase 6,478 ms. Erneut keine D/folio-Probe und
kein ausgelöster Dateicacheabruf. Damit bleibt die historische Warte-/
Dateicachefrage auch bei passender Versionsnummer unbeantwortet.
Die hohen Dropzahlen treten hier in beiden Rollen auf; aus den exportierten
Summen wird weder ein bestimmtes natives Auslassungsmuster noch eine genaue
Version als Ursache abgeleitet. Die eigene Diagnosebranch wurde nach
terminalem Lauf und verifizierter Belegsicherung entfernt. Kein erneuter
identischer Lauf, keine Produktänderung und keine Änderung der Gates.

## Unabhängige lokale Reproduktionspakete

Zwei getrennte Quellpakete sind ohne Erweiterung, Repository-Abhängigkeiten
oder npm-Pakete lokal vorbereitet und erneut funktional geprüft. Der
Zeitbasisfall bestätigt im unabhängigen Paket 31/0 API- und native innere
Auslassungen bei gültigem realem Takt. Das kleine Grafikpaket bestätigt eine
frühe Lücke von 165,1 ms mit FXC-/Graphite-Ereignissen; sein Gegenprozess hat
keine Lücke über 120 ms, maximal 48 ms Abstand und keine erfassten FXC-/
Graphite-Ereignisse. Je 480 Endtexte korrekt, keine Page-Long-Task.

Das lokale Quellarchiv enthält insgesamt 18 geprüfte Dateien: Quellcode,
Lizenzen, Anleitungen und synthetische Videoressourcen. Sämtliche Archiveinträge
sind gegen ihre SHA-256-Manifeste geprüft. Rohtraces, Ausgabeverzeichnisse,
persönliche Pfade, Profile und Gerätekennungen sind ausgeschlossen. Die
Pakete und vorbereiteten Browserfehlerberichte sind noch nicht an einen
externen Tracker gesendet. Sie sind getrennte Reproduktionshilfen, keine
zusätzliche Produktkorrektur oder Gesamtfreigabe.
