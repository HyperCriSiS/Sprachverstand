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
Pakete und Browserfehlerberichte sind nach ausdrücklicher Freigabe und Einsicht
in die vollständigen Texte und den Anhang am 16.10.2026 eingereicht:
[Frame-Takt / BeginFrame #574079200](https://issues.chromium.org/issues/574079200)
und [Graphite-/FXC-Startpausen #574322346](https://issues.chromium.org/issues/574322346).
Bei beiden sind vollständiger Bericht und Quell-ZIP im Tracker verifiziert;
der Status ist jeweils „New“, keine bestätigte Diagnose oder Browserkorrektur.
Ein identischer Gegenversuch dieser beiden Chromium-Reproduktionen in anderen
Browser-Engines ist nicht nachgewiesen. Die Meldungen sind getrennte Reproduktionshilfen, keine
zusätzliche Produktkorrektur oder Gesamtfreigabe.

## Gezielte Android-Abnahme des verschachtelten ShadowRoot-Fixes

Der Produktfix `f778bae` ist zusätzlich in Firefox Nightly auf Android
geprüft. Grundlage ist das bereits isoliert gebaute Firefox-Produktpaket
(Content-SHA-256 `9b54097b9da67907baca342325f8ab24d4221a686509a1437d86c4c607892ab0`);
für die temporäre Testinstallation wurden ausschließlich die lokale
Testadresse, Erweiterungskennung und der Anzeigename begrenzt. Die zwei
älteren uncommitteten Transportversuche sind darin nicht enthalten.

Ein zunächst leerer innerer Host wird innerhalb einer bereits beobachteten
offenen ShadowRoot eingefügt. Erst nach 250 ms erhält er seine eigene
offene ShadowRoot. Der neue innere Absatz wird automatisch von
`Nutzer:innen` zu `Nutzer` korrigiert, sein Codebereich bleibt unverändert.
Auch der vorgelagerte einfache ShadowRoot-Fall, geschützter Seitencode
und ein Eingabefeld bestehen. Die Testseite ist vor und nach der Prüfung
sichtbar und fokussiert. Dies ist eine gezielte Funktionsabnahme; die
Protokollabfrage liefert keine präzise Verarbeitungslatenz.

Temporäre Erweiterung, eigene Geräte-Testdateien und eigene Weiterleitungen
sind anschließend entfernt; andere Erweiterungen und die vorherige
Bildschirm-Zeitüberschreitung sind nachweislich unverändert bzw.
wiederhergestellt. Kein Mikrofon, keine Audio-/Videoaufnahme und keine
Gerätekennung im veröffentlichten Nachweis. Die offenen Chromium-Befunde
und die Gesamtfreigabe werden durch diese Android-Abnahme nicht ersetzt.

## Windows-Firefox: aktueller Produktstand nach Statusoptimierungen

Am 17.10. wurde der unveränderte Produktlaufzeitstand `98c80cd` nach den beiden Statusoptimierungen zusätzlich mit dem normalen Firefox-Videorunner geprüft. Es werden eigene temporäre Headless-Sitzungen des nativen Windows-Firefox verwendet; dies ist keine physische Display-/Audioaufnahme oder interaktive Oberflächenabnahme. Keine Compilerflags, Dateivorladung oder veränderten Qualitätsgrenzen.

Die erste 60-FPS-Probe mit Baseline zuerst erreicht 197/195 Callbacks, jeweils null Drops, 48,62/49,14 ms maximale Callbackabstände und alle 480 Endtexte je Rolle. In umgekehrter Reihenfolge bleibt die Erweiterung bei 195 Callbacks, null Drops und 48,62 ms maximalem Abstand; die Baseline ohne Erweiterung hat jedoch 117 Drops und eine 1.964,34-ms-Lücke. Das relative Gate besteht trotzdem. Dieses Paar ist daher keine stabile Qualitätsreferenz und kein Beweis allgemeiner störungsfreier Wiedergabe. Diese beiden älteren Proben haben nur finales Fokus-/Sichtbarkeitswissen; durchgängige Framebeobachtung wird daraus nicht abgeleitet.

Die anschließende ausdrücklich instrumentierte 60-FPS-Probe beobachtet jeden Callback: sämtliche 197/196 Callbacks sind sichtbar und fokussiert, beide Rollen erreichen 480 Endtexte, null Drops und maximal 48,64/48,72 ms Callbackabstand. Die sechs kontrollierten Untertitelkorrekturen dauern 2/2/2/5/3/3 ms, die sechs Wiederholungen 2/0/1/1/0/1 ms, jeweils sichtbar und bei Ausgabe fokussiert. Der Hash des tatsächlich bereitgestellten generierten Videostreams ist `616a1a469a616c7c769d05bf391c2b030587e2373f31f1a30835ca85354a685e`. Die Browserversion steht im alten 60-FPS-Artefakt noch auf `unknown`; sie wird nicht nachträglich umgeschrieben.

Dabei wurden zwei Lücken im Messnachweis behoben: Der Runner übernimmt nun auch Firefox-/Geckodriver-Versionen aus den bereits ausgehandelten Sitzungskapazitäten; der Versionsfilter akzeptiert sichere rein numerische Versionen mit zwei bis vier Komponenten. Er verwirft weiterhin beliebige Pfade, Suffixdaten und überlange Versionsfolgen. Der Quellhash wird unmittelbar aus dem tatsächlich bereitgestellten Videopuffer berechnet, auch bei generierten 60 FPS, ohne zusätzlichen Medienzugriff während der Wiedergabe. Die 23 gezielten Runner-/Medien-/Exporttests bestehen.

Die native 30-FPS-Prüfung nach dieser Korrektur bestätigt Firefox `157.0.1`, Geckodriver `0.37.1` und den unveränderten Quellhash `13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd`. Bei Erweiterung zuerst haben Baseline/Erweiterung 197/195 sichtbare/fokussierte Callbacks, je null Drops, je 48,62 ms maximalen Abstand und alle 480 korrekten Endtexte. Die kontrollierten Cues dauern 2/3/2/3/2/2 ms, Wiederholungen 2/1/0/0/0/0 ms. Aus-/An-/Aus-Schaltung besteht in beiden instrumentierten Proben. Die beim Optionswechsel verborgenen ersten Cues zählen ausdrücklich nicht als fokussierte Korrekturlatenz. Firefox bietet hier keine Long-Task-API; null gemeldete Tasks werden nicht als gemessene Abwesenheit ausgegeben.

Diese aktuellen funktionalen und lokalen Videonachweise ersetzen weder mehrere stabile gepaarte Qualitätsreihen noch die ausstehende vollständige Plattform-/Interaktions-/Untertitelabnahme aus #419. Die rote Baseline, ältere Produktgegenbefunde und der historische Navigationstimeout bleiben erhalten; PR #451 bleibt Entwurf, keine Releasefreigabe.

### Mindestprüfung der Vergleichsbasis

Der reguläre Videorunner verwirft jetzt auch eine Baseline, deren maximaler beobachteter Callbackabstand die bereits bestehende absolute 300-ms-Sicherheitsgrenze überschreitet. Zuvor konnte eine solche Pause die relative Vergleichsgrenze erhöhen und bei besserer Erweiterungsrolle zum Erfolg führen. Die neue Prüfung läuft vor dem relativen Vergleich, bewahrt die vorab gespeicherte Paardatei und erhält den Fehlerstatus. Sie löst keine Bestätigungswiederholung aus; diese bleibt ausschließlich der bestehenden Frame-Ratio-Fehlerklasse vorbehalten. Keine bisherigen Erweiterungsgrenzen werden gelockert.

Der konkrete gespeicherte Firefox-Gegenbefund mit 1.964,34 ms wird bei erneutem Auswerten abgewiesen; die beiden gespeicherten instrumentierten Referenzen mit maximal rund 48,6 ms bestehen diese Mindestprüfung. Grenzwert, fehlende/ungültige Zahlen und der reale Befund sind gezielt geprüft; 31 relevante Runner-/Export-/Medientests bestehen. Dies ist eine minimale Referenzeignung, keine statistische Stabilitätsprüfung und keine endgültige Verschärfung sämtlicher Qualitätsgates aus #419. Der historische Lauf bleibt als damals technisch erfolgreich, qualitativ ungeeignet dokumentiert; seine Originaldaten werden nicht geändert.

### P99-Nachweis ohne neue Messreihe

Der reguläre Bericht und sein gefilterter Fehlerexport enthalten zusätzlich den in #419 geforderten P99-Frameabstand. P95, Maximum, Zähler und das bisherige Anlaufsegment bleiben unverändert: Wie bisher werden die ersten 15 gültigen Abstände für diese Zusammenfassung ausgeschlossen. Die neue P99-Zahl verwendet denselben Nearest-Rank-Vertrag wie P95. Sie ist keine Bewertung des ausgelassenen Kaltstarts. In älteren gefilterten Daten bleibt ein fehlender P99-Wert ausdrücklich unbekannt; es wird keine Null erfunden.

Eine Neuauswertung der acht gespeicherten Firefox-Rollen reproduziert sämtliche bisherigen P95-/Maximum-/Callback-/Lückenzähler exakt. P99 liegt dabei jeweils bei rund 48,60–48,64 ms. Auch die ungeeignete Baseline mit maximal 1.964,34 ms hat nur 48,62 ms P99: Ein einzelner schwerer Aussetzer kann oberhalb dieses Quantils liegen. Deshalb ersetzt P99 weder das Maximum noch die neue Mindestprüfung der Baseline oder die Untersuchung von Ausreißern. Die Rohmessungen bleiben unverändert; keine Browserreihe wurde hierfür wiederholt. 38 gezielte Medien-/Runner-/Referenz-/Exporttests bestehen, einschließlich Quantil-Rang, unverändertem Anlaufsegment, einer seltenen großen Pause und ungültigen/fehlenden Exportwerten. Keine Grenzwerte wurden geändert; eine mehrpaarige statistische Qualitätsfreigabe steht weiterhin aus.

### Vorab festgelegte vier Firefox-30-FPS-Paare

Der aktuelle Produktstand `98c80cd` wurde anschließend in vier vorab festgelegten, sequenziellen Paaren geprüft: ohne/mit Erweiterung, mit/ohne, mit/ohne, ohne/mit. Die Deklaration wurde vor der ersten Messung gespeichert. Alle verwenden denselben instrumentierten 30-FPS-Runner mit Framefokus-/Sichtbarkeitsbeobachtung und getrennten kontrollierten Cue-Phasen, dieselben normalen Browserflags und keine Dateivorladung. Es gibt weder parallele Browserproben noch eine vom Zwischenergebnis abhängige Verlängerung oder Auswahl erfolgreicher Versuche. Jedes Paar besteht im ersten Versuch; zusätzliche Ratio-Bestätigungsversuche waren nicht nötig.

Alle acht Rollen bestätigen Firefox `157.0.1`, Geckodriver `0.37.1`, den unveränderten 30-FPS-Quellhash, 480 korrekte Endtexte und sichtbare/fokussierte Framecallbacks. Insgesamt sind dies 3.840 Endtexte. Alle Baselines erfüllen die neue minimale Referenzeignung. Die Werte unten sind jeweils Baseline/Erweiterung und verwenden für P95/P99/Maximum weiterhin das etablierte Segment nach den ersten 15 Abständen.

| Paar / Reihenfolge | Callbacks | P95 ms | P99 ms | Maximum ms | Drops |
| --- | --- | --- | --- | --- | --- |
| 1 / ohne zuerst | 197 / 196 | 47,88 / 48,60 | 48,62 / 48,62 | 48,62 / 48,62 | 0 / 0 |
| 2 / mit zuerst | 197 / 195 | 48,06 / 48,62 | 48,62 / 49,04 | 48,62 / 49,52 | 0 / 0 |
| 3 / mit zuerst | 197 / 196 | 46,84 / 48,62 | 48,64 / 48,62 | 50,54 / 48,62 | 0 / 0 |
| 4 / ohne zuerst | 197 / 195 | 46,72 / 48,60 | 48,60 / 48,62 | 48,84 / 48,62 | 0 / 0 |

Die Erweiterung liefert in allen Paaren ein bis zwei Callbacks weniger und etwas höhere P95-Werte. Diese Unterschiede werden nicht als identische Leistung ausgegeben. Der tatsächliche Browser-Bildfortschritt zeigt in allen acht Rollen jedoch null lokalisierte oder unlokalisierte Quellframeauslassungen: Quell-/Präsentationsspanne 239 oder 240 Bilder, jeweils exakt gleich innerhalb einer Rolle. Zwischen Callbackeintritten können mehrere Bilder präsentiert werden; ein fehlender Callback ist daher nicht gleichbedeutend mit einem verworfenen Bild. Diese Browserzähler sind kein physischer Displaynachweis.

Die 48 kontrollierten und wiederholten Cue-Korrekturen aller vier Paare dauern 0–4 ms, sind bei Ausgabe fokussiert und bei Ausgabe/Korrektur sichtbar. Aus-/An-/Aus-Schaltung besteht in jedem Paar. Beim Optionswechsel verborgene erste Cues sind ausgeschlossen. Firefox unterstützt hier weiterhin keine Long-Task-API. Die wiederholte aktuelle Windows-Firefox-Teilprüfung ist damit positiv innerhalb dieses begrenzten Vertrags; sie erklärt weder die frühere instabile Baseline noch die Linux-/Navigationsgegenbefunde und ersetzt keine vollständige kombinierte Untertitel-/DOM-Dauerlast-, Interaktions- oder Plattformfreigabe aus #419.

### Kombinierte Firefox-Dauerlast: Video, aktive Cues und DOM-Mutationen

Eine weitere vorab deklarierte Reihe prüft dieselbe aktuelle Produktlaufzeit gleichzeitig mit 30-FPS-Video, natürlichen Untertitelwechseln und 48 DOM-Textmutationen alle 50 ms über 30 Sekunden. Die festen Rollen sind ohne/mit/mit/ohne Erweiterung, sequenziell in eigenen Sitzungen. Der bestehende `--subtitle-dom-load`-Pfad bleibt in Last und Funktionsgrenzen unverändert. Sein Bericht bindet jetzt ebenfalls Quellhash und ausgehandelte Browser-/Treiberversion; jeder Videocallback erfasst Fokus/Sichtbarkeit, deren Verlust die Funktionsabnahme scheitern lässt. Alle 30 gezielten Medien-/Runner-/Exporttests bestehen, anschließend auch die vier nativen Rollen. Der Baseline-Aufbau wartet auf laufende Wiedergabe, die Erweiterungsrolle aktiviert vorher die reale Untertiteloption; dies ist keine Kontrolle identischer Cachezustände.

Alle Rollen bestätigen Firefox 157.0.1 / Geckodriver 0.37.1, den bekannten 30-FPS-Quellhash und sichtbare/fokussierte Videocallbacks. Die Messfenster dauern 30.001–30.004 ms; 585–591 Mutationstakte entsprechen jeweils 28.080–28.368 Textänderungen. Beide Erweiterungsrollen korrigieren alle 480 finalen normalen Texte und sämtliche 52/54 Cues. Die Baselines verändern erwartungsgemäß weder normale Texte noch Cues.

| Rolle | Callbacks | P95 / P99 / Maximum ms | Drops / gesamte Bilder | Cues korrigiert | Cue-P95 / P99 / Maximum ms |
| --- | --- | --- | --- | --- | --- |
| Ohne, zuerst | 737 | 47,74 / 48,62 / 48,88 | 6 / 906 | 0 von 54 | nicht anwendbar |
| Mit | 730 | 48,62 / 48,62 / 76,38 | 6 / 907 | 52 von 52 | 4 / 5 / 5 |
| Mit, zuerst | 729 | 48,62 / 48,64 / 76,38 | 5 / 906 | 54 von 54 | 3 / 5 / 5 |
| Ohne | 737 | 46,74 / 48,60 / 49,46 | 6 / 906 | 0 von 54 | nicht anwendbar |

Wiedergabe, finale Korrektheit und sämtliche Cues bestehen; die Erweiterung hat in dieser Reihe keine zusätzlichen Drops. Dennoch steigt der maximale Renderingzeitstempel-Abstand in beiden Erweiterungsrollen reproduzierbar auf 76,38 ms, gegenüber rund 49 ms ohne Erweiterung. Die drei betroffenen Intervalle liegen bei unterschiedlichen Medienzeiten, jeweils mit zwei Präsentationen und etwa 66–67 ms Medienfortschritt. Ein konkreter Zusatzbildverlust in genau diesen Intervallen ist nicht belegt. Diese Abweichung wird weder als identische Leistung noch als erklärte Ursache ausgegeben.

Die bisherige Dauerlastprobe speichert den Renderingzeitstempel aus dem Callbackargument, aber keine unabhängige `performance.now()`-Zeit beim tatsächlichen Eintritt. Damit lässt sich eine Rendering-/Callbacktaktabweichung noch nicht von einer realen Hauptthread-Verzögerung trennen. Firefox bietet hier auch keine Long-Task-API. Vor weiterer Ursachenmessung ist diese konkrete Zeitbasislücke zu schließen; eine unveränderte Dauerlastwiederholung würde sie nicht beantworten. Die Reihe ist eine funktional positive, zeitlich teilweise offene Teilabnahme. Historische Linux-/Navigationsgegenbefunde und #419-Gesamtfreigabe bleiben offen.

### Unabhängige Eintrittsuhr für die kombinierte Dauerlast

Die gezielte Folgereihe ergänzt ausschließlich `performance.now()` beim Eintritt in den bereits bestehenden Videocallback. Sie erzeugt weder einen zusätzlichen rAF noch einen Timerbeobachter. Die tatsächliche Eintrittsuhr wird getrennt vom Renderingzeitstempel zusammengefasst; fehlende, nichtfinite, negative oder rückwärts laufende Eintrittswerte bleiben ausdrücklich unbekannt. Alte Messungen werden nicht aus Renderingzeiten rekonstruiert. Die bisherigen Prüfgrenzen und Anlaufsegmente bleiben bestehen. 37 relevante Tests prüfen unter anderem getrennte Uhren, fehlende Werte und zulässige Zeitquantisierung.

Vier erneut vorab festgelegte Rollen ohne/mit/mit/ohne Erweiterung erfüllen Quell-/Versionsbindung, Fokus/Sichtbarkeit und sämtliche Funktionsbedingungen. Beide Erweiterungsrollen korrigieren jeweils alle 53 Cues und 480 finalen normalen Texte; maximale Cue-Latenzen 5 beziehungsweise 3 ms. Die Messfenster dauern 30.000–30.001 ms. Die unabhängige Uhr bestätigt die Abweichung:

| Rolle | Renderingmaximum ms | Tatsächliches Eintrittsmaximum ms | Eintritts-P99 ms | Callbacks | Drops / gesamte Bilder |
| --- | --- | --- | --- | --- | --- |
| Ohne, zuerst | 48,90 | 50 | 49 | 739 | 6 / 906 |
| Mit | 76,40 | 77 | 50 | 731 | 5 / 906 |
| Mit, zuerst | 76,40 | 77 | 50 | 728 | 6 / 906 |
| Ohne | 50,52 | 50 | 49 | 737 | 5 / 906 |

In der ersten Erweiterungsrolle fallen Renderingmaximum und tatsächliches Eintrittsmaximum in dasselbe Intervall. In der zweiten liegt beim Renderingmaximum ein tatsächlicher Abstand von 76 ms vor; ihr Eintrittsmaximum von 77 ms gehört zu einem anderen, ebenfalls rund 76,38-ms-Renderingintervall. Damit ist ein bloßes Artefakt der Renderingzeitstempel als vollständige Erklärung ausgeschlossen. Die betroffenen Intervalle zeigen weiterhin jeweils zwei Präsentationen bei rund 66–67 ms Medienfortschritt. Ein konkreter CPU-/GC-/Schedulerblock oder additiver Bildverlust ist daraus nicht bewiesen.

Die nächste begrenzte Ursachenfrage ist, ob vergleichbare zusätzliche Text-Rückschreibungen durch einen minimalen seiteneigenen Literaladapter ohne installierte Erweiterung dieselbe Abweichung in genau dieser Firefox-Dauerlast erzeugen. Frühere Literaltests in anderen Browsern oder Fixtures beantworten das nicht. Bis zu dieser Abgrenzung bleibt der 77-ms-Gegenbefund offen; eine unveränderte Wiederholung derselben Reihe würde keine neue Ursache isolieren. Keine Produktregel, Cachevorladung oder Browserflagänderung wird aus dem Befund abgeleitet.

### Kontrollierte Text-Rückschreibungen ohne Erweiterung

Die gezielte Kontrolle auf Diagnosequelle `dd6e742` ersetzt ausschließlich bekannte synthetische Fixturetexte durch einen kleinen seiteneigenen MutationObserver. Sie installiert keine Erweiterung und lädt weder Produktregeln noch Hintergrundtransport. Nur die beiden bekannten statischen/Cue-Ziele sowie unmittelbar im eigenen Lastcontainer liegende, exakt passende Spans werden verändert; Code, Eingaben und übrige Texte bleiben unangetastet. Tatsächliche Normal-/Cue-Rückschreibungen werden gezählt. Beide Kontrollrollen müssen wie das Produkt alle Cues und 480 finale normale Texte korrigieren. Diese Diagnose wird nicht in die Produktlaufzeit übernommen.

Ein erster Aufbauversuch brach in beiden Kontrollrollen vor Messbeginn ab, weil der WebDriver-Aufruf die Installationsbestätigung nicht zurückgab. Die beiden übrigen Produktrollen dieses unvollständigen Versuchs sind keine gültige gepaarte Kontrolle. Der korrigierte Transport enthält ein explizites `return`; ein Test führt den tatsächlich serialisierten Installationscode aus und prüft dessen Rückgabe samt Schutzverhalten. 32 relevante Tests und die Argumentwächter bestehen.

Die danach separat vorab deklarierte gültige Reihe hat feste Rollen Literal/Produkt/Produkt/Literal, je 30 Sekunden unter unveränderter Stresslast. Alle vier Rollen bestehen Quelle/Version, sichtbare/fokussierte Callbacks, Cuekorrektheit und 480 finale normale Texte. Die Literalrollen laufen über frische Sitzungen ohne Add-on-Installation; ihr Bericht bindet `extensionInstalled:false` und `synthetic-literal` an diesen Aufbau. Die Literalrollen führen 28.224/28.176 normale Rückschreibungen aus, zusätzlich zu den Cuekorrekturen.

| Rolle | Tatsächliches Eintrittsmaximum / P99 ms | Renderingmaximum ms | Drops / gesamte Bilder | Cues korrigiert | Cue-Maximum ms |
| --- | --- | --- | --- | --- | --- |
| Literal, zuerst | 71 / 49 | 72,64 | 5 / 906 | 54 von 54 | 1 |
| Produkt | 76 / 50 | 76,38 | 5 / 906 | 53 von 53 | 5 |
| Produkt, zuerst | 51 / 50 | 48,62 | 5 / 906 | 54 von 54 | 6 |
| Literal | 73 / 49 | 72,78 | 6 / 906 | 53 von 53 | 1 |

Damit können zusätzliche Text-Rückschreibungen bereits ohne Produktpipeline tatsächliche Callbackabstände über 70 ms erzeugen. Die zweite Produktrolle bleibt hier bei 51 ms; ein dauerhaft ausschließlich dem Produkt eigener 77-ms-Effekt ist damit nicht belegt. Der Vergleich weist weder jedem früheren Maximum eine exakte Ursache zu noch beweist er identische Leistung: Die Cue-Latenzen und P99-Werte des Produkts liegen über der minimalen Kontrolle. Das rechtfertigt keinen Austausch der echten Sprach-/Schutzregeln durch den Literaladapter. Es gibt weiterhin keinen physischen Displaynachweis und keine Long-Task-API in diesem Firefox. Ältere Gegenbefunde bleiben erhalten; weitere unveränderte Wiederholungen dieser Kontrolle sind nicht erforderlich.

## Aktuelle kombinierte Windows-Chromium-Abnahme mit 30 und 60 FPS

Nach dem Kontingentreset am 17.10. wurden die noch fehlenden kombinierten Prüfungen des unveränderten Produktstands `98c80cd` unter nativem Windows-Chromium ergänzt. Browser und Treiber melden jeweils `155.0.8059.39`. Es sind eigene Headless-Sitzungen, keine physische Display-/Audioaufnahme. Content-SHA `8cc5c0d2e11cbfadfd7c1191a7f62ceb0930cbe786ea4efedc1a9d144d3cee4c`, Hintergrund-SHA `c626333c1301cbb6da9c56f8a3a1890eebda2c447f4280ff5f86db8bf07eec85`; die Produktquellen sind gegenüber `98c80cd` unverändert.

Für jede Bildrate wurden vorab vier feste Rollen ohne/mit/mit/ohne Erweiterung deklariert. Jeweils 30 Sekunden Video mit natürlichen Cuewechseln und 48 DOM-Textänderungen alle 50 ms laufen gleichzeitig. Alle Rollen erreichen 600 Mutationstakte, also 28.800 Textänderungen pro Messfenster. Keine Parallelbrowser, keine Browserdateivorladung, keine Compiler-/Grafikschalter; die bestehenden Last-/Funktionsgrenzen bleiben unverändert. Fokus und Sichtbarkeit werden pro Videocallback beobachtet, Rendering- und tatsächliche Eintrittszeit getrennt ausgewertet.

### 30 FPS

Die vier Rollen verwenden die unveränderte Quelle mit SHA `13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd`. Alle Framecallbacks sind sichtbar und fokussiert, alle vier Rollen erfüllen die Funktionsbedingungen und Quell-/Versionsbindung. Die beiden Erweiterungsrollen korrigieren jeweils 57 von 57 Cues und 480 finale normale Texte; die beiden Baselines verändern diese Texte erwartungsgemäß nicht.

| Rolle | Callbacks | Tatsächliches P95 / P99 / Maximum ms | Drops / gesamte Bilder | Cue-P95 / Maximum ms |
| --- | --- | --- | --- | --- |
| Ohne, zuerst | 900 | 41,60 / 41,60 / 55,40 | 0 / 900 | nicht anwendbar |
| Mit | 899 | 41,60 / 41,70 / 55,40 | 0 / 900 | 3,40 / 4,50 |
| Mit, zuerst | 900 | 41,60 / 41,70 / 54,40 | 0 / 900 | 2,30 / 5,00 |
| Ohne | 900 | 41,60 / 41,70 / 55,40 | 0 / 901 | nicht anwendbar |

Die Long-Task-API ist in allen vier Rollen verfügbar; innerhalb der gemessenen Fenster werden keine Long Tasks beobachtet. Renderzeit-Maxima liegen bei 55,5–55,6 ms. Die Messfenster dauern 30.002,5–30.015,9 ms. Dies ist eine positive kombinierte lokale 30-FPS-Teilabnahme, kein Nachweis für alle Decoder, Webseiten oder Plattformen.

### 60 FPS mit byte-identischer Quelle

Zwei getrennte Aufrufe des vorhandenen 60-FPS-Generators liefern unterschiedliche Containerdateihashes. Für den strengeren Vergleich über getrennte Prozesse wurde deshalb genau eine Quelle mit dem vorhandenen Generator erstellt und per FFprobe als 60 FPS geprüft. Alle vier Rollen lesen exakt diese Datei; ein Quellhashwächter vor dem Serverstart verweigert abweichende Bytes. SHA aller vier Rollen: `3f879deef1a898a6981309b7f53dbbe1f19068bb2efdc406204d5ee93ea5ae50`.

Nur die lokale Diagnosekopie des bestehenden Runners verwendet diese gebundene Quelldatei; Produktcode, Browserstart, Beobachter und Grenzwerte bleiben unverändert. Das ist die Vorbereitung eines gemeinsamen synthetischen Testmediums, keine Vorladung von Browserprogrammdateien. Frühere getrennt erzeugte 60-FPS-Dateien werden nicht rückwirkend als byte-identisch bezeichnet.

Alle vier Rollen bestehen Quell-/Versionsbindung und durchgängigen Framefokus/Sichtbarkeit. Die beiden Erweiterungsrollen korrigieren wiederum je 57 von 57 Cues und 480 finale normale Texte. Die Messfenster dauern 30.002,7–30.012,3 ms.

| Rolle | Callbacks | Tatsächliches P95 / P99 / Maximum ms | Drops / gesamte Bilder | Cue-P95 / Maximum ms |
| --- | --- | --- | --- | --- |
| Ohne, zuerst | 1.799 | 21,00 / 27,80 / 27,90 | 0 / 1.800 | nicht anwendbar |
| Mit | 1.800 | 27,20 / 27,80 / 27,90 | 0 / 1.800 | 1,70 / 2,50 |
| Mit, zuerst | 1.800 | 27,70 / 27,80 / 29,00 | 0 / 1.799 | 2,20 / 3,10 |
| Ohne | 1.800 | 21,00 / 27,80 / 34,40 | 0 / 1.800 | nicht anwendbar |

Die beobachteten Drops und Long Tasks sind in allen vier Rollen null, bei verfügbarer Long-Task-API. Renderingmaxima liegen bei 27,9–34,8 ms. Die Abfragegrenzen von Gesamtbildzähler und Callbackfenster sind verschiedene Beobachtungen; deren Einzelbilddifferenzen werden nicht als zusätzliche Bildverluste ausgegeben.

Die höheren P95-Werte der Erweiterung bei 60 FPS bleiben ausdrücklich Gegenstand der Bewertung. P99, tatsächliche Maxima, Bildverlustzähler und Cuekorrektheit zeigen in dieser begrenzten Reihe keine entsprechende schwere zusätzliche Störung; daraus folgt keine behauptete identische Leistung. Insgesamt sind es acht funktional gültige Rollen, 228 korrekt verarbeitete aktive Cues und 1.920 finale normale Texte in den vier Erweiterungsrollen. Die früheren Linux-I/O-/Navigationsgegenbefunde, die Grafik-/Zeitbasisberichte und die vollständige unabhängige Qualitäts-/Plattformfreigabe aus #419 werden dadurch nicht rückwirkend geschlossen. PR #451 bleibt Entwurf.

## Fortgeführte Iteratoren für ausstehende DOM-Arbeit

Eine gezielte Quellprüfung findet ein eigenständiges Skalierungsproblem: Die Mengen für hinzugefügte Knotenlisten, Strukturmutationen, bekannte Untertiteltexte und Untertitelwurzeln verwenden bei jedem Entnahmeschritt `values().next()`. Frische V8-Set-Iteratoren beginnen erneut am Tabellenanfang und können dabei bereits gelöschte Einträge wiederholt durchlaufen. Die reguläre Knotenwarteschlange verwendet bereits einen fortgeführten Iterator; die vier übrigen Mengen bislang nicht. Die Arbeitsbudgets begrenzen zwar Schritte pro Scheibe, beseitigen diesen zusätzlichen Suchaufwand aber nicht.

`PendingSet` führt für das erste ausstehende Element einen Cursor fort. Ein teilweise bearbeiteter Stapel bleibt bis zu seiner expliziten Löschung erster Eintrag. Löschen und erneutes Einfügen ordnen ihn wie bei einem normalen Set hinten ein; `clear()` und vollständiges Leeren lösen den Cursor. Mitgliedschaft und normale Set-Iteration bleiben erhalten. Die Korrektur betrifft ausschließlich die vier genannten Arbeitsmengen, keine Textregeln, Budgets oder Erweiterungsberechtigungen.

Eine vorab festgelegte lokale native Chromium-Probe (155.0.8059.39) vergleicht beide Entnahmemuster im selben Browser über drei Größen und je vier Wiederholungen mit wechselnder Reihenfolge. Alle 24 Rollen konsumieren genau die erwarteten Elemente mit korrekter Indexsumme. Gemessen wird ausschließlich das Leeren der bereits aufgebauten Menge, ohne DOM, Erweiterungsinstallation oder Videowiedergabe:

| Elemente | Bisheriges Muster, Median | Fortgeführter Cursor, Median |
| ---: | ---: | ---: |
| 10.000 | 11,55 ms | 0,35 ms |
| 20.000 | 37,45 ms | 1,00 ms |
| 40.000 | 146,80 ms | 1,85 ms |

Damit ist der Skalierungseffekt des tatsächlich verwendeten Entnahmemusters im Browser reproduziert. Die Werte sind keine DOM-Gesamtdauer, kein Frame-/Untertitel-Latenzvergleich und keine rückwirkende Erklärung der historischen Linux-Pausen. Fünf neue Warteschlangentests prüfen teilweise bearbeitete Stapel, Löschen/Wiedereinfügen, `clear`, vollständiges Leeren und 4.000 gemischte Operationen gegen ein gewöhnliches Set. Zusammen mit allen vorhandenen DOM-Tests bestehen 54 Dateien / 372 Tests sowie TypeScript im isolierten sauberen Arbeitsstand. Die reguläre Browser-/Paketabnahme dieser Produktänderung steht zum Implementierungszeitpunkt noch aus. Keine Gesamtfreigabe aus der Mikroprobe ableiten.

Die anschließende reguläre [CI 39072752855](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39072752855) auf Produktcommit `5bc1578` endet erfolgreich; alle acht PR-Prüfungen sind grün. Vollständige Kernprüfung, reale Chromium-/Firefox-Smokes, kontrollierte Interaktion, Videoprüfungen und Paket-/Gecko-Kompatibilität bestehen. Dies ist die reguläre Abnahme der neuen Warteschlangenänderung, kein erneuter matched Vergleich der historischen roten Linux-Compiler-/Frame-Reihe. Die ursprünglichen uncommitteten Versuchdateien sind bytegleich erhalten; PR #451 bleibt Entwurf und #419 NO-GO.

## Fortgeführte Schlüssel für ausstehende Map-Aufträge

Die anschließende gezielte Prüfung findet dasselbe Entnahmemuster in den Map-Warteschlangen für Folgekontexte, Inline-Schutzvorbereitung, normale/große/Untertitel-Transformationen, normale/Untertitel-Ergebnisanwendung, Textbearbeitungspläne und zugängliche Attribute. Die Grenzen gleichzeitig aktiver Transformationen begrenzen nicht die Länge der wartenden Mengen. Normale Zustands-, Originaltext-, Ergebnisindex- und Cache-Speicher werden nicht geändert.

`PendingMap` führt den Schlüsseliterator fort und liest beim Zugriff den aktuellen Wert dieses Schlüssels. Dadurch wird ein noch ausstehender Auftrag nach `set` mit demselben Schlüssel nicht aus einem veralteten zwischengespeicherten Wert ausgeführt. Löschen/Wiedereinfügen, `clear`, vollständiges Leeren, normale Map-Iteration und Eigentumsübergabe der Textbearbeitungspläne an die Wiederherstellung behalten ihre Semantik. Die Attributnamen pro Element sind eine kleine feste Menge und bleiben normale Sets; nur die äußere Auftrags-Map erhält den Cursor.

Die native Chromium-Mikroprobe (155.0.8059.39) verwendet erneut drei Größen, vier vorab festgelegte Wiederholungen und wechselnde Alt-/Cursorreihenfolge, diesmal ausschließlich für das Map-Entnahmemuster. Alle 24 Rollen prüfen bei jedem Eintrag explizit Reihenfolge, Schlüsselindex und Wert sowie abschließend Anzahl und Indexsumme. Gemessen wird nur das Leeren einer bereits gefüllten Map, ohne DOM oder Videowiedergabe:

| Aufträge | Bisheriges Muster, Median | Fortgeführter Schlüssel, Median |
| ---: | ---: | ---: |
| 10.000 | 10,70 ms | 0,65 ms |
| 20.000 | 41,90 ms | 1,00 ms |
| 40.000 | 160,95 ms | 2,00 ms |

Fünf zusätzliche Tests prüfen insbesondere den aktualisierten Wert eines bestehenden Auftrags, Reihenfolge beim Wiedereinfügen, `clear`/Leeren, einen explizit undefinierten Map-Wert sowie 4.000 gemischte Operationen gegen eine normale Map. Zusammen mit den vorhandenen DOM- und Set-Warteschlangentests sind 55 Dateien / 377 Tests und TypeScript im isolierten Arbeitsstand geprüft. Die reguläre Abnahme des ergänzten Produktstands folgt separat. Die Mikroprobe erklärt weder die gesamte DOM-Laufzeit noch rückwirkend historische Linux-Frame-/Compiler-/Navigationsgegenbefunde; deren Freigabe bleibt offen.
