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

### Plattform-Alltagsgegenproben und unabhängiger Trace

Auf `cddcaaf` bestanden PR-CI 38244288472 und separate Trace-Diagnosen
38244283881 sowie 38244978877. Uninstrumentierte unabhängige Hochlast:
57/57 Cues, maximal 33,3 ms, alle 480 Endtexte, keine Long Tasks.
Instrumentierte Entfernungsserien: 59/59 beziehungsweise 60/60 Cues,
maximal 33,2/33,1 ms, größte Callback-Lücke 50,0/33,4 ms, keine Long Tasks.
Die Traces enthalten den Entfernungstimer (30,0/37,6 ms); Zeitachsenunsicherheit
3,75/3,20 ms. Die vorherigen seltenen 172-/105-ms-Tasks wurden in diesen
instrumentierten Wiederholungen nicht erfasst. Keine kausale Entwarnung.

Native mäßige Last jeweils 120 s ohne/mit Erweiterung in Firefox und Waterfox:
beide je 215/215 aktive Cues und alle 480 Endtexte. Firefox maximales Cue
33 ms, Qualitätsframes 7.212/7.211, je zehn Drops, größte Callback-Lücke
60,1/59,3 ms. Waterfox maximales Cue 32 ms, Qualitätsframes je 7.211,
je zehn Drops, größte Callback-Lücke 59,8/61,0 ms. Long Tasks dort unbewertet.
Rohberichte `windows-caption-isolation-moderate-{firefox,waterfox}-*.json`.

### Veraltete Warteschlangenknoten ebenfalls budgetiert verwerfen

`takeNextReadyNode()` lief bisher einmal durch alle abgetrennten oder noch
verzögerten Knoten. Ein isolierter nativer CPU-4-Core-Stau mit 50.000 bereits
abgetrennten Einträgen überschreitet das 4-ms-Budget: 25,3/25,5/26,7 ms in
einem Scan, erster Frame 26,3–28,5 ms. Das ist eine isolierte interne
Scheduler-Fixture, keine vollständige Webseitenlast und keine Erklärung der
unabhängigen seltenen Video-Long-Tasks.

Ein persistenter Iterator begrenzt jede Suche auf 128 Einträge und setzt sie
innerhalb der vorhandenen Scheibenbudgets fort. Der früheste Wake-Zeitpunkt
bleibt über Teilsuchen erhalten. Erneut geänderte bereits besuchte Texte werden
ans Ende eingereiht, damit der Cursor sie noch erreicht. Synchronflush und
Abbruch verwerfen den Cursor. Attribute und Einfügelisten behalten Gelegenheit
zur Verarbeitung. Vier Regressionen sichern begrenzten Scan, Fortschritt hinter
Backoff, Synchronflush/Restart und erneute Queue nach Cursorfortschritt.

Native vollständige Bereinigung nachher: synchron gesamter Auslauf 45,9–53,8 ms,
größter einzelner Schritt 6,0–6,6 ms, erster Frame 6,6–7,3 ms. Mit dem
asynchronen Produktionsbudget Auslauf 42,8–44,0 ms, größter Schritt 3,4–4,4 ms,
erster Frame 4,4–5,6 ms. Alle 50.000 Einträge entfernt, spätere maximale
Frameabstände unter 12 ms. Ein erster begrenzter Entwurf mit zu vielen separaten
Scheiben brauchte im synchronen Pfad 2,8 s; dies wurde vor Sicherung korrigiert.
Die Zeitbudgets sind Prüfgrenzen zwischen Schritten, keine harte Dauerzusage
für jeden einzelnen Schritt. Rohlogs `windows-stale-queue-{before,final,async-final}.log`.
Gesamtcheck des finalen Codes: 239 Dateien / 10.693 Tests, Typprüfung, Builds
und Firefox-Lint 0/0/0 erfolgreich. #419 bleibt wegen der offenen seltenen
Pausen weiterhin nicht abgenommen.

Finale native Smokes und 30-s-Hochlastvideos dieses Scanfixes bestanden:
Chromium 57/57 Cues, maximal 16 ms, keine Long Tasks; Firefox/Waterfox je
54/54 Cues, maximal 31/32 ms. Alle 480 Endtexte vollständig. Größte
Video-Callback-Lücke 32,2/62,7/61,8 ms; Gecko Long Tasks weiterhin unbewertet.

### Browsing mit aktiver Untertitelverarbeitung getrennt prüfen

Die vorhandene Interaktionsdiagnose ergänzt optional `--active-subtitles`:
vor dem ersten Fixture-Aufruf im frischen Profil speichern, tatsächlichen
Storagewert prüfen und anschließend frische Captions alle 500 ms erzeugen.
Die Baseline erzeugt dieselben Texte, lässt sie unverändert. Jede ausgegebene
Caption muss im Erweiterungslauf korrigiert sein. Die Standardprobe bleibt
ohne Aktivierung; Rohbericht weist den Modus aus. Der manuelle unabhängige
Interaktionsworkflow bietet den Modus ebenfalls optional an.

Native CPU-4-Serie, drei abwechselnde Paare, jeweils vier Sekunden mit
1.200 normalen Textänderungen/s und echten WebDriver-Klicks/Eingaben:
24/24 Cues, alle 480 Endtexte, kein späterer Auslauf, keine Long Tasks.
Mediane zusätzliche Klickzeit 0,9 ms, Eingabe -0,6 ms (keine behauptete
Beschleunigung), RAF-P95 +8,0 ms und RAF-Maximum +8,0 ms. Captionmaxima
unter 44 ms unter dieser starken synthetischen Last. Dies ist eine positive
Interaktionsgegenprobe, keine Zusage null zusätzlicher Renderarbeit.
Rohbericht `windows-active-caption-interactions-final/report.json`.

Der erste Teststart lud für die Erweiterung die große Fixture zusätzlich vor
dem Optionswechsel: auch 24/24 Cues und vollständiger Auslauf, aber ein
58-ms-Long-Task in drei Erweiterungsläufen. Diese Serie bleibt separat erhalten
(`windows-active-caption-interactions/report.json`). Instrumentierte Wiederholung
zeigt MajorGC/Mark-Compactor-Ereignisse von etwa 22–27 ms in verzögerten
Framephasen, einmal 52-ms-Long-Task. Zeitachsenunsicherheit 16–30 ms;
damit keine präzise alleinige Zuordnung des gesamten Long Tasks. Der
gleich häufige Fixture-Aufruf beseitigt die Protokollungleichheit, erklärt
aber nicht die unabhängigen 172-/105-ms-Ereignisse der Videoprobe.
Standard-Interaktionsmodus zusätzlich verifiziert: vollständiges gültiges Paar,
kein Auslauf und keine Long Tasks. Die allgemeine #419-Abnahme bleibt offen.

### Letzte unabhängige Prüfstände und frühe Videolücke

Auf Codecommit `4b95e98` ist PR-CI 38249313005 erfolgreich. Die unabhängige
aktive Interaktionsdiagnose 38249307717 besteht fünf abwechselnde Paare:
40/40 Cues, alle 480 Endtexte pro Lauf, kein Auslauf und keine Long Tasks.
RAF-P95 median +0,1 ms; negative Klick-/Eingabedeltas als Messstreuung erhalten,
keine Beschleunigung behauptet. Diese CI läuft ohne die native CPU-4-Drosselung.

Native 300-s-Gegenproben mit mäßiger Last: 575/575 aktive Cues, maximal
16,3 ms, alle 480 Endtexte, keine Long Tasks und keine Lücke >120 ms.
Ohne/mit Erweiterung: Qualitätsframes 17.992/17.996, Drops 1.533/1.432,
größte Callback-Lücke 116,0/106,8 ms. Keine pauschale Decoderbeschleunigung
behauptet. Rohberichte `windows-final-long-moderate-{baseline,extension}.json`.

**Unabhängiger Videolauf 38249314356 ist fehlgeschlagen:** Das unveränderte
kurze 60-FPS-Gate sieht maximal 333,3 ms mit Erweiterung gegenüber 33,5 ms
Basis (erlaubt 300 ms). Die Episode 1.567,8–1.901,1 ms hat nur einen neu
präsentierten Frame und 0,017 s Medienfortschritt. Sie bleibt ein Gegenbefund
auf dem aktuellen Code, obwohl spätere Phasen bestehen: 345/345 Cues über
drei Minuten, Hochlast 57/57, Burst 58/58, Entfernung 59/59. Der
Entfernungstimer hat in diesem Lauf einmal 61 ms, davon 47,6 ms native
DOM-Mutation; größter dortiger Callback-Abstand nur 50,1 ms. Rohdaten
`artifacts/ci-451-final-video-long-download/`, Log `ci-451-final-video-long.log`.

Der opt-in Browsertrace beginnt jetzt auch im kurzen Hauptvergleich vor der
Navigation. Rohberichte kennzeichnen die Instrumentierung und speichern den
Abgleich; Mediaereignisse und eine passive Long-Task-Beobachtung ergänzen nur
diesen instrumentierten Hauptpfad. Normale Messung und alle Gates unverändert.
Defaultberichte bleiben bei fehlender Long-Task-Beobachtung explizit unbewertet.

Erste native technische Prüfung: instrumentierter kurzer Lauf rot wegen Drops
44 Basis / 54 Erweiterung. Eingeschwungene Maximalabstände 32,3/47,9 ms.
Frühe Episoden 150,2/260,3 ms; in der aufgezeichneten frühen V8-/JS-Zeitachse
kein Ereignis >20 ms. Zweite native Media-/Longtaskprüfung technisch vollständig,
unverändertes Gate bestanden (Drops 53/55): **249,3-ms-Anlaufepisode auch ohne
Erweiterung**, mit geringem Präsentationsfortschritt und ohne Long Task. Der
Erweiterungslauf hat keine Episode >120 ms. Dies beweist einen möglichen
Browser-/Media-Anlaufanteil, erklärt den unabhängigen 333-ms-Befund noch nicht.
Rohberichte `windows-{final-main60-trace,main60-media-trace}.json`.

Die vorhandenen Quell-Aufrufprüfungen wurden nach der frühen Trace-Erweiterung
angepasst; ein zwischenzeitlich roter Gesamtcheck auf dem Diagnosecommit
betraf zwei wörtliche Aufrufzeilen, keinen Text-/DOM-Test. Reparaturcommit
`304cf44`: Gesamtcheck erneut 239 Dateien / 10.693 Tests erfolgreich.
Der Standard-Workflowbefehl bleibt als eigener unveränderter Schritt erhalten;
Trace ist ein ausdrücklich optionaler Alternativschritt mit denselben Gates.

Frühe unabhängige Media-/V8-Trace 38253477387 auf `28088c2` technisch vollständig
und erfolgreich: eingeschwungene Maximalabstände 33,5/83,3 ms, Drops 1/2,
keine Episode >120 ms. Die 333-ms-Lücke wurde dort nicht wieder erfasst.

