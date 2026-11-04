# Datenschutz: Sprachverstand für Thunderbird

Stand: 4. November 2026. Gilt für die Thunderbird-Ausgabe ab 0.9.0.

Die Verarbeitung erfolgt lokal innerhalb von Thunderbird. Es gibt keine
externen Sprachdienste, eigenen Server, Telemetrie, Tracking oder Werbung.
Die Erweiterung überträgt weder Nachrichtentexte noch Ersetzungsübersichten
an den Entwickler oder einen Cloud-Dienst.

## Nachrichten beim Lesen

Die Berechtigungen `messagesRead` und `scripting` ermöglichen, das lokale
Verarbeitungsskript in angezeigte Nachrichten einzubinden. Es verändert nur
deren Darstellung. Die gespeicherte Originalnachricht wird nicht geändert.
Korrekturzähler und begrenzte Ersetzungsübersichten werden innerhalb der
Erweiterung an die Oberfläche übergeben, ohne sie dauerhaft zu speichern.
Zu korrigierende Textabschnitte werden innerhalb von Thunderbird an den lokalen
Hintergrundprozess der Erweiterung übergeben und dort verarbeitet, ohne sie dauerhaft zu speichern.
Der Hintergrund liest den aktuellen Zustand aus der geöffneten Nachricht.

## Optionale Antworten und Weiterleitungen

Die Option zur einmaligen Korrektur neu geöffneter Antworten und Weiterleitungen
ist standardmäßig ausgeschaltet. Erst beim Einschalten wird die zusätzliche
Berechtigung `compose` angefordert. Mit Zustimmung wird der tatsächliche Body
des Entwurfs nach den gewählten Regeln geändert. Diese Änderung kann anschließend
gespeichert und versendet werden. Empfänger, Betreff und Anhänge werden dabei
nicht bearbeitet. Es gibt keinen automatischen Versand und keine dauerhafte
Änderung der empfangenen Originalnachricht. Deaktivieren stellt bereits
bearbeitete Entwürfe nicht wieder her.

## Einstellungen

Die Berechtigung `storage` dient zum lokalen Speichern der Einstellungen und
persönlichen Ausnahmen/Ersetzungen. Diese können selbst eingetragene persönliche
Texte enthalten. Sie werden nicht aus Mails automatisch gesammelt.
Die Verfassen-Option wird nur auf diesem Gerät gespeichert und nicht über
allgemeine Sicherungen oder Synchronisierung aktiviert.

Die gemeinsame Oberfläche bietet außerdem eine ausdrücklich wählbare
Synchronisierung einzelner allgemeiner Einstellungskategorien. Standardmäßig
ist sie aus; soweit die Thunderbird-Installation den betreffenden Dienst
bereitstellt, gelten zusätzlich dessen Datenschutzbestimmungen. Mailtexte und
Korrekturübersichten sind keine Synchronisierungskategorien.
JSON-Sicherungen werden nur auf eigene Veranlassung lokal exportiert/importiert.

Für Thunderbird, GitHub und einen späteren Add-on-Store gelten zusätzlich die
Datenschutzbestimmungen des jeweiligen Anbieters. Technische Details stehen
im öffentlich einsehbaren Quellcode des Projekts.
