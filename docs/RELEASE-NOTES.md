# Sprachverstand 0.6.1 – RC1

RC1 ist der abschließend geprüfte Veröffentlichungskandidat für die öffentliche
Freigabe des Repositorys und die Einreichung bei Firefox Add-ons.

## Kernfunktionen

- Lokale Anpassung unterstützter gegenderter Schreibweisen auf Webseiten.
- Reversible Änderungen ohne Neuladen der Seite.
- Vierzehn einzeln aktivierbare Regelgruppen.
- Persönliche Ausnahmen und eigene wörtliche Ersetzungen.
- Live-Vorschau, Konflikthinweise sowie versionierter JSON-Import und -Export.
- Domain-Ausschlüsse, Zitatschutz und optionale Verarbeitung zugänglicher Attribute.

## Speicherung und optionale Synchronisierung

- Der vollständige Einstellungsstand wird standardmäßig ausschließlich in `storage.local` gespeichert.
- Aktivierungsstatus, Regelgruppen, Domain-Ausschlüsse, Textoptionen, persönliche Ausnahmen und eigene Ersetzungen können getrennt zur Browser-Synchronisierung ausgewählt werden.
- Alle Synchronisierungsschalter sind standardmäßig deaktiviert.
- Sobald mindestens eine Kategorie ausgewählt ist, werden die Auswahl und nur die ausgewählten Kategorien über `storage.sync` übertragen.
- Abgewählte Kategorien werden aus dem Synchronisierungsspeicher entfernt.
- Vor dem Synchronisieren wird ein konservatives Byte-Limit pro Kategorie geprüft.

## Änderungen seit Beta 12

- Alle Bereiche der erweiterten Einstellungen sind einzeln ein- und ausklappbar.
- Globale Schalter öffnen oder schließen sämtliche Einstellungsbereiche.
- Die Reihenfolge der Einstellungsbereiche wurde überarbeitet; Sicherung und Übertragung stehen vor der Browser-Synchronisierung.
- Regressionstests sichern zusätzlich `Praktiker*innen` → `Praktiker` und `Mediziner*innen` → `Mediziner` ab.
- Die Entwicklungsabhängigkeit `jsdom` wurde auf Version 30 aktualisiert.
- Redundante versionsgebundene Dokumente wurden entfernt und die öffentliche Freigabecheckliste dauerhaft ausgerichtet.
- Die Testdokumentation zur optionalen Browser-Synchronisierung wurde an die tatsächliche Implementierung angeglichen.

## Sicherheit und Veröffentlichung

- Ungültige oder überlange Importdaten werden vollständig abgewiesen.
- Unbekannte Felder, Kategorien und zukünftige Einstellungsrevisionen werden nicht übernommen.
- Vorhandene Tags und Releases werden niemals überschrieben.
- Browserpakete, Quellarchiv und `SOURCE_COMMIT.txt` stammen aus demselben Commit.
- Das Firefox-XPI wird als unsigniertes AMO-Einreichungspaket erzeugt und darf kein `META-INF`-Signaturverzeichnis enthalten.
- Das Manifest enthält die feste Firefox-ID und `data_collection_permissions.required: ["none"]`.

## Pakete

- `sprachverstand-0.6.1-rc.1-chromium.zip`
- `sprachverstand-0.6.1-rc.1-firefox.xpi` – unsigniertes AMO-Einreichungspaket
- `sprachverstand-0.6.1-rc.1-source.zip`
- `SHA256SUMS.txt`
- `SOURCE_COMMIT.txt`
- `BETA-TEST.md`
- `AMO-SOURCE-INSTRUCTIONS.md`
