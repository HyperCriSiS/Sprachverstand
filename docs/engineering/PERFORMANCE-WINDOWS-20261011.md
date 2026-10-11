# Lokale Windows-Performanceprüfung, 11.10.2026

Arbeitsbranch: `X/perf-dom-throughput`; Vergleichs-HEAD:
`6c3b5f4d4bb6fcba941d61a0ac450d7f16274d90`.
Die Untersuchung ergänzt und verifiziert bereits vorhandene uncommittete
Performanceänderungen. Sie ist keine isolierte Zuordnung aller Verbesserungen
zu einzelnen Änderungen und keine Releasefreigabe.

## Implementiert

- Wiederaufnahme nach neuer Nutzeranweisung: unnötige Zeitabfragen beim
  Einreihen sofortiger Arbeit und bei Knoten ohne aktiven Backoff entfernt.
  Technische Schutzmuster werden nur bei notwendigen Zeichen/Längen geprüft;
  der Partizip-Kontextscan stoppt vor unnötiger Klassifikation eindeutig
  nicht einschlägiger nichtleerer Wörter. 94 gezielte Sicherheits-, Kontext-,
  Async- und Schedulerregressionen bestanden; beide Browser-Builds erstellt.
- Die isolierte 2-ms-Variante des Async-Zeitbudgets wurde nicht übernommen:
  drei Video-/Neutralpaare korrigieren vollständig, zeigen aber keinen
  belastbaren Vorteil gegenüber dem aktuellen 1-ms-Budget.
- Neue CPU-4-Browsertrace-Probe: erstes Seitenlayout rund 35 ms in Basis und
  Erweiterung, Content-Script-Auswertung rund 32 ms; eine spätere rund
  21-ms-Aufgabe enthält rund 19 ms Major-GC. Das erklärt einzelne Spitzen,
  ersetzt aber keine unprofilierte Abnahme. Rohdaten lokal unter
  `artifacts/video-frame-cpu/trace-1-marker-{baseline,extension}.json`.
- Die Interaktionsprüfung kontrolliert alle 480 dynamischen Knoten; ein
  korrigierter erster Knoten reicht nicht mehr als Durchsatznachweis (Schema 2).
- Regeln haben notwendige Kandidatenprüfungen; aufwendige Muster werden bei
  Bedarf konstruiert und wiederverwendet. Die gesamte Sprachtestsuite prüft
  zusätzlich, dass jede tatsächliche eingebaute Regelersetzung den schnellen
  DOM-Kandidatenfilter passiert. Leichtgewichtige DOM-Regelmetadaten werden
  gegen die vollständigen Regeln geprüft.
- Der Seitenprozess lädt die großen Lexika und Transformationsmuster nicht
  mehr selbst. Verarbeitung erfolgt im lokalen Erweiterungshintergrund,
  ohne externe API oder neue Berechtigung. Kleine Texte werden begrenzt
  gebündelt; große Texte bleiben auf zwei gleichzeitige Anfragen begrenzt.
  Untertitel erhalten Vorrang. Inline-Schutzbereiche, Optionen und Kontext
  werden mitgegeben; veraltete Antworten werden verworfen.
- Fertige Antworten werden budgetiert angewendet. Wo verfügbar ersetzt
  `scheduler.postTask` mit Hintergrundpriorität die verschachtelten Nulltimer;
  verzögerte Backoffs und Browser ohne diese API behalten den Timerpfad.
- Eine gemeinsame temporäre Inline-Grenze pro synchronem Arbeitsschritt
  verhindert Chromiums teure partielle Neuberechnung. Native Textknoten und
  deren Ranges bleiben erhalten. Die Grenze wird vor Observerzustellung entfernt.
- Schutz-/Untertitelklassifikation wird nur innerhalb eines synchronen
  Arbeitsschritts gecacht. Eigene Attributschreibvorgänge invalidieren die
  Klassifikation wegen möglicher synchroner Custom-Element-Reaktionen.
