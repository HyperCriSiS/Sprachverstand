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

### Branch-Delta nach Kontingentreset am 12.10.2026

Die Wiederaufnahme wurde gegen den aktuellen `main`-Checkpoint, den offenen
Releaseblocker #419 und Draft-PR #451 verifiziert. Im unabhängigen Trace von
`90f0a2e` liegt der 166,7-ms-Abstand bei 1398,5–1565,2 ms. `MinorGC` dauert
166,2 ms, davon `V8.GC_TIME_TO_SAFEPOINT` 165,5 ms, gleichzeitig mit einem
Maglev-Compilerthread. Die anschließende eigentliche Scavenger-Phase dauert
0,6 ms. Die CPU-Samples im Framefenster enthalten 163,2 ms GC. Damit ist die
Wartephase dieses konkreten Ausreißers belegt; eine allgemeine browserübergreifende
Ursache oder Beseitigung folgt daraus nicht.

Sampling inklusive gesammelter Objekte zeigt im lokalen direkten Vergleich
vorher/Allokationsfix 57,9/53,1 MB bei Markerlast und 13,0/9,7 MB bei neutraler
Last (Schätzwerte, jeweils acht Sekunden). NodeList-Kopien und Iteratoren in
Mutation-Callbacks entfallen; Vorfahrenlisten und Hilfsfunktionen werden bei
bereits bekannten Cache-Ergebnissen vermieden. Scope-Invalidierung und
Schutzentscheidungen bleiben erhalten. Drei unprofilierte direkte Markerpaare
zeigen keine stabile Frameverbesserung: 385/387, 397/383, 389/390 Callbacks.

Der erste CPU-4-Interaktionsvergleich gegen keine Erweiterung zeigt zwei
verspätete vollständige Korrekturen um rund 130 ms. Ein anschließender direkter
Vergleich mit der vorherigen Erweiterung (`43d5285`) über fünf frische Paare
zeigt zwei verspätete Läufe vorher und einen mit dem Fix (133/150 ms im dritten
Paar, nur vorher 133 ms im fünften). Alle 480 Texte und Schutzprüfungen bestehen;
keine Long Tasks. Dies ist kein Nachweis einer neuen Auslaufregression, aber
auch keine generelle Latenzfreigabe. Chromium-, Firefox- und Waterfox-Smokes
sowie Gesamtcheck 229 Dateien / 10.625 Tests und Firefox-Lint 0/0/0 bestehen.
Der Funktionstest für temporäre Knoten verwendet kontrollierte Timer statt
einer zufälligen 25-ms-Wallclock-Frist; alle bisherigen Ergebnisprüfungen bleiben.

Die optionale Diagnose `--allocation-profile` speichert Samplingdateien bei
16-KiB-Intervallen inklusive durch GC gesammelter Objekte. Sie ist standardmäßig
aus, auf Chromium begrenzt und verändert Laufzeiten. Native Prüfung mit Marker-
und neutraler Last: vier gültige Samplingdateien, alle Endtexte vollständig.
Kein Freigabegate wird verändert.

Die unabhängige unprofilierte Serie auf `9aacc4c` (38193208790) zeigt weiterhin
einen 200,1-ms-Abstand im ersten Marker-Erweiterungslauf und einen 107-ms-
Long Task bei 1361 ms. Alle Endtexte werden vollständig korrigiert. Mit
Allokationssampling (38193206887) zeigt das erste Paar 150 ms maximalen Abstand
und Long Tasks 114/122 ms. Die fünf Interaktionspaare (38193210423) bestehen
ohne zusätzlichen Auslauf, Median-P95 +0,1 ms, Maximalframe-/Long-Task-Mehrkosten
null. Die 60-FPS-Probe (38193212150) besteht erst im zweiten unveränderten
Paar: zuerst 448/346, danach 371/377 Callbacks. Dies ist weiterhin NO-GO,
auch bei vollständiger grüner PR-CI (38193169600).

Die externe Negativkontrolle reproduziert ohne Erweiterung auf beiden Seiten
358/295 und 296/294 Callbacks sowie Drops 38/101 und 101/102. Alle vier
Dokumente sind sichtbar und fokussiert, Wiedergabe und aktive Captions gemessen.
Der große erste Unterschied ist daher kein Nachweis einer Erweiterungsregression.
Die getrennte Linux-CI-Codecdiagnose (38193576980) zeigt H.264 nicht unterstützt,
VP8 unterstützt und Medienfehler 4 statt Wiedergabe. Dafür wird ein separat
ausgewiesener, gepinnter CfT-Browserlauf ergänzt.

Ein weiterer isolierter Wartepfad verwendet nur einen asynchronen WebDriver-
Aufruf statt wiederholter Skriptinjektionen während des Messfensters. Die
lokalen Markerpaare liefern 414/386, 392/384 und 399/402 Callbacks, ohne
Long Tasks. Das erklärt die bisherige lokale Frameabweichung nicht vollständig.
Der optionale `--wait-strategy async` wird als eigene Messvariante ausgewiesen;
Default bleibt `poll`. Alle Endtext- und Validierungsgates bleiben bestehen.

Die unabhängige System-Chromium-Kontrolle mit asynchronem Warten (38196193918,
154.0.8037.0) reproduziert 183,4 ms im ersten Erweiterungslauf und 166,7 ms
auch in einer Basis-Sitzung. Wiederholte WebDriver-Abfragen allein erklären
die Spitze damit nicht. Die separat gepinnte CfT-155-Serie (38196195509)
enthält dagegen keine Long Tasks, maximal 33,5 ms Abstand; alle Endtexte
vollständig, einmal 60 ms zusätzlicher Auslauf. Unterschiedliche Browserbuilds
belegen keine alleinige Kausalität eines Produktfixes.