Eine zusätzliche `--diagnose-main-tasks`-Aufnahme erfasst passive Long Tasks,
Sichtbarkeit und Fokus ohne schweren Browsertrace. Erste native Reihe bleibt
am Drop-Gate rot (50/69), frühe Episoden 148,4/284,3 ms, jeweils keine
Long Tasks. Die Basis bleibt ohne Dokumentfokus, der Erweiterungslauf bekommt
früh Fokus. Im Produktionscode ist kein Fokus-/Selection-Wechselaufruf gefunden.
Die zusätzliche explizite `--focused-start`-Kontrolle aktiviert beide Testfenster
vor Navigation und prüft sichtbaren Dokumentfokus danach: weiterhin rot wegen
Drops 42/60, frühe Erweiterungsepisode 412,8 ms ohne Long Task. Fokus allein
erklärt den Gegenbefund nicht. Alle eingeschwungenen Callback-Abstände unter
48 ms. Die neuen Kontrollen sind gekennzeichnete Diagnosen; Standard und Gates
bleiben unverändert. `VIDEO_ARTIFACTS_DIR` erlaubt getrennte native Runverzeichnisse,
damit gleichnamige Traces und ihre zugehörigen Rohberichte nicht überschrieben werden.
Rohdaten `windows-main60-passive-tasks.json` und `windows-main60-focused-control/`.

Unabhängige passive Aufnahme 38260731516 auf `9a507e0`: technisch grün,
aber **166,7-ms-Videolücke mit passendem 158-ms-Long-Task** bei 1.360,3 ms.
Präsentationsfortschritt nur ein Frame und 0,017 s Video. Danach eine weitere
200-ms-Lücke ohne Long-Task-Korrelation, ebenfalls nur ein neuer Frame.
Sichtbarkeit bleibt sichtbar; Fokus ist seit etwa 88 ms vorhanden. Zwei
unterschiedliche Ursachenklassen müssen getrennt untersucht werden. Die
permissiven bestehenden Grenzen lassen diesen Lauf bestehen; #419 bleibt offen.
Unabhängige Standard-CI 38260738763 auf demselben Commit erfolgreich.
Rohdaten `ci-451-passive-main-download/`, Log `ci-451-passive-main.log`.

Isolierte normale Batchwartezeit-Gegenprobe, produktiver Code nicht geändert:
aktueller 8-ms-Build / 2-ms-Archivvariante / 2-ms-Variante / aktueller Build,
je ein frisches natives 60-FPS-Paar mit passiver Taskdiagnose.
Zusätzliche Drops +15 / -9 / +11 / -5; beide Varianten jeweils ein rotes
und ein grünes Gate. Erweiterung allein 55–59 Drops, Basis 41–68. Kein
belastbarer Timergewinn; 8 ms beibehalten. Alle eingeschwungenen Maximalabstände
unter 49 ms und keine Long Tasks in diesen nativen Reihen. Rohdaten
`artifacts/normal-window-comparison/`; isolierte Variante nur unter `artifacts/`.

## Begrenzte DOM-Phasendiagnose (12.10.2026, Wiederaufnahme)

Ein ausdrücklich erzeugter separater Diagnosebuild unter
`artifacts/dom-phase-diagnostic/chromium` misst sechs zentrale DOM-Einstiege.
Nur numerische Zeiten und Methodennamen; maximal 128 langsame Proben ab 8 ms.
Keine Text-/Knotenreferenzen, keine zusätzlichen Berechtigungen. Produktions-
`content.js` wird nicht geändert und sein Hash wird im Diagnosemarker gespeichert.
Der Videolauf verlangt den passenden Marker und die ausdrückliche Diagnoseflag;
Standardbuild und Standardmessgrenzen bleiben erhalten. Separater manueller
Workflowinput ermöglicht die gleiche Aufnahme auf dem unabhängigen Runner.

Native technische Prüfung des endgültigen Diagnosewegs: Gate erfolgreich,
Drops 55/59, eingeschwungene Maximalabstände 31,6/47,1 ms. Frühe Lücken
151/158,2 ms jeweils ohne Long Task. Gemessene Observer-Aufrufdauer höchstens
1,4 ms, reguläre Scheibe 2,5 ms, Start 1,2 ms; keine langsame Methodenprobe.
Zwei vorbereitende Archivdiagnosen waren am Drop-Gate rot; eine frühe
457-ms-Lücke ohne Long Task wurde erfasst. Keine Entwarnung für #419 oder
Erklärung des früheren unabhängigen 158-ms-Tasks. Rohdaten
`artifacts/dom-phase-native-supported/` und `artifacts/phase-diagnostic-native/`.
Gesamtcheck: 240 Dateien / 10.694 Tests, beide Builds und Firefox-Lint erfolgreich.

Unabhängige Phasenaufnahme 38291406839 auf `b0aedfc` technisch erfolgreich:
keine Long Tasks oder Videolücken >120 ms, Maximalabstände Basis/Erweiterung
66,7/100 ms, Drops 2/1. Eine reguläre DOM-Scheibe dauert 31,7 ms bei
1.330,9 ms; Observer maximal 1,8 ms, Shadow Discovery 0,3 ms. Unterphasen
und mögliche Laufzeit-/Scheduleranteile müssen für die einzelne langsame
Scheibe getrennt werden. Rohdaten `artifacts/ci-dom-phase-download/`.

## Mehrfache CharacterData-Rückschreibungen pro Batch

Reproduziert mit echtem nativen Observer: 5.000 Änderungen desselben bereits
korrigierten normalen Textknotens in einem Task und ein gleichzeitig geänderter
Untertitel. Chromium, CPU-Faktor 4, drei frische Läufe. Vorher Observer
35,9–36,4 ms, Untertitel 59,9–62,2 ms, normaler Text 298,5–307,6 ms.
Die wiederholt gelesene finale Quelle wurde für jeden Record erneut als
Framework-Rewrite gezählt und erhielt dadurch eine künstliche 250-ms-Sperre.

Fix: externe CharacterData-Knoten innerhalb desselben Observer-Batches einmal
behandeln. Eigene Schreib-Rückläufer bleiben geprüft, echte Rückschreibungen
über mehrere Batches behalten ihre Begrenzung. Nachher Observer 7,9–8,1 ms,
Text und Cue 32,4–36,7 ms, genau ein Rewrite ohne Backoff. Seitenmutation
selbst weiterhin 12–14 ms unter CPU-Faktor 4; gemessene Text-/Cue-Zeit bis zum
Frame umfasst diese und die Frame-Taktung. Belastungsfall, kein Beleg für die
Ursache des sporadischen Store-Videofehlers. Vollständige Logs
`artifacts/repeated-character-data-{before,after}.log`.

Zwei neue Verhaltenstests vor dem Fix rot, nachher erfolgreich. Sechs
Regressionen insgesamt: Batch vs. mehrere echte Batches, verschiedene Knoten,
Editor-Schutz, verschobene Texte/Restore und aktive Untertitel. Gesamtcheck
240 Dateien / 10.700 Tests, beide Builds und Firefox-Lint 0/0/0. Native
Chromium-, Firefox- und Waterfox-Smokes einschließlich vier Ranges/Restore
erfolgreich. #419 bleibt offen.

Die isolierte Phasendiagnose erfasst jetzt zusätzlich Textvorbereitung,
Transformationsabschluss und Range-erhaltendes Schreiben (neun Methoden).
Optionaler Browsertrace und Phasendiagnose sind im manuellen Workflow kombinierbar.
Native technische Kombinationsprüfung am unveränderten Drop-Gate rot (48/56),
keine Long Tasks oder Videolücken >120 ms. Reguläre Scheibe maximal 2 ms,
Textvorbereitung 1,9 ms, Abschluss 0,7 ms, Schreiben 0,5 ms. Keine langsame
Unterphase erfasst. Rohdaten `artifacts/dom-phase-detailed-native-trace/`.
Isolierter Build und 16 relevante Diagnose-/Workflowtests erfolgreich.

Unabhängige kombinierte Aufnahme 38292633057 auf `b74131f` erfolgreich:
Basis/Erweiterung Maximalabstand 50/33,4 ms, Drops 3/0, keine Long Tasks oder
Lücken >120 ms. Neun gemessene DOM-Methoden jeweils höchstens 3,9 ms; keine
langsame Unterphase erfasst. Aktuelle vollständige CI 38292638283 auf demselben
Commit erfolgreich. Der Produktfix-Check auf `39eaa6a` wurde durch den folgenden
Commit abgebrochen; er wird nicht als erfolgreiche CI ausgegeben.
Rohdaten `artifacts/ci-dom-phase-detailed-download/`.

Vollständiger Add-on-Gegenvergleich mit laufendem echtem 60-FPS-Video, einem
einmaligen 5.000-Schreib-Burst und aktiven natürlichen Cues über 30 Sekunden:
unveränderte Vorversion `b0aedfc` korrigiert den normalen Text nach 272,4 ms,
aktueller Produktfix nach 15,5 ms; native Seitenmutation selbst 2,4/2,8 ms.
Gleichzeitig ausgelöster Cue 12,8/5,3 ms. Beide Chromium-Läufe ohne Long Tasks.
Firefox mit Produktfix: Text 17 ms, Burst-Cue 12 ms, alle 54/54 Cues korrigiert;
Longtask-API dort nicht verfügbar. Dies ist eine weitere direkte Fix-Verifikation,
keine allgemeine Video-/Store-Abnahme. Isolierte Variante des bestehenden
Videoharness nur unter `artifacts/`; Rohdaten `artifacts/repeated-write-video/`.

Manuelle DOM-Phasendiagnose kann nun 1/3/5 getrennte frische Browserpaare in
einem Runner messen. Jeder Messfehler macht den Gesamtschritt rot; weitere
Paare werden trotzdem aufgezeichnet und getrennt archiviert. Kein Aussuchen
grüner Wiederholungen, keine geänderten Einzelgates. 15 relevante Tests erfolgreich.

Waterfox bestätigt den vollständigen 5.000-Schreib-Burst: normaler Text 23 ms,
gleichzeitiger Cue 13 ms, Seitenmutation 4 ms, 55/55 Cues korrigiert. Longtask-API
nicht verfügbar. `artifacts/repeated-write-video/waterfox-after/`.

## Wieder erfasster langer Observer-Aufruf und getrennte Video-Uhren

Unabhängige fünf Paare 38293520290 auf `d37cdd0` technisch erfolgreich, aber
**Paar 1 erfasst einen 143,7-ms-`handleMutationRecords`-Aufruf bei 1.348 ms**
mit passendem 144-ms-Long-Task bei 1.347,8 ms. Eine frühere Observerprobe bei
157,3 ms dauert 9,9 ms. Die übrigen vier Paare enthalten weder Long Tasks
noch langsame Methodenproben; ihre maximalen Callback-Abstände liegen bei
33,4–33,5 ms. Paar 1 Basis/Erweiterung 50/150 ms, Drops 0/1. Vollständige CI
38293524547 auf demselben Commit erfolgreich. #419 bleibt NO-GO.
Rohdaten `artifacts/ci-dom-phase-five-download/`.

