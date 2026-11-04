# Thunderbird-Entwurf

Stand: 2026-11-04. Entwicklungs- und Prüfprotokoll der ersten Thunderbird-Ausgabe.

## Repository und Branches

Thunderbird bleibt im selben Repository: gemeinsame Regeln in `src/rules/`,
Text- und DOM-Verarbeitung in `src/core/`, dünne Plattformanbindung in
`src/thunderbird/` und eigenes `manifests/thunderbird.json` mit separater Add-on-ID.
Keine Kopie der Regeln und kein dauerhaft auseinanderlaufender Produktbranch.

Der Entwurf entstand auf `feature/thunderbird-draft`, Basis `5d7732a`
(Browserstand 0.9.0 einschließlich Homepage-Link). Auf ausdrücklichen Nutzerwunsch
vom 2026-11-04 wird daraus eine eigene geschützte Release-Linie `thunderbird`.
Änderungen gelangen per PR mit Thunderbird-CI dorthin. Gemeinsame Regeln bleiben
im selben Repository; spätere Browseränderungen müssen kontrolliert integriert werden.
Release-Tags verwenden `thunderbird-vX.Y.Z`, unabhängig von Browser- und Pale-Moon-Tags.

## Bauen und ausprobieren

`npm run build:thunderbird` erzeugt `dist/thunderbird/`. Der bestehende Builder
bereinigt vorher **das gesamte `dist/`**, wie auch bei Browser-Einzelbuilds.
`npm run build` baut weiterhin ausschließlich die regulären Browserziele.
Thunderbird ist nicht Teil der Browser-/Store-Pipeline. Die separate
`.github/workflows/thunderbird.yml` prüft und paketiert die Thunderbird-Linie;
Release-Tags veröffentlichen nach erfolgreicher Prüfung XPI, Quellpaket und Prüfsummen.

In einem separaten Thunderbird-Testprofil unter Add-ons → Erweiterungen debuggen
→ Temporäres Add-on laden die Datei `dist/thunderbird/manifest.json` auswählen.
Danach eine Nachricht neu öffnen: Die Registrierung greift für neu geöffnete
Nachrichten. Bereits offene Nachrichten werden im Entwurf nicht nachträglich injiziert.
Popup und erweiterte Einstellungen verwenden dieselben HTML-, CSS- und
TypeScript-Dateien wie das Browser-Add-on, ohne separate reduzierte Oberfläche.
Im Thunderbird-Build wird zusätzlich ein Modul für die lokale Verfassen-Option geladen.
Enthalten sind Regelgruppen, Textoptionen, Ersetzungsübersicht, persönliche
Ausnahmen/Ersetzungen, Vorschau, Sicherung und Oberflächenkonfiguration.
Die Browserbreite von 384 Pixeln und Hell-/Dunkeldarstellung bleiben erhalten.
Die Website-Schaltfläche bleibt bei Mails deaktiviert (kein Website-Hostname).
Layout, Umschalten, Regelgruppen und Ersetzungsübersicht wurden in Chromium mit
nachgebildeter Erweiterungs-API geprüft; Thunderbird-Autosizing bleibt separat abzunehmen.

## Umfang und Datenschutz

Zielbasis ist Thunderbird 128+, Manifest V3. Die tatsächliche Mindestversion ist
noch praktisch zu prüfen. Nachrichtenanzeige via `scripting.messageDisplay`,
mit `storage`, `scripting`, `messagesRead`; zusätzlich ausschließlich optional
`compose` für die Korrektur beim Öffnen einer Antwort/Weiterleitung. Keine
Webseiten-, Sende- oder Berechtigung zur dauerhaften Änderung empfangener Nachrichten.
Quelle: https://webextension-api.thunderbird.net/en/mv3/scripting.messageDisplay.html