CfT-155 unterstützt H.264 und beweist externe Caption-Wiedergabe im
Linux-Runner (38196192206). Ein Erweiterungslauf scheitert jedoch beim Speichern
der Untertiteloption. Ein eigener Regressionstest reproduziert die Ursache:
Die Optionsseite rendert bereits die Einstellungen, bindet Speichern und
weitere Interaktionen aber erst nach einer optionalen asynchronen Zählerabfrage.
Bei ausstehender Antwort verhindert das Formular seine normale Navigation
nicht und speichert die Änderung nicht. Die Handler werden jetzt vor der
Zählerabfrage gebunden; Fehler und verspätete Antworten blockieren keine
Bedienung und überschreiben keine neueren Werte. Fünf Regressionen sichern
ausstehende und fehlgeschlagene Antworten, Antwortreihenfolge, Live-Updates
und neue Tabkontexte. Gesamtcheck 230 Dateien / 10.630 Tests, Firefox-Lint 0/0/0.
Zwei native externe Caption-Paare bestätigen gespeicherte Option und
Wiedergabe; der unabhängige CfT-Reaudit folgt auf dem neuen Produktstand.

Der unabhängige CfT-Reaudit auf `e4ee831` (38198963932) besteht in allen sechs
Sitzungen: mindestens 15 Sekunden Fortschritt, eingeblendete Textspur, jeweils
zwei Cue-Wechsel, keine Medienfehler und keine verlorene Optionsspeicherung.
Frames Basis/Erweiterung 396/394, 395/392 und 392/392; P95 je 50,1 ms,
Maximum je rund 66,7 ms, Drops 4/3, 5/5 und 6/2. Die separate 60-FPS-Probe
(38198965541) besteht im ersten Paar: 353/368 Callbacks, Drops 1/2.

Längere native Windows-60-FPS-Last mit verifiziertem 72-Sekunden-Medium:
je eine Minute, 57.600 Seitenmutationen, alle Endtexte vollständig, keine
Long Tasks. Callbacks Basis/Erweiterung 3304/2390, P95 24,1/46,7 ms,
Drops 291/550, zuletzt präsentierte Frames 3305/3046. Eine anschließende
Negativkontrolle mit zwei No-Extension-Sitzungen reproduziert 3299/2533
Callbacks, P95 24,1/47,1 ms und Drops 290/548; zuletzt präsentiert 3300/3035.
Die zweite No-Extension-Sitzung enthält sogar 394,5 ms maximalen Abstand.
Der große erste Vergleich ist daher nicht als alleiniger Produktverlust
belegt. Callback-Zustellung und tatsächliche präsentierte Frames werden
getrennt bewertet; der langsame Zustand zeigt nahezu gleiche Videoausgabe
mit und ohne Erweiterung. Eine allgemeine Störungsfreiheit folgt daraus nicht.

Ein weiterer Hotpath ist die vollständige `childElementCount`-Zählung vor jedem
lokalen Inline-Edit; der aktuelle
[Blink-Code](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/dom/container_node.cc)
iteriert dafür alle Elementkinder. Die Prüfung nutzt jetzt eine bereits in
dieser synchronen Scope vorhandene Partition oder prüft nur das 128. Element.
Native CPU-4-Mikromessung mit 50.000 Kindern, 100 Scopes / 1600 Prüfungen:
vorher 721–748 ms, begrenzt 0,9–1,0 ms, identische Schwellenentscheidungen.
Drei direkte 480-Knoten-Framepaare ergeben noch keinen stabilen Framegewinn;
der Fix beseitigt die belegte ungebundene Zählung, ohne Texte oder Ranges zu
verändern. Gesamtcheck 230 Dateien / 10.630 Tests, Firefox-Lint 0/0/0 und
native Chromium-/Firefox-Smokes bestanden.

Auf `09afb7b` besteht die vollständige CI (38201323062). Die unabhängige
CfT-155-Serie (38201321898, drei Marker-/Neutralpaare, ohne Sampler/Trace,
asynchrones Warten) hat alle zwölf Läufe gültig, alle 480 Endtexte vollständig,
null zusätzlichen Auslauf, keine Long Tasks und Maxima von 33,4–33,5 ms.
Die System-Chromium-154-Interaktionsreihe (38201319618, fünf Paare) zeigt
dagegen im ersten Erweiterungslauf eine 152-ms-Long-Task und zwei Frameabstände
über 120 ms. Ein grüner Diagnoseworkflow hebt diesen Gegenbefund nicht auf.

Die native lange 30-FPS-Quelle unter 60 Sekunden Markerlast verarbeitet alle
480 Endtexte: Basis/Erweiterung 1792/1772 Callbacks, P95 44,8/47,4 ms,
Drops 7/20, keine Long Tasks. Dies ist ein einzelnes Paar, keine allgemeine
Performanceabnahme.

Die Interaktionsdiagnose unterstützt nun getrennt `--cpu-profile on` und
`--browser-trace`, standardmäßig beide aus. Sampling beginnt vor Navigation;
Frame-/Long-Task-Rohzeitstempel werden mit der monotonen Chromium-Uhr
abgeglichen und getrennt gespeichert. Trace-Transfer liegt außerhalb des
Samples und der Text-Abschlussfrist. Der manuelle Workflow kann außerdem
zwischen System-Chromium und dem separat gepinnten CfT wählen. Native Prüfung
beider Diagnosearten erzeugt gültige CPU-/Trace-/Timingdateien für beide Modi,
mit vollständigen Endtexten und geschützten Eingaben; relevante
Interaktions-/Supply-Chain-Tests und Publikationsaudit bestehen. Instrumentierte
Zahlen bleiben Diagnosewerte und dürfen keine unprofilierte Abnahme ersetzen.

