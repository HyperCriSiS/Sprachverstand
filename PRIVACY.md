# Datenschutzerklärung für Sprachverstand

**Stand: 28. Juli 2026**

## 1. Geltungsbereich

Diese Datenschutzerklärung beschreibt die lokale Datenverarbeitung durch die
Browser-Erweiterung **Sprachverstand** für Firefox und Chromium-basierte Browser.
Für die Datenverarbeitung durch den verwendeten Browser, den jeweiligen
Erweiterungs-Store und die Betreiber besuchter Webseiten gelten deren eigene
Datenschutzbestimmungen.

## 2. Grundprinzip

Sprachverstand verarbeitet Webseitentexte ausschließlich lokal im Browser des
Nutzers. Die Erweiterung besitzt keinen eigenen Serverdienst und verwendet keine
externe Sprach-, Analyse- oder Cloud-API.

Webseitentexte, aufgerufene Adressen, Einstellungen und Nutzungsdaten werden
nicht an den Entwickler oder andere Empfänger übertragen.

## 3. Lokal verarbeitete Daten

### Webseitentexte

Sprachverstand liest sichtbare Texte auf aufgerufenen Webseiten, um unterstützte
genderbezogene Schreibweisen zu erkennen und ihre lokale Darstellung nach den
gewählten Regeln anzupassen.

Optional können auch die zugänglichen Textattribute `alt`, `aria-label`,
`aria-description` und `title` verarbeitet werden. Eingabefelder, Editoren,
Quellcode, URLs und technische Daten werden von der regulären Textverarbeitung
ausgenommen.

Die verarbeiteten Inhalte werden nicht an einen Server übertragen und nicht als
Kopie dauerhaft gespeichert.

### Adresse und Domain der aktuellen Webseite

Die Adresse beziehungsweise Domain der geöffneten Seite wird lokal verwendet,
um die Erweiterung auf der Seite auszuführen, persönliche Domain-Ausschlüsse zu
berücksichtigen und den Korrekturzähler dem aktuellen Tab zuzuordnen.

Sprachverstand erstellt keinen Browserverlauf und überträgt keine aufgerufenen
Adressen oder Domains.

### Einstellungen und persönliche Einträge

Folgende Angaben können im Erweiterungsspeicher des Browsers gespeichert werden:

- Aktivierungsstatus der Erweiterung
- aktivierte und deaktivierte Regelgruppen
- persönliche Wort- und Phrasenausnahmen
- eigene wörtliche Ersetzungen mit Ausgangs- und Zieltext
- ausgeschlossene Domains
- Einstellungen für Zitate und zugängliche Textattribute

Diese Daten werden ausschließlich verwendet, um die vom Nutzer gewählte
Konfiguration bereitzustellen. Eigene Ersetzungen werden nicht als reguläre
Ausdrücke ausgeführt, nicht an einen Server übertragen und nicht automatisch aus
Webseiteninhalten gesammelt.

### Import- und Exportdateien

Auf ausdrückliche Anforderung kann Sprachverstand persönliche Ausnahmen und
eigene Ersetzungen als JSON-Datei erzeugen. Diese Datei wird lokal im Browser
erstellt und über die normale Downloadfunktion des Browsers gespeichert.

Eine Importdatei wird nur nach einer bewussten Dateiauswahl lokal gelesen. Vor
der Übernahme prüft Sprachverstand Dateiformat, Schemaversion, Größenlimits und
die enthaltenen Einträge. Die Datei wird weder hochgeladen noch an den
Entwickler oder andere Empfänger übertragen.

Exportdateien können vom Nutzer selbst eingetragene Begriffe und Formulierungen
enthalten. Für ihre Aufbewahrung, Weitergabe und Löschung ist der Nutzer selbst
verantwortlich. Domains, Regelgruppen und sonstige Einstellungen sind in diesem
Export absichtlich nicht enthalten.

## 4. Zweck der Verarbeitung

Die lokale Verarbeitung dient ausschließlich dazu, die Darstellung
unterstützter deutschsprachiger Webseitentexte nach den gewählten Regeln und
eigenen lokalen Ersetzungen anzupassen und diese Änderungen beim Ausschalten
wieder rückgängig zu machen.

