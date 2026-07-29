# Datenschutzerklärung für Sprachverstand

**Stand: 29. Juli 2026**

## 1. Geltungsbereich

Diese Datenschutzerklärung beschreibt die Datenverarbeitung durch die
Browser-Erweiterung **Sprachverstand** für Firefox und Chromium-basierte Browser.
Für den verwendeten Browser, dessen optionalen Synchronisierungsdienst, den
jeweiligen Erweiterungs-Store und besuchte Webseiten gelten zusätzlich die
Datenschutzbestimmungen der jeweiligen Anbieter.

## 2. Grundprinzip

Die Verarbeitung von Webseitentexten erfolgt ausschließlich innerhalb des
Browsers. Sprachverstand besitzt keinen eigenen Serverdienst und verwendet keine
externe Sprach-, Analyse- oder Cloud-API. Es gibt kein Tracking, keine
Telemetrie, keine Werbung und keine Nutzerkonten des Projekts.

Alle Einstellungen werden standardmäßig ausschließlich in `storage.local` auf
dem jeweiligen Gerät gespeichert. Eine zusätzliche Browser-Synchronisierung ist
für jede Datenkategorie einzeln wählbar und standardmäßig vollständig
deaktiviert.

## 3. Verarbeitete Daten

### Webseitentexte

Sprachverstand liest sichtbare Texte auf geöffneten Webseiten, um unterstützte
genderbezogene Schreibweisen zu erkennen und ihre lokale Darstellung nach den
gewählten Regeln anzupassen. Optional können die Attribute `alt`, `aria-label`,
`aria-description` und `title` verarbeitet werden.

Eingabefelder, Editoren, Quellcode, URLs und technische Daten sind von der
regulären Textverarbeitung ausgeschlossen. Verarbeitete Webseiteninhalte werden
weder dauerhaft gespeichert noch an den Entwickler, einen Synchronisierungsdienst
oder andere Empfänger übertragen.

### Aktuelle Adresse und Domain

Die aktuelle Adresse beziehungsweise Domain wird im Browser verwendet, um die
Erweiterung auszuführen, Domain-Ausschlüsse zu prüfen und den Korrekturzähler dem
richtigen Tab zuzuordnen. Sprachverstand erstellt und speichert keinen
Browserverlauf.

Ein vom Nutzer selbst eingetragener Domain-Ausschluss kann nur dann an den
Synchronisierungsdienst des Browsers übertragen werden, wenn die Kategorie
**Domain-Ausschlüsse** ausdrücklich zur Synchronisierung ausgewählt wurde.

### Einstellungen und persönliche Einträge

Gespeichert werden können:

- Aktivierungsstatus
- aktivierte Regelgruppen
- Domain-Ausschlüsse
- Verarbeitung von Zitaten und zugänglichen Attributen
- persönliche Wort- und Phrasenausnahmen
- eigene wörtliche Ersetzungen mit Ausgangs- und Zieltext
- Auswahl, welche Kategorien zusätzlich synchronisiert werden

Die vollständige Konfiguration wird immer lokal gespeichert. Sobald mindestens
eine Kategorie aktiviert ist, wird die Synchronisierungsauswahl zusätzlich als
technische Information an den Browser-Synchronisierungsdienst übergeben. Dadurch
können weitere angemeldete Geräte dieselben Kategorien laden. Solange die
Synchronisierung auf einem frischen Profil nie aktiviert wurde, legt
Sprachverstand keine eigenen Einträge in `storage.sync` an. Werden nach vorheriger
Nutzung alle Kategorien wieder deaktiviert, kann dort nur die leere Auswahl als
Metadatum verbleiben; die zuvor synchronisierten Kategorieschlüssel werden
entfernt. So können weitere Geräte die vollständige Deaktivierung übernehmen.

## 4. Optionale Browser-Synchronisierung

In den erweiterten Einstellungen kann für folgende Kategorien getrennt gewählt
werden, ob sie zusätzlich über `storage.sync` synchronisiert werden:

- Aktivierungsstatus
- Regelgruppen
- Domain-Ausschlüsse
- Zitat- und Attributoptionen
- persönliche Ausnahmen
- eigene Ersetzungen

Ohne ausdrückliche Auswahl wird keine dieser Kategorien in `storage.sync`
geschrieben. Abgewählte Kategorien werden aus dem Synchronisierungsspeicher der
Erweiterung entfernt.

Bei aktivierter Synchronisierung werden die ausgewählten Werte an den
Synchronisierungsdienst des verwendeten Browsers übergeben. Abhängig vom Browser
kann dies eine Verarbeitung durch Mozilla, Google oder einen anderen
Browseranbieter und eine Übertragung auf weitere angemeldete Geräte umfassen.
Sprachverstand hat keinen Zugriff auf das Browserkonto, empfängt diese Daten
nicht und betreibt keinen eigenen Synchronisierungsdienst.