Die neue optionale `--subtitle-dom-load`-Probe ergänzt den bestehenden echten
Aus/An/Aus-Schalter um 30 Sekunden natürliche Video-Cues und 960 normale
Textänderungen pro Sekunde. Native 60-FPS-Quelle:

| Browser | Cues vollständig | Normale Endtexte | Cue P95 / Maximum | Video-Callbacks / Drops |
| --- | --- | --- | --- | --- |
| CfT Chromium 155 | 57/57 | 480/480 | 24,0 / 29,9 ms | 1653 / 145 |
| Firefox 157 | 54/54 | 480/480 | 43 / 45 ms | 729 / 2 |
| Waterfox 153.4 | 54/54 | 480/480 | 36 / 44 ms | 730 / 2 |

Keine Frameabstände über 120 ms. Chromium meldet keine Long Tasks; Gecko hat
diese API nicht und bleibt dafür unbewertet. Cue-Latenzen entstehen direkt
in der Seite zwischen Original-DOM-Cue und korrigierendem MutationObserver,
ohne WebDriver-Zeit. Alle Frame-Metadaten und Cue-Zeitstempel bleiben im
synthetischen lokalen Rohbericht, die Standard-CI wird nicht verlängert.
Zwei identische Chromium-Kontrollen ohne Erweiterung liefern 1658/1340
Callbacks und 142/256 Drops. Die hohe Dropzahl des ersten Produktlaufs ist
damit auch ohne Produkt vorhanden; die natürlichen 57 Cues bleiben in der
Kontrolle erwartungsgemäß unverändert. Dies belegt Cue-Durchsatz unter Last,
keine störungsfreie Videoausgabe für alle Plattformen oder native WebVTT-Cues.
Unabhängig bestätigt die neue CI-Probe (38202220213) alle 57/57 Cues und
480/480 Endtexte: Cue P95 47 ms / Maximum 47,3 ms, 1631 Videocallbacks,
vier Drops, maximales Frameintervall 50,1 ms, keine Long Tasks. Die separate
Hauptvideoprobe besteht im ersten Paar, zeigt aber P95 16,8/33,3 ms und
Maximum 33,4/83,3 ms für Basis/Erweiterung; dies bleibt ein Gegenbefund zur
pauschalen Störungsfreiheit.

Die neue Budgetregression reproduziert zwei Uhr-Randfälle: Bei einem Sprung
über die erste Deadline werden Verarbeitung, Restore und Shadow-Discovery
ohne Fortschritt neu eingeplant; bei konstantem grobem Zeitstempel laufen
Verarbeitung und Restore unbegrenzt in derselben Scheibe. Fünf zuvor rote
Regressionen sichern jetzt mindestens eine Einheit Fortschritt und höchstens
128 reguläre Einheiten je budgetierter Scheibe. Expliziter synchroner Restore
bleibt vollständig, die vorhandene Shadow-Grenze von 256 Elementen bleibt
erhalten. Gesamtcheck 231 Dateien / 10.635 Tests, Builds und Firefox-Lint
0/0/0 bestanden. Native Chromium-Smoke und separate Firefox-/Waterfox-Smokes
in frischen Profilen mit `privacy.resistFingerprinting=true` bestehen inklusive
Late-Shadow, Editorwechsel und Text-/Range-Restore. Die dabei gemessene
Seitenuhr hat grobe etwa 16,7-ms-Schritte; die deterministischen Tests prüfen
die Budgetinvarianten unabhängig von der jeweiligen Browser-Uhrenpolitik.
Fünf native CPU-4-Interaktionspaare nach dem Fix verarbeiten alle 480 Texte
ohne zusätzlichen Auslauf und ohne Long Tasks. P95-Differenz weiterhin
median +8 ms auf diesem schnell aktualisierenden Windows-Setup; daraus wird
keine allgemeine Latenzfreiheit abgeleitet.

Uninstrumentierte unabhängige CfT-155-Interaktionen (38202616089, vor diesem
Budgetfix): fünf gültige Paare, alle Texte vollständig und null Auslauf,
keine Long Tasks, Maximum je 16,8 ms, medianer P95-/Max-Abstand null.
Die getrennte System-154-Startprofil-/Trace-Reihe (38202482208) reproduziert
die zuvor beobachtete 152-ms-Spitze nicht: alle sechs Frame-Maxima 16,8 ms,
keine Long Tasks. Größte Minor-GCs 2,5–4,2 ms, keine vergleichbare lange
Safepoint-Wartephase. Die sporadische Spitze bleibt daher als Gegenbefund
offen, statt aus einer guten Wiederholung als behoben erklärt zu werden.

Drei native öffentliche Wikipedia-GPU-Tabellenpaare (je zehn Sekunden)
erhalten alle geschützten Felder und DOM-Invarianten. Medianer Besuchsdelta
ohne Browserstart +11 ms, Interaktionsphase +15 ms, nach Observer erfasste
Long-Task-Summe -11 ms. Ein einzelnes Paar hat +379 ms Besuchsdelta,
hauptsächlich in den getrennten Mess-/Snapshotphasen. Weder dieses Delta
noch negative Long-Task-Differenzen belegen allein Produktkausalität.
Die native 30-FPS-Untertitel-/DOM-Lastprobe korrigiert 57/57 Cues und 480/480
Endtexte, Cue P95 24,5 ms / Maximum 27,3 ms, 900 Videocallbacks, keine Drops,
keine Long Tasks und keine Frameabstände über 120 ms.