Verarbeitet wird nur das angezeigte Dokument. Die DOM-Verarbeitung läuft im Dokument;
die Regelverarbeitung wird gebündelt im lokalen Erweiterungshintergrund ausgeführt.
Zähler und begrenzte Ersetzungsübersicht gelangen per lokalen Runtime-Nachrichten
in die gemeinsame Oberfläche. Der Thunderbird-Hintergrund persistiert keine
Mailfragmente, Zähler oder Ersetzungslisten und hält keinen Zustandscache vor.
Beim Öffnen fragt das Popup die aktuelle Nachrichtenansicht ab. Kein Netzwerk.
Die Regel-Engine wird zwischen Nachrichten geteilt und nicht in jeder Nachrichtenansicht
erneut initialisiert. Registrierung bei `document_end`; alte Idle-Registrierungen
werden beim Hintergrundstart migriert. Messwerkzeug: `scripts/thunderbird-perf/`.
Die gespeicherte Originalmail wird nicht verändert. Ein selbst eingetragener
Ersatz oder eine Ausnahme ist eine Einstellung, kein automatisch gespeicherter Mailtext.
Thunderbird-Einstellungen sind durch die separate ID von Firefox getrennt.
Domainlisten werden für Nachrichten bewusst nicht angewendet; Mailserver-Hosts
sind keine Webseiten-Domains und keine Absenderfilter.
Die webvideospezifische Untertiteloption wird in Thunderbird-Popup und
Einstellungen ausgeblendet. Die Nachrichtenanzeige erzwingt `processSubtitles: false`,
auch bei aus Browser-Sicherungen übernommenen Einstellungen. Der gemeinsame
Einstellungsschlüssel bleibt für die Kompatibilität erhalten. Es gibt keine
verifizierte Unterstützung von Videoplayer-Untertiteln innerhalb von Mails.
Bearbeitbare Bereiche bleiben geschützt.

## Verifiziert und offen

### Option: Antworten und Weiterleitungen beim Öffnen korrigieren

Unter den Textoptionen der erweiterten Einstellungen. Standardmäßig aus; der
Schalter fordert bei Aktivierung die optionale `compose`-Berechtigung an und
speichert seine Auswahl unmittelbar in `storage.local`. Diese Thunderbird-spezifische
Einwilligung wird bewusst nicht synchronisiert oder über die allgemeine
Einstellungssicherung importiert/exportiert. Deutsch und Englisch sind vorhanden;
andere Oberflächensprachen verwenden für diesen Zusatz Englisch.

Ein registriertes Compose-Skript meldet einmalig den geöffneten Editor. Nur
`reply` und `forward` werden bearbeitet, nicht `new`, `draft` oder `redirect`.
Es gelten Aktivierungsstatus, Regelgruppen, geschützte Begriffe und eigene Regeln.
HTML wird in einer inerten Dokumentkopie verarbeitet; Linkziele, CID-Bilder und
technische Bereiche bleiben erhalten. Nur der Body wird via `setComposeDetails`
zurückgeschrieben, keine Empfänger, Betreffzeilen oder Anhänge.
Weiterleiten als Anhang verändert die angehängte Originalnachricht nicht.
Bereits als geändert markierte Entwürfe werden übersprungen; vor dem Schreiben
werden Body und Änderungsstatus erneut geprüft. Die API bietet hierfür keine atomare
Vergleich-und-Schreiboperation; Editor-Timing und Undo sind direkt in Thunderbird abzunehmen.
Es gibt keinen Schreib-Observer und keinen Vor-dem-Senden-Hook. Ausschalten wirkt
auf künftige Öffnungen; bereits korrigierter Entwurfstext wird nicht zurückgesetzt.

Automatisiert geprüft: Klartext/HTML, Struktur-/Link-/Bildschutz, Ausnahmen und
eigene Regeln, ausgeschaltete Option/fehlende Berechtigung, Einmaligkeit,
konkurrierende Bearbeitung und Abmeldung des Compose-Skripts beim Abschalten.
Stand 2026-11-04: 12.544 Tests in 347 Dateien im abschließenden Gesamtlauf grün,
TypeScript und alle drei Builds erfolgreich. Chromium-Prüfung mit nachgebildeter
Erweiterungs-API: Option standardmäßig aus, Ablehnung der Berechtigung ohne
Aktivierung, lokales Speichern nach Zustimmung, keine relevanten Konsolenfehler.
Aktualisiertes XPI einschließlich neuer Einstiegspunkte und optionaler Berechtigung geprüft.
Direkte Thunderbird-Prüfung dieser neuen Funktion steht noch aus.
Zusätzlicher API-Integrationstest: Der simulierte Compose-Body wird über
`setComposeDetails` von HTML mit `Nutzer:innen` auf HTML mit `Nutzer` geändert;
ein erneuter Bereitschaftshinweis verändert ihn nicht nochmals. Das prüft die
tatsächliche Body-Schreiboperation unserer Anbindung, keinen SMTP-/Empfänger-End-to-End-Lauf.

