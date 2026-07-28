# Checkliste für die öffentliche Repository-Freigabe

Diese Schritte werden unmittelbar vor und nach dem Wechsel von **private** auf
**public** geprüft.

## Vor dem Umschalten

- [ ] `main` enthält ausschließlich vollständig geprüfte Änderungen
- [ ] `main` und `dev` sind synchron
- [ ] CI auf dem finalen Commit ist vollständig erfolgreich
- [ ] Repository enthält keine `.env`-Dateien, Schlüssel, Tokens, Zugangsdaten oder lokalen Konfigurationen
- [ ] Git-Historie, Pull Requests und Actions-Protokolle wurden auf sensible Inhalte geprüft
- [ ] alte Actions-Artefakte enthalten keine privaten Dateien
- [ ] README, Lizenz, `NOTICE`, `TRADEMARKS.md`, `SECURITY.md` und `CONTRIBUTING.md` sind aktuell
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