Eine weitere native CPU-4-Probe reproduziert 32,3–39,1 ms Observer-Arbeit bei
einer neutralen Textänderung in einem 50.000-Kinder-Inline-Block mit aktiviertem
Zitatschutz. Bei höchstens 64 verfolgten Textänderungen/-plänen/-antworten
invalidiert der neue Pfad den schwachen Schutzcache und markiert ausschließlich
die innerhalb der Grenze liegenden verfolgten Texte. Unbetroffene Grenzen
berechnen ihren Cache bei Bedarf erneut; viele verfolgte Einträge behalten
die bisherige Traversierung. Dieselbe isolierte native Probe braucht danach
0,5–4,1 ms Observerzeit, erster Frame 1,0–5,3 statt 32,9–40,6 ms.
Dies misst die Invalidierung, nicht sämtliche spätere Schutztextberechnung.
Fünf neue Fälle sichern Sparse-/Dense-Zitatschutz, externe Originale,
verspätete ungeschützte Antworten und Schutzbegriffe über mehrere Inline-Nodes.
Eine bestehende Custom-Term-Regression prüft nun den tatsächlichen geschützten
Text statt eine notwendige Volltraversierung vorauszusetzen. Gesamtcheck
232 Dateien / 10.640 Tests und native Chromium-/Firefox-/Waterfox-Smokes
auf dem neu erstellten Build bestanden. Der erste Check hatte die veraltete
Traversierungsassertion aufgedeckt und wurde nach deren Verhaltensprüfung
vollständig neu ausgeführt; der vorherige Smoke auf altem Build gilt nicht
als Verifikation dieses Fixes.

Die getrennte positive Extrem-Fixture belegt anschließend eine weitere
Blockade in der eigentlichen Schutztextberechnung: Nach vollständig beendetem
Initialscan führt ein echter Kandidat im 50.000-Kinder-Inline-Block unter CPU-4
zu 179,7 ms Frameabstand. Kurze frühere Proben mit noch laufendem Initialscan
waren dafür ungeeignet und werden nicht als Gegenbeweis verwendet.
Große Schutzkontexte werden jetzt als resumierbare Traversierungs-/Ergebnis-
Vorbereitung im bestehenden Budget verarbeitet. Kleine Kontexte behalten den
synchronen Pfad; vollständige Schutzkarten werden in O(1) veröffentlicht,
Originale und Dirty-Flags bleiben bis dahin erhalten. Versionierte
Vorfahrengrenzen verhindern veraltete Karten nach Entfernen/Wiederanfügen,
unabhängige Blockänderungen starten den anderen Kontext nicht ständig neu.
Gültige gleichlange Textwechsel übertragen die Schutzkarte ohne alte Nodes
festzuhalten; Größenwechsel prüfen den Kontext erneut. Abbruch löscht die Jobs.
Dieselbe native CPU-4-Probe erreicht 11 ms Maximum im ersten Fenster; die
zusätzliche Messung über den **gesamten** späteren Auslauf bleibt bei 32,6 ms,
statt die Arbeit nur außerhalb des kurzen Fensters zu verschieben. Der
absichtlich übergroße geschützte Run bleibt unverändert, Zähler null.
Acht neue Regressionen sichern vollständige Korrektur/Schutz, Partial-Cancel,
kontinuierliche Nachbarlast, Stop, expliziten Synchronflush, Größenwechsel und
detached Mutation mit Wiederanfügen. Gesamtcheck 233 Dateien / 10.648 Tests,
DOM-Performancecheck 3/3, native Chromium-/Firefox-/Waterfox-Smokes auf dem
finalen Build bestanden. Diese isolierte Core-Fixture ersetzt keine vollständige
Video-/Plattformabnahme.

Auf dem vorherigen Code `e76eb5a` besteht die unabhängige CI 38204882652.
Die erneute Videoprobe 38205325223 ist technisch grün, zeigt aber erneut
150 ms maximales Erweiterungs-Frameintervall (Basis 33,4 ms). Die gesonderte
30-Sekunden-Untertitellast ist vollständig: 57/57 Cues, 480/480 Endtexte,
Maximum Cue 48,2 ms, maximaler Frameabstand 50 ms, zwei Drops, keine Long Tasks.
Der 150-ms-Gegenbefund bleibt offen; kein permissives Grün wird zur Freigabe.

Kontingentcheckpoint 12.10.2026, Schlussprüfung 07:39 Europe/Berlin bei 93 %
Primärkontingent: Codecommit `cada78e` vollständig in CI 38208129056 grün,
einschließlich Kern, Chromium, Gecko, Performance und CodeQL. Native finale
30-/60-FPS-Untertitellast: jeweils 57/57 Cues und 480/480 normale Endtexte,
keine Long Tasks. Bei 30 FPS 900 Callbacks / null Drops, Cue Maximum 31,5 ms;
bei 60 FPS 1661 Callbacks / 139 Drops, Cue Maximum 26,7 ms. Die älteren
Negativkontrollen zeigen ebenfalls hohe Drops, ersetzen aber keine aktuelle
gepaarte Freigabe dieses Schlusslaufs.

Die finale unabhängige Videodiagnose 38208125864 auf demselben Code ist
technisch grün und korrigiert 57/57 Cues mit Maximum 49,8 ms sowie 480/480
Endtexte (keine Long Tasks im Untertitel-Lastfenster). Die Hauptprobe zeigt
jedoch **283,4 ms** maximales Erweiterungs-Frameintervall gegenüber 33,4 ms
Basis. Dies liegt innerhalb des permissiven alten Gates und ist ausdrücklich
keine Qualitätsfreigabe. Die Ursache dieser sporadischen Spitzen und die
separate positive Windows-/Edge-/Opera-/Playerabnahme bleiben offen.
Edge, Opera und Pale Moon wurden auch beim Schlusscheck weder über PATH noch
die geprüften Windows-App-Pfade als nutzbare Installationen gefunden.