Automatisiert geprüft: TypeScript, separater Build, Registrierung inklusive
Neustart/Fehler, getrennte Berechtigungen sowie DOM-Umwandlung und Rücknahme.
Das ersetzt keinen Thunderbird-Lauf.

Zusatzprüfung 2026-11-04: gesamte damalige Testsuite erfolgreich (346 Dateien,
12.532 Tests), danach fünf zusätzliche Thunderbird-Regressionen ergänzt und
erfolgreich gezielt ausgeführt. Abgedeckt sind nachgeladene Nachrichtentexte,
unveränderte Linkziele, eigene Ersetzungen, geschützte Begriffe, schnelles
An/Aus, Listener-Freigabe, Nachrichtenwechsel/Tab-Schließen und ungültige Anfragen.
TypeScript, Build aller drei Ziele sowie 51 Locale-Dateien geprüft.

Lokales Testpaket: `artifacts/thunderbird-draft/sprachverstand-thunderbird-0.9.0-draft.xpi`.
Erzeugt mit `web-ext build`; dies ist ein Paketbau, keine Thunderbird-Lint- oder
Storefreigabe. Vor Einreichung einen finalen Commit und reproduzierbares
Quellarchiv festlegen. Die positive Nutzerprobe ersetzt keine dokumentierte
Versionsmatrix oder Prüfung von Antworten/Weiterleitungen.

## Einreichung bei Thunderbird Add-ons

Die Erstveröffentlichung separat über https://addons.thunderbird.net/developers/
anlegen. Firefox-Storetexte, Logo und Projektlinks können als Vorlage dienen;
Beschreibung und Screenshots müssen Thunderbird und die Nachrichtenanzeige beschreiben.
Die eigene Thunderbird-ID bleibt erhalten; es wird nicht das signierte Firefox-XPI hochgeladen.

Wegen `messagesRead` ist nach der ATN-Richtlinie eine manuelle Prüfung erforderlich:
https://thunderbird.github.io/atn-review-policy/
Die Firefox-Freigabe ersetzt diese Prüfung nicht. Für TypeScript/esbuild ein minimales
Quellarchiv mit Lockfile und exakter Build-Anleitung zusätzlich zum XPI einreichen:
https://webextension-api.thunderbird.net/en/mv3/guides/sourceCodeSubmission.html
Die Anleitung muss Umgebung und Werkzeugversionen sowie `npm ci` und
`npm run build:thunderbird` dokumentieren und das hochgeladene Paket reproduzieren.
Keine Tests, privaten Dateien, `node_modules` oder Build-Ausgaben ins Quellarchiv aufnehmen.

Vor Upload noch Thunderbird-Datenschutztext, angepasste Storebeschreibung,
Screenshots, verifizierte Versionsunterstützung und konkrete Reviewer-Testschritte
vorbereiten. Den Datenschutztext vollständig im ATN-Feld angeben, nicht nur verlinken.
Keine externe Einreichung oder Veröffentlichung wurde vorgenommen.

Vor Unterstützung/Release offen:

- Temporärinstallation und API-Verhalten in Thunderbird 128 und einer aktuellen Version.
- HTML-/Reintextansicht, Zitate, Links, Signaturen, Nachrichtenwechsel,
  separates Fenster, mehrere Tabs, Einstellungen, Neustart und Deaktivierung.
- Originalnachricht vor/nach Umwandlung vergleichen; Antworten/Weiterleiten dürfen
  keine Darstellungsänderung in den Versand übernehmen.
- Thunderbird-Lint, Paketprüfung, CI-Build und isolierte XPI-/Release-Pipeline.
- Thunderbird-gerechte Einstellungen und Beschreibungen, Datenschutzerklärung
  (die bisherige `PRIVACY.md` beschreibt Browser), Store-Metadaten und Lokalisierung.