Persönliche Ausnahmen, eigene Ersetzungen und Domain-Ausschlüsse können private
Begriffe oder interne Domainnamen enthalten. Diese Kategorien sollten nur
synchronisiert werden, wenn der Nutzer der Verarbeitung durch seinen
Browseranbieter zustimmt.

Vor dem Schreiben prüft Sprachverstand konservative Größenlimits. Überschreitet
eine Kategorie das sichere Limit des Synchronisierungsspeichers, wird sie nicht
synchronisiert und eine verständliche Fehlermeldung angezeigt.

## 5. Import und Export

Der vollständige Einstellungsstand kann nach einer bewussten Nutzeraktion als
versionierte JSON-Datei lokal erzeugt werden. Enthalten sind alle Einstellungen,
persönlichen Listen und die Synchronisierungsauswahl.

Importdateien werden nur nach einer bewussten Dateiauswahl lokal gelesen. Format,
Schemaversion, Einstellungsrevision, Feldtypen, bekannte Kategorien, Anzahl und
Länge der Einträge sowie Domainangaben werden vor der Übernahme geprüft. Ein
Import verändert zunächst nur das sichtbare Formular und wird erst mit
**Speichern** wirksam.

Import- und Exportdateien werden nicht hochgeladen. Sie können persönliche
Begriffe, Formulierungen und Domainnamen enthalten und sollten entsprechend
vertraulich behandelt werden.

## 6. Zweck und Rechtsgrundlage

Die Verarbeitung dient ausschließlich dazu, die lokale Darstellung
unterstützter deutschsprachiger Webseitentexte nach der gewählten Konfiguration
anzupassen und beim Ausschalten wiederherzustellen.

Die Erweiterung verarbeitet keine Daten für Werbung, Profilbildung,
Marktforschung, Nutzerbewertung oder andere sachfremde Zwecke. Die lokale
Verarbeitung und eine freiwillig aktivierte Browser-Synchronisierung erfolgen
auf Veranlassung des Nutzers.

## 7. Empfänger

Der Entwickler und die Mitwirkenden erhalten keine Webseitentexte,
Browserverläufe, Einstellungen oder Nutzungsdaten.

Nur bei ausdrücklich aktivierter Browser-Synchronisierung kann der jeweilige
Browseranbieter Empfänger der ausgewählten Einstellungskategorien sein. Die
weitere Verarbeitung richtet sich nach dessen Datenschutzbestimmungen und den
Einstellungen des Browserkontos.

## 8. Speicherdauer und Löschung

Lokale Einstellungen bleiben gespeichert, bis sie geändert, zurückgesetzt oder
die Erweiterung entfernt wird. Synchronisierte Kategorien bleiben nach Maßgabe
des Browseranbieters gespeichert, bis die Kategorie abgewählt, die Daten dort
gelöscht oder die Browser-Synchronisierung beendet wird.

Abgewählte Kategorien entfernt Sprachverstand beim nächsten Speichern aus dem
Synchronisierungsspeicher der Erweiterung. Exportierte JSON-Dateien liegen
außerhalb der Erweiterung und müssen vom Nutzer selbst gelöscht werden.

## 9. Berechtigungen

Die Berechtigung `storage` wird benötigt, um lokale Einstellungen zu speichern
und optional ausdrücklich ausgewählte Kategorien über die standardisierte
Browser-Synchronisierung zu übertragen. Zusätzliche Netzwerk-, Download- oder
Dateisystemberechtigungen werden dafür nicht angefordert.

Der Zugriff auf Webseiten dient ausschließlich der lokalen Kernfunktion. Es wird
kein extern bereitgestellter Code geladen oder ausgeführt.

## 10. Datenerfassung durch die Erweiterung

Sprachverstand sammelt keine Daten für den Entwickler oder andere vom Projekt
betriebene Dienste. Die Firefox-Angabe `data_collection_permissions.required:
["none"]` bezieht sich auf diese fehlende Datenerfassung durch die Erweiterung.
Eine vom Nutzer aktivierte Browser-Synchronisierung ist eine Funktion des
verwendeten Browsers und wird in Abschnitt 4 gesondert beschrieben.

## 11. Änderungen

Diese Datenschutzerklärung wird angepasst, wenn sich Funktionen,
Berechtigungen oder Datenflüsse ändern. Maßgeblich ist die mit der jeweiligen
Version veröffentlichte Fassung.

## 12. Kontakt

Datenschutzfragen können über den
[Issue-Tracker](https://github.com/HyperCriSiS/Sprachverstand/issues) gestellt
werden. Sicherheitslücken und sensible Informationen dürfen nicht öffentlich
gepostet werden; dafür gilt [`SECURITY.md`](SECURITY.md).