Der Checkout ist gesichert; andere Projektaufgaben wurden wegen der offenen
Performanceabnahme nicht begonnen. Der Nutzerauftrag bleibt unvollständig
und wird wegen der ausdrücklich gewünschten Kontingentgrenze unterbrochen.
Wiederaufnahme zuerst bei reproduzierbarer Zuordnung der großen
System-Chromium-Frame-Spitzen, nicht bei Release oder weiteren Fachaufgaben.

Historischer Prüfstand vor dem Kontingentreset auf Codecommit `90f0a2e`: vollständige PR-CI
38181175865 grün. Startprofil-/Render-Serie 38181173126 mit zwölf gültigen
Zeitachsen, allen Endtexten vollständig und null zusätzlichem Auslauf.
Markerframes Basis/Erweiterung 451/426, 440/433, 443/420. Erster
Erweiterungslauf erneut mit 166,7 ms maximalem Abstand ohne Long-Task-Eintrag;
GC-Samplezeit erstes Paar 25,3/228,8 ms. Dies ist ein neuer instrumentierter
Gegenbefund, keine nachgewiesene Ursache. Native Waterfox-60-FPS-Quelle:
197/196 Callbacks, P95 51,3/47,5 ms, Maximum 57,6/48,2 ms, Drops je null;
sechs kontrollierte Cues 14–15 ms. Die dort fehlende Long-Task-API bleibt
unbewertet. Nutzergrenze bei 94 % Kontingent erreicht; Auftrag weiterhin offen.

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

## Fortsetzung: sporadische Videostörung und Untertitel, 12.10.2026

Die Nutzerbeobachtung betrifft eine nicht mehr von Hand reproduzierbare
sporadische Störung der Store-Version. Die bisherige Lastfixture bleibt eine
Robustheitsprüfung; sie allein weist weder die Ursache dieser Beobachtung noch
eine allgemeine Alltagsfreigabe nach. Zusätzliche lokale native Headless-Proben
trennen nun keine zusätzliche Textlast, mäßige Last (8 Änderungen/s) und die
bisherige hohe Last (960 Änderungen/s). Dauer 30–600 Sekunden, gleiche lokale
Videoquelle und Untertitelwechsel, getrennte Sitzungen mit/ohne Erweiterung.
Die bestehenden Video-Grenzwerte wurden nicht gelockert. Rohdaten unterscheiden
Callback-Abstände, präsentierte Frames, Videozeit und Decoder-Drops; große
Callback-Lücken werden mit diesen Werten und verfügbaren Long Tasks erfasst.
Die Hauptfixture erfasst keine Long Tasks und weist diese Korrelation als
unbewertet aus. Der manuelle CI-Workflow bietet optional zwei dreiminütige
Vergleiche ohne zusätzliche DOM-Last an (`long_session`).

Zwei konkrete Untertitelkorrekturen:

- Priorisierte Cues warten nicht mehr auf das reguläre 8-ms-Sammelfenster.
  Anfragen desselben Verarbeitungsschritts bleiben gebündelt; Größen- und
  Parallelitätsgrenzen bleiben bestehen. Native dreiminütige 60-FPS-Probe ohne
  Textlast: vorher 346/346 Cues, P95 23,9 ms / Maximum 24,2 ms; nachher 345/345,
  P95 16,0 ms / Maximum 16,1 ms. Beide ohne Lücken >120 ms oder Long Tasks.
- Der vorhandene Untertitelcache wurde vom asynchronen Produktionspfad
  umgangen (Regression zunächst 2 statt 1 Hintergrundanfrage). Jetzt werden
  gültige Ergebnisse dort verwendet. Höchstens 256 Einträge; asynchrone Ein-
  und Ausgaben ab 8.192 Zeichen werden nicht gespeichert. Optionenwechsel,
  verspätete Antworten, Normaltext-Abgrenzung, Eviction, No-op, Zähler und
  Wiederherstellung sind geprüft. Native wiederholte Cues nach dem ersten
  kalten Aufruf: Chromium 0,2–0,5 ms, Firefox/Waterfox 0–1 ms innerhalb ihrer
  Uhrpräzision. Neue kontrollierte Cues: Chromium maximal 9,3 ms, Gecko 15 ms.

Die einminütigen Chromium-60-FPS-Vergleiche nach der Sammelfensterkorrektur
waren vollständig: mäßige Last 115/115 Cues, 480/480 Texte, maximal 16,1 ms;
hohe Last 115/115, 480/480, maximal 19,6 ms. Callback-Maxima je rund 32 ms,
keine Long Tasks. Drops Baseline/Erweiterung mäßig 288/280, hoch 286/279;
daraus keinen Geschwindigkeitsgewinn ableiten. Die erste dreiminütige
No-addon-Gegenprobe war deutlich langsamer (7.732 Callbacks / 1.487 Drops)
als die spätere (9.942 / 852). Letztere hatte außerdem eine 133,4-ms-Lücke
ohne Long Task, mit nur einem zusätzlichen präsentierten Frame. Negative
Kontrollen bleiben daher Teil der Ursachenprüfung.

