# Format der Einstellungssicherung

Sprachverstand kann den vollständigen aktuellen Einstellungsstand als
versionierte JSON-Datei exportieren und wieder importieren.

Enthalten sind:

- Aktivierungsstatus
- aktive Regelgruppen
- ausgeschlossene Domains
- Verarbeitung von Zitaten und zugänglichen Attributen
- persönliche Ausnahmen
- eigene Ersetzungen

## Datenschutz

Der Export wird lokal im Browser erzeugt. Eine Importdatei wird nur nach einer
bewussten Dateiauswahl lokal gelesen. Es findet keine Übertragung an den
Entwickler, einen Cloud-Dienst oder andere Empfänger statt.

Die exportierte Datei kann persönliche Begriffe, Formulierungen und Domainnamen
enthalten. Sie sollte deshalb wie eine andere persönliche Konfigurationsdatei
behandelt und nicht ungeprüft veröffentlicht werden.

## Aktuelles Schema

```json
{
  "format": "sprachverstand.settings-backup",
  "version": 1,
  "exportedAt": "2026-07-28T18:30:00.000Z",
  "settings": {
    "settingsRevision": 5,
    "enabled": true,
    "excludedDomains": [
      "example.org"
    ],
    "enabledRuleGroupIds": [
      "plural-separators",
      "plural-binnen-i"
    ],
    "protectedTerms": [
      "Nutzer:innen"
    ],
    "customReplacements": [
      {
        "source": "Meine Sonderform",
        "replacement": "Gewünschte Form"
      }
    ],
    "processAccessibleAttributes": true,
    "processQuotedText": true
  }
}
```

- `format` kennzeichnet den Dateityp.
- `version` ist die Schemafassung. Unbekannte zukünftige Fassungen werden nicht
  stillschweigend eingelesen.
- `exportedAt` enthält den Exportzeitpunkt im ISO-8601-Format.
- `settingsRevision` beschreibt den internen Migrationsstand.
- `enabledRuleGroupIds` enthält ausschließlich bekannte Regelgruppen.
- `protectedTerms` und `customReplacements` enthalten die persönlichen Listen.

Regex, Platzhalter, ausführbarer Code und rekursive Ersetzungsketten werden
nicht unterstützt.

## Importstrategien

Allgemeine Einstellungen aus der Sicherung werden bei jeder Strategie in das
Formular übernommen. Die Auswahl bestimmt, wie bereits vorhandene persönliche
Listen behandelt werden:

1. Vorhandene Ersetzungsziele behalten und abweichende Importziele nur melden.
2. Importierte Ersetzungsziele bei identischem Ausgangstext übernehmen.
3. Alle Einstellungen und beide persönlichen Listen vollständig ersetzen.

Ein Import verändert zunächst nur das sichtbare Formular. Er wird erst mit dem
Knopf **Speichern** aktiviert. Dubletten, widersprüchliche Ziele, blockierende
Ausnahmen, Ersetzungsketten, Überschneidungen und wirkungslose Einträge werden
vorher angezeigt.

## Sicherheitsgrenzen

- Importdateien sind auf 1 MB begrenzt.
- Dateityp, Schemafassung, Zeitstempel und Feldtypen werden geprüft.
- Unbekannte Schemaversionen werden abgewiesen.
- Persönliche Listen unterliegen denselben Anzahl- und Längenlimits wie bei der
  direkten Eingabe.
- Ein Import löst keine Netzwerkverbindung aus.