- Überlappende Nachbarkontextfenster werden vereinigt. Ein Regressionstest
  kontrolliert den Laufweg und den Kasuswechsel hinter der letzten Mutation.
- Wiederholte Zusammenfassungseinträge werden vor dem lokalen Rücktransport
  zusammengezählt, ohne unterschiedliche Paare oder Ersetzungszahlen zu verlieren.
- Hintergrundausfälle führen zu Wiederholungen. Alte Anfragen blockieren nach
  einem Prozessorneustart keine neuen Parallelitätsplätze. Beim fehlgeschlagenen
  Kontextwechsel bleibt das gespeicherte Original für den Wiederholungsversuch
  erhalten; dafür wurde ein zusätzlicher Regressionstest ergänzt.

## Verifiziert und Messgrenzen

Node 24.19, Chromium 155.0.8059.39, Firefox 157.0.1 und Waterfox 153.4.
Vollständiger abschließender `npm run check`: 228 Dateien / 10.586 Tests,
Typprüfung, beide Builds, Publikations-, Icon-, Locale-, Store- und Browserprüfungen
erfolgreich. Firefox-Lint: 0 Fehler / 0 Notices / 0 Warnungen.
Nachweis: `artifacts/windows-final-check.log`.
Native Smokes aller drei Browser bestanden einschließlich geschützter Inhalte,
dynamischer Texte, zugänglicher Attribute, später ShadowRoots/designMode,
dichter Inline-Ranges sowie eines großen Einzeltextes mit vier Ranges und Restore.
Nach der letzten Fehlerpfadkorrektur bestanden alle drei nativen Smokes erneut;
Logs: `artifacts/windows-final-chromium-smoke.log`,
`artifacts/windows-final-firefox-smoke.log`, `artifacts/windows-final-waterfox-smoke.log`.

Mit gleicher verschärfter Fixture und vierfacher Renderer-Drosselung blieben
beim unveränderten HEAD in drei Läufen 165, 214 und 188 Knoten unvollständig.
Die geprüften Arbeitsstände korrigierten alle 480 Knoten. Die isolierte,
anschließend integrierte Hintergrundpriorität korrigierte 480/480 in 3/3 Läufen
bereits nach 400 ms, ohne zusätzliche Auslaufzeit und ohne Long Tasks.
Eine abschließende Paarprobe am finalen Build bestätigte ebenfalls 480/480
nach 400 ms, 0 Long Tasks und 0 Frame-Lücken über 120 ms;
Nachweis: `artifacts/interaction-performance/windows-final-build-cpu4.json`.
Deren P95-Frameabstand lag weiterhin etwa 7 ms über der Basis.

Die gemeinsame Inline-Grenze reduzierte bei vergleichbarer Video-Markerlast
zusätzliche `childList`-Records von etwa 15.000 auf etwa 1.100. Die finale
nicht profilierte CPU-4-Serie (3 Paare, Marker und neutral, echte lokale
FFprobe-geprüfte 60-FPS-Quelle) bestätigte vollständigen Auslauf aller Texte
in allen Erweiterungsläufen. P95 lag mit Erweiterung bei etwa 32,1 ms;
rohe maximale Frameabstände blieben unter 80 ms. Trotzdem lagen die
Framecallbackzahlen der Markerserien etwa 6–14 % unter den jeweiligen Baselines.
Einzelne anfängliche Long Tasks von etwa 50–75 ms bleiben sichtbar.

Die unveränderte 60-FPS-Hauptprüfung bestand: Basis/Erweiterung 421/369
Callbacks, P95 24,1/32,1 ms, Maximum 32/48 ms, keine Lücke über 120 ms.
Sechs getrennt kontrollierte Cue-Korrekturen lagen bei etwa 9,9–10,4 ms.
Die abschließenden Wiederholungen am finalen Build bestanden ebenfalls:
30 FPS Basis/Erweiterung 230/232 Callbacks, Maximum 41,8/48,6 ms,
Drops 8/7; 60 FPS 458/465 Callbacks, Maximum je 27,9 ms, Drops 20/9.
Beide ohne Lücken über 120 ms, Untertitel Aus/An/Aus erfolgreich.
Logs: `artifacts/windows-final-video30.log`, `artifacts/windows-final-video60-2.log`.
Die erste automatische Cue-Latenz von 380,6 ms enthält das Einschalten über
die Optionsseite und ist keine isolierte aktive Cue-Latenz.

