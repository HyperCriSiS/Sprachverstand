# Linux-Navigationsbeginn: Diagnose vom 17. Oktober 2026

## Aktueller Gegenbefund

Die [CI auf `4783bc6`](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38984807772)
scheitert mit Chromium **155.0.8059.0** unter Linux beim ersten Seitenaufruf:
`Timed out receiving message from renderer: 30.000`. Die DOM-Prüfungen haben
noch nicht begonnen. Kernprüfung, Performancecheck und Gecko bestehen.
Der Vorgänger `13feb5a` hatte acht erfolgreiche Prüfungen; die nachfolgende
Änderung betrifft ausschließlich die Firefox-Nachweisdokumentation.
Eine Produktursache oder ein bloßer Infrastrukturfehler ist damit nicht bewiesen.

## Unabhängiger Navigationszeuge

Ein isolierter Diagnosebranch verwendet denselben Produktstand, dieselbe
synthetische Smoke-Seite und das unveränderte 30-Sekunden-Limit. Eigene
HTTP-Serverzeitmarken und ein separater Browserkanal erfassen nur begrenzte
Ladeereignisse und feste DOM-Zustandswerte.

Der erste Diagnoseversuch scheiterte vor Browserstart an der neuen
Treiberpfadauflösung und ist **kein Produktmessergebnis**. Die Korrektur
unterstützt sowohl die auf dem Runner bereitgestellte Treiberverzeichnisangabe
als auch eine ausführbare Datei; beide Varianten sind regressionsgesichert.
Der [korrigierte Lauf](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38987561779)
besteht sechs Navigationen und einen getrennten Validierungskontrollfall.

Der Kontrollfall verzögert absichtlich eine synthetische Ressource und verwendet
**nur zur Instrumentierungsvalidierung** ein 500-ms-Limit. Er erzeugt einen
Renderer-Timeout bei gleichzeitig nachweisbarer HTTP-Antwort und unabhängig
lesbarem Dokument. Das belegt die Messfähigkeit; es erklärt den echten
30-Sekunden-Gegenbefund nicht.

## Startphasen und Einfluss des Beobachters

Der [Vierfachvergleich auf `1bdb313`](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38987794541)
prüft zwei Rollenfolgen und zwei Zeitpunkte für den Browserbeobachter auf
getrennten Linux-Runnern. Pro Runner werden sechs frische Sitzungen erzeugt:
erste Rolle / Gegenrolle / Gegenrolle / erste Rolle / erste Rolle / Gegenrolle.
Der Beobachter wird entweder vor der Navigation oder erst nach deren Antwort
verbunden. Eigene HTTP-Zeitmarken sind in beiden Varianten vorhanden.

| Erste Rolle | Beobachter | Erste Sitzung erzeugt | Beobachter aufgebaut | Erste Navigation |
| --- | --- | --- | --- | --- |
| Ohne Erweiterung | Danach | 22.827,0 ms | 193,7 ms | 136,5 ms |
| Ohne Erweiterung | Davor | 24.725,8 ms | 17,2 ms | 137,3 ms |
| Mit Erweiterung | Danach | 13.649,1 ms | 44,9 ms | 207,4 ms |
| Mit Erweiterung | Davor | 8.507,6 ms | 13,6 ms | 151,8 ms |

Alle **24 Navigationen** bestehen. Statische und dynamische Prüfinhalte sowie
Code-/Eingabeschutz entsprechen in jeder Rolle der Erwartung; Fokus und
Sichtbarkeit sind in den Snapshots bestätigt. Alle vier getrennten
Validierungskontrollen bestehen, sämtliche eigenen Sitzungen sind beendet.

Die langen ersten Wartezeiten liegen in `POST /session`, vor dem eigentlichen
Seitenaufruf. Sie treten auch ohne Erweiterung auf. Der Beobachteraufbau erklärt
sie in dieser Reihe nicht. Unterschiede zwischen verschiedenen Runnern sind
kein stabiler Nachweis einer positiven oder negativen Erweiterungszusatzlast.
Ein kalter Betriebssystem-Dateicache wurde nicht kontrolliert.

Zwei spätere Navigationen **ohne Erweiterung** benötigen 632,1 beziehungsweise
509,4 ms. Beim zweiten Fall liegen rund 402,4 ms zwischen dem empfangenen
Browser-Anfrageereignis und dem eigenen HTTP-Anfrageereignis; der Server
beendet seine Antwort anschließend in rund 0,4 ms. Dies sind Zeitmarken des
Diagnoseprozesses, keine native CPU-/Scheduling- oder physische Displaymessung.
Auch dieser Befund wird nicht als Erklärung des früheren Timeouts ausgegeben.

