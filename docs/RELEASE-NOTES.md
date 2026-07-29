# Sprachverstand 0.6.1 – RC2

RC2 ersetzt RC1 als abschließend geprüften Veröffentlichungskandidaten für die
öffentliche Freigabe des Repositorys und die Einreichung bei Firefox Add-ons.

## Korrektur gegenüber RC1

- **Speichern** und **Zurücksetzen** befinden sich nun oben in derselben Werkzeugleiste wie **Alle öffnen** und **Alle schließen**.
- Beide Schaltergruppen sind auf Desktop-Breiten bündig ausgerichtet und werden auf schmalen Ansichten übersichtlich untereinander angeordnet.
- Die bisherige doppelte Platzierung am unteren Ende der Einstellungsseite wurde entfernt.
- Ein eigener Layouttest schützt die Position der vier Schaltflächen vor Regressionen.

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

## Sicherheit und Veröffentlichung

- Ungültige oder überlange Importdaten werden vollständig abgewiesen.
- Unbekannte Felder, Kategorien und zukünftige Einstellungsrevisionen werden nicht übernommen.
- Vorhandene Tags und Releases werden niemals überschrieben.
- Browserpakete, Quellarchiv und `SOURCE_COMMIT.txt` stammen aus demselben Commit.
- Das Firefox-XPI wird als unsigniertes AMO-Einreichungspaket erzeugt und darf kein `META-INF`-Signaturverzeichnis enthalten.
- Das Manifest enthält die feste Firefox-ID und `data_collection_permissions.required: ["none"]`.

## Pakete

- `sprachverstand-0.6.1-rc.2-chromium.zip`
- `sprachverstand-0.6.1-rc.2-firefox.xpi` – unsigniertes AMO-Einreichungspaket
- `sprachverstand-0.6.1-rc.2-source.zip`
- `SHA256SUMS.txt`
- `SOURCE_COMMIT.txt`
- `BETA-TEST.md`
- `AMO-SOURCE-INSTRUCTIONS.md`
