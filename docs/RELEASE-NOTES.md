# Sprachverstand 0.6.1 – Beta 12

Beta 12 härtet die Einstellungsverwaltung und bereitet das Projekt auf die
öffentliche Freigabe und die spätere Store-Einreichung vor.

## Speicherort und optionale Synchronisierung

- Der vollständige Einstellungsstand wird standardmäßig ausschließlich lokal gespeichert.
- Aktivierungsstatus, Regelgruppen, Domain-Ausschlüsse, Textoptionen, persönliche Ausnahmen und eigene Ersetzungen können getrennt zur Browser-Synchronisierung ausgewählt werden.
- Alle Synchronisierungsschalter sind standardmäßig deaktiviert. Bei einer Aktivierung wird die Auswahl als eigener Metadatenschlüssel mit synchronisiert, damit weitere Geräte dieselben Kategorien laden können.
- Nicht ausgewählte Kategorien werden aus `storage.sync` entfernt.
- Vor dem Synchronisieren wird ein konservatives Byte-Limit pro Kategorie geprüft.

## Vorschau, Konflikthinweise und Sicherung

- Live-Vorschau mit den noch nicht gespeicherten Regelgruppen, Ausnahmen und Ersetzungen.
- Hinweise zu Dubletten, Zielkonflikten, blockierenden Ausnahmen, Groß-/Kleinschreibung, Ketten, Überschneidungen und wirkungslosen Einträgen.
- Vollständiger JSON-Export einschließlich Synchronisierungsauswahl.
- Lokaler Import mit drei Strategien für persönliche Listen; wirksam erst nach **Speichern**.

## Importhärtung

- Backup-Schema 2 mit strikter Feld- und Typprüfung.
- Unbekannte Felder, Regelgruppen, Synchronisierungskategorien und zukünftige Einstellungsrevisionen werden abgewiesen.
- Überzählige, zu lange, leere oder typwidrige Einträge führen zur vollständigen Ablehnung.
- Domain-Ausschlüsse werden normalisiert, validiert, dedupliziert und begrenzt.

## Release und öffentliche Vorbereitung

- Version 0.6.1 und Beta 12 in Paket, Lockdatei, Manifesten und Workflows vereinheitlicht.
- Vorhandene Release-Tags werden nicht mehr überschrieben.
- Tag, Quellarchiv und Browserpakete werden an denselben Commit gebunden.
- `SECURITY.md`, öffentliche Freigabecheckliste und Mozilla-Build-Anleitung ergänzt.
- Der Lizenzlink befindet sich ausschließlich in den erweiterten Einstellungen.

## Pakete

- `sprachverstand-0.6.1-beta.12-chromium.zip`
- `sprachverstand-0.6.1-beta.12-firefox.xpi` – unsigniertes AMO-Einreichungspaket
- `sprachverstand-0.6.1-beta.12-source.zip`
- `SHA256SUMS.txt`
- `BETA-TEST.md`
- `AMO-SOURCE-INSTRUCTIONS.md`

## Weiterhin vor den Stores zu prüfen

- Firefox für Android auf echter Hardware
- Popup und Einstellungen auf mehreren Displaygrößen
- Screenreader auf Desktop und Android
- DHL, Mediatheken, rebuy und weitere Single-Page-Anwendungen
- große Nachrichtenseiten und Framework-Anwendungen unter realer Last