## Automatischer Nachweis beim regulären Fehler

Die reguläre Chromium-CI aktiviert einen begrenzten Fehlernachweis. Sie verbindet
**keinen Browserbeobachter vor der erfolgreichen Navigation**. Erst wenn der
ursprüngliche Seitenaufruf scheitert, versucht sie eine unabhängige Abfrage
des eigenen Testdokuments. Ist der Renderer weiter unerreichbar, bleiben die
HTTP-Zeitmarken erhalten. Der ursprüngliche Fehler wird unverändert weitergeworfen.
Navigationsbeginn und Fehlerbeobachtung werden auf derselben relativen Uhr wie
die Serverereignisse erfasst. Damit lässt sich eine Antwort vor dem Fehler von
späterem Fortschritt während der Diagnose unterscheiden; der DOM-Snapshot
bleibt ausdrücklich eine Beobachtung nach dem Fehler.
Zusätzlich wird `loadEventEnd` aus der Browser-Navigationszeitachse mit der
gemessenen Anfrage-/Antwortspanne auf diese relative Uhr abgebildet, mit einem
zusätzlichen Millisekundenpuffer für Zeitquantisierung. Nur wenn das gesamte
Intervall vor der Fehlerbeobachtung liegt, wird die vorherige Ladebeendigung
bestätigt. Fehlende Ladezeitpunkte oder überlappende Intervalle bleiben unbewertet.
Das ausgehandelte Seitenlimit wird separat erfasst. Ein vor Ablauf bestätigtes
Ladeende wird nur ausgewiesen, wenn das gesamte Intervall auch vor
Navigationsbeginn plus Seitenlimit liegt. Ein Ladeende nach Ablauf, aber vor
der Fehlerrückmeldung könnte durch den Abbruch selbst entstanden sein und
wird nicht als Beweis eines voreiligen Timeouts verwendet.

Der Export ist auf eine einzelne synthetische JSON-Zusammenfassung beschränkt:
Browserversionsnummer, Fehlerklasse, Zeitdauern, feste Zustandswerte und
begrenzte Ereignisnamen. Unbekannte Felder, Profile, Rohprotokolle und
Sitzungskennungen werden vor dem Upload abgewiesen. Fehler der Diagnose
wandeln einen fehlgeschlagenen Test nicht in Erfolg um.

Der tatsächliche Fehlerpfad ist lokal mit einer ausschließlich zur Validierung
verzögerten Ressource geprüft: Der Test bleibt rot; der separat validierte
Nachweis enthält einen vollständigen korrigierten Fixture-Zustand und
unveränderte Schutzbereiche. Beschädigte Protokollantworten und unzulässige
Exportfelder sind gezielt getestet.

## Verbleibende Grenze

Der echte 30-Sekunden-Timeout ist in diesen gezielten Vergleichsreihen nicht
erneut aufgetreten und bleibt offen. Die neue automatische Fehlersicherung
soll verhindern, dass bei einem erneuten regulären Fehler die benötigte
Evidenz fehlt. Kein Produktfix, keine gelockerten Grenzen, keine gesamte
Performance-, Browser- oder Releasefreigabe. PR #451 bleibt Entwurf;
Issue #419 bleibt NO-GO.

## Erneuter echter Fehler mit gesichertem Nachweis

Die reguläre [CI 39054176385](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39054176385) auf `49ce645` scheitert erneut beim ersten Chromium-Seitenaufruf, unverändert mit 30-Sekunden-Renderer-Timeout. Kernprüfung, Performance und Gecko bestehen; der Gesamtstatus bleibt rot. Dieser Lauf wird nicht unverändert neu gestartet oder durch einen späteren grünen Stand als gelöst umgedeutet.

Diesmal sind der tatsächliche Fehlerfilter und der Actions-Upload erfolgreich ausgeführt. Das einzelne streng validierte synthetische Artefakt heißt `navigation-failure-a82e0ff1f008db53b9660c59778310ff3eb0c990`; der Name bindet den geprüften Mergebaum, nicht nur den PR-Head. Browserversion 155.0.8059.0, gemessene Navigation 30.011,914 ms bei unverändertem 30.000-ms-Limit, anschließende Diagnose 7,102 ms. Der reguläre eigene Serverzeuge erfasst **keine HTTP-Anfrage oder beendete Antwort für die Fixture**, auch keine Browserereignisse; sein Puffer ist nicht abgeschnitten. Ein eigenes Fixture-Dokument ist nicht bestätigt, der Snapshot fehlt, sämtliche Aussagen zur vorherigen Ladebeendigung bleiben unbekannt.