Eine Verwendung für Werbung, Profilbildung, Marktanalyse, Nutzerbewertung oder
andere sachfremde Zwecke findet nicht statt.

## 5. Keine Übertragung oder Weitergabe

Sprachverstand überträgt keine durch die Erweiterung verarbeiteten Nutzerdaten
an:

- den Entwickler
- Analyse- oder Telemetriedienste
- Werbenetzwerke
- Cloud- oder KI-Dienste
- sonstige Dritte

Die Erweiterung legt keine Nutzerkonten an und setzt keine eigenen Cookies oder
vergleichbaren Identifikatoren. Nutzerdaten werden nicht verkauft, vermietet
oder veröffentlicht. Menschen erhalten keinen Zugriff auf die lokal
verarbeiteten Webseiteninhalte.

## 6. Lokale Speicherung und Speicherdauer

Einstellungen, persönliche Ausnahmen, eigene Ersetzungen und Domain-Ausschlüsse
bleiben im lokalen Erweiterungsspeicher des Browsers, bis sie vom Nutzer geändert
oder gelöscht werden oder die Erweiterung entfernt wird.

Webseitentexte und aufgerufene Adressen werden nicht als dauerhafte
Datensammlung gespeichert. Exportierte JSON-Dateien liegen außerhalb des
Erweiterungsspeichers und bleiben erhalten, bis der Nutzer sie selbst löscht.

## 7. Browserberechtigungen

### Zugriff auf Webseiten

Der Zugriff auf aufgerufene Webseiten ist erforderlich, damit Sprachverstand
deren sichtbare Texte lokal erkennen und anpassen kann. Der Zugriff wird nicht
verwendet, um den Browserverlauf zu erfassen oder Webseitendaten zu übertragen.

### Speicherberechtigung

Die Speicherberechtigung wird benötigt, um Einstellungen, Regelgruppen,
persönliche Ausnahmen, eigene Ersetzungen und Domain-Ausschlüsse lokal im
Browser zu speichern.

Für Import und Export wird keine zusätzliche Netzwerk- oder Dateisystemberechtigung
angefordert. Der Zugriff auf eine Importdatei erfolgt ausschließlich über den
vom Nutzer geöffneten Dateiauswahldialog.

## 8. Kontrolle durch den Nutzer

Der Nutzer kann Sprachverstand jederzeit:

- global ein- oder ausschalten
- für einzelne Domains deaktivieren
- über die Regelgruppen einschränken
- durch persönliche Ausnahmen konfigurieren
- durch eigene wörtliche Ersetzungen ergänzen
- persönliche Einträge lokal exportieren und wieder importieren
- gespeicherte persönliche Einträge ändern oder löschen
- aus dem Browser entfernen

Beim Ausschalten werden die von Sprachverstand vorgenommenen Änderungen an der
aktuellen Darstellung rückgängig gemacht.

## 9. Chrome Web Store – eingeschränkte Datennutzung

Die Verwendung der durch Browserberechtigungen zugänglichen Informationen ist
auf die in dieser Datenschutzerklärung beschriebene, für den Nutzer sichtbare
Kernfunktion beschränkt.

Sprachverstand verwendet diese Informationen nicht für Werbung, Profilbildung,
Kreditwürdigkeitsprüfungen oder andere sachfremde Zwecke und überträgt sie nicht
an Dritte. Die Nutzung entspricht den Anforderungen zur eingeschränkten
Datennutzung des Chrome Web Store.

## 10. Änderungen dieser Datenschutzerklärung

Diese Datenschutzerklärung wird angepasst, wenn sich die Funktionen oder die
Datenverarbeitung von Sprachverstand ändern. Eine künftige Einführung von
Telemetrie, externen Diensten oder Datenübertragungen müsste vor ihrer Nutzung
deutlich offengelegt und hier dokumentiert werden.

## 11. Kontakt

Fragen zum Datenschutz und zur Erweiterung können über den
[Issue-Tracker des Projekts](https://github.com/HyperCriSiS/Sprachverstand/issues)
gestellt werden. Keine Zugangsdaten, privaten Nachrichten oder persönlichen
Webseiteninhalte in öffentlichen Issues veröffentlichen.
