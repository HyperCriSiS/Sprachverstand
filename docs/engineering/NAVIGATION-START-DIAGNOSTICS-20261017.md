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
