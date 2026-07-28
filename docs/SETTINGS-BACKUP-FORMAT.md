# Format der Einstellungssicherung

Sprachverstand exportiert den vollständigen aktuellen Einstellungsstand als
versionierte JSON-Datei und kann ihn lokal wieder einlesen.

## Enthaltene Daten

- Aktivierungsstatus
- aktive Regelgruppen
- Domain-Ausschlüsse
- Verarbeitung von Zitaten und zugänglichen Attributen
- persönliche Ausnahmen
- eigene Ersetzungen
- Auswahl der optionalen Browser-Synchronisierung

## Datenschutz

Export und Import finden ausschließlich nach einer bewussten Nutzeraktion im
Browser statt. Die Datei wird nicht hochgeladen. Sie kann persönliche Begriffe,
Formulierungen und Domainnamen enthalten und sollte nicht ungeprüft veröffentlicht
werden.

Ein Import mit ausgewählten Synchronisierungskategorien überträgt noch nichts.
Erst nach **Speichern** werden ausdrücklich ausgewählte Kategorien zusätzlich an
`storage.sync` übergeben.

## Schema 2

```json
{
  "format": "sprachverstand.settings-backup",
  "version": 2,
  "exportedAt": "2026-07-28T18:30:00.000Z",
  "settings": {
    "settingsRevision": 6,
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
    "processQuotedText": true,
    "syncCategoryIds": [
      "rule-groups"
    ]
  }
}
```

### Synchronisierungskategorien

Zulässig sind ausschließlich:

- `activation`
- `rule-groups`
- `excluded-domains`
- `text-options`
- `protected-terms`
- `custom-replacements`

Eine leere Liste bedeutet, dass alle Daten ausschließlich lokal bleiben.

## Strikte Prüfung

Der Import wird vollständig abgewiesen bei:

- fremdem Format oder unbekannter Schemaversion
- zukünftiger unbekannter `settingsRevision`
- unbekannten Feldern
- unbekannten Regelgruppen oder Synchronisierungskategorien
- falschen Feldtypen
- leeren, überzähligen oder zu langen Einträgen
- ungültigen oder gleichwertig doppelten Domains
- doppelten Ausgangstexten eigener Ersetzungen
- Dateien über 1 MB

Es gibt keine stille Kürzung. Regex, Platzhalter, Skripte und ausführbarer Code
sind nicht Teil des Formats.

## Importstrategien

Allgemeine Einstellungen und die Synchronisierungsauswahl werden bei jeder
Strategie in das Formular übernommen. Die Auswahl betrifft nur bereits vorhandene
persönliche Listen:

1. vorhandene Ersetzungsziele behalten
2. importierte Ersetzungsziele bevorzugen
3. alle Einstellungen und persönlichen Listen vollständig ersetzen

Der Import wird erst mit **Speichern** aktiv.