Mit beiden Korrekturen: vollständiger Projektcheck 235 Dateien / 10.663 Tests,
beide Builds und Firefox-Lint ohne Fehler/Warnungen; anschließend zusätzlicher
Optionenwechsel-Test, fokussierte Cache-Suite 9/9. Native Chromium-, Firefox-
und Waterfox-Smokes sowie Chromium-30-FPS-Prüfung bestanden. Separate aktive
30-s-Hochlast-Cues: Chromium 57/57, maximal 17,3 ms, 480/480 Texte, keine Long
Tasks; Firefox 54/54 und Waterfox 53/53, jeweils maximal 32 ms und 480/480.
Gecko-Long-Task-API weiterhin nicht verfügbar und ausdrücklich unbewertet.
Die drei finalen CPU-4-Interaktionspaare sind ebenfalls vollständig (480/480,
kein Auslauf oder Long Task). Unter dieser künstlich gedrosselten Markerlast
bleiben rund 7,9 ms mediane P95-Frame-Mehrkosten; Klick +1,1 ms / Eingabe
+2,5 ms. Daraus keine Aussage über generell kostenfreies Browsen ableiten.

**Weiterhin kein Video-/Release-Go:** Die frische kurze Chromium-60-FPS-Probe
scheiterte unverändert an 58 Drops mit Erweiterung gegenüber 48 ohne; maximale
eingeschwungene Callback-Abstände 47,8/32,0 ms. Der Gegenbefund wird nicht durch
die erfolgreichen längeren Cue-Proben aufgehoben. Die 30-FPS-Rohdaten zeigen
auch anfängliche Lücken von 372,8 ms mit bzw. 159,1 ms ohne Erweiterung, die der
bisherige Einschwingfilter nicht als Maximum bewertet. Beide Rohdatensätze
bleiben erhalten; die ursprüngliche Nutzerstörung ist damit noch nicht kausal
zugeordnet. Keine anderen Roadmap-Aufgaben oder Veröffentlichung begonnen.

Reproduktion der längeren Vergleichsprobe (nach Build; Browserpfade wie oben):

```powershell
$env:SUBTITLE_DURATION_MS = '180000'
$env:SUBTITLE_LOAD = 'none' # alternativ moderate oder stress
node scripts/video-playback-regression.mjs --fps 60 --subtitle-only --subtitle-dom-load --subtitle-baseline
node scripts/video-playback-regression.mjs --fps 60 --subtitle-only --subtitle-dom-load --diagnose-cue-phases
```

Rohberichte liegen in `artifacts/video-playback/subtitle-dom-load-*.json` und
`video-pair-*.json`. Lokale Vorher-/Nachher-Logs und gesicherte Vorher-Berichte
liegen unter `artifacts/windows-*caption*` bzw. `windows-*everyday*`/`windows-long-*`.

### Unabhängiger Untertitelprüfstand und große Einfügelisten

Code-/Diagnosecommit `c46f2f0`: [gesamte PR-CI](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38225069510)
und [optionale Langzeitdiagnose](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38225064688)
erfolgreich. Drei Minuten ohne zusätzliche Textlast: 345/345 aktive Cues,
maximal 33,4 ms, keine Long Tasks/Lücken >120 ms; Baseline/Erweiterung jeweils
10.799 Decoder-Frames, Drops 10/5. Callbacks 10.652/9.951 und P95 16,8/33,3 ms
sind **keine** gleich große Verringerung der tatsächlichen Videopräsentation.
Die kurze Hauptprobe zeigt maximal 116,5 ms mit Erweiterung gegenüber 33,4 ms
ohne, je einen Drop. Der unabhängige 30-s-Stressfall korrigiert 56/56 Cues und
480/480 Texte, maximal 32,4 ms, ohne Long Task. Keine Freigabe allein aus Grün.

Danach ein weiterer kausal reproduzierter Arbeitsblock: Ein Fragment mit
50.000 neutralen Spans wird im MutationObserver vollständig eingereiht,
bevor eine separate frische Untertitelmutation an die Reihe kommt. Drei native
CPU-4-Core-Proben: Observer 202,3/211,3/202,7 ms, Cue 207,4/216,3/207,1 ms.
Nur neutrale Blätter früh auszusortieren verringert den Observer auf rund
165 ms und ist allein nicht ausreichend. Große statische Added-NodeLists
werden deshalb jetzt innerhalb der bestehenden Zeit-/Schrittbudgets verarbeitet;
ihre Einreihung und die eigentliche Traversal wechseln sich über Scheiben hinweg
ab. Direkte Caption-Mutationen bleiben unabhängig priorisiert. Untertitelwurzeln
erhalten weiterhin den eigenen Framepfad. Stop/Restoration verwirft offene
Listen; manuelles `flush()` bleibt vollständig synchron. Neutrale Blätter ohne
Attribute/ShadowRoot werden nur übersprungen, wenn weder Texttracking noch
ausstehende Transformation/Edits vorhanden sind. Attribute, ShadowRoots,
benutzerdefinierte Regeln und spätere Mutationen bleiben erfasst.

Derselbe vollständige native CPU-4-Auslauf nachher: Observer 6,9/6,3/6,2 ms,
Cue 10,1/9,7/9,8 ms, 50.000 Knoten erhalten, korrekter Cue und Zähler,
maximaler späterer Frameabstand 16,0–16,1 ms. **Isolierter Core-Nachweis.**

Zusätzlich die **komplette Erweiterung** mit 60-FPS-Video geprüft: Die
Burst-Fixture bereitet 50.000 neutrale Spans und einen letzten markierten Text
außerhalb des Messfensters vor und fügt sie später in einen versteckten Block
ein. Das trennt Page-Allokation und sichtbares Layout von Erweiterungsaufnahme;
es ersetzt keine allgemeine Großseiten-/Alltagsprobe. Sechs neue Sitzungen,
Reihenfolge kein Add-on / `c46f2f0` / korrigiert / korrigiert / `c46f2f0` /
kein Add-on, jeweils 30 s. Der alte Build stammt aus einem isolierten Git-Archiv
und denselben Build-Abhängigkeiten; kein produktiver Checkout wurde überschrieben.
Alle Erweiterungsläufe 58/58 Cues und letzter Text vollständig:

