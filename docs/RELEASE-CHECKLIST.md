# Release-Checkliste Beta 12

## Version und Metadaten

- [x] Version auf 0.6.1 erhöht
- [x] Beta-Bezeichnung auf beta.12 aktualisiert
- [x] Paketdatei, Lockdatei und beide Quell-Manifeste synchronisiert
- [x] Changelog, Release Notes und Testanleitung aktualisiert

## Einstellungen und Datenschutz

- [x] Vollständiger Einstellungsstand wird standardmäßig in `storage.local` gespeichert
- [x] Browser-Synchronisierung für jede Datenkategorie einzeln wählbar
- [x] Alle Synchronisierungskategorien standardmäßig deaktiviert
- [x] Synchronisierungsauswahl wird nur bei aktivierter Synchronisierung als eigener Metadatenschlüssel übertragen
- [x] Größenprüfung vor dem Schreiben in `storage.sync`
- [x] Vollständiger Export einschließlich Synchronisierungsauswahl
- [x] Datenschutzerklärung und Storetexte an die optionale Synchronisierung angepasst

## Importhärtung

- [x] Backup-Schema auf Version 2 erhöht
- [x] Unbekannte Felder und Kategorien werden abgewiesen
- [x] Zukünftige Einstellungsrevisionen werden abgewiesen
- [x] Anzahl, Länge und Typ aller persönlichen Einträge werden streng geprüft
- [x] Domain-Ausschlüsse werden normalisiert, validiert und begrenzt
- [x] Ungültige Dateien werden vollständig abgewiesen statt still gekürzt

## Release-Sicherheit

- [x] Bestehende Tags und Releases werden niemals überschrieben
- [x] Release-Tag wird nach Veröffentlichung gegen den auslösenden Commit geprüft
- [x] Quellarchiv wird ausdrücklich aus demselben Commit erzeugt
- [x] `SOURCE_COMMIT.txt` dokumentiert den Build-Commit in jedem Artefakt
- [x] `SOURCE_COMMIT.txt` dokumentiert den Build-Commit in jedem Artefakt
- [x] Firefox-XPI wird vor der Mozilla-Einreichung auf fehlende Signaturdateien geprüft

## Öffentliche Freigabe

- [x] `SECURITY.md` ergänzt
- [x] öffentliche Veröffentlichungscheckliste ergänzt
- [x] reproduzierbare Mozilla-Build-Anleitung ergänzt
- [x] Dokumentation auf veraltete Beta-11- und offene Statusangaben geprüft
- [ ] GitHub Private Vulnerability Reporting nach dem Umschalten auf öffentlich aktivieren
- [ ] Branch-Regeln für `main` nach dem Umschalten auf öffentlich aktivieren
- [ ] Reale Geräte-, Screenreader-, Webseiten- und Belastungstests abschließen
