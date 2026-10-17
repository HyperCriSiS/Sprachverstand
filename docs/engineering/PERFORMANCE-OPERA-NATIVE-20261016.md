# Native Opera-Prüfung des aktuellen Performance-Produktstands

Stand: 16.10.2026. Produktcode `f778bae`, PR #451 weiterhin Entwurf.
Die Prüfung betrifft den PR-Stand, nicht die ältere main-Release-Basis.

## Laufzeit und geprüfte Herkunft

Opera **137.0.6036.63** läuft nativ unter Windows im Headless-Modus.
OperaDriver **153.0.8010.55** ist laut
[Hersteller-Release](https://github.com/operasoftware/operachromiumdriver/releases/tag/v.153.0.8010.55)
für Opera Stable 137 vorgesehen. Die WebDriver-Antwort nennt `chrome`
und Engine-Version 153.0.8010.55; der lokale Browser meldet zugleich
`OPR/137`. Browserprodukt und Chromium-Engine sind getrennte Versionen.

Das x64-Paket stammt aus dem offiziellen
[Opera-Verzeichnis](https://get.opera.com/pub/opera/desktop/137.0.6036.63/win/).
Paket-SHA-256: `639a4c114f2432b6f0a2e3cdbe659eabd5c7f212455e3f1dcb1a97d69a4b1fee`.
Die offizielle Prüfsumme sowie gültige Opera-Signaturen von Paket und
Laufzeit wurden geprüft. Das Driverarchiv entspricht seinem vom Hersteller
veröffentlichten SHA-256-Digest. Nur lokal entpackt, Installer nicht
ausgeführt; ausschließlich eigene temporäre Testprofile.

Die vorhandenen DOM-/Video-Prüfskripte wurden lokal für die native
Opera-Laufzeit angepasst. Die
[Herstelleranbindung](https://github.com/operasoftware/operachromiumdriver/blob/master/docs/desktop.md)
benötigt ausdrücklich den W3C-Modus. Es wurden keine Erweiterungsrechte
oder Produktfunktionen geändert. Sauberer Produktbuild, Content-SHA-256:
`9b54097b9da67907baca342325f8ab24d4221a686509a1437d86c4c607892ab0`.
Die zwei älteren uncommitteten Transportversuche sind ausgeschlossen.

## DOM und Wiedergabe

Der DOM-Smoke besteht: statische und dynamische Korrekturen, geschützter
Code und Eingaben, spät offene und spät verschachtelte ShadowRoots,
ereignisloser DesignMode-Wechsel, Inline-/große Einzeltext-Ranges und Restore.

Ein erster Videoansatz wurde wegen fehlenden Fokus vor Messbeginn
abgebrochen und liefert keine gültige Performanceaussage. Die frische
Opera-Instanz behält eine zusätzliche Startseite; bloßes Schließen dieser
Seite löst die Fokusbereitschaft nicht. Die gültigen Proben aktivieren die
Testseite und bestätigen Fokus/Sichtbarkeit, bevor Video und Absatzlast
starten. Beide Rollen verwenden dieselbe Steuerung und unveränderte Gates.

| 30-FPS-Probe | Drops ohne/mit Erweiterung | Callbacks ohne/mit | Maximum aller erfassten Callbackabstände ohne/mit |
| --- | ---: | ---: | ---: |
| Kontrollierter Start mit bereits gesetzter Quelle | 9/9 | 231/231 | 62,7/94,2 ms |
| Quelle erst nach bestätigtem Fokus gesetzt | 9/10 | 208/207 | 92,9/63,2 ms |

Alle **1.920 Endtexte** korrekt. Keine beobachtete Page-Long-Task und
kein Abstand über 120 ms in sämtlichen erfassten Callbackintervallen.
Alle Frames sowie die Abschlusszustände sichtbar/fokussiert;
Long-Task-Beobachtung war eingeschaltet. Die unveränderten relativen
Video-Gates bestehen in beiden Paaren. Keine Null-Drop- oder 60-FPS-Aussage.

Vor dem zweiten Paar sind leeres `currentSrc`, `readyState=0`, pausiertes
Video und das Fehlen eines Videoressourcenabrufs geprüft. Erst danach wird
die Quelle gesetzt. Dies erfasst den Medienanlauf nach Fokusbestätigung,
aber nicht sämtliche Kosten des vorher bereits gestarteten Content-Scripts
und der Erweiterungsinitialisierung. Keine vollständige Kaltstartabnahme.

## Untertitel und Aufräumen

Aus/An/Aus über die echte Optionsseite funktioniert bei fortlaufendem Video.
Tabwechselzeiten sind keine Cue-Latenz. Eine getrennte Probe mit explizitem
Fokusguard und geprüften Ausgaberecords ergibt:

| Kontrollierte Cues | Vollständig | Median | Maximum |
| --- | ---: | ---: | ---: |
| Unterschiedliche Texte | 6/6 | 1,35 ms | 7,0 ms |
| Wiederholter Text | 6/6 | 0,30 ms | 1,4 ms |

Alle zwölf Cues sind bei Ausgabe fokussiert/sichtbar und bei Korrektur
sichtbar. Zeitstempel entstehen in der Seite; WebDriver-Antwortzeiten sind
nicht als Verarbeitungslatenz enthalten.

Alle eigenen Opera-/Driverprozesse sind nach den letzten Proben beendet,
alle drei Driverports geschlossen. Eine nach einem früheren Bereitschafts-
abbruch verbliebene eigene Browser-Prozessgruppe wurde anhand ihres
Runtime- und Testprofilpfads gezielt beendet. Keine persönlichen Profile,
Mikrofone, Aufnahmen oder Gerätekennungen im öffentlichen Nachweis.

Native Windows-Headless-Teilabnahme des aktuellen PR-Produktstands:
bestanden. Interaktive Opera-/Store-/Installationsprüfungen, aktuelle
main-Release-Abnahme und vollständiger Erweiterungskaltstart sind damit
nicht bestätigt. Die offenen Chromium-Gegenbefunde bleiben bestehen;
#419 bleibt NO-GO.