| Build | Burst-Cue | Letzter Text | Größte Callback-Lücke | Long Tasks |
| --- | ---: | ---: | ---: | ---: |
| vorher, 1 | 50,0 ms | 503,6 ms | 63,3 ms | 1 |
| nachher, 1 | 7,4 ms | 70,9 ms | 48,1 ms | 0 |
| nachher, 2 | 2,9 ms | 69,7 ms | 31,4 ms | 0 |
| vorher, 2 | 49,7 ms | 496,3 ms | 71,3 ms | 1 |

Die Decoder-Drops schwanken zwischen 141–146 und 271–272; sowohl alter als auch
neuer Build trifft den langsameren Zustand. Diese Zahlen separat erhalten,
nicht dem Fix zuschreiben. Rohdaten `artifacts/windows-addon-burst-{1..6}-*.json`;
Core-Logs `windows-added-neutral-burst-{before,after,cooperative}.log`.
Gesamtcheck des kooperativen Codes: 236 Dateien / 10.675 Tests, Builds und
Firefox-Lint erfolgreich. Elf neue Regressionen sichern Neutralblätter,
vollständigen Auslauf, Stop/Restart, Entfernen/Reattach, Captionpriorität,
synchrones Flush und Fortschritt trotz abgelaufener erster Zeitbudgets.
Der manuelle CI-Langlauf ergänzt optionale Burst-Gegenproben.
Finale native Chromium-/Firefox-/Waterfox-Smokes bestanden. Gecko-Burst mit
laufendem 60-FPS-Video: Firefox und Waterfox je 54/54 Cues und letzter Text
vollständig, Burst-Cue 16/18 ms, Auslauf letzter Text 336/333 ms, je zwei
Decoder-Drops, keine Lücke >120 ms. Long Tasks dort weiterhin unbewertet.
Die ursprüngliche Store-Beobachtung und der frühere kurze Drop-Gegenbefund
bleiben ohne gesonderte kausale Abnahme offen.

### Große Entfernungen: eigener Callback und native Beobachtung getrennt

Nach vollständigem Einfügen werden 50.000 neutrale Textblätter entfernt und
gleichzeitig eine frische Caption ausgegeben. Der alte Core sucht für jedes
Blatt erneut in der kleinen globalen Trackingübersicht: nativer CPU-4-Observer
166,7/146,0/141,6 ms. Ein Blattpfad allein reicht nicht aus (117–133 ms).
Große Entfernungen mit höchstens 64 Tracking-/Pending-Einträgen prüfen jetzt
einmal die eigenen abgetrennten Einträge. Inline-Schutz und größere Trackingmengen
behalten den allgemeinen Pfad; ShadowRoots, Attribute und fremde Dokumente
werden weiterhin zurückgesetzt. Vollständig entfernte offene Added-NodeLists
entfallen; teilweise verschobene Knoten bleiben verarbeitet.

Der neue Core-Callback benötigt 2,1–2,8 ms. Das ist kein Nachweis, dass die
gesamte Operation nur so lange dauert: Ab dem Beginn von `replaceChildren()`
bis zum nächsten Frame bleiben in der CPU-4-Probe 131–155 ms gegenüber
15–17 ms ohne Processor. Eine reine native MutationObserver-Kontrolle ohne
Textverarbeitung benötigt bereits rund 90–104 ms; das Entfernen des
Attributfilters löst diesen Anteil nicht (rund 95–96 ms). Beobachterkosten
und eigene Verarbeitung dürfen nicht zusammen als vollständig behoben gelten.

Die vollständige Erweiterung wurde separat mit 60-FPS-Video, ohne künstliche
CPU-Drosselung, geprüft. Neuer Build / vorheriger `a7b9c5d` / ohne Erweiterung,
jeweils frische 30-s-Sitzung, identische vorbereitete 50.001 Knoten:

| Build | Entfernung bis nächster Frame | Native DOM-Mutation | Cue nach Entfernung | Long Tasks |
| --- | ---: | ---: | ---: | ---: |
| korrigiert | 29,0 ms | 22,8 ms | 14,9 ms | 0 |
| vorher | 79,0 ms | 24,0 ms | 56,2 ms | 1 |
| ohne Erweiterung | 3,5 ms | 3,4 ms | unbewertet | 0 |

Alle 59/59 beziehungsweise 60/60 aktiven Cues korrigiert; der entfernte
markierte Tail wird zurückgesetzt. Maximaler Video-Callback-Abstand 32,0 /
73,9 / 31,1 ms, Decoder-Drops 145 / 138 / 143. Keine Verbesserung der
Decoder-Drops behauptet. Rohberichte `windows-addon-removal-{new,old,baseline}.json`.
Die neue opt-in Last `removal` misst den Beginn des DOM-Aufrufs, verlangt
vollständige vorherige Korrektur und anschließende Rücksetzung. Der manuelle
Langworkflow ergänzt unabhängige Entfernungsgegenproben.

Gesamtcheck: 237 Dateien / 10.685 Tests, Typprüfung, Builds und Firefox-Lint
0/0/0 erfolgreich. Zehn neue Regressionen schützen sparse und dichte Entfernung,
eigene Attribute, ShadowRoots, Dokumentwechsel, offene Listen und Teilverschiebung.
Die allgemeine Performanceabnahme #419 bleibt offen.

