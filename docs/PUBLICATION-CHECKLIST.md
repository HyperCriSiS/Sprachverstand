# Checkliste für die öffentliche Repository-Freigabe

Diese Schritte werden unmittelbar vor und nach dem Wechsel von **private** auf
**public** geprüft.

## Vor dem Umschalten

- [ ] `main` enthält ausschließlich vollständig geprüfte Änderungen
- [ ] keine veralteten Arbeits-, Test- oder temporären Branches sind vorhanden
- [ ] CI auf dem finalen Commit ist vollständig erfolgreich
- [ ] Repository enthält keine `.env`-Dateien, Schlüssel, Tokens, Zugangsdaten oder lokalen Konfigurationen
- [ ] Git-Historie, Pull Requests und Actions-Protokolle wurden auf sensible Inhalte geprüft
- [ ] alte Workflow-Läufe und Actions-Artefakte enthalten keine privaten Dateien oder Geheimnisse
- [ ] nur bewusst benötigte Releases und Tags bleiben sichtbar; überholte Beta-Prereleases sind entfernt oder ausdrücklich archiviert
- [ ] Actions-Artefakte werden höchstens 14 Tage aufbewahrt
- [ ] README, Changelog, Lizenz, `NOTICE`, `TRADEMARKS.md`, `SECURITY.md` und `CONTRIBUTING.md` sind aktuell
- [ ] Datenschutzerklärung beschreibt lokale Speicherung und optionale Browser-Synchronisierung korrekt
- [ ] Storetexte stimmen mit Berechtigungen und Datenflüssen überein
- [ ] offene automatisierte Abhängigkeits-PRs sind bewertet

## Direkt nach dem Umschalten

- [ ] Private Vulnerability Reporting unter **Settings → Security** aktivieren
- [ ] Dependency Graph, Dependabot Alerts und Security Updates aktivieren
- [ ] Ruleset oder Branch Protection für `main` aktivieren
- [ ] Pull Request vor Änderungen an `main` verlangen
- [ ] erfolgreichen CI-Check verlangen
- [ ] Force-Push und Löschen von `main` verbieten
- [ ] automatische Löschung zusammengeführter Head-Branches aktivieren
- [ ] Squash-Merge als bevorzugtes Mergeverfahren festlegen
- [ ] Repository-Beschreibung, Website, Themen und Social Preview prüfen
- [ ] Issue-Tracker und Security-Link von einem nicht angemeldeten Browser prüfen
- [ ] README-Logo und alle öffentlichen Dokumentlinks prüfen

## Vor AMO

- [ ] unsigniertes Firefox-XPI aus dem finalen Commit verwenden
- [ ] Quellarchiv desselben Commits hochladen
- [ ] `SOURCE_COMMIT.txt` mit dem finalen Commit abgleichen
- [ ] `AMO-SOURCE-INSTRUCTIONS.md` für den Prüfer beilegen
- [ ] Firefox-ID und Versionsnummer kontrollieren
- [ ] Datenschutzerklärung und Datenerfassungsangabe kontrollieren
- [ ] XPI darf vor der Mozilla-Signierung kein `META-INF`-Signaturverzeichnis enthalten

## Vor Chrome Web Store

- [ ] Chromium-ZIP aus demselben finalen Commit verwenden
- [ ] Datenschutzformular an die optionale Browser-Synchronisierung anpassen
- [ ] Berechtigung `storage` und Zugriff auf Webseiten begründen
- [ ] Screenshots aus der finalen Version verwenden

## Vor Microsoft Edge Add-ons

- [ ] Edge-ZIP aus demselben finalen Commit verwenden
- [ ] `EDGE-SUBMISSION.md` vollständig abarbeiten
- [ ] Manifest V3 und Service Worker im Paket kontrollieren
- [ ] Berechtigung `storage` und Zugriff auf Webseiten im Datenschutzformular begründen
- [ ] Remote-Code mit **Nein** deklarieren
- [ ] deutsche und englische Storetexte eintragen
- [ ] höchstens sieben Suchbegriffe pro Sprache eintragen
- [ ] aktuelle Screenshots in 640×480 oder 1280×800 Pixel verwenden
- [ ] Zertifizierungshinweise mit reproduzierbarem README-Test eintragen

## Vor Opera Add-ons

- [ ] Opera-ZIP aus demselben finalen Commit verwenden
- [ ] `OPERA-SUBMISSION.md` vollständig abarbeiten
- [ ] entpacktes Paket in aktuellem Opera Stable testen
- [ ] mindestens Windows oder macOS gegenprüfen
- [ ] Test mit gedrosselter Verbindung durchführen
- [ ] Kategorie **Barrierefreiheit** wählen
- [ ] deutsche und englische Storetexte eintragen
- [ ] Screenshots bevorzugt in 612×408 Pixel erstellen und 800×600 nicht überschreiten
- [ ] Support-, Datenschutz- und Lizenzangaben kontrollieren
