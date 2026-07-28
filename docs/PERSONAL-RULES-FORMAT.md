# Format für persönliche Regeln

Sprachverstand kann ausschließlich **persönliche Ausnahmen** und **eigene
Ersetzungen** als JSON-Datei exportieren und wieder importieren. Domains,
aktivierte Regelgruppen und sonstige Einstellungen sind absichtlich nicht
enthalten.

## Datenschutz

Der Export wird lokal im Browser erzeugt. Eine Importdatei wird nur nach einer
bewussten Dateiauswahl lokal gelesen. Es findet keine Übertragung an den
Entwickler, einen Cloud-Dienst oder andere Empfänger statt.

Die exportierte Datei kann persönliche Begriffe und Formulierungen enthalten.
Sie sollte deshalb wie eine andere persönliche Konfigurationsdatei behandelt
und nicht ungeprüft veröffentlicht werden.

## Aktuelles Schema

```json
{
  "format": "sprachverstand.personal-rules",
  "version": 1,
  "exportedAt": "2026-07-28T18:30:00.000Z",
  "protectedTerms": [
    "Nutzer:innen"
  ],
  "customReplacements": [
    {
      "source": "Meine Sonderform",
      "replacement": "Gewünschte Form"
    }
  ]
}
```

- `format` kennzeichnet den Dateityp.
- `version` ist die Schemafassung. Unbekannte zukünftige Fassungen werden nicht
  stillschweigend eingelesen.
- `exportedAt` enthält den Exportzeitpunkt im ISO-8601-Format.
- `protectedTerms` enthält die wörtlichen persönlichen Ausnahmen.
- `customReplacements` enthält wörtliche Ausgangs- und Zieltexte.

Regex, Platzhalter, ausführbarer Code und rekursive Ersetzungsketten werden
nicht unterstützt.

## Importstrategien

Die Einstellungsseite bietet drei ausdrücklich wählbare Verfahren:

1. Vorhandene Ersetzungen behalten und abweichende Importziele nur melden.
2. Importierte Ersetzungen bei identischem Ausgangstext übernehmen.
3. Beide persönlichen Listen vollständig durch den Import ersetzen.

Ein Import verändert zunächst nur das sichtbare Formular. Er wird erst mit dem
Knopf **Speichern** aktiviert. Dubletten, widersprüchliche Ziele, blockierende
Ausnahmen, Ersetzungsketten, Überschneidungen und wirkungslose Einträge werden
vorher angezeigt.