Native Entfernungsprobe und Smokes auch in Firefox und Waterfox bestanden:
je 56/56 Cues und Tail-Rücksetzung, Entfernung bis nächster Frame 34/35 ms,
Cue danach 30/19 ms, maximales Cue 32 ms. Größte Video-Callback-Lücke im ganzen
Lauf 88,9/70,6 ms, je zwei Decoder-Drops. Long Tasks in Gecko unbewertet.

Unabhängige CI auf `a7b9c5d`: PR-Lauf 38231676039 und manuelle Langdiagnose
38231670544 vollständig erfolgreich. Drei Minuten ohne zusätzliche Textlast:
10.799/10.797 Qualitätsframes und 10/14 Drops (Baseline/Erweiterung), maximale
Callback-Lücke je 50,1 ms, alle 345 aktiven Cues. Burst mit vollständiger
Erweiterung: 58/58 Cues, Burst-Cue 10,5 ms, Tail 82,8 ms, maximaler
Callback-Abstand 33,4 ms, keine Long Tasks. Der positive Lauf ersetzt die
separat dokumentierten negativen Kurzlaufbefunde nicht.

### Anfragenkapazität und getrennte Untertitelantworten

Zwei weitere gezielte Regressionen reproduzieren die Prioritätsgrenze:
32 laufende normale kleine Textanfragen verhindern jede neue Captionanfrage;
ein gemischter Batch hält die Captionantwort bis zum Abschluss seiner normalen
Einträge zurück. Bei aktivierter Untertitelverarbeitung bleibt jetzt ein Platz
innerhalb der bestehenden Gesamtgrenze 32 frei. Captionbatches enthalten nur
Captions; normale Texte benutzen den anderen Batch. Die Transportgrenze bleibt
zwei gleichzeitig laufende Batches. Bereits laufende volle Batches werden
nicht unterbrochen; dies ist keine Garantie sofortiger Antworten bei blockiertem
Hintergrundprozess. Ohne aktivierte Untertitel bleibt die normale Core-Kapazität 32.

Drei neue Core-Regressionen sichern frische Captions während ausstehender
normaler Antworten, gemeinsame Kapazität und vollständigen normalen Auslauf
mit Restore. Eine zusätzliche Transportregression hält die normale Antwort
zurück und verlangt trotzdem eine abgeschlossene Captionantwort. Vorher rot,
nachher grün. Gesamtcheck: 238 Dateien / 10.689 Tests, Builds, Typprüfung und
Firefox-Lint erfolgreich. Native Chromium-/Firefox-/Waterfox-Smokes bestanden.

Native CPU-4-Fixture mit absichtlich verzögerten normalen Antworten:
Core allein vorher 191,9–291,4 ms, nachher 10,7–22,3 ms für die Caption.
Core und echter lokaler Batchtransport gemeinsam, kontrollierter API-Adapter:
vorher 563,7/843,7/626,7 ms, nachher 10,7/18,1/10,0 ms. Alle Sitzungen sichtbar
und fokussiert, 40 normale Texte plus Caption vollständig korrigiert und
zurückgesetzt. Konfigurierte Antwortverzögerung 200 ms; dies ist eine gezielte
Backlog-Fixture, keine Messung gewöhnlicher Hintergrundlaufzeiten.
Normale Gesamtausläufe schwanken überlappend (vorher 780–982, nachher 661–937 ms).

Uninstrumentierte Alltagsgegenprobe mit vollständiger Erweiterung: je 120 s,
60-FPS-Video und mäßige Last (acht Textänderungen/s), ohne/mit Erweiterung.
Aktiv 230/230 Cues, maximale Cue-Latenz 16,1 ms, alle 480 Endtexte korrekt,
keine Long Tasks. Qualitätsframes 7.197/7.198, Drops 560/563, größte
Callback-Lücke 119,9/88,9 ms. Rohberichte
`windows-caption-isolation-moderate-{baseline,extension}.json`.

### Unabhängiger Gegenbefund außerhalb des Entfernungscallbacks

PR-CI 38241425040 und Langdiagnose 38241569210 auf `d2d46c9` erfolgreich.
Die unabhängige Entfernungsserie bleibt dennoch negativ: alle 59 Cues und
Tail-Restore korrekt, Entfernung bis nächster Frame 28,3 ms, Cue danach 9,7 ms;
aber größte Callback-Lücke 183,3 ms mit nur einem präsentierten neuen Frame.
Zeitlich dazu passt ein 172-ms-Long-Task bei 7.589,8 ms, vor der Entfernung
bei 8.056,8 ms. Ein weiterer 105-ms-Long-Task bei 29.522,1 ms verzögert einen
Cue auf 125,3 ms. Keine dieser Pausen ist durch den kurzen Entfernungscallback
erklärt. Der positive Workflowstatus hebt diesen Befund nicht auf.
Rohdaten in `artifacts/ci-451-removal-download/`, Log `ci-451-removal-long.log`.

Die neue separate `--browser-trace`-Diagnose korreliert die Trace-Zeitachse mit
`performance.now()` einschließlich Abgleichunsicherheit. Sie archiviert die
Browserereignisse zusätzlich und kennzeichnet Berichte als instrumentiert.
Der manuelle Workflow kann Entfernungsgegenproben separat mit Trace ausführen;
Standard und Alltagsgegenproben bleiben uninstrumentiert. Trace-Laufzeiten
sind keine Grundlage einer Performancefreigabe. #419 bleibt offen.
Native instrumentierte Gegenprobe technisch verifiziert: 59/59 aktive Cues,
maximal 16,0 ms, keine Long Tasks, Trace enthält den Entfernungstimer mit
27,0 ms. Zeitachsenunsicherheit 15,8 ms. Eine positive Trace-Wiederholung
erklärt die unabhängig beobachtete seltene Pause nicht; ihre Ursache bleibt offen.
