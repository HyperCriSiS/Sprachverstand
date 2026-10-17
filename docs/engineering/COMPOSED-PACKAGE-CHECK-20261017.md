# Gemeinsame Paketprüfung der vorbereiteten Änderungen

## Geprüfter Umfang

Am 16./17. Oktober 2026 wurde ein separater lokaler Quellsnapshot aus
`dfab42770fbf6906fc245be4a5db03547b355062` (PR #451) aufgebaut. Darauf wurden
ausschließlich die Daten- und Registrierungsänderungen sowie die zugehörigen
Tests aus diesen drei vorbereiteten Änderungen angewendet:

| PR | Geprüfter Commit | Ergänzung |
| --- | --- | --- |
| #454 | `847c9943888a62bb51c8264a0e5cae76027d9d5d` | Zehn zusätzliche Schreibvarianten beziehungsweise Personenbasen |
| #455 | `2320eb4cdfb1ad271b770911e0ddde2f9e00a146` | 190 exakte ausgeschriebene Personenpaare |
| #456 | `ff8831dcad57a7f3b012c1c80e9b28210693bb54` | 13 exakte Personenformen mit gesondert geprüfter Flexion |

Es fand kein Git-Merge statt. Die beiden uncommitteten Versuchdateien des
Arbeitsverzeichnisses wurden ausgeschlossen; ihre Snapshotfassungen stammen
aus dem gepinnten Gitstand. Die Performanceoptimierungen der Basis blieben
erhalten. Die Prüfung nimmt keine Integration in `main` vorweg.

## Ergebnis

- Paketbau und TypeScript-Prüfung erfolgreich.
- Vollständige Testsuite: **263 Dateien, 11.098 bestandene Tests**.
- Browserzielprüfung erfolgreich; Firefox-Lint ohne Fehler, Warnungen oder Notices.
- Native lokale Laufzeitprüfung mit Microsoft Edge **152.0.4191.135** und
  Firefox **157.0.1**, jeweils headless und mit separatem Testprofil.
- In beiden Browsern alle **213 ergänzten Fälle** korrekt umgeformt und nach
  Entfernung aus dem geprüften Teilbaum vollständig wiederhergestellt.
- Drei zusätzliche Fälle in offenen ShadowRoots ebenfalls korrekt umgeformt
  und wiederhergestellt. Eingabefelder, Textareas, Code und editierbare
  Inhalte blieben geschützt.
- Bestehende Prüfungen für dynamische Texte, zugängliche Attribute, spät
  verschachtelte offene ShadowRoots, `designMode`, große Inlinebereiche und
  große Einzeltexte einschließlich Wiederherstellung bestanden.

Die eigenen Browser- und Driverprozesse, Testports und temporären XPI-Dateien
wurden nach Abschluss unabhängig auf vollständige Bereinigung geprüft.
Die Prüfung verwendete lokale synthetische Inhalte. Es wurden weder ein
persönliches Browserprofil noch ein Mikrofon oder Aufnahmen verwendet.

## Grenzen

### Zusätzliche frische Edge-Starts

Eine gesonderte Startprobe am 17. Oktober vergleicht sechs frische lokale
Edge-Profile in der Reihenfolge Basis / Erweiterung / Erweiterung / Basis /
Basis / Erweiterung. Die Testseite wurde vor Navigation über
`Page.bringToFront` aktiviert; tatsächlicher Dokumentfokus und Sichtbarkeit
wurden geprüft. Die Basis startet ohne Erweiterungen, die Gegenprobe mit dem
oben beschriebenen zusammengesetzten Paket. Je 480 synthetische Textknoten
und geschützte Code-/Eingabefelder werden vollständig kontrolliert.

| Messgröße | Basis, drei Starts | Erweiterung, drei Starts |
| --- | --- | --- |
| WebDriver-Navigationsantwort | 55,3–69,1 ms | 63,0–69,6 ms |
| Erster Animation-Frame-Callback ab Dokumentbeginn | 25,7–36,9 ms | 25,1–32,4 ms |
| Alle 480 Texte korrigiert, ab Dokumentbeginn | Unverändert wie erwartet | 97,8–102,1 ms |
| WebDriver-Sitzung erzeugt | 527,0–603,8 ms | 611,3–1.079,5 ms |

Alle sechs Navigationsantworten liegen innerhalb des unveränderten
30-Sekunden-Limits. In allen drei Erweiterungsläufen sind 480/480 Texte
korrekt, in allen Basisläufen 480/480 unverändert; Schutzbereiche bleiben
jeweils erhalten. Browser- und Driverprozesse sowie der eigene Testport
wurden nach Abschluss unabhängig auf vollständige Bereinigung geprüft.

Die beiden ersten Steuerungsversuche ohne bestätigten Fokus wurden vor der
gültigen Messreihe abgebrochen und werden nicht ausgewertet. Frische Profile
bedeuten keinen kalten Betriebssystem-Dateicache. Die Sitzungszeiten enthalten
Browser-/Driverstart und beweisen bei drei Läufen keine stabile Zusatzlast der
Erweiterung. Der erste Animation-Frame-Callback misst keine physische
Bildschirmdarstellung. Die Probe belegt den aktuellen lokalen Edge-Startpfad;
sie erklärt keinen historischen Linux-Navigationstimeout.

### Weiterhin offene Abnahmen

Dies ist eine gemeinsame **Funktions- und Paketprüfung** der angegebenen
Quellstände. Die Laufzeiten des Prüfskripts sind keine Messung physischer
Darstellungsverzögerung, vollständiger Erweiterungskaltstarts oder störungsfreier
Videowiedergabe. Sie ersetzen keine interaktive Plattform- oder Storeabnahme.

Historische V8-/GC-Wartezeiten, der frühere Navigationstimeout und unzureichend
instrumentierte ältere Einzelproben sind dadurch nicht rückwirkend erklärt.
Die beiden getrennt reproduzierten Chromium-Befunde bleiben eigene offene
Browserprobleme. PR #451 bleibt Entwurf und Issue #419 bleibt ohne Gesamtfreigabe.
