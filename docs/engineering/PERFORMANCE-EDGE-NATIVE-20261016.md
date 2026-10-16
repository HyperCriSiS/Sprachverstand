# Native Edge-Prüfung des aktuellen Performance-Produktstands

Stand: 16.10.2026. Produktcode `f778bae`, PR #451 weiterhin Entwurf.
Diese Prüfung betrifft den PR-Stand, nicht die ältere main-Release-Basis.

## Laufzeit und Herkunft

Microsoft Edge **152.0.4191.135** und Edge WebDriver derselben Version
laufen nativ unter Windows im Headless-Modus. Ein reguläres interaktives
Browserfenster, die Installation über einen Store und Opera sind damit
nicht geprüft. Microsoft verlangt passende erste drei Versionsbestandteile
von Browser und Driver: [WebDriver-Dokumentation](https://learn.microsoft.com/en-us/microsoft-edge/webdriver/).

Das Windows-x64-Stable-Paket stammt aus dem offiziellen
[Microsoft-Releasekatalog](https://edgeupdates.microsoft.com/api/products?view=enterprise).
MSI-SHA-256: `97a757053e806a7b4e42fb24285d1b3dc2191db4f56031a16be735cb291e0322`.
Kataloghash, Paketgröße und gültige Microsoft-Signaturen von Paket, innerem
Browserpaket, Laufzeit und Driver wurden vor dem Start geprüft. Ausschließlich
Archivdateien wurden lokal entpackt; weder MSI noch Browserinstaller wurden
ausgeführt. Keine Hostinstallation oder Änderung eines persönlichen Profils.

Die temporären Prüfskripte verwenden den bestehenden Browser-Smoke und
Video-/Untertiteltest mit Edge-spezifischen WebDriver-Capabilities.
Testdaten und Profile bleiben lokal; nur Loopback-Testseiten werden geprüft.
Der isolierte Produktbuild hat Content-SHA-256
`9b54097b9da67907baca342325f8ab24d4221a686509a1437d86c4c607892ab0`.
Die zwei älteren lokalen Transportversuche sind nicht enthalten.

## Ergebnisse

Der vollständige DOM-Smoke besteht: statische/dynamische Korrekturen,
geschützter Code und Eingabefeld, spät offene und spät verschachtelte
ShadowRoots, ereignisloser DesignMode-Wechsel sowie Inline-/große
Einzeltext-Ranges einschließlich Wiederherstellung.

| 30-FPS-Probe unter dynamischer Absatzlast | Ohne Erweiterung | Mit Erweiterung |
| --- | ---: | ---: |
| Korrekte Endtexte | 480/480 | 480/480 |
| Video-Callbacks | 241 | 239 |
| Gemeldete Drops | 0 | 1 |
| Größter Callbackabstand | 61,3 ms | 51,5 ms |
| Beobachtete Page-Long-Tasks | 0 | 0 |

Unveränderte relative Video-Gates bestanden. Beide Rollen waren am Start,
am Ende und bei sämtlichen erfassten Frames sichtbar/fokussiert;
Long-Task-Beobachtung war eingeschaltet. Dies ist ein Paar, keine
allgemeine Null-Drop- oder 60-FPS-Aussage.

Die Untertiteloption lässt sich über die echte Optionsseite Aus/An/Aus
schalten, während das Video weiterläuft. Die dabei anfallenden Tabwechsel
sind ausdrücklich keine Cue-Latenz. Eine getrennte kontrollierte Probe
prüft Fokus und Sichtbarkeit vor Ausgabe sowie Sichtbarkeit bei Korrektur:

| Kontrollierte Cues | Anzahl vollständig | Median | Maximum |
| --- | ---: | ---: | ---: |
| Unterschiedliche Texte | 6/6 | 1,5 ms | 4,1 ms |
| Wiederholter Text | 6/6 | 0,25 ms | 1,6 ms |

Die Zeitstempel entstehen in der Testseite vor der Textzuweisung und beim
beobachteten Korrekturergebnis; WebDriver-Antwortzeit wird nicht als
Verarbeitungslatenz gezählt.

## Grenzen und Aufräumen

Alle eigenen Browser-/Driverprozesse sind beendet und alle drei
Driverports geschlossen. Kein Mikrofon, keine Aufnahmen und keine
Gerätekennungen oder persönlichen Profile im öffentlichen Nachweis.

Dies schließt einen Teil der offenen nativen Edge-Abnahme auf dem aktuellen
PR-Produktstand. Die bestehenden Chromium-Gegenbefunde, eine interaktive
Edge-Abnahme, Opera, Store-/Installationsprüfungen und eine aktuelle
Release-Abnahme bleiben davon unberührt. #419 bleibt NO-GO.