Rohdaten: `artifacts/interaction-performance/`, `artifacts/video-frame-cpu/`,
`artifacts/windows-final-video60-1.log`, Browser-Smoke-Logs unter `artifacts/`.
Alle Artefakte sind lokal und ignoriert. CDP drosselt den Renderer, nicht
nachweislich den Hintergrund; es ersetzt keine schwache Hardware.
Baselines schwankten erheblich, deshalb nur gepaarte Serien vergleichen.
`alleGueltig` bestätigt die Instrumentierung, keine Performancefreigabe.

### Wiederaufnahme: reale Großseite und Diagnosegrenzen

Die neue Wikipedia-Nvidia-Großseitenreihe bestand in drei Paaren mit rund
48.300 Elementen / 63.100 Textknoten und ohne ausschließlich durch die
Erweiterung veränderte geschützte Inhalte. Nach dem Observer lagen Long Tasks
im Median 283 ms höher, die gesamte Long-Task-Dauer jedoch 33 ms niedriger;
die Navigation war im Erweiterungslauf im Median rund 3 Sekunden früher
abgeschlossen. Ein zusätzlicher gepaarter Browsertrace zeigt die großen
Layout-/Stylespitzen sowie eine Wikipedia-Funktion in beiden Varianten;
die längste Erweiterungsfunktion blieb unter 4 ms. Diese Live-Differenzen
sind damit kein kausaler Nachweis eines Erweiterungs-Long-Tasks.
Rohdaten: `artifacts/real-world/windows-resumed-wikipedia.json`,
`windows-wikipedia-trace.json` und `trace-wikipedia-nvidia-gpus-0-*.json`.

Die Windows-Messhilfe hing nach allen sechs abgeschlossenen Besuchen an
`chrome.exe --version`. Der genau identifizierte selbst gestartete Prozess
wurde beendet und die Daten gesichert. Die Browserversion kommt nun aus
WebDriver; übrige CLI-Versionsabfragen haben ein 5-Sekunden-Limit. Der neue
Trace-Lauf beendet sich regulär und meldet Chromium 155.0.8059.39.

Eine isolierte Minifizierung des nun leichten Content-Scripts reduzierte
150.403 auf 76.782 Bytes, seine CPU-4-Auswertung blieb jedoch bei rund
33 ms gegenüber zuvor rund 32 ms. Die Buildoptionen wurden nicht geändert.

### Eigenständige Gecko-Videoabnahme

Die vorhandenen lokalen Videowerkzeuge unterstützen nun `--browser firefox`
mit frischen temporären Add-ons und Profilen. Sampling und CPU-Drosselung
werden für Gecko ausdrücklich abgelehnt. Firefox 157.0.1 bestätigte in drei
60-FPS-Marker-/Neutralpaaren vollständige 480/480-Korrektur: Marker
Basis/Erweiterung 197/194, 198/195, 197/194 Framecallbacks, neutrale Reihen
nahezu identisch; rohe größte Lücke unter 63 ms. Die erste Reihe hatte eine
falsche Long-Task-Unterstützungsmarkierung; ihre leeren Listen sind **kein**
Long-Task-Nachweis. Das Werkzeug prüft inzwischen `supportedEntryTypes`;
der nachfolgende Firefox-Abschluss- und Waterfox-Lauf melden korrekt
`longTaskSupported=false`, im kompakten Log `longTasks=null`.