Zwischen Aufbau des Serverzeugen und Beginn des Navigationsbefehls liegen bereits 42.362,993 ms. Im geprüften Ablauf liegen dort die Sitzungserzeugung und anschließende synchrone Kennungsextraktion; dies ist keine zusätzlich isolierte Messung interner Browserstartkosten. Die fehlenden Serverereignisse liefern keinen Beleg für ein bereits fertig geladenes oder von Sprachverstand verarbeitetes Testdokument.

Der vorhandene Nachfehler-Beobachter verwirft unerwartete Debugger-Zielzustände weiterhin streng und bewahrt keine freien URLs oder Rohprotokolle. Sein abgefangener Fehler unterscheidet bislang jedoch nicht zwischen Adressprüfung, Discovery, Zielauswahl, Verbindung und Snapshot. Aus den nur 7 ms Diagnosezeit wird keine konkrete dieser Ursachen geraten. Die nächste begrenzte Verbesserung ist eine ausschließlich aus festen Stufen-/Zielzustandswerten bestehende Fehlerklassifikation nach dem ursprünglichen Fehler. Sie darf weder die erfolgreiche Navigation vorab beobachten noch Ziel-/Adressgrenzen lockern oder das ursprüngliche Timeout verändern. Der echte Gegenbefund bleibt offen.

## Feste Stufenklassifikation nach dem Fehler

Der Nachfehler-Bericht verwendet jetzt Schema 3 mit genau drei zusätzlichen festen Metadaten: Beobachtungsstufe, Zielzustandsklasse und begrenzte Anzahl der gefundenen Seiten. Die Stufen unterscheiden Adressprüfung, Discovery, Zielauswahl, Websocket-Endpunktprüfung, Verbindung, Aktivierung der Beobachtungsdomänen und Snapshot. Erfolg wird separat als `complete` erfasst. Zielzustände sind ausschließlich unbeobachtet, keine Seite, mehrere Seiten, bekannte Fixture, ursprüngliche WebDriver-Leerseite oder anderes Ziel. Freie URLs, Kennungen, Protokollantworten und Fehlertexte werden nicht gespeichert. Ein anderes Ziel bleibt strikt verweigert; die neue Klassifikation lockert weder Ziel- noch Adressgrenzen.

Die Ausgabe entsteht weiterhin erst nach fehlgeschlagener Originalnavigation. Der erfolgreiche Navigationspfad erhält keine zusätzliche Beobachterverbindung; Timeout, ursprünglicher Fehler und roter Teststatus bleiben unverändert. Der Validator liest die unveränderten früheren Schema-2-Berichte weiterhin, ohne fehlende Stufen zu erfinden. 34 gezielte Tests prüfen unter anderem private/unbekannte Ziele, mehrere/fehlende Seiten, ausbrechende Verbindungsadressen, Snapshotfehler, Metadatengrenzen und die alte Schemaform. Der tatsächliche Schema-2-Nachweis des roten CI-Laufs wurde erneut unverändert validiert.

Zusätzlich ist der reale Fehlerpfad mit dem vorhandenen isolierten Verzögerungskontrollfall geprüft: ausschließlich dort 500-ms-Seitenlimit und eine nach 1,5 Sekunden gelieferte synthetische Ressource, nativer Windows-Chromium 155.0.8059.39. Der Prozess endet erwartungsgemäß mit Fehler; Navigation 517,038 ms, Diagnose 110,490 ms. Der neue Bericht erfasst `complete` / bekannte Fixture / eine Seite sowie korrigierte statische und dynamische Texte und erhaltene Code-/Eingabeschutzbereiche. `loadEventEnd` ist nullwertig; ein vor Ablauf bestätigtes Ladeende bleibt ausdrücklich unbekannt. Diese Validierung belegt die Messfähigkeit und Fehlererhaltung, erklärt aber den echten Linux-30-Sekunden-Timeout nicht. Die konkreten neuen Fehlerunterstufen sind durch gezielte Protokolltests geprüft; sie wurden im echten Linux-Gegenbefund noch nicht nachträglich ermittelt.