Der 150-ms-Abstand in Paar 1 liegt bei den bisherigen übergebenen Rendering-
Zeitstempeln 1.580,1–1.730,1 ms, ohne Longtask-Überlappung. Rund um den
Observer-Block springen Compositor-Zähler zunächst von 76 auf 84 und der
Medienzeitstempel von 1,267 auf 1,4 s, obwohl der nächste Rendering-Zeitstempel
nur 16,6 ms später liegt. Daraus darf weder eine genaue zeitliche Ursache noch
ein sichtbarer Stillstand für jeden verzögerten Callback abgeleitet werden.

Die [rVFC-API-Spezifikation](https://wicg.github.io/video-rvfc/) übergibt den
Rendering-Schritt-Zeitstempel und beschreibt verzögerte/ausgelassene Callbacks
unter Hauptthreadlast. `presentedFrames` zählt an den Compositor übergebene
Frames, keine unabhängige Messung des tatsächlich sichtbaren Bildes. Diagnose-
aufnahmen speichern daher zusätzlich tatsächlichen Callback-Eintritt,
Compositor-Übergabe, erwartete Displayzeit und optionale Decoderzeit. Getrennte
`callbackGapEpisodes` korrelieren nur wirklich beobachtete Eintrittszeiten;
alte Rohdaten bleiben ausdrücklich ungemessen. Bestehende Gates und ihre
Rendering-Zeitachse unverändert. Zwei Regressionen schützen die Trennung.

Die isolierte Diagnose ergänzt vier Observer-Unterphasen und langsame
Regex-Testaufrufe. Nur Musterlänge und bereinigte Funktionsnamen, keine Muster,
URLs oder Eingabetexte; gemeinsam weiterhin maximal 128 langsame Proben.
Eine zusätzliche Probeprüfung verifiziert die Obergrenze einschließlich
interner Regex-Aufrufe bei Stackaufbereitung. Technischer nativer Uhrenlauf
am Drop-Gate rot (44/63), frühe Lücke 126,4 ms Rendering / 127,3 ms Eintritt,
ohne Long Task oder langsame Unterphase. Vorhandene Typdeklaration ergänzt;
22 relevante Tests erfolgreich. Keine Produktions-DOM-Änderung in dieser Einheit.

Unabhängige Unterphasenreihe 38295799463 auf `eb865a5`: technisch grün,
Paar 1 mit zwei Textvorbereitungen 87,1/87,4 ms und passenden Long Tasks
87/88 ms bei 720,1/814,6 ms. Observer maximal 3,5 ms, gemessene Kontext-
und Restore-Unterphasen kurz, keine langsame Regex-Testprobe. Alle vier
Folgepaare ohne langsame Proben/Long Tasks. Tatsächliche Callback-Eintritte
807,6/903,3 ms gegenüber Rendering-Zeitstempeln 722,6/822,6 ms bestätigen
die erforderliche Uhren-Trennung. Vollständige CI 38295807685 erfolgreich.
Rohdaten `artifacts/ci-dom-observer-clock-five-download/`.

Die kombinierte Fünfer-Trace 38296685464 auf demselben Commit erfasst den
übrigen Pausenanteil konkreter: ein Observer-Aufruf 90,1 ms, dazu eigener
`FunctionCall` 90,147 ms **bei 1,438 ms Thread-CPU-Zeit**. Darin
`V8.OptimizeCode` 89,113 ms bei 0,408 ms CPU. Eine folgende reguläre Scheibe
27,7 ms enthält MinorGC 26,637 ms bei 0,497 ms CPU. Später MinorGC 257,925 ms
bei 0,847 ms CPU, davon `V8.GC_TIME_TO_SAFEPOINT` 257,226 ms bei 0,435 ms CPU.
Hintergrundoptimierung 722,756 ms bei 3,155 ms CPU. Dies zeigt in dieser
Aufnahme überwiegend Laufzeit-/Synchronisationspausen, keine entsprechende
Menge an Hauptthread-Rechenarbeit. Der konkrete OS-/VM-/Browseranteil ist
damit noch nicht bestimmt. [Chromium dokumentiert ThreadDuration als CPU-Zeit](https://chromium.googlesource.com/website/+/7f4f02c5e95202f51e31cd8a91df7898218177b0/site/developers/how-tos/trace-event-profiling-tool/trace-event-reading/index.md).

Paar 1: späterer 284,2-ms-Callback-Eintrittsabstand mit **17** übergebenen
Frames und 0,283 s Medienfortschritt; Drops Basis/Erweiterung 2/2. Dieser
Callbackabstand ist kein Nachweis eines entsprechenden Bildstillstands.
Alle Folgepaare ohne Long Tasks, höchste normale Abstände 33,4–33,5 ms;
zwei frühe Observerproben 8,2/8,4 ms. Zeitachsenabgleich in Paar 1 ±25,9 ms;
CPU-/Wanddauer innerhalb desselben Trace-Ereignisses benötigt keinen Abgleich.
Rohdaten `artifacts/ci-dom-observer-cpu-five-download/`, begrenzte Auswertung
`artifacts/ci-dom-observer-cpu-five-summary.jsonl`. #419 bleibt offen.

Ausdrückliche Engine-Gegenprobe `no-concurrent-recompilation` nur mit vollständigem
Chromium-Videotrace. Argument wird über den gestarteten Browser geprüft,
Rohdaten kennzeichnen die Abweichung. Produktions-Traces können ohne die
DOM-/Regex-Messwrapper ebenfalls in 1/3/5 getrennten Browserpaaren laufen.
Vier Guards verhindern unbekannte, unmarkierte oder falsche Plattform-/Teilmodi.
Native technische Gegenprobe: Argument verifiziert, keine Long Tasks oder
langsamen Proben; Drop-Gate weiterhin rot (46/55). Keine Änderung am Add-on
oder am Browser des Nutzers und kein Freigabenachweis durch Sonderflags.
Gesamtcheck 240 Dateien / 10.706 Tests, beide Builds und Firefox-Lint erfolgreich.

Fünf Produktions-Traces 38299012401 auf `87fa288` ohne DOM-/Regex-Messwrapper:
alle Gates bestanden, keine Long Tasks oder Eintrittslücken >120 ms;
höchster Erweiterungsabstand in Paar 1 49,9 ms, danach 33,4–33,5 ms.
Standard-V8 unverändert. Vollständige CI 38299018666 erfolgreich. Dieses
Ergebnis grenzt den möglichen Instrumentierungseinfluss ein, beweist aber
keine universelle Entwarnung für ältere passive Befunde oder die Store-Störung.
Rohdaten `artifacts/ci-production-trace-five-download/`.

Engine-Gegenprobe 38302290150 auf demselben Commit **rot**: erstes Paar
533,3-ms-Rendering-/561,4-ms-Eintrittslücke; 34 übergebene Frames und 0,566 s
Medienfortschritt. Long Tasks 556/53 ms in Textvorbereitung. Eigenes
`FunctionCall` 556,274 ms bei 5,808 ms CPU, `V8.OptimizeCode` 555,962 ms
bei 5,502 ms CPU, darin `V8.OptimizeNonConcurrent` 355,388 ms bei 3,870 ms CPU.
Sonderflag nachweislich aktiv; keine geeignete Abhilfe für den Produktbetrieb.
Alle vier Folgepaare ohne Long Tasks, Maximalabstände 33,5 ms. Die Schleife
hält den Gesamtfehler rot und bewahrt alle Paare. Rohdaten
`artifacts/ci-v8-engine-control-five-download/`. Keine Übernahme der Engineflag.

## Dichte Entfernung: budgetierte Ownership-Bereinigung

Neuer nativer Reproduktionsfall: 10.000 bereits korrigierte Knoten in einem
entfernten Teilbaum, gleichzeitig neuer Untertitel. Chromium, CPU-Faktor 4,
asynchroner Core-Scheduler, drei frische Läufe. Vorher Observer 63,2–64,3 ms,
Cue 70,4–71 ms, Seitenmutation selbst 3,4–3,8 ms. Zuvor 5.000 Knoten:
45,1–47,4 ms Observer. Dichte Roots verblieben auf dem allgemeinen synchronen
Restore-Pfad; die bisherigen Sparse-/Neutral-Fixes erfassten ihn nicht.

Live Ownership-Iteratoren restaurieren dichte entfernte Bestände jetzt in den
bestehenden regulären Zeit-/Schrittbudgets. Keine volle Key-Snapshot-Kopie
oder Bindung an die alte Baumform. Reinsert bleibt verfolgt, auseinandergerissene
Nachkommen werden restauriert, spätere Entfernungen lösen einen weiteren
Durchlauf aus. Normale Textarbeit und Cues kommen weiter zum Zug. Explizite
Sync-APIs drainieren die Bereinigung; StopBudgeted übernimmt ausstehende
Originale. Asynchrone Antworten und Retries prüfen die eigene Dokumentgrenze,
damit ein währenddessen adoptierter Knoten keine verspätete Transformation
im fremden Dokument erhält. Pending-Attribute gehören ebenfalls zur Ownership.
Große dichte Bestände werden nun **eventuell** restauriert; schnelle Blatt-
und Sparse-Fälle bleiben unmittelbar. Diese begrenzte Verzögerung ist durch
Reinsert-, externe Änderungs- und Lifecycle-Tests abgesichert.

Identischer nativer Nachlauf: Observer 1,4–1,9 ms, Cue 8,4–10,5 ms, alle
10.000 Originale restauriert, späterer Frameabstand höchstens 8,9 ms.
Rohlogs `artifacts/dense-removal-10000-{before,after}.log`.

Vollständiges Produktions-Add-on, echtes 60-FPS-Video, dichte 10.000 Ersetzungen
und normale Hochlast: vor Entfernung 10.000/10.000 korrekt, danach 10.000/10.000
Originale restauriert. Chromium Cue 10,2 ms, Operation bis Frame 11,8 ms,
59/59 Cues, keine Long Tasks. Direkte unveränderte Vorversion `87fa288`:
Cue 23,9 ms, Operation bis Frame 27,1 ms, ebenfalls alle Originale; Seitenmutation
8 ms vorher / 9,1 ms nachher. Firefox Cue 13 ms, Frame 16 ms, 56/56;
Waterfox Cue 13 ms, Frame 12 ms, 55/55. Gecko-Longtask-API nicht verfügbar.
Isolierte dichte Variante des Videoharness nur unter `artifacts/`;
Rohdaten `artifacts/dense-removal-video/`.

Zehn neue Regressionen einschließlich harter Schrittgrenze, vollständigem
Restore/Cue, zerlegtem Baum, Reinsert, externen Änderungen, Shadow DOM,
StopBudgeted, großen NodeLists, weiteren Entfernungen, verspäteten Antworten
und Fairness. Initiale Budgetprüfung vor dem Fix rot. Gesamtcheck mit ersten
neun Regressionen 241 Dateien / 10.715 Tests, beide Builds und Firefox-Lint
erfolgreich; anschließend gesamte Testsuite mit Fairnessfall 10.716 Tests
und Typecheck erfolgreich. Native Chromium-, Firefox- und Waterfox-Smokes
einschließlich Ranges und Restore erfolgreich. #419 weiterhin offen.

## Große nachträgliche Untertitelklassifikation bei ausgeschalteter Verarbeitung

Weiterer verifizierter allgemeiner Restore-Engpass: 10.000 vorher normal
korrigierte Texte erhalten nachträglich einen Captionmarker, während
`processSubtitles=false` gilt. Native CPU-4-Reproduktion: Observer vorher
235,4–249,1 ms, gleichzeitig geänderter normaler Außenknoten nach
376–390,2 ms korrigiert. Die eigene Klassenmutation selbst dauert 0–0,2 ms.
Der verbundene Captionroot lag weiterhin auf `forgetRoot` mit vollständigem
Restore und großen anschließenden CharacterData-Batches.

Große Bestände verwenden jetzt dieselbe Ownership-Bereinigung mit aktueller
Caption-/Optionenprüfung. Kleine Bestände bleiben unmittelbar. Rücknahme des
Markers vor der Bereinigung erhält eigene korrekte Änderungen; StopBudgeted
übernimmt verbleibende Originale. Keine Transformation ausgeschlossener
Captions und keine Änderung am aktivierten Untertitelpfad.

Identischer nativer Nachlauf: Observer 1,6–2,4 ms, normaler Außenknoten nach
7,9–14 ms, alle 10.000 Originale wiederhergestellt, späterer Frameabstand
höchstens 10,1 ms. Drei fokussierte Regressionen, erste Budgetprüfung vorher
rot. Gesamtcheck 242 Dateien / 10.719 Tests, beide Builds und Firefox-Lint
erfolgreich. Native Chromium-, Firefox- und Waterfox-Smokes einschließlich
Ranges/Restore erfolgreich. Rohlogs `artifacts/caption-reclassification-{before,after}.log`.

Vollständiges Add-on mit echtem Video und normaler Hochlast: vor Klassifikation
10.000/10.000 korrekt, danach 10.000/10.000 Originale. Direkte Chromium-
Vorversion `f59620c`: normaler Außenknoten 92,4 ms, Long Task 82 ms bei der
Klassifikation; aktueller Fix 12,2 ms, keine Long Tasks. **Tradeoff:** die
Wiederherstellung ist verteilt: letzter beobachteter Captionknoten vorher
nach 28,8 ms, nachher nach 137,4 ms. Dies ist die deaktivierte Verarbeitung
eines ungewöhnlich großen Bereichs, kein Latenznachweis für aktive Cues.
Beide unveränderten Drop-Gates rot (vorher 53/63, nachher 47/60); alle
eingeschwungenen aktuellen Callback-Abstände unter 48 ms. Gesamt-NO-GO bleibt.

Firefox-Funktionslauf: Außenknoten 18 ms, letzter beobachteter Captionknoten
762 ms, alle Originale, Gate erfolgreich. Waterfox technische Funktionsaufnahme:
Außenknoten 7 ms, letzter Knoten 743 ms, alle Originale und Gate erfolgreich;
ein separater Chromium-Smoke lief teilweise gleichzeitig, deshalb keine
isolierte Waterfox-Performancefreigabe daraus. Gecko unterstützt die Longtask-API
nicht. Die zunächst vermutete Nutzung des Timer-Fallbacks war falsch: Firefox
157 stellt im isolierten Add-on-Kontext `scheduler.postTask` bereit; der
bestehende Hintergrundpfad verwendet diese API. Der große Restaurierungsauslauf
bleibt als möglicher nächster Durchsatzpunkt messbar. Isolierte Variante nur
unter `artifacts/`, Rohdaten `artifacts/caption-reclassification-video/`.

Vollständige unabhängige CI 38305410844 auf dem vorigen Dense-Fix `f59620c`
erfolgreich. Auch CI 38307637382 auf Caption-Folgefix `c0c6e98` erfolgreich.

## Observer-Rückläufer vollständig ausgeschlossener Captionblöcke

Nach einem Restore ist die Textownership bereits freigegeben. Die anschließende
CharacterData-Benachrichtigung führte trotzdem grammatische Nachbarscans aus.
Bei unowned Texten ohne ausstehende Transformation in einem vollständig
ausgeschlossenen Caption-Inlineboundary wird diese Arbeit jetzt übersprungen.
Inlinecaptions innerhalb normaler Absätze bleiben kontextrelevant; eine
Regression prüft den Wechsel von „mit Nutzer:innen“ zu „für Nutzer:innen“.
Eine weitere Regression schützt vor Nachbarscans bei 256 ausgeschlossenen
Captionänderungen. Eigene/pending Texte bleiben im bestehenden Prüfpfad.

Direkter vollständiger Firefox-Add-on-Vergleich mit echtem 60-FPS-Video,
normaler Hochlast und 10.000 nachträglich ausgeschlossenen Texten: Vorversion
`c0c6e98` Außenknoten 16 ms / letzter beobachteter Restoreknoten 680 ms;
aktueller Pfad 11 / 366 ms, Wiederholung 14 / 374 ms. Alle 10.000 Texte vorher
korrigiert und danach original. Isolierter Waterfox-Nachlauf 9 / 357 ms,
ebenfalls alle Originale. Die unveränderten relativen Videogates erfolgreich;
hohe absolute Dropzahlen schon ohne Add-on (Firefox erster Nachlauf 188/188,
Waterfox 197/195) erlauben keine allgemeine Aussage über flüssige Wiedergabe.
Gecko bietet weiterhin keine Longtask-Beobachtung. Rohdaten unter
`artifacts/excluded-caption-notifications/`.

Die experimentelle MessageChannel-Variante wurde vollständig verworfen:
Sie wurde wegen des bereits vorhandenen postTask-Pfads nicht verwendet und
belegt daher keinen Timergewinn. Keine Änderung am Scheduler oder am aktiven
Untertitelpfad. Die sporadische Store-Störung bleibt kausal offen; #419 NO-GO
bleibt bestehen.

Abschlussprüfung dieses Folgefixes: Gesamtcheck 242 Dateien / 10.721 Tests,
beide Builds, Metadaten-/Locale-/Storeprüfungen und Firefox-Lint 0/0/0
erfolgreich. Native Chromium-, Firefox- und Waterfox-Smokes einschließlich
Inline-Ranges und großem Einzeltext mit Restore erfolgreich.

Direkte Chromium-Kontrolle gegen `c0c6e98`: letzter beobachteter Restoreknoten
vorher 103,1 ms, aktuell 60,0 ms, Wiederholung 63,3 ms; normaler Außenknoten
14,4 / 14,4 / 14,6 ms. Alle 10.000 Originale in allen Läufen. **Alle drei
unveränderten Videogates rot:** Drops Basis/Add-on vorher 31/114, aktuell
38/122, Wiederholung 40/111. Frühe tatsächliche Callback-Lücken 398 / 243,9 /
367,7 ms liegen jeweils weit vor der Klassifikation nach fünf Sekunden und
haben keinen korrelierten Longtask-Eintrag. Dies ist ein erneut reproduzierter
Startgegenbefund unter dieser großen Anfangslast, keine Performancefreigabe.
Eine aktuelle Aufnahme enthält zusätzlich einen frühen 86-ms-Long-Task
bei 48,3 ms; die beiden anderen nicht. Rohdaten bleiben vollständig erhalten.

Unabhängige CI 38310735581 auf Observer-Folgefix `0d0fe4c` vollständig
erfolgreich. Produktions-Trace desselben Builds ohne DOM-/Regex-Wrapper:
Drops 35/105, diesmal keine große tatsächliche Callback-Lücke und keine Long
Tasks. Vor Klassifikation (Sekunde 1–4) Media-BeginFrame-Takt in beiden Modi
56–57/s; nach Restore im Add-on-Modus etwa 32/s, Decoder weiter etwa 60/s.
Im Fenster 500–4500 ms eigene reguläre PostTask-Callbacks zusammen 95,8 ms
(427 Aufrufe), Observer 51,3 ms (430 Aufrufe); maximaler PostTask-Event 1,1 ms.
Verschachtelte Event-Summen sind inklusiv und dürfen nicht addiert werden.

Native Kontrollvariante schreibt ohne Add-on dieselben 10.000 versteckten
Texte nach fünf Sekunden kurz und wieder original. Erstes Paar weiter rot
(41/107 Drops, frühe tatsächliche Add-on-Callback-Lücke 284,3 ms); automatische
zweite Bestätigung relativ grün (115/102 Drops), aber **auch die native Basis
fällt nach den Textänderungen auf etwa 32 Media-BeginFrames/s**, bei weiter
60 Decoderframes/s. Damit ist dieser Effekt nicht allein der Erweiterung
zuzuordnen. Beide Paare erhalten; Rohdaten
`artifacts/excluded-caption-notifications/chromium-native-control/`.

Host ist Windows 11 10.0.22000; Tests verwenden stumme Headless-Browser.
Die [Microsoft-Dokumentation](https://learn.microsoft.com/en-us/windows/win32/api/timeapi/nf-timeapi-timebeginperiod)
garantiert ab Windows 11 für unsichtbare/unhörbare Prozesse keine erhöhte
Timerauflösung. Der beobachtete Takt ist ein Ansatz für die Testumgebungs-
Analyse, **kein Nachweis dieser konkreten Ursache**. Keine System-, Timer-,
Energie- oder Browserkonfigurationsänderung; Gates unverändert.

## Wiederholte ausgeschlossene Captionänderungen vor Boundarysuche bündeln

Gezielte Prüfung des neuen Skip-Pfads: 5.000 Änderungen desselben Texts in
einem ausgeschlossenen Captionblock führten noch zu 10.000 Klassifikationen
und wiederholter Inlineboundary-Suche. Die Batch-Deduplizierung liegt jetzt
vor diesem Skip-Pfad; eigene/pending Writes bleiben wie bisher davor geprüft.
Regression zunächst rot (10.000 statt höchstens zwei Aufrufe), danach grün.
Native Chromium-CPU-4-Gegenprobe, 200 Inlinevorfahren, drei unabhängige Läufe:
Observer vorher 444,4–447,6 ms, nachher 7,5–7,9 ms; gleichzeitig geänderter
normaler Außenknoten vorher 514,0–517,6 ms, nachher 75,5–77,9 ms. Die native
Seitenschreibarbeit bleibt etwa 58–60 ms. Ausgeschlossener Text bleibt exakt
original; keine Aussage über aktive Cue-Latenz aus diesem ausgeschlossenen
Pfad. Rohdaten `artifacts/excluded-caption-burst/{before,after}/report.json`.
Gesamtcheck 242 Dateien / 10.722 Tests, beide Builds und Firefox-Lint 0/0/0
erfolgreich. Finale native Chromium-, Firefox- und Waterfox-Smokes mit
Inline-Ranges, großem Einzeltext und Restore ebenfalls erfolgreich.

Vollständiges Chromium-Add-on mit echtem 60-FPS-Video, bestehender normaler
Hochlast und Caption-Burst nach fünf Sekunden: Vorversion `0d0fe4c` normaler
Außenknoten 118,7 ms, korrelierter Long Task 103 ms und tatsächliche
Callback-Lücke 120,8 ms beim Burst. Aktuell Außenknoten 15,6 ms, keine Long
Tasks und keine Lücke beim Burst. Native Seitenschreibarbeit 2,8 / 3,0 ms.
**Videogates weiter rot** (Drops 40/115 versus 35/114); frühe tatsächliche
Callback-Lücken 402,6 / 429,8 ms ohne korrelierten Long Task bleiben erhalten.
Finaler Firefox-Videolauf Außenknoten 6 ms (native Writes 1 ms), Waterfox
21 ms (native Writes 6 ms), relative Gates grün, absolute Drops schon in der
Basis hoch (Firefox 208/178, Waterfox 199/189). Gecko-Longtasks weiterhin
nicht bewertet. Rohdaten `artifacts/excluded-caption-burst-video/`.

Unabhängige CI 38312718013 auf finalem Codefix `47d15c5` vollständig
erfolgreich. Die folgenden Diagnosevarianten ändern keine Produktionsdateien.

## Fünf-Sekunden-Mediatakt zeitlich vom Captionrestore trennen

Klassifikation im identischen Diagnosefixture von 5,0 auf 6,5 Sekunden
verschoben: tatsächlicher Beginn 6537,3 ms, normaler Außenknoten 13,7 ms,
letzter beobachteter Restore 56,1 ms, alle 10.000 Originale, keine Long Tasks.
Relative Videoprüfung grün bei absolut 119/106 Drops. **Der Media-Takt sinkt
in Basis und Erweiterung weiterhin schon nach etwa fünf Sekunden auf 32/s,
vor dieser Klassifikation.** Decoder weiter etwa 60/s. Damit belegt die
zuvor zeitgleiche Aufnahme keinen Restore als Ursache dieser Taktänderung.
Rohdaten `artifacts/excluded-caption-notifications/chromium-delayed-classification/`.

Weitere ruhende Kontrolle aus dem Standardfixture ohne dynamische
Textschreibvorgänge (der Metriktimer bleibt erhalten): Videogate rot,
Drops 33/105. Zusätzliche reine Diagnosegegenprobe mit offiziell dokumentiertem
[Chromium-Argument `--disable-renderer-backgrounding`](https://chromium.googlesource.com/chromium/src/+/master/content/public/common/content_switches.cc)
ebenfalls rot, Drops 34/120. Argument in tatsächlicher Browser-Commandline
verifiziert. Diese Variante wird nicht übernommen; keine nachgewiesene
Verbesserung. Rohdaten `artifacts/video-quiet-{native,foreground}-control/`.

Erweiterte ruhende Priority-/Compositor-Aufnahme (zusätzlich `renderer_host`,
`toplevel`, `cc`, `gpu`, `benchmark`, `power`): erneut rot, Drops 37/106.
Getesteter Renderer in den erfassten UpdateProcessPriority-Ereignissen
foreground; kein erfasster Prioritätswechsel zum Fünf-Sekunden-Einbruch.
Media-Takt im Erweiterungslauf nach fünf Sekunden erneut 32/s. Dies widerlegt
eine einfache durch das getestete Renderer-Flag behebbare Erklärung; die
konkrete Windows-/Headless-/Mediaursache bleibt offen. Rohdaten
`artifacts/video-quiet-priority-control/`, numerische Auswertung
`artifacts/quiet-priority-summary.jsonl`. Diese Varianten sind Diagnosen,
keine unveränderten Standard-Hochlastabnahmen oder Releasefreigaben.

Fortsetzungspriorität: frühe tatsächliche Videolücken und zeitgesteuerte
Media-Taktänderung in der lokalen Windows-/Headless-Konfiguration weiter
zuordnen, gegen unveränderten Produktionsbuild und native Basis prüfen.
Die sporadische Store-Störung bleibt offen; keine andere Projektaufgabe oder
Releaseaktion vorgezogen. Alle hier kausal reproduzierten Caption-Observer-
Engpässe sind implementiert und separat verifiziert.

Letzte gezielte Auswertung desselben erweiterten Traces: im ruhenden
Erweiterungsfenster 4500–8000 ms nur vier eigene Content-Callbacks mit
zusammen 0,515 ms Wandzeit. Compositor-BeginFrameArgs fordern weiterhin
16.666 µs Intervalle an. **Konkreter nächster Ansatz im nativen GPU-Prozess:**
`GpuVSyncThread` / `WaitForVSync Sleep` im Basislauf etwa 18 ms, im späteren
Erweiterungsfenster wiederholt etwa 32 ms. Beispiel bei 5390,4 ms:
WaitForVSync Sleep 32,158 ms Wandzeit / 0,012 ms Thread-CPU. Die großen
Wandzeiten sind hier native Wartezeit, keine laufende eigene DOM-Arbeit.
Dies ordnet den Taktwechsel genauer zu, erklärt aber noch nicht seine
konkrete Ursache oder die sporadische Store-Störung. Nächste Prüfung:
native VSync-/Wakeupsteuerung in der Windows-/Headless-Konfiguration und
Vergleich mit der normalen Browsersituation. Numerische Rohzusammenfassung
`artifacts/quiet-slow-task-summary.jsonl`, BeginFrame-Argumente unter
`artifacts/quiet-begin-frame-args.jsonl`. Keine OS-/Treiber-/Timeränderung.

CI 38313504100 auf Dokumentationscheckpoint `f66b11d` ebenfalls vollständig
erfolgreich; finaler Code unverändert `47d15c5`.

## Native VSync-Sleep-Quantisierung und bestätigter Reihenfolgeeffekt (13.10.)

Letzter Checkpoint `f946894`, unabhängige CI 38314036816 erfolgreich.
Produktionscode bleibt `47d15c5`. Installierte Chromium-Version 155.0.8059.39;
die passende öffentliche [VSync-Implementierung](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/ui/gl/vsync_thread_win.cc)
wurde versionsgenau geprüft. Der beobachtete Sleep-Pfad ersetzt erfolgloses
oder unter 1 ms zurückkehrendes Hardware-Warten. In den erhaltenen Traces
keine `WaitForVSyncImpl`-Fehlerereignisse und keine Fake-VSync-Argumente:
das Warten kehrt erfolgreich, aber zu früh zurück. Das belegt den verwendeten
Ersatzpfad, nicht den konkreten Grund der Desktop-/Hardware-Okklusion.

Ruhender Standardlauf, native Sleep-Mediane früh/spät (500–4500 / 5500–8000 ms):
Basis 17,628 / 17,680 ms, Erweiterung 17,574 / 31,308 ms. Reine frische
Diagnosebrowser mit verifiziertem `--fake-vsync-rate=60` reproduzieren
34/104 Drops. Gegenprobe mit 144 Hz: 55/54 Drops, native Sleeps in beiden
Modi früh etwa 7,94 ms, spät etwa 15,52 ms. Der zusätzliche Modusunterschied
verschwindet bei anderem nativen Warteintervall; absolute Drops bleiben.
Diese Runtimegegenprobe bleibt ausschließlich unter `artifacts/`; kein
Produkt-, Benutzerbrowser-, OS- oder Treiberfix und keine Freigabemessung.
Rohdaten `artifacts/vsync-rate-control/{60,144}/`.

**Wichtige Korrektur der Attribution:** Umkehr der festen Browserreihenfolge
ohne Zusatzflags kehrt auch den Verlust um. Ruhend, Erweiterung zuerst:
Drops Basis/Erweiterung 114/38, Wiederholung 115/42. Im ersten Reverse-Paar
späte Sleep-Mediane Basis 31,254 ms / Erweiterung 17,586 ms. Der langsamere
native Takt folgt dem zweiten Browser und nicht dauerhaft dem Add-on-Modus.
Rohdaten `artifacts/video-quiet-reverse-order-{control,repeat}/`.

Dieselbe Gegenprobe im unveränderten Produktionsfixture mit 960 Änderungen/s:
Basis zuerst 40/105 Drops (Gate rot), Erweiterung zuerst 113/35 (Gate grün).
Korrekte Ergebnislabels und ursprüngliche Gates verifiziert. Ein grüner
Reverse-Lauf allein ist ebenso wenig eine Abnahme wie der vorherige rote
feste Vorwärtsvergleich ein kausaler Add-on-Nachweis. Frühe tatsächliche
Callback-Lücken bleiben teilweise bestehen, auch in der Basis. Originale
Store-Störung und #419 NO-GO weiterhin offen. Die konkrete Ursache der
Reihenfolgeabhängigkeit im nativen Sleep-/Timerverhalten bleibt zu prüfen.

Wiederverwendbare Diagnoseoption: `VIDEO_PAIR_ORDER=extension-first`, Standard
unverändert `baseline-first`. Manueller Workflow hat dieselbe explizite
Auswahl. Rohdateien und Log enthalten `pairOrder`; Ergebnislabels bleiben
unabhängig von der Ausführungsreihenfolge. Unbekannte Werte scheitern vor
Media-/Browserstart. Keine geänderten Fixtures, Framegrenzen, Wiederholungs-
oder Akzeptanzregeln. 31 fokussierte Tests in vier Dateien, Typprüfung und
YAML-Parsing erfolgreich; beide native Reihenfolgen auf dem echten
Produktionsbundle ausgeführt. Rohdaten `artifacts/video-pair-order-validation/`.

Unabhängige vollständige CI 38324123027 auf `95d4d26` erfolgreich. Neue
manuelle Workflowauswahl mit drei Produktions-Traces unabhängig in
38324209263 ausgeführt, Workflow ebenfalls erfolgreich. Alle drei Rohpaare
haben `pairOrder=extension-first`, korrekte Moduslabels und Engine `standard`.
Drops Basis/Erweiterung: Paar 1 169/3, Paar 2 1/2, Paar 3 1/1. Paar 2 und 3
ohne Long Tasks oder tatsächliche Callbackepisoden über 120 ms.

**Gegenbefund im ersten unmodifizierten Produktionsbundle:** Long Task
269 ms bei 1754,4 ms; tatsächliche Callbackepisode 283,8 ms, dabei 17 weitere
an den Compositor weitergereichte Frames und 0,283 s Medienfortschritt.
Matched FunctionCall 269,316 ms Wandzeit / 2,715 ms Thread-CPU;
V8.OptimizeCode 268,176 / 1,590 ms. Später MinorGC 86,334 / 1,514 ms,
enthaltene Safepoint-Wartezeit 84,796 / 0,026 ms. Summen sind verschachtelt.
Dies bestätigt eine seltene Produktions-Callbackpause unter Trace ohne
DOM-/Regex-Wrapper, überwiegend Warte-/OffCPU-Zeit. Es belegt keine sichtbare
Video-Freeze und löst die Store-Störung nicht kausal. Hohe Basis-Drops und
permissive Vergleichsgrenzen erklären, warum der Workflow trotzdem grün ist.

Alle Rohpaare und Traces erhalten unter `artifacts/ci-video-pair-order-20261013/`;
kompakte CPU-Zuordnung `artifacts/ci-pair-order-first-cpu-summary.jsonl`.
Nächste begrenzte Prüfung: Produktions-Callbackpausen mit ausgeglichener
Messreihenfolge und ohne Browsertrace gegenprüfen, eigene CPU von nativer
V8-/Safepoint-Wartezeit und GPU-Takt trennen. Keine spekulative Änderung
an Transformation, Scheduler oder Benutzerbrowser; #419 weiterhin NO-GO.

### Nutzereingrenzung vom 13.10.2026: Android und hörbare Aussetzer

Der Nutzer grenzt die sporadische Störung der Store-Version auf Android mit
Firefox beziehungsweise Waterfox ein. Sie trat auf mehreren Seiten auf;
der Ton stockte definitiv, vermutlich das gesamte Video. Am Desktop ist
die Störung nach seiner Erinnerung bisher nicht aufgetreten. Das ist eine
Nutzerbeobachtung, noch keine reproduzierte oder kausal zugeordnete Störung.

Die bisherigen Desktop-Messungen belegen die beschriebenen Einsparungen
an DOM-Arbeit, verifizieren aber weder Android-Verhalten noch hörbare
Audiokontinuität. Windows-VSync- und V8-Befunde dürfen nicht als Erklärung
des Android-Fehlers übernommen werden. Die nächste priorisierte Prüfung
benötigt Android mit dem betroffenen Gecko-Browser und ein Video mit echtem
Ton: Audio- und Videounterbrechungen mit und ohne Erweiterung erfassen,
die Vergleichsreihenfolge wechseln und beobachtete Unterbrechungen mit
Erweiterungsarbeit korrelieren. Desktop-AV-Tests können ergänzen, ersetzen
die Android-Verifikation aber nicht. Originale Store-Störung und #419
NO-GO bleiben offen; noch keine weiteren Produktänderungen abgeleitet.

**Vorbereitung nach Kontingentreset:** `adb devices -l` zweimal ohne Gerät;
ADB vorhanden, kein Emulator an den üblichen SDK-Pfaden. Nutzer kann ein
Android-Gerät erst in etwa acht Stunden anschließen. Kein Gerätetest gestartet.
Aktueller Remote-`main` weiterhin `6c3b5f4d`; #451 offen und Draft auf `0292515`.

Lokaler, noch nicht ins Produkt/Testsystem übernommener Prototyp unter
`artifacts/android-av-20261013/`: reproduzierbare FFmpeg-Quelle mit 60 s
H.264 1280×720/30 FPS und AAC Mono/48 kHz, durchgehender Prüfton. Moderate
Seitenlast 4 normale Textänderungen/s plus etwa 2 Captionwechsel/s, getrennte
Stressprobe bis 960 normale Änderungen/s. Start per Benutzerinteraktion mit
echtem unmuted Audio; Browsermetriken ausdrücklich kein Audio-Nachweis.
Server nur an 127.0.0.1, Android-Zugriff später per gezieltem ADB-Reverse.

Quelle und Prototyp vollständig neu erzeugt und lokal geprüft:
FFprobe bestätigt beide Streams und 60-s-Dauer; Stilleprüfung −50 dB/20 ms
findet keine Quelllücke. Absichtlich eingefügte 120-ms-Audiolücke wird als
128 ms erkannt (blockweise Filterung). HTTP/HEAD/Byte-Ranges, ungültige Range,
Pfadbegrenzung sowie Start, moderate Writes, unmuted Audio und Endzustand der
Seitenlogik erfolgreich geprüft. Serverprozess danach beendet. Keine
Decoder-/Android-Verifikation; Stilleprüfung erfasst keine wiederholten
Audioblöcke und keine Störung hinter dem Aufnahmeabgriff.

Vor Android-Test Geräte-/Browser-/Storeversion feststellen, Erweiterungs-
zustand anhand tatsächlicher Transformation prüfen und Aus/an sowie an/aus
vergleichen. Aufnahmeunterstützung erst am Gerät prüfen: offizielle
[scrcpy-Audiodokumentation](https://github.com/Genymobile/scrcpy/blob/master/doc/audio.md)
beschreibt Audio ab Android 11 und Playback-Duplikation ab Android 13;
Aufnahmequelle kann Wiedergabe beeinflussen. Keine Aufnahmeinstallation oder
Umleitung bisher. Mozilla beschreibt für
[Android-web-ext](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)
das Hauptprofil statt eines isolierten temporären Profils; vorhandene
Store-Identität/Einstellungen vor Testbuild berücksichtigen. Waterfox separat
verifizieren. Keine spekulative Produktkorrektur aus den Desktopbefunden.

### Android-Geräteprüfung und kürzere Untertitelwartezeit, 13.10.2026

Die vorstehende Vorbereitung ist inzwischen durch echte Geräteproben ergänzt:
Pixel 10 Pro, Android 17, Firefox Nightly 160.0a1. Installierte Erweiterung laut
`runtime.getManifest()` **0.7.1**, obwohl der Paketdateiname 0.7.2-rc.11 nennt.
Vier manuell exportierte Proben waren sämtlich mit aktiver Transformation;
ihre Baseline-Beschriftung ist kein gültiger Aus/an-Vergleich. Der Nutzer hörte
keinen Aussetzer. Die damalige Audioausgabe (Lautsprecher/Kopfhörer/Bluetooth)
ist ihm nicht mehr bekannt.

Automatische Vergleiche prüfen den Modus anhand frischer Texttransformation.
Produktcode von `main` **6c3b5f4d** und Branch **5fa9c23** wurde jeweils als
0.7.2 mit derselben separaten temporären Identität installiert, ausschließlich
auf der lokalen Fixture. Hintergrund- und Content-JavaScript stimmen per
SHA256 mit dem jeweiligen Produktionsbuild überein; nur Testname/-Identität
und Fixture-Hostbegrenzung ändern sich. Die ursprüngliche Erweiterung bleibt
installiert und wird für den Vergleich lokal deaktiviert. Die ältere 0.7.1
ist keine kausale Vorher-Baseline für die 0.7.2-Codeänderungen.

Je 60 Sekunden 720p30/H.264 und AAC48k, 120 erkannte `subtitle-cue`-Wechsel,
moderate Last etwa vier normale Textänderungen/s; separat etwa 950/s und
5.000 gebündelte Änderungen desselben Textknotens. Sichtbarkeit, Videogeometrie,
verbundene Knoten, tatsächliche Cue-Ersetzung und native Framequalität geprüft.
Die frühe Probe mit generischer Klasse `subtitle` maß normalen Seitentext;
eine weitere Probe ohne Frame-/Latenz-Sensordaten wurde ausdrücklich verworfen.

| Produktionsstand / gültige Probe | Cue-P95 / Maximum | Drops / Frames |
| --- | ---: | ---: |
| main 6c3b5f4d, moderat, zuerst | 8 / 12 ms | 3 / 1800 |
| Branch 5fa9c23, moderat, zuerst | 23 / 25 ms | 4 / 1800 |
| Branch 5fa9c23, moderat, umgekehrt | 24 / 26 ms | 4 / 1800 |
| main 6c3b5f4d, moderat, umgekehrt | 9 / 52 ms | 4 / 1800 |
| Branch mit frühem budgetierten Cue-Pfad, moderat | 18 / 21 ms | 4 / 1800 |
| Derselbe Cue-Pfad, moderat, Wiederholung nach echter Baseline | 16 / 22 ms | 4 / 1800 |
| Derselbe Cue-Pfad, etwa 950 normale Änderungen/s | 15 / 23 ms | 4 / 1800 |
| Derselbe Cue-Pfad, 5.000 Änderungen gebündelt | 24 / 30 ms | 4 / 1800 |
| Erweiterung abgeschaltet, moderat | keine Ersetzung | 4 / 1800 |

Die gebündelte normale Textänderung wurde auf main nach 69 ms, auf Branch
5fa9c23 nach 32 ms, mit dem zusätzlichen Cue-Pfad nach 43 ms ersetzt.
Einzelproben, keine universellen Geschwindigkeitsfaktoren. Alle aktiven
Tabellenproben ersetzten sämtliche 120 Cues; außerhalb des Anlaufs keine
Callbackepisode über 120 ms oder Media-Waiting-/Fehlerereignisse.

**Zusätzliche Produktkorrektur:** Bekannte einzelne Caption-Textknoten und
fertige lokale Transformationsantworten müssen keinen Animationsframe
abwarten. Eine Microtask bearbeitet ausschließlich diese bekannte Arbeit;
größere Unterbäume bleiben im Frame-Traversal. Frühe Arbeit und Frame-Callback
teilen dieselben zwölf Schritte und das kooperative 2-ms-Budget; getrennt
eintreffende Antworten bekommen kein jeweils neues Budget. Große Rückschreib-
arbeit bleibt gesliced. Optionswechsel/Stop verwerfen alte Aufgaben und
Antworten. Das entfernt nachgewiesene zusätzliche Wartezeit, erreicht in
diesen Android-Proben aber **noch nicht** die main-Cue-P95 von 8–9 ms.

Audio wird mit scrcpy 5.0.1 als FLAC am Android-Playback-Abgriff dupliziert,
während es am Telefon weiterläuft. Positive Kontrollen am Gerät: eingefügte
Quelllücke von 128 ms als 107,3-ms-Innenlücke erkannt; 200-ms-Wiederholung
ohne Stille anhand des Frequenzverlaufs erkannt. In den Tabellenproben keine
Innenlücke ab 20 ms und keine entsprechende Wiederholung im kontinuierlichen
Prüfton. Container-Zeitstempeljitter und teilweise aktive Anfangs-/Endfenster
sind keine Audioaussetzer. Dieser endliche synthetische Test erfasst weder
die komplette Lautsprecher-/Bluetooth-Kette noch alle realen Videoseiten;
Aufnahme und Debugging können das Timing beeinflussen. **Die sporadische
Store-Audiostörung ist weiterhin nicht reproduziert oder kausal behoben.**

Nightly-Originalversion/-Einstellungen und beide Autoplay-UserPref-Zustände
verifiziert wiederhergestellt; temporäre Identität entfernt. USB-Wachhalten
auf den ursprünglichen Wert 0 zurückgestellt. Waterfox Android 1.2.8.1 ist im
Vordergrund per RDP erreichbar; frühere Timeouts belegen keinen Defekt.
Automatische Wiedergabeproben brachen vor Aufnahme wegen gesperrtem Telefon
ab; keine Android-Waterfox-Performanceabnahme. Auch dort Originalzustand
verifiziert wiederhergestellt und temporäre Identität entfernt.

Verifikation des zusätzlichen Produktpfads: sieben fokussierte Regressionen
für frühe Antworten, beide Cue-Mutationsarten, Mengen-/Zeitbudget, getrennte
Antworten und Stop. Vollständiger lokaler `npm run check`: **243 Dateien,
10.730 Tests**, Typprüfung, Builds, Metadaten-/Locale-/Browserprüfungen,
Firefox-Lint ohne Fehler/Warnungen. Native Chromium-, Firefox- und
Waterfox-Desktop-Smokes einschließlich Inline-Ranges, großem Einzeltext,
Schutzbereichen und Restore erfolgreich. Rohdaten, Gerätezustände und
Audioaufnahmen bleiben ignoriert unter `artifacts/android-av-20261013/`.
Keine neue Release-/Store-Freigabe; #419 bleibt NO-GO.

### Neuere Waterfox-Messungen und Android-Audio-Gegenbefund, 13.10.2026

Der vorstehende Waterfox-Blocker ist durch neuere Geräteproben überholt.
Waterfox 1.2.8.1 auf demselben Android-Gerät ist per RDP erreichbar.
Die ignorierten Rohdaten unter `artifacts/android-av-20261013/automated/`
belegen 120 ersetzte Cues bei moderater MP4-Probe: Branch `5fa9c23`
Cue-P95 30 ms/Maximum 41 ms, Branch `456caf9` P95 18 ms/Maximum 46 ms;
vier beziehungsweise drei Drops aus 1800 nativen Frames. Bei hoher Textlast
bleibt zusätzliche Nachrichtenwartezeit offen: `456caf9` P95 100 ms/119 ms
Maximum in einer vollständigen MP4-Probe. Eine vermeintliche Wiederholung
mit nur 82 gemessenen Cues ist keine vollständige Untertitelabnahme.

**Neuer relevanter Gegenbefund:** Segmentierte lokale H.264-/AAC-Wiedergabe
mit zwei SourceBuffers, einsekündigen Segmenten, 100-ms-Pump und Zielpuffer
0,5 s. Mit ungefähr 900 normalen Textänderungen/s zeigen beide aktiven
`456caf9`-Proben Innenlücken im tatsächlich aufgenommenen Android-Audio,
während beide zugehörigen abgeschalteten Proben ohne solche Innenlücke sind.
Jeweils 60 s Quelle, verifizierte Transformation, sichtbare und vollständige
Wiedergabe; Reihenfolge erst aus/an, anschließend an/aus. Sensorwerte und
native Framequalität allein hätten die hörbare Signalunterbrechung übersehen.

| Code / Probe | Native Drops / 1800 Frames | Audio-Innenlücken ab 20 ms |
| --- | ---: | --- |
| 0.6.6-Produktcode, an, Stress/0,5-s-Puffer | 58 | 34,5 ms |
| 0.6.6-Produktcode, aus, gleiche Last | 61 | 45,5 ms |
| 456caf9, aus, Stress/0,5-s-Puffer | 71 | keine |
| 456caf9, an, gleiche Last | 53 | 40,1 / 151,5 / 21,5 ms |
| 456caf9, an, Wiederholung | 55 | sieben, Maximum 103 ms |
| 456caf9, aus, umgekehrte Paarung | 61 | keine |
| 456caf9, aus, moderate Last/2,5-s-Puffer | 4 | keine |
| 456caf9, an, moderate Last/2,5-s-Puffer | 4 | keine |
| 456caf9, an, Stress/2,5-s-Puffer | 4 | keine |
| 456caf9, an, moderate Last/0,5-s-Puffer | 85 | 77,4 ms |

Die 0.6.6-Probe verwendet den lokal vorhandenen, unveränderten Produktcode
mit per Hash geprüfter Herkunft aus seinem Build, separater temporärer
Identität und Loopback-Hostbegrenzung. Sie ist kein Identitätsnachweis des
vom Nutzer damals verwendeten signierten Store-Artefakts. Alle Audioangaben
beziehen sich auf den Android-Playback-Abgriff mit scrcpy/FLAC; Randstille
der Aufnahme ist ausgeschlossen. Frequenzabweichungen nach Innenlücken
belegen Signal-/Zeitverschiebung, nicht automatisch wiederholte Audioblöcke.
In den Streamingproben liegen 120 oder 121 beobachtete Cue-Ersetzungen vor;
die Abschlussgrenze kann einen zusätzlichen Cue ergeben.

Die knappe Pufferung ist in den bisherigen Proben der gemeinsame Faktor;
hohe Textlast allein genügte beim 2,5-s-Puffer nicht. Auch moderate Last mit
0,5-s-Puffer zeigt eine Lücke. Dafür fehlt noch die passende ausgeschaltete
Gegenprobe. Dass 0.6.6 auch ausgeschaltet eine Lücke zeigt, verhindert eine
pauschale Add-on-Attribution. Die wiederholten 456caf9-Aus/an-Gegenbefunde
verhindern umgekehrt eine Entwarnung für den Branch. Das ist ein neuer
reproduzierbarer Untersuchungsfall, noch kein kausaler Nachweis der
ursprünglichen sporadischen Store-Störung. Normale Pufferung zu prüfen
ersetzt keine Behebung oder weitere Diagnose des knappen Pufferfalls.

Der uncommittete zusätzliche Caption-Batchslot wurde separat geprüft:
elf fokussierte Tests und Firefox-Build erfolgreich; MSE-Stressprobe mit
121 Ersetzungen, Cue-P95 63 ms/Maximum 85 ms, 53/1800 Drops, dennoch
Audio-Innenlücken von 69,4 und 54,3 ms. Er behebt den Audiofall nicht und
bleibt ein offener Versuch in `src/browser/local-transform.ts` und
`tests/local-transform-batch.test.ts`. Keine Freigabe oder Lösung daraus
abgeleitet. Die instrumentierte vorherige MP4-Probe misst bei 120 Cues
Nachrichtenwartezeit P95 60 ms/Maximum 120 ms bei Kernberechnung bis 1 ms;
dies begründet weitere gezielte Prüfung der Nachrichten-/Scheduling-Kette.

Nächste Priorität: moderate 0,5-s-Aus/an-Gegenprobe vervollständigen und
Fetch-, Append-/Updateend- und Hintergrund-Nachrichtenzeiten rund um echte
PCM-Lücken getrennt erfassen. Aufnahme-/Debugging-Einfluss unabhängig prüfen;
keine pauschale Verzögerung oder Gate-Lockerung. Ursprüngliche Waterfox-
Version 0.7.1 und vollständige Settings nach den Proben verifiziert
wiederhergestellt, temporäre Identität entfernt, Autoplay-Prefs restauriert,
USB-Wachhalten wieder 0 und eigene ADB-Testports entfernt. Telefon danach
gesperrt; weitere Geräteprobe benötigt erneutes Entsperren. #419 bleibt NO-GO.

### Wiederaufnahme: Restore-Vorbereitung und beeinflusste Android-Gegenprobe, 13.10.2026

Live geprüft: main `6c3b5f4d`, PR #451 weiterhin Entwurf auf `d74c4d2`, alle
acht Head-Prüfungen erfolgreich. Der zusätzliche Caption-Batchslot bleibt
als früherer uncommitteter Versuch getrennt von der folgenden Korrektur.

**Neuer reproduzierter Produktengpass:** `stopBudgeted()` kopierte sämtliche
verfolgten Text-, Anfrage-, Edit- und Attributoriginale in neue Listen, bevor
das erste Arbeitsbudget begann. Die native lokale Fixture transformiert
1.000/4.000/16.000 Texte tatsächlich mit einer einfachen lokalen Regel,
prüft Ersetzungszahl und anschließend jedes restaurierte Original. Keine
Produktregel-/Lexikonmessung, keine allgemeine Webseitenabnahme.

Die Korrektur übergibt die vorhandenen Ownership-Maps in konstantem Aufwand
und liest ihre Einträge innerhalb der Restore-Scheiben. Überschriebene
Einträge verbrauchen ebenfalls einen Budgetschritt; ausstehende Antworten
werden entwertet. Teilrückgaben bei DesignMode -> Stop behalten Original und
aktuellen Erwartungstext. Fremde Text-/Attributänderungen bleiben bestehen.

| Native Probe, 16.000 Texte, je drei Wiederholungen | Vorher: Aufruf bis Rückkehr | Nachher: Aufruf bis Rückkehr |
| --- | --- | --- |
| Chromium 155, Renderer CPU-4 | 14,2 / 37,5 / 14,8 ms | 3,2 / 4,0 / 3,9 ms |
| Firefox 157.0.1, ungedrosselt | 12 / 5 / 5 ms | 0 / 0 / 1 ms |
| Waterfox 153.5.0, ungedrosselt | 10 / 9 / 7 ms | 0 / 0 / 0 ms |

Nullwerte liegen unter der Millisekundenauflösung, sind keine kostenlose
Arbeit. Die Messung umfasst Vorbereitung und erste Restore-Scheibe, keine
isolierte Funktions-Eigenzeit. Gesamt-Restore bleibt insbesondere auf Chromium
CPU-4 mehrere Sekunden lang; diese Korrektur behebt den synchronen
Vorbereitungsengpass, nicht pauschal die ganze Rückgabezeit. Native Daten
ignoriert unter `artifacts/restore-preparation-resume/`.

Vier neue Regressionen: Vorbereitungslimit, fremde Text-/Attributänderung,
Neustart mit neuer Ownership und DesignMode-Teilrückgabe mit Range-Erhalt.
Vorher-Code scheitert beim Budgettest (512 gelesene Originale statt maximal
128), drei weitere Sicherheitsfälle bestehen dort bereits. Nachher alle
vier grün. Vollständiger `npm run check`: 244 Dateien / 10.734 Tests,
Typprüfung, Builds, Metadaten-/Locale-/Browserprüfungen und Firefox-Lint
0 Fehler / 0 Notices / 0 Warnungen. Chromium-, Firefox- und Waterfox-Erweiterungssmokes
mit Inline-Ranges, großem Einzeltext, Schutzbereichen und Restore erfolgreich.

Zwei neue Android-0,5-s-Proben wurden mit unverändertem 456caf9-Produktcode
und instrumentierter lokaler MSE-Fixture durchgeführt. Der Nutzer meldete
anschließend zwischenzeitliche Gerätebedienung, Zeitpunkt/Zuteilung unbekannt.
**Beide Proben als kausaler Aus/an-Vergleich und Freigabenachweis verworfen**,
auch bei durchgehend gemeldeter Seitensichtbarkeit. Die ausgeschaltete Probe
enthält Segmentfetch-Verzögerungen bis 2.350 ms, Audiopufferleerlauf und
passende `waiting`-Episoden; dies bleibt ein beeinflusster Transporthinweis,
keine Erklärung der früheren gültigen Gegenbefunde. Starre 65-s-Aufnahme
kann bei verzögerter Wiedergabe außerdem das Signalende verfehlen; vor
weiterer Abnahme Aufnahmevor-/nachlauf und vollständigen Prüfton prüfen.
Originalversion/-settings verifiziert restauriert, temporäre ID entfernt,
Autoplay restauriert, eigene ADB-Testports geschlossen, Wachhalten weiterhin
0. Gerät an Nutzer freigegeben; keine weiteren Geräteproben in dieser Runde.

Unprofilierte Chromium-30/60-FPS-Proben, Erweiterung zuerst, technisch grün,
aber frühe Callbackepisoden bleiben: 30 FPS 159,7/444,4 ms und 60 FPS
437,5/376,4 ms (Basis/Erweiterung). Eingeschwungene Abstände unter 56 ms.
Ein grünes Gate ist weiterhin keine vollständige Videoabnahme. #419 NO-GO;
keine Store-, Tag-, Release-, Berechtigungs- oder Pale-Moon-Aktion.

### Restore-Fortsetzung ohne verschachtelte Timerwartezeit, 13.10.2026

Der erste Restore-Fix `aaa808a` ist gepusht; vollständige unabhängige CI
38471014062 inklusive Gecko, Chromium/Video, Performance und CodeQL grün.
Zweiter Produktfix `0ed27b1`: Fortsetzung über `scheduler.postTask` mit
Hintergrundpriorität und unverändertem 4-ms-/128-Schritte-Budget; fehlende API
oder abgelehnte Task-Anfrage behalten Timer. Token verwerfen alte Callbacks
nach synchronem Stop/Finish. Keine neue Transformationsregel.

Eigene lokale synthetische Chromium-CPU-4-Fixture mit 16.000 tatsächlich
korrigierten Texten, je drei Proben: Timer-Restore 4,03/4,27/4,20 s;
Hintergrund-Tasks 185/162/191 ms, jeweils vollständige Originalrückgabe.

Separate unprofilierte Fairnessprobe mit FFprobe-bestätigter 60-FPS-Quelle,
16.000 Texten, CPU-4 und drei alternierenden Timer/Task-Paaren:

| Paar | Timer: gesamte Rückgabe | Hintergrund-Task: gesamte Rückgabe | Task: Eingabe bis rAF | Task: höchster Callback-Abstand |
| --- | --- | --- | --- | --- |
| 1, Timer zuerst | 1.165 ms | 178 ms | 1,0 ms | 21,5 ms |
| 2, Task zuerst | 1.240 ms | 174 ms | 1,1 ms | 24,0 ms |
| 3, Timer zuerst | 1.173 ms | 172 ms | 0,9 ms | 21,1 ms |

Alle sechs Proben restaurieren 16.000/16.000 Texte; keine Long Tasks oder
Drops. Unterschiedliche Beobachtungsfenster durch unterschiedlich lange
Rückgabe: absolute Callbackzahlen sind kein Modus-Performancevergleich.
Erste Scheibe mit Video 6,3–7,4 ms: kooperatives Budget bleibt keine harte
Einzeloperationgarantie. Diese endliche Restore-Probe ersetzt keine Abnahme
der offenen Streaming-/Startbefunde. Vier neue Regressionen für begrenzte
Fortsetzung, synchronen Stop, Task-Ablehnung und verspätete Ablehnung nach
Finish; Task-Test scheitert auf vorherigem Timer-Code. Vollständiger lokaler
Projektcheck grün; finale Suite 245 Dateien / 10.738 Tests, native Smokes
Chromium, Firefox und Waterfox einschließlich Ranges/Restore erneut grün.
Daten ausschließlich synthetisch, Rohdaten lokal ignoriert. #419 NO-GO.

### Leere Inline-Kontextnachbarn ohne TreeWalker-Allokation, 13.10.2026

Eine eigene lokale native Fixture stellt einen einzelnen Kontexttext hinter
0/1.000/10.000/50.000 leere Inline-Spans. Verarbeitung fordert vorhergehenden
Kontext an, kontrolliert Dativziel und Originalrückgabe; Aufbau außerhalb
der gemessenen einzelnen `processTextNode`-Operation. Synthetische Grenze,
keine belegte reale Häufigkeit solcher Seitenstrukturen.

Bisher entstand für jedes leere Inline-Blatt ein erfolgloser TreeWalker.
Leere Nicht-Text-Blätter werden jetzt ohne Walker gelesen; Blockgrenzen
werden weiterhin zuerst geprüft. Derselbe Schnellpfad gilt bei Änderung
des vorangehenden Kontexts. Sechs neue Regressionen mit echten Produktregeln
prüfen Dativ, Kontextwechsel, Restore, drei leere Blockgrenzen und Code-
Schutz. Vorher scheitern beide Allokationsregressionen (u.a. 3.000 Walker
bei 1.000 leeren Nachbarn), alle vier übrigen Sicherheitsfälle bestehen.

| Native Einzeloperation, 50.000 leere Nachbarn, je drei Proben | Vorher | Nachher |
| --- | --- | --- |
| Chromium, CPU-4 | 87,7 / 89,0 / 96,3 ms | 31,0 / 30,7 / 33,5 ms |
| Firefox 157.0.1, ungedrosselt | 19 / 18 / 20 ms | 7 / 9 / 9 ms |
| Waterfox, ungedrosselt | 17 / 20 / 23 ms | 9 / 6 / 15 ms |

Alle nativen Proben erhalten Dativziel und Original korrekt. Vollständiger
lokaler Projektcheck: 246 Dateien / 10.744 Tests, Typprüfung, beide Builds,
Metadaten-/Locale-/Browserprüfungen, Firefox-Lint ohne Fehler/Warnungen.
Native Rohdaten lokal ignoriert unter `artifacts/restore-preparation-resume/`.
**Teilkorrektur:** Der verbleibende lineare Kontextlauf kann weiterhin eine
Arbeitsscheibe überschreiten. Nächste Ursachenprüfung: große Kontextläufe
in der vorhandenen lokalen Anfragepipeline kooperativ vorbereiten, ohne
Kontext abzuschneiden oder Schutz-/Flexionsverhalten zu lockern. #419 NO-GO.

### Lange Anfragekontexte kooperativ vorbereiten, 14.10.2026

Die Kontextvorbereitung normaler budgetierter lokaler Textanfragen behält
nach einer kurzen unmittelbaren Prüfung ihren Iterator. Fortsetzungen
laufen in der vorhandenen begrenzten Anfragepipeline mit 1-ms-Budget und
höchstens 1.024 Schritten. Hintergrund-Tasks werden bevorzugt; fehlende oder
abgelehnte Tasks verwenden Timer. Vollständiger vorangehender Kontext und
folgender Partizipschutz bleiben erhalten. Geänderte Grenzen, fremde Texte,
Editorwechsel, Stop und neue Optionen verwerfen den alten Stand; auch vor
Anfragestart verworfene Iteratoren werden freigegeben. Untertitel benötigen
diese normale Kontextvorbereitung nicht und behalten ihren Anfragepfad.

Separate native Chromium-Fixture, CPU-4, bestätigte 60-FPS-Quelle,
50.000 leere Inline-Nachbarn, drei alternierende Vorher/Nachher-Paare:

| Paar | Vorher: erster Aufruf | Nachher: erster Aufruf | Vorher: Eingabe bis rAF | Nachher: Eingabe bis rAF | Vorher / Nachher: Korrektur vollständig |
| --- | --- | --- | --- | --- | --- |
| 1, vorher zuerst | 46,2 ms | 7,0 ms | 51,3 ms | 11,2 ms | 59,8 / 139,0 ms |
| 2, nachher zuerst | 46,8 ms | 7,8 ms | 60,3 ms | 12,6 ms | 59,9 / 145,5 ms |
| 3, vorher zuerst | 45,2 ms | 7,1 ms | 49,6 ms | 13,1 ms | 57,2 / 138,0 ms |

Dies verbessert die Reaktionszeit auf Kosten der gesamten Korrekturdauer;
keine allgemeine Durchsatzsteigerung. Alle Ziele und Originalrückgaben
korrekt; keine Long Tasks oder Drops in diesen endlichen Proben. Höchste
Callbackabstände nachher 25,1 / 21,4 / 26,7 ms. Mit 1.000 Nachbarn sinkt der
erste Aufruf von 9,5–12,0 auf 7,0–7,3 ms, die Korrektur steigt von
17,4–23,1 auf 28,5–31,5 ms. Fixture verwendet eine synthetische Regel und
asynchrone Transformationsfunktion; sie misst die DOM-Pipeline, nicht die
vollständige Erweiterung oder reale Seitennutzung. Zeitbudget bleibt
kooperativ, keine harte Einzeloperationgarantie.

Zwölf Regressionen mit Produktregeln prüfen vollständigen Dativkontext,
große Geschwisterlisten/Teilbäume, fremde Änderungen, bereits gelesenen
Kontext, Editorwechsel, Partizipschutz, Untertitelpriorität, Stop,
Optionswechsel, frühe Iteratorfreigabe und beide Timer-Fallbacks. Die zwei
Budgetregressionen scheitern auf dem vorherigen synchronen Code.
Abschließender Gesamtcheck: 247 Dateien / 10.756 Tests, Typprüfung, Builds,
Metadaten-/Locale-/Browserprüfungen und Firefox-Lint ohne Fehler/Warnungen.
Native Erweiterungssmokes Chromium, Firefox und Waterfox mit Inline-Ranges,
großem Einzeltext, Schutzbereichen und Restore erfolgreich. Synthetische
Rohdaten lokal ignoriert. Lange synchrone Folgekontext-Invalidierung und
die allgemeinen Streaming-/Startbefunde sind damit nicht abgeschlossen.

Die erste neue Ersatzgeräte-Reihe erkennt eine absichtliche 128-ms-Lücke
im lokalen Playback-Abgriff; vier moderate 0,5-s-MSE-Proben enthalten keine
innere Stille ab 20 ms. **Kein gültiger Aus/an-Nachweis:** Ein zusätzlicher
Texttransformer auf dem Ersatzgerät verändert den Marker auch bei
entfernter temporärer Sprachverstand-ID. Alle vier Vergleiche verworfen;
zwei Stressanläufe brechen vor Wiedergabestart an der Zustandskontrolle ab.
Nach Entfernung/Deaktivierung zusätzlicher Erweiterungen wird die Reihe
mit durchgehender Markerkontrolle wiederholt. Keine Mikrofonaufnahme;
Aufnahmen, Browserinventar, Sicherungen und eindeutige Kennungen bleiben
lokal. #419 weiterhin NO-GO.