Firefox-30-FPS-Frameprüfung: 197/195 Callbacks, größte Erweiterungslücke
50,24 ms. Anschließende Aus/An/Aus-Probe und sechs kontrollierte Cues
10–12 ms bestanden. Firefox-60-FPS-Gesamtprüfung: 198/195 Callbacks,
größte Erweiterungslücke 50,56 ms; Aus/An/Aus und sechs Cues 10–14 ms
bestanden. Waterfox 153.4: Marker 197/195, neutral 197/197, vollständiger
Auslauf; separate 60-FPS-Prüfung 197/196, Aus/An/Aus, Cues 11–15 ms.
Headless-Callbackzahlen entsprechen hier keiner Garantie physisch
angezeigter 60 Bilder/s; Vergleiche gelten jeweils für dieselbe Engine.

Für die Optionsseiten-Navigation startet die Gecko-Untertitelprobe ihren
lokalen Testdriver mit dem notwendigen
[`--allow-system-access`](https://firefox-source-docs.mozilla.org/testing/geckodriver/Flags.html#allow-system-access).
Das betrifft ausschließlich den Testbrowser; Manifestrechte bleiben gleich.
Die vorhandene Gecko-CI prüft nun zusätzlich 30-FPS-Playback und reale Cues;
ein unabhängiger Lauf des neuen Stands ist noch offen.

Der erneute Gesamtcheck vor der Zähler-Cache-Untersuchung bestand mit
228 Testdateien / 10.607 Tests, Typprüfung, beiden Builds und Firefox-Lint
0/0/0. Aktuelle native Chromium-/Firefox-/Waterfox-Smokes bestanden;
Chromium-60-FPS-Wiederholung 454/455 Callbacks, größte Lücke je 27,9 ms,
Drops 8/1. Die CPU-4-Interaktion korrigiert weiter vollständig, zeigt aber
im Median rund 13,7 ms zusätzlichen P95-Frameabstand. Ein zusätzlicher Cache
für Texte mit wechselndem numerischem Endzähler wurde nicht übernommen:
der direkte Vergleich zweier ansonsten gleicher Erweiterungsbuilds zeigte
keinen stabilen Framegewinn (drei Paare: bisher/Cache 412/363, 371/374,
362/368 Callbacks). Die instrumentierte Einzelprobe bestätigte 2.900 Hits
bei 2.948 Anfragen; fehlende Treffer erklären den ausbleibenden Gewinn somit
nicht. Nach Entfernen dieses Versuchs bestand der vollständige Check erneut
mit 228 Dateien / 10.607 Tests und Firefox-Lint 0/0/0.

Die vorhandene CPU-4-Browsertrace zeigt einen konkreten Restkostenpunkt:
Basis/Erweiterung 162/473 Layouts, insgesamt 560/1.477 ms Layoutzeit,
188/677 ms PrePaint und 512/916 ms Paint. Die Anfangslayouts dauern jeweils
rund 34,5 ms; kein Layout liegt vollständig innerhalb einer FunctionCall-
Spanne auf demselben Thread. Das spricht für zusätzliche Renderarbeit zwischen
den Aufgaben, nicht für ein im Trace belegtes synchron erzwungenes Layout.
Die Summen sind Diagnosewerte eines Paars und keine allgemeine Hardwaregrenze.
Der neue Auslaufnachweis und das rohe Framemaximum sind getrennte Berichtsfelder;
ein gefiltertes Lückenmaximum von 0 ist kein rohes Maximum von 0.

## Ergänzende Prüfungen und Korrekturen

### Entfernen großer neutraler Unterbäume

Ein weiterer Engpass wurde auf dem geprüften Arbeitsstand reproduziert:
50.000 versteckte neutrale Elemente entfernen, während genau eine eigene
Textänderung außerhalb dieses Unterbaums verfolgt wird. Drei frische CPU-4-
Paare zeigen bis zum nächsten Bild Basis/Erweiterung rund 9,5/101,2,
10,2/139,8 und 10,8/117,8 ms. Ursache ist der synchrone `forgetRoot()`-
Vollscan, obwohl im entfernten Baum nichts zu restaurieren ist.
Bei höchstens 64 verfolgten Einträgen prüft der Prozessor nun zuerst deren
Zugehörigkeit einschließlich verschachtelter ShadowRoots. Ohne eigenen
Eintrag entfällt der Vollscan; größere Trackingmengen behalten den bisherigen
Traversierungspfad. Drei identische Nachher-Paare zeigen rund 10/12 ms;
kein Textverlust, kein zusätzlicher Long-Task-Nachweis. Die reine Bildlatenz
ist hier der maßgebliche Reproduktionswert. Fünf Regressionen sichern den
ausbleibenden Scan, Restaurierung/Recycling, ShadowRoots, größere Mengen
und verspätete Antworten nach Entfernen. Gesamtcheck: 229 Dateien / 10.612
Tests, beide Builds und Firefox-Lint 0/0/0.

### Unabhängige Prüfung der Draft-PR #451

Commit `6bc2185` bestand die [vollständige PR-CI](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38177127648)
einschließlich Gecko-Video/Cues, Chromium, Performance und CodeQL.
Firefox-Playback Basis/Erweiterung 193/198 Callbacks, Maximum 50,26/50,76 ms,
je 0 Drops. [Fünf Interaktionspaare](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38177136928)
waren vollständig ohne verspätete Korrekturen; P95-Frame- und Long-Task-
Mediandeltas 0, Eingabe +0,9 ms, Klick +10,7 ms.
[60-FPS-Hauptprobe](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38177138445):
379/366 Callbacks, P95 je 33,4 ms, Maximum 33,5/33,4 ms, Drops 2/1.
Die separat kontrollierten Cues lagen bei 10,4–13,1 ms; der mit dem
Einstellungswechsel vermischte erste Cue bei etwa 296 ms bleibt getrennt.

**Gegenbefund trotz technisch grüner Diagnose:** Die
[drei Video-A/B-Paare ohne Sampler](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38177140195)
auf Chromium 154.0.8037.0 zeigen Marker-Frames 391/329, 453/381 und 427/401.
Im ersten Erweiterungslauf vier Long Tasks bis 221 ms und 250,1 ms rohe
Frame-Lücke; Endtexte in allen Sitzungen vollständig. Der
[nachfolgende profilierte Lauf](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38177431232)
zeigte Marker 394/372, 453/374, 392/374, eine Spitze von 83,3 ms und keine
Lücke über 120 ms. Der frühere Gegenbefund wird dadurch nicht aufgehoben.
Die Diagnose-Grenzen sind keine endgültige Performance-/Releasefreigabe.

Die Video-Diagnose unterstützt zusätzlich `--browser-trace` (nur Chromium),
um Layout, Paint und Compilerarbeit vor Navigation bis zum abgeschlossenen
Last-/Auslauffenster zu sichern. Native CPU-4-A/B-Probe: zwei gültige JSON-
Traces, vollständige Endtexte. Das Abrufen der Tracestreams liegt außerhalb
der Auslauffrist und eines aktiven V8-Samplingfensters; Fehlerpfade besitzen
Zeitlimits und schließen die lokale Verbindung. Der manuelle Workflow bietet
die Option standardmäßig deaktiviert an. Trace-/Samplingwerte bleiben wegen
zusätzlicher Instrumentierung von ungeprofilten Abnahmewerten getrennt.
Unvollständige Endtexte nach dem begrenzten Auslauf lassen die Diagnose nun
ausdrücklich fehlschlagen, zusätzlich zur Instrumentierungsvalidität.

### Externe Wiedergabe auf Windows

Video.js ist jetzt in zwei frischen 15-Sekunden-Paaren tatsächlich gemessen:
Basis/Erweiterung 327/330 und 334/336 Framecallbacks, Videozeitfortschritt
je etwa 15 Sekunden, 0 Lücken über 120 ms, Drops 32/32 und 32/29.
Ein erstes Long-Task-Paar 52/164 ms ist noch nicht kausal zugeordnet;
zweites Paar je 0. Untertitelspuren waren vorhanden, aber nicht eingeblendet:
dieser Nachweis ersetzt keine externe Abnahme mit aktiven Untertiteln.
YouTube lieferte zunächst wegen eines sichtbaren Consent-Dialogs keinen
ausreichenden Zeitfortschritt. Nach Ablehnen optionaler Cookies wurden in zwei
frischen Paaren jeweils rund 15 Sekunden Wiedergabe nachgewiesen. Die Seite
enthielt weiterhin große Frameabstände und Long Tasks in beiden Modi; ohne
aktive Caption-Wechsel ist dies keine Untertitelabnahme.

Die bisherige VideoJS-Startseite zeigte nur ein Hintergrundvideo. Der Matrixeintrag
verweist deshalb jetzt auf die offizielle Caption-Anleitung mit WebVTT-Demo.
Zwei frische A/B-Paare belegen jeweils eine eingeblendete Textspur, zwei
Caption-Wechsel und rund 15 Sekunden Wiedergabe. Baseline/Erweiterung lieferten
367/299 und 302/299 Framecallbacks, ohne Abstände über 120 ms oder Long Tasks.
Der erste Vergleich hatte unterschiedliche Tabwechsel zur Optionsaktivierung;
ein weiterer Lauf gleicht diese Sichtbarkeitswechsel an. Dieser bestätigt in
allen vier Sitzungen aktive Captions und 15 Sekunden Fortschritt, mit
366/298 und 298/297 Callbacks, P95 47,5/94,2 und 63,5/63,7 ms. Das zweite
Paar reproduziert damit den großen ersten Paarunterschied nicht. Keine
Long Tasks während der Beobachtung, jedoch vor dem Observer 0/116 und
168/160 ms Gesamtzeit. Keine Lücke über 120 ms. Reihenfolge, Kaltstart und
Seitenlast sind weiterhin getrennt zu beurteilen; der Frameunterschied darf
nicht ohne Kausalitätsnachweis der Erweiterung zugeschrieben werden.
Die Quelle und aktive Captions sind verifiziert, eine Performancefreigabe
folgt daraus nicht.

Ein zusätzlicher lokaler Test mit 5.000 bearbeiteten Absatzknoten bestätigte erst
nach 18 Sekunden alle 5.000 korrigierten Texte vor dem Entfernen. Der frühere
7-Sekunden-Versuch hatte diesen Ausgangszustand noch nicht erreicht und wird
nicht als vollständiger Wiederherstellungstest gewertet. Die Entfernung ergab
bei vierfacher CPU-Drosselung 62,5 ms bis zum ersten Frame; die Messung enthält
auch die eigene Zählprüfung. Die getrennte Kostenmessung ergibt 44,6 und
45,1 ms bis zum ersten Frame; alle 5.000 entfernten Texte sind anschließend
wiederhergestellt. Dies betrifft einen vollständig bearbeiteten Baum und wird
getrennt vom neutralen Vollscan bewertet.

Ein weiterer reproduzierbarer Vollscan trat bei einem überwiegend neutralen
50.000-Knoten-Baum mit genau einer eigenen Textänderung auf: drei CPU-4-Läufe
benötigten 118,3, 101,5 und 113,7 ms bis zum ersten Frame. Bei höchstens 64
verfolgten Einträgen werden jetzt deren Knoten direkt geprüft und
wiederhergestellt; auch verschachtelte offene ShadowRoots werden berücksichtigt.
Die Tracking-Schlüssel werden vor Änderungen an den Maps gesichert. Der neue
Regressionstest scheitert am vorherigen Stand und besteht mit dem Fix.
Native Nachmessung: 11,8, 15,2 und 12,7 ms; in allen drei Erweiterungsläufen
wurde der Text vor dem Entfernen korrigiert und danach vollständig restauriert.
Gesamtcheck: 229 Dateien / 10.620 Tests, Firefox-Lint 0/0/0; native Chromium-,
Firefox- und Waterfox-Smokes bestanden.

Die unabhängige CI auf `c60ebce` bestand vollständig. Der zusätzliche
Rendertrace-Lauf (38179728967) korrigiert alle Endtexte; einmal sind 66 ms
zusätzlicher Auslauf erforderlich. Kein erneuter 250-ms-Frameabstand, erster
Markermaximalabstand je 83,4 ms. Die erste Basis-Skriptbewertung dauert im Trace
120,1 ms, die Content-Skriptbewertung mit Erweiterung 72,0 ms. Die größte
Erweiterungsfunktion bleibt unter 3,4 ms; zusätzliche Layoutarbeit bleibt sichtbar
(159/456 Layouts, 282/648 ms Gesamtzeit). Instrumentierung verändert Laufzeiten;
der frühere Gegenbefund ist damit nicht als behoben nachgewiesen.

Die V8-Profilierung begann bisher erst nach Navigation und konnte die
Content-Skript-Initialisierung deshalb verpassen. Sie startet jetzt vorher;
der Uhrabgleich erfolgt weiterhin gegen das neu geladene Dokument. Ein nativer
Versuch lieferte drei zeitlich vertauschte Samples (-17, -19, -30 µs), die der
bisherige Parser zurückwies. Die Auswertung rekonstruiert jetzt die Zeitstempel
und sortiert Samples samt Funktionszuordnung wie
[Chrome DevTools](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/cpu_profile/CPUProfileDataModel.ts).
CPU-Zeiten bleiben nicht negativ, Samples außerhalb des Profilzeitraums und
nicht endliche Zeitwerte werden abgewiesen. Das ursprüngliche Rohprofil bleibt
unverändert gesichert; die Korrektur erweitert keine Video-Freigabegrenzen.
Verifiziert: Gesamtcheck 229 Dateien / 10.625 Tests, Firefox-Lint 0/0/0;
native Startprofilierung mit Browsertrace, plausible Zeitachsen und vollständige
Endtexte ohne zusätzlichen Auslauf. Callbacks 447/403, P95 29,3/31,3 ms,
Drops 28/47, keine Long Tasks. Dies ist instrumentierte Ursachendiagnose und
kein Ersatz für die weiterhin roten lokalen 60-FPS-Paare.

Der externe CI-Lauf (38179730841) ist technisch grün, liefert aber in allen vier
Sitzungen null Videofortschritt und null Caption-Wechsel. Diese Daten werden
korrekt als nicht verfügbar ausgewiesen. Der aktive externe Caption-Nachweis
ist damit lokal belegt; die unabhängige Runner-Abnahme bleibt offen.

Neuester Produktstand `2e9e7ca`: unabhängige PR-CI (38180206078) vollständig
grün. Fünf Interaktionspaare (38180318763) korrigieren alle 480 Texte ohne
zusätzlichen Auslauf, ohne verspätete Korrekturen, Median-P95-/Maximalframe-
und Long-Task-Mehrkosten jeweils null; Klick-/Eingabeframe -5,1/-3,7 ms.
Unabhängige 60-FPS-Prüfung (38180316535): 354/367 Callbacks, P95 je 33,4 ms,
Maximum 33,4/99,9 ms, verworfene Frames je 1.

Zwei frische lokale 60-FPS-Paare desselben Produktstands scheitern dagegen am
unveränderten Drop-Grenzwert: 54/62 und 45/51 verworfene Frames. Callbacks
425/394 und 431/396, P95 24,1/31,8 und 24,0/31,7 ms, maximale Abstände
31,8/47,7 und 32,0/48,0 ms. Dies ist ein verbleibender lokaler Gegenbefund;
die unabhängige grüne Probe hebt ihn nicht auf. Eine getrennte native
Untertitelprobe besteht mit sechs kontrollierten Cue-Latenzen 9,4–17,4 ms,
ohne Long Tasks. Der erste Schalterwechsel enthält zusätzliche Optionskosten
(350,2 ms) und wird nicht als reine Cue-Latenz ausgegeben.

## Verworfene bzw. isolierte Versuche

Einzelne Hintergrundanfragen für jeden kleinen Text verschlechterten Video
stark und wurden nicht übernommen. Ein reines 1-ms-Medienbudget verringerte
Durchsatz; Vollminifizierung beseitigte die alten Startblockaden nicht.
Frameweise Ergebnisanwendung und unverzögerte Microtask-Bündelung wurden
isoliert verglichen, ohne belastbaren zusätzlichen Framegewinn. Beide bleiben
außerhalb des Produktcodes. Die Produktbündelung behält ihre geprüfte 8-ms-Frist.
Ein neuer direkter Vergleich aktueller Erweiterung gegen eine isolierte
2-ms-Batch-Wartezeit liefert 437/396, 399/370 und 400/369 Callbacks.
P95 aktuell/Versuch 30,0/32,0, 32,0/45,8 und 31,7/37,1 ms.
Alle Endtexte werden korrigiert; die kürzere Frist wird wegen des fehlenden
Gewinns nicht übernommen. Ein isolierter Konstruktionstest in sechs frischen
Chromium-Prozessen findet für den Unicode-Leading-Kandidaten nur 0,5–0,6 ms
mit `iu` unter CPU-4; dies erklärt den 72-ms-Start-Long-Task nicht.
Ein erneuter direkter Vergleich auf der aktuellen Architektur mit einem
6-ms-Rückschreibbudget am Bildbeginn zeigte ebenfalls keinen stabilen Gewinn:
bisher/Versuch 423/363, 372/364 und 361/365 Callbacks. Alle Endtexte wurden
korrigiert; der Versuch bleibt ausschließlich im ignorierten Artefaktverzeichnis.

## Offen und nächste Arbeit

**#419 und Release bleiben NO-GO.** Die fehlende Durchsatzvollständigkeit und
die großen bisherigen Start-/Frameblockaden sind deutlich verbessert.
Verbleibender Frameverlust bei hoher Markerlast, anfängliche kleinere Long Tasks,
weitere längere ungedrosselte 30-/60-FPS-Serien, reale Webseiten und unabhängige
Plattform-/Hardwareabnahme sind noch nicht vollständig abgeschlossen.
Andere Projektaufgaben wurden entsprechend der Nutzerpriorität nicht begonnen.
Keine Version, Berechtigung, Veröffentlichung oder Storefreigabe geändert.
Arbeitsfenster um 22:09 Uhr Europe/Berlin kurz vor dem bisherigen
Fünf-Stunden-Limit pausiert. Auf erneute Nutzeranweisung wird bis kurz vor
Erreichen des Kontingentlimits oder vollständigem Abschluss weitergearbeitet.
Das Nutzungs-/Freigabeprüfungskontingent hatte zwischenzeitlich weitere
Änderungen verhindert; nach Wiederaufnahme wurden Fehlerpfad, vollständiger
Check, native Smokes und 30-/60-FPS-Proben abgeschlossen.
Der Gesamtauftrag wird ausdrücklich nicht als vollständig erledigt markiert.

Reproduktion: Node 24, Browser-/Driverpfade über `CHROMIUM_BIN` und
`CHROMEWEBDRIVER`, FFmpeg/FFprobe im PATH; für Gecko `FIREFOX_BIN`,
`GECKOWEBDRIVER` und einen verfügbaren `WEBDRIVER_PORT` setzen.

```powershell
npm run check
node scripts/live-browser-smoke.mjs --browser chromium
node scripts/live-browser-smoke.mjs --browser firefox
node scripts/controlled-interaction-performance.mjs --pairs 3 --cpu-throttle 4
node scripts/video-frame-cpu-correlation.mjs --pairs 3 --mutation-mode both --cpu-profile off --cpu-throttle 4
node scripts/video-playback-regression.mjs --fps 60 --diagnose-cue-phases
```
